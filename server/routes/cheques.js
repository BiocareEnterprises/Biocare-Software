const express = require('express');
const router = express.Router();
const { getDatabase } = require('../db');

// Get all cheques
router.get('/', async (req, res) => {
    try {
        const db = getDatabase();
        const result = await db.query(`
            SELECT cheques.*, shops.name as shop_name, recoveries.shop_id 
            FROM cheques 
            JOIN recoveries ON cheques.recovery_id = recoveries.id 
            JOIN shops ON recoveries.shop_id = shops.id 
            ORDER BY due_date ASC
        `);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update Cheque Status (Module C Logic)
router.patch('/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status, bounce_reason, deposit_date, clearance_date } = req.body;

    if (!status) {
        return res.status(400).json({ error: 'Status is required' });
    }

    const db = getDatabase();

    try {
        const chequeResult = await db.query(`
            SELECT cheques.*, recoveries.shop_id, recoveries.amount as recovery_amount 
            FROM cheques 
            JOIN recoveries ON cheques.recovery_id = recoveries.id 
            WHERE cheques.id = $1
        `, [id]);

        const cheque = chequeResult.rows[0];

        if (!cheque) {
            return res.status(404).json({ error: 'Cheque not found' });
        }

        const oldStatus = cheque.status;

        // Update Cheque
        await db.query(
            `UPDATE cheques 
             SET status = $1, bounce_reason = $2, deposit_date = $3, clearance_date = $4 
             WHERE id = $5`,
            [status, bounce_reason, deposit_date, clearance_date, id]
        );

        // Critical Business Logic: If status becomes "Bounced", reverse the credit
        if (status === 'Bounced' && oldStatus !== 'Bounced') {
            // Add debt back to the shop
            const shopResult = await db.query('SELECT current_balance FROM shops WHERE id = $1', [cheque.shop_id]);
            const shop = shopResult.rows[0];
            const newBalance = shop.current_balance + cheque.recovery_amount;
            await db.query('UPDATE shops SET current_balance = $1 WHERE id = $2', [newBalance, cheque.shop_id]);
        }
        // Optional: If status changes FROM Bounced TO something else (correction), reverse the reversal?
        // For now, let's stick to the explicit requirement.

        res.json({ message: 'Cheque status updated', status });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;