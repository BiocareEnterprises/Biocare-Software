const { Pool } = require('pg');

// Yahan apna password zaroor dalna bracket hata kar!
const connectionString = "postgresql://postgres.zrcjkksbuwnvqaivbelr:Biocare22$$$@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres";

const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false // Live server (Supabase) ke liye zaroori hai
  }
});

async function initializeDatabase() {
  try {
    // Master Shops Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS shops (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        address TEXT,
        current_balance REAL DEFAULT 0
      );
    `);

    // Module A: Sales/Invoices
    await pool.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id SERIAL PRIMARY KEY,
        invoice_no TEXT NOT NULL UNIQUE,
        date TEXT NOT NULL,
        shop_id INTEGER NOT NULL REFERENCES shops(id),
        salesman_name TEXT,
        bill_amount REAL NOT NULL,
        previous_balance REAL NOT NULL,
        total_payable REAL NOT NULL,
        type TEXT DEFAULT 'Sale',
        notes TEXT
      );
    `);

    // Module B: Daily Recovery
    await pool.query(`
      CREATE TABLE IF NOT EXISTS recoveries (
        id SERIAL PRIMARY KEY,
        date TEXT NOT NULL,
        salesman_name TEXT,
        shop_id INTEGER NOT NULL REFERENCES shops(id),
        mode TEXT CHECK(mode IN ('Cash', 'Cheque')) NOT NULL,
        amount REAL NOT NULL,
        cheque_ref_no TEXT
      );
    `);

    // Module C: Cheque Management
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cheques (
        id SERIAL PRIMARY KEY,
        recovery_id INTEGER NOT NULL REFERENCES recoveries(id),
        cheque_no TEXT NOT NULL UNIQUE,
        bank_name TEXT NOT NULL,
        amount REAL NOT NULL,
        due_date TEXT NOT NULL,
        deposit_date TEXT,
        status TEXT CHECK(status IN ('Pending', 'Deposited', 'Cleared', 'Bounced', 'Returned')) DEFAULT 'Pending',
        bounce_reason TEXT,
        clearance_date TEXT
      );
    `);

    // Module D: Product Management (Inventory)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        sku TEXT NOT NULL UNIQUE,
        rate REAL NOT NULL,
        cost_price REAL DEFAULT 0,
        stock_quantity INTEGER DEFAULT 0
      );
    `);

    // Module E: Daily Register (Opening/Closing)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS daily_registers (
        id SERIAL PRIMARY KEY,
        date TEXT NOT NULL UNIQUE,
        opening_balance REAL DEFAULT 0,
        closing_balance REAL DEFAULT 0,
        notes TEXT
      );
    `);

    // Module F: Invoice Items (Itemized Billing)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS invoice_items (
        id SERIAL PRIMARY KEY,
        invoice_id INTEGER NOT NULL REFERENCES invoices(id),
        product_id INTEGER NOT NULL REFERENCES products(id),
        quantity INTEGER NOT NULL,
        rate REAL NOT NULL,
        cost_price REAL DEFAULT 0,
        amount REAL NOT NULL
      );
    `);

    // Adding columns if they don't exist (Supabase/Postgres syntax)
    try {
      await pool.query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'Sale'`);
      await pool.query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS notes TEXT`);
      await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price REAL DEFAULT 0`);
      await pool.query(`ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS cost_price REAL DEFAULT 0`);
      console.log("Extra columns verified.");
    } catch (err) {
      // Ignore if columns exist
    }

    console.log('Database connected & initialized on Supabase successfully!');
    return pool;
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  }
}

function getDatabase() {
  if (!pool) {
    throw new Error('Database not initialized.');
  }
  return pool;
}

module.exports = {
  initializeDatabase,
  getDatabase,
  pool
};