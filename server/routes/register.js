const express = require('express');
const router = express.Router();
const { getDatabase } = require('../db');

// GET register for a specific date or range
router.get('/', async (req, res) => {
    const { date, start_date, end_date } = req.query;
    const db = getDatabase();

    try {
        if (date) {
            const result = await db.query('SELECT * FROM daily_registers WHERE date = $1', [date]);
            res.json(result.rows[0] || null);
        } else if (start_date && end_date) {
            const result = await db.query(
                'SELECT * FROM daily_registers WHERE date BETWEEN $1 AND $2 ORDER BY date DESC',
                [start_date, end_date]
            );
            res.json(result.rows);
        } else {
            // Default: Get last 30 days
            const result = await db.query('SELECT * FROM daily_registers ORDER BY date DESC LIMIT 30');
            res.json(result.rows);
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST/PUT set opening/closing balance
router.post('/', async (req, res) => {
    const { date, opening_balance, closing_balance, notes } = req.body;
    const db = getDatabase();

    try {
        const existingResult = await db.query('SELECT id FROM daily_registers WHERE date = $1', [date]);
        const existing = existingResult.rows[0];

        if (existing) {
            await db.query(
                `UPDATE daily_registers 
                 SET opening_balance = COALESCE($1, opening_balance), 
                     closing_balance = COALESCE($2, closing_balance), 
                     notes = COALESCE($3, notes) 
                 WHERE date = $4`,
                [opening_balance, closing_balance, notes, date]
            );
            res.json({ message: 'Register updated successfully' });
        } else {
            await db.query(
                'INSERT INTO daily_registers (date, opening_balance, closing_balance, notes) VALUES ($1, $2, $3, $4)',
                [date, opening_balance || 0, closing_balance || 0, notes || '']
            );
            res.json({ message: 'Register created successfully' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;