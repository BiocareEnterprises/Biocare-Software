const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // Add cost_price to products table
    db.run("ALTER TABLE products ADD COLUMN cost_price DECIMAL(10,2) DEFAULT 0", (err) => {
        if (err) {
            if (err.message.includes('duplicate column name')) {
                console.log('Column cost_price already exists in products table.');
            } else {
                console.error('Error adding cost_price to products:', err.message);
            }
        } else {
            console.log('Successfully added cost_price to products table.');
        }
    });

    // Add cost_price to invoice_items table
    db.run("ALTER TABLE invoice_items ADD COLUMN cost_price DECIMAL(10,2) DEFAULT 0", (err) => {
        if (err) {
            if (err.message.includes('duplicate column name')) {
                console.log('Column cost_price already exists in invoice_items table.');
            } else {
                console.error('Error adding cost_price to invoice_items:', err.message);
            }
        } else {
            console.log('Successfully added cost_price to invoice_items table.');
        }
    });
});

db.close();
