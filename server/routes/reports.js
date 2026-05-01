const express = require('express');
const router = express.Router();
const { getDatabase } = require('../db');
const XLSX = require('xlsx');

router.get('/monthly-sales', async (req, res) => {
    try {
        const db = getDatabase();
        // Postgres uses to_char for date formatting instead of strftime
        const result = await db.query(`
            SELECT to_char(date::date, 'YYYY-MM') as month, SUM(bill_amount) as total
            FROM invoices
            GROUP BY month
            ORDER BY month ASC
            LIMIT 12
        `);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/:type', async (req, res) => {
    const { type } = req.params;
    const db = getDatabase();
    let data = [];
    let sheetName = 'Sheet1';

    try {
        let result;
        if (type === 'sales') {
            result = await db.query(`
                SELECT invoices.invoice_no, invoices.date, shops.name as shop_name, 
                       invoices.salesman_name, invoices.bill_amount, invoices.total_payable 
                FROM invoices 
                JOIN shops ON invoices.shop_id = shops.id 
                ORDER BY date DESC
            `);
            data = result.rows;
            sheetName = 'Sales Ledger';
        } else if (type === 'recovery') {
            result = await db.query(`
                SELECT recoveries.date, shops.name as shop_name, recoveries.salesman_name, 
                       recoveries.mode, recoveries.amount, recoveries.cheque_ref_no 
                FROM recoveries 
                JOIN shops ON recoveries.shop_id = shops.id 
                ORDER BY date DESC
            `);
            data = result.rows;
            sheetName = 'Recovery Log';
        } else if (type === 'cheques') {
            result = await db.query(`
                SELECT cheques.cheque_no, shops.name as shop_name, cheques.bank_name, 
                       cheques.amount, cheques.due_date, cheques.status, cheques.deposit_date, cheques.clearance_date 
                FROM cheques 
                JOIN recoveries ON cheques.recovery_id = recoveries.id 
                JOIN shops ON recoveries.shop_id = shops.id 
                ORDER BY due_date ASC
            `);
            data = result.rows;
            sheetName = 'Cheque Management';
        } else if (type === 'products') {
            result = await db.query(`
                SELECT sku, name, rate, stock_quantity 
                FROM products 
                ORDER BY name ASC
            `);
            data = result.rows;
            sheetName = 'Product Inventory';
        } else if (type === 'register') {
            result = await db.query(`
                SELECT date, opening_balance, closing_balance, notes 
                FROM daily_registers 
                ORDER BY date DESC
            `);
            data = result.rows;
            sheetName = 'Daily Register';
        } else {
            return res.status(400).json({ error: 'Invalid report type' });
        }

        const format = req.query.format || 'xlsx';

        if (format === 'csv') {
            const ws = XLSX.utils.json_to_sheet(data);
            const csv = XLSX.utils.sheet_to_csv(ws);

            res.setHeader('Content-Disposition', `attachment; filename="${type}_report.csv"`);
            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            // Add BOM for Excel to recognize UTF-8
            res.send('\uFEFF' + csv);
        } else {
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(data);
            XLSX.utils.book_append_sheet(wb, ws, sheetName);

            const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

            res.setHeader('Content-Disposition', `attachment; filename=${type}_report.xlsx`);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.send(buffer);
        }

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;