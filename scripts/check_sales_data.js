const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../server/database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // 1. Check invoice count
    db.get("SELECT COUNT(*) as count FROM invoices", (err, row) => {
        if (err) console.error(err);
        else console.log("Total Invoices:", row.count);
    });

    // 2. Check a sample date
    db.get("SELECT date FROM invoices LIMIT 1", (err, row) => {
        if (err) console.error(err);
        else console.log("Sample Date:", row ? row.date : "No invoices found");
    });

    // 3. Run the monthly sales query
    db.all(`
        SELECT strftime('%Y-%m', date) as month, SUM(bill_amount) as total
        FROM invoices
        GROUP BY month
        ORDER BY month ASC
        LIMIT 12
    `, (err, rows) => {
        if (err) console.error(err);
        else {
            console.log("Monthly Sales Data:");
            console.log(JSON.stringify(rows, null, 2));
        }
    });
});

db.close();
