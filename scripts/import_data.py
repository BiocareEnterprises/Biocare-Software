import pandas as pd
import sqlite3
from datetime import datetime
import os
import re

# Configuration
DB_PATH = os.path.join(os.path.dirname(__file__), '../server/database.sqlite')
CSV_DIR = os.path.join(os.path.dirname(__file__), '../data')

def connect_db():
    return sqlite3.connect(DB_PATH)

def clean_text(text):
    """Fixes common typos in legacy data."""
    if pd.isna(text):
        return None
    text = str(text).strip()
    # Auto-correction map
    corrections = {
        r'Recived': 'Received',
        r'Panaelty': 'Penalty',
        r'Recovry': 'Recovery'
    }
    for error, fix in corrections.items():
        text = re.sub(error, fix, text, flags=re.IGNORECASE)
    return text

def clean_date(date_str):
    if pd.isna(date_str):
        return None
    date_str = str(date_str).strip()
    formats = ['%d-%m-%y', '%Y-%m-%d', '%d/%m/%Y', '%d-%b-%y', '%d-%m-%Y', '%Y-%m-%d %H:%M:%S']
    for fmt in formats:
        try:
            return datetime.strptime(date_str, fmt).date()
        except ValueError:
            continue
    return None

def create_tables(conn):
    """Creates the DMS tables if they don't exist."""
    # Drop tables to ensure fresh schema
    conn.executescript("""
        DROP TABLE IF EXISTS Payments;
        DROP TABLE IF EXISTS Invoices;
        DROP TABLE IF EXISTS Customers;
        DROP TABLE IF EXISTS Staff;
        DROP TABLE IF EXISTS Attendance;
    """)
    
    schema = """
    CREATE TABLE Staff (
        StaffID INTEGER PRIMARY KEY AUTOINCREMENT,
        Name TEXT NOT NULL,
        Role TEXT NOT NULL
    );
    CREATE TABLE Customers (
        CustomerID INTEGER PRIMARY KEY AUTOINCREMENT,
        ShopName TEXT NOT NULL,
        BookerName TEXT,
        SalesmanID INTEGER,
        Area TEXT,
        ContactNumber TEXT,
        FOREIGN KEY(SalesmanID) REFERENCES Staff(StaffID)
    );
    CREATE TABLE Invoices (
        InvoiceID INTEGER PRIMARY KEY AUTOINCREMENT,
        DeliveryNo TEXT UNIQUE NOT NULL,
        Date TEXT NOT NULL,
        CustomerID INTEGER,
        TotalCartons REAL,
        GrossAmount REAL,
        NetAmount REAL,
        Remarks TEXT,
        FOREIGN KEY(CustomerID) REFERENCES Customers(CustomerID)
    );
    CREATE TABLE Payments (
        PaymentID INTEGER PRIMARY KEY AUTOINCREMENT,
        InvoiceID INTEGER,
        CustomerID INTEGER,
        PaymentDate TEXT,
        Amount REAL,
        PaymentType TEXT,
        ChequeNo TEXT,
        Status TEXT DEFAULT 'Pending',
        FOREIGN KEY(InvoiceID) REFERENCES Invoices(InvoiceID),
        FOREIGN KEY(CustomerID) REFERENCES Customers(CustomerID)
    );
    """
    conn.executescript(schema)
    print("Tables created/verified.")

# ... (find_header_row and import_customers remain same)

def import_cheques(conn):
    print("Importing Cheques...")
    file_path = os.path.join(CSV_DIR, 'Clear Cheque List.xlsx')
    if not os.path.exists(file_path):
        return

    try:
        df_raw = pd.read_excel(file_path, header=None)
        header_idx = find_header_row(df_raw, 'Shop Name')
        
        if header_idx is not None:
            df = pd.read_excel(file_path, header=header_idx)
            df.columns = [str(c).strip() for c in df.columns]
            
            for _, row in df.iterrows():
                shop_name = clean_text(row.get('Shop Name'))
                if shop_name and str(shop_name).lower() != 'nan':
                    cur = conn.execute("SELECT CustomerID FROM Customers WHERE ShopName = ?", (shop_name,))
                    res = cur.fetchone()
                    if res:
                        cust_id = res[0]
                        
                        try:
                            penalty = float(row.get('Bounce Panaelty') or 0)
                        except:
                            penalty = 0
                            
                        status = 'Bounced' if penalty > 0 else 'Cleared'
                        
                        amount = row.get('Amount')
                        cheque_date = clean_date(row.get('Date'))
                        cheque_no = row.get('Cheque #') or row.get('Slip No')
                        
                        conn.execute("""
                            INSERT INTO Payments (InvoiceID, CustomerID, PaymentDate, Amount, PaymentType, ChequeNo, Status)
                            VALUES (?, ?, ?, ?, ?, ?, ?)
                        """, (None, cust_id, cheque_date, amount, 'Cheque', cheque_no, status))
    except Exception as e:
        print(f"Error importing cheques: {e}")

def main():
    conn = connect_db()
    create_tables(conn)
    
    import_customers(conn)
    import_invoices(conn)
    import_cheques(conn)
    
    conn.commit()
    conn.close()
    print("Data Import Completed.")

if __name__ == "__main__":
    main()
