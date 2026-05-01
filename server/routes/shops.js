const express = require('express');
const router = express.Router();
const { getDatabase } = require('../db');

// Get all shops
router.get('/', async (req, res) => {
    try {
        const db = getDatabase();
        const result = await db.query('SELECT * FROM shops ORDER BY name');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add a new shop
router.post('/', async (req, res) => {
    const { name, address, initial_balance } = req.body;
    try {
        const db = getDatabase();
        const result = await db.query(
            'INSERT INTO shops (name, address, current_balance) VALUES ($1, $2, $3) RETURNING id',
            [name, address, initial_balance || 0]
        );
        res.status(201).json({ id: result.rows[0].id, name, address, current_balance: initial_balance || 0 });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;