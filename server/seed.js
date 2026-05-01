const { initializeDatabase } = require('./db');

async function seed() {
    try {
        const db = await initializeDatabase();

        console.log('Seeding database...');

        // 1. Create Shops
        const shops = [
            { name: 'Al-Madina Pharmacy', address: 'Main Market, City A', current_balance: 0 },
            { name: 'Bismillah Medical Store', address: 'Plaza B, City A', current_balance: 0 },
            { name: 'Care Plus', address: 'Road C, City B', current_balance: 0 }
        ];

        for (const shop of shops) {
            await db.run(
                'INSERT INTO shops (name, address, current_balance) VALUES (?, ?, ?)',
                [shop.name, shop.address, shop.current_balance]
            );
        }
        console.log('Shops seeded.');

        // 2. Create Invoices
        // We need shop IDs, so let's fetch them back
        const dbShops = await db.all('SELECT * FROM shops');

        const invoices = [
            { invoice_no: 'INV-001', date: '2023-10-25', shop_id: dbShops[0].id, salesman_name: 'Ali', bill_amount: 5000 },
            { invoice_no: 'INV-002', date: '2023-10-26', shop_id: dbShops[1].id, salesman_name: 'Ahmed', bill_amount: 12000 },
            { invoice_no: 'INV-003', date: '2023-10-27', shop_id: dbShops[0].id, salesman_name: 'Ali', bill_amount: 3000 }
        ];

        for (const inv of invoices) {
            // Calculate logic manually for seed
            const shop = await db.get('SELECT current_balance FROM shops WHERE id = ?', [inv.shop_id]);
            const previous_balance = shop.current_balance;
            const total_payable = inv.bill_amount + previous_balance;

            await db.run(
                `INSERT INTO invoices (invoice_no, date, shop_id, salesman_name, bill_amount, previous_balance, total_payable) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [inv.invoice_no, inv.date, inv.shop_id, inv.salesman_name, inv.bill_amount, previous_balance, total_payable]
            );

            await db.run('UPDATE shops SET current_balance = ? WHERE id = ?', [total_payable, inv.shop_id]);
        }
        console.log('Invoices seeded.');

        console.log('Database seeded successfully!');
    } catch (error) {
        console.error('Seeding failed:', error);
    }
}

seed();
