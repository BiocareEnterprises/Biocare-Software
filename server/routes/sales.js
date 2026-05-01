const express = require('express');
const router = express.Router();
const { getDatabase } = require('../db');

// Get all invoices
router.get('/', async (req, res) => {
    try {
        const db = getDatabase();
        const result = await db.query(`
            SELECT invoices.*, shops.name as shop_name 
            FROM invoices 
            JOIN shops ON invoices.shop_id = shops.id 
            ORDER BY date DESC
        `);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create a new invoice (or Return)
router.post('/', async (req, res) => {
    const { invoice_no, date, shop_id, salesman_name, bill_amount, type = 'Sale', notes = '', items = [] } = req.body;
    const db = getDatabase();

    try {
        // 1. Get current balance of the shop
        const shopResult = await db.query('SELECT current_balance FROM shops WHERE id = $1', [shop_id]);
        if (shopResult.rows.length === 0) {
            return res.status(404).json({ error: 'Shop not found' });
        }
        const shop = shopResult.rows[0];

        const previous_balance = shop.current_balance;

        // Calculate bill amount from items if provided
        let calculatedBillAmount = parseFloat(bill_amount) || 0;
        if (items.length > 0) {
            calculatedBillAmount = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
        }

        // Calculate new total payable based on type
        let total_payable;
        if (type === 'Return') {
            total_payable = previous_balance - calculatedBillAmount;
        } else {
            total_payable = previous_balance + calculatedBillAmount;
        }

        // 2. Insert Invoice/Return
        const insertResult = await db.query(
            `INSERT INTO invoices (invoice_no, date, shop_id, salesman_name, bill_amount, previous_balance, total_payable, type, notes)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
            [invoice_no, date, shop_id, salesman_name, calculatedBillAmount, previous_balance, total_payable, type, notes]
        );

        const invoiceId = insertResult.rows[0].id;

        // 3. Handle Items and Inventory
        if (items.length > 0) {
            for (const item of items) {
                // Fetch product cost price
                const productResult = await db.query('SELECT cost_price FROM products WHERE id = $1', [item.product_id]);
                const product = productResult.rows[0];
                const costPrice = product ? product.cost_price : 0;

                // Insert into invoice_items
                await db.query(
                    `INSERT INTO invoice_items (invoice_id, product_id, quantity, rate, amount, cost_price)
                     VALUES ($1, $2, $3, $4, $5, $6)`,
                    [invoiceId, item.product_id, item.quantity, item.rate, item.quantity * item.rate, costPrice]
                );

                // Update Product Stock
                if (type === 'Sale') {
                    await db.query(
                        'UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2',
                        [item.quantity, item.product_id]
                    );
                } else if (type === 'Return') {
                    await db.query(
                        'UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2',
                        [item.quantity, item.product_id]
                    );
                }
            }
        }

        // 4. Update Shop Balance
        await db.query(
            'UPDATE shops SET current_balance = $1 WHERE id = $2',
            [total_payable, shop_id]
        );

        res.status(201).json({
            id: invoiceId,
            message: type === 'Return' ? 'Return recorded successfully' : 'Invoice created successfully',
            new_balance: total_payable
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;