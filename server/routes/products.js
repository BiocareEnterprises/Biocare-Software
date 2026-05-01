const express = require('express');
const router = express.Router();
const { getDatabase } = require('../db');

// GET all products
router.get('/', async (req, res) => {
    try {
        const db = getDatabase();
        const result = await db.query('SELECT * FROM products ORDER BY name');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST new product
router.post('/', async (req, res) => {
    console.log('POST /products body:', req.body);
    const { name, sku, rate, stock_quantity } = req.body;
    try {
        const db = getDatabase();
        // Postgres mein insert hone ke baad id return karwane ke liye 'RETURNING id' use hota hai
        const result = await db.query(
            'INSERT INTO products (name, sku, rate, stock_quantity, cost_price) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [name, sku, rate, stock_quantity || 0, req.body.cost_price || 0]
        );
        res.status(201).json({ id: result.rows[0].id, name, sku, rate, stock_quantity, cost_price: req.body.cost_price || 0 });
    } catch (error) {
        // Postgres unique error code 23505 hota hai
        if (error.code === '23505' || error.message.includes('duplicate key') || error.message.includes('unique constraint')) {
            return res.status(400).json({ error: 'SKU already exists' });
        }
        res.status(500).json({ error: error.message });
    }
});

// PUT update product
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, sku, rate, stock_quantity } = req.body;
    try {
        const db = getDatabase();
        await db.query(
            'UPDATE products SET name = $1, sku = $2, rate = $3, stock_quantity = $4, cost_price = $5 WHERE id = $6',
            [name, sku, rate, stock_quantity, req.body.cost_price || 0, id]
        );
        res.json({ message: 'Product updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE product
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const db = getDatabase();
        await db.query('DELETE FROM products WHERE id = $1', [id]);
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;