import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), '../server/database.sqlite')

def verify():
    if not os.path.exists(DB_PATH):
        print("Database not found.")
        return

    conn = sqlite3.connect(DB_PATH)
    tables = ['Customers', 'Invoices', 'Payments', 'Staff']
    
    print("--- Data Verification ---")
    for table in tables:
        try:
            cur = conn.execute(f"SELECT COUNT(*) FROM {table}")
            count = cur.fetchone()[0]
            print(f"{table}: {count} rows")
        except Exception as e:
            print(f"{table}: Error - {e}")
            
    conn.close()

if __name__ == "__main__":
    verify()
