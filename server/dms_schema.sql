-- DMS Database Schema (PostgreSQL)

-- 1. Staff Table
CREATE TABLE Staff (
    StaffID SERIAL PRIMARY KEY,
    Name VARCHAR(255) NOT NULL,
    Role VARCHAR(100) NOT NULL -- 'Salesman', 'Warehouse', 'Admin', etc.
);

-- 2. Customers Table
CREATE TABLE Customers (
    CustomerID SERIAL PRIMARY KEY,
    ShopName VARCHAR(255) NOT NULL,
    BookerName VARCHAR(255),
    SalesmanID INTEGER REFERENCES Staff(StaffID),
    Area VARCHAR(255),
    ContactNumber VARCHAR(50),
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Invoices Table (Sales)
CREATE TABLE Invoices (
    InvoiceID SERIAL PRIMARY KEY,
    DeliveryNo VARCHAR(100) UNIQUE NOT NULL, -- From 'Company invoice detail.csv'
    Date DATE NOT NULL,
    CustomerID INTEGER REFERENCES Customers(CustomerID),
    TotalCartons INTEGER DEFAULT 0,
    GrossAmount DECIMAL(12, 2) DEFAULT 0.00,
    DiscountAmount DECIMAL(12, 2) DEFAULT 0.00,
    NetAmount DECIMAL(12, 2) DEFAULT 0.00,
    Remarks TEXT,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Payments Table (Recovery/Credits)
CREATE TABLE Payments (
    PaymentID SERIAL PRIMARY KEY,
    InvoiceID INTEGER REFERENCES Invoices(InvoiceID),
    PaymentDate DATE NOT NULL,
    Amount DECIMAL(12, 2) NOT NULL,
    PaymentType VARCHAR(50) CHECK (PaymentType IN ('Cash', 'Cheque', 'Online')),
    ChequeNo VARCHAR(100),
    ChequeDate DATE,
    Status VARCHAR(50) CHECK (Status IN ('Cleared', 'Bounced', 'Pending')) DEFAULT 'Pending',
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Attendance Table
CREATE TABLE Attendance (
    AttendanceID SERIAL PRIMARY KEY,
    StaffID INTEGER REFERENCES Staff(StaffID),
    Date DATE NOT NULL,
    Status VARCHAR(50) CHECK (Status IN ('Present', 'Absent', 'Leave')),
    UNIQUE(StaffID, Date) -- Prevent duplicate attendance for same staff on same day
);

-- 6. InventoryLog Table
CREATE TABLE InventoryLog (
    LogID SERIAL PRIMARY KEY,
    Date DATE NOT NULL,
    QuantityIn INTEGER DEFAULT 0,
    BatchNo VARCHAR(100), -- '1st', '2nd', etc.
    TotalStock INTEGER DEFAULT 0,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_invoices_customer ON Invoices(CustomerID);
CREATE INDEX idx_payments_invoice ON Payments(InvoiceID);
CREATE INDEX idx_attendance_staff ON Attendance(StaffID);
CREATE INDEX idx_attendance_date ON Attendance(Date);
