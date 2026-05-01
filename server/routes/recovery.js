const express = require('express');
const router = express.Router();
const { getDatabase } = require('../db');

// Get all recoveries
router.get('/', async (req, res) => {
    try {
        const db = getDatabase();
        const result = await db.query(`
            SELECT recoveries.*, shops.name as shop_name 
            FROM recoveries 
            JOIN shops ON recoveries.shop_id = shops.id 
            ORDER BY date DESC
        `);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create a new recovery (Module B Logic)
router.post('/', async (req, res) => {
    const { date, salesman_name, shop_id, mode, amount, cheque_ref_no, bank_name, due_date } = req.body;

    if (!shop_id || !amount || !mode) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    if (mode === 'Cheque' && (!cheque_ref_no || !bank_name || !due_date)) {
        return res.status(400).json({ error: 'Cheque details are required for Cheque mode' });
    }

    const db = getDatabase();

    try {
        // 1. Get current balance
        const shopResult = await db.query('SELECT current_balance FROM shops WHERE id = $1', [shop_id]);
        if (shopResult.rows.length === 0) {
            return res.status(404).json({ error: 'Shop not found' });
        }
        const shop = shopResult.rows[0];

        // 2. Insert Recovery
        const result = await db.query(
            `INSERT INTO recoveries (date, salesman_name, shop_id, mode, amount, cheque_ref_no) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
            [date, salesman_name, shop_id, mode, amount, cheque_ref_no]
        );
        const recoveryId = result.rows[0].id;

        // 3. Update Shop Balance (Subtract amount)
        // Note: Even if it's a cheque, it's treated as 'Received' in the ledger initially
        const newBalance = shop.current_balance - parseFloat(amount);
        await db.query('UPDATE shops SET current_balance = $1 WHERE id = $2', [newBalance, shop_id]);

        // 4. If Cheque, create entry in Module C
        if (mode === 'Cheque') {
            await db.query(
                `INSERT INTO cheques (recovery_id, cheque_no, bank_name, amount, due_date, status) 
                 VALUES ($1, $2, $3, $4, $5, 'Pending')`,
                [recoveryId, cheque_ref_no, bank_name, amount, due_date]
            );
        }

        res.status(201).json({
            id: recoveryId,
            message: 'Recovery recorded successfully',
            new_balance: newBalance
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;