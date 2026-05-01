const express = require('express');
const router = express.Router();
const { getDatabase } = require('../db');
const XLSX = require('xlsx');

// GET /api/dms/customers
// Fetch all customers (shops)
router.get('/customers', async (req, res) => {
    try {
        const db = getDatabase();
        // Map shops table to expected Customer format
        const sql = `SELECT id as CustomerID, name as ShopName, address as Area, current_balance as Balance, NULL as BookerName FROM shops ORDER BY name`;
        const result = await db.query(sql);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/dms/customers/:id
// Fetch specific customer details
router.get('/customers/:id', async (req, res) => {
    try {
        const db = getDatabase();
        const sql = `SELECT id as CustomerID, name as ShopName, address as Area, NULL as BookerName FROM shops WHERE id = $1`;
        const result = await db.query(sql, [req.params.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});



// GET /api/dms/customers/:id/ledger
// Fetch customer ledger (Invoices and Recoveries combined/sorted)
router.get('/customers/:id/ledger', async (req, res) => {
    try {
        const db = getDatabase();
        const customerId = req.params.id;
        const { startDate, endDate } = req.query;

        // Fetch Shop Details for Current Balance
        const shopResult = await db.query('SELECT current_balance FROM shops WHERE id = $1', [customerId]);
        if (shopResult.rows.length === 0) {
            return res.status(404).json({ error: 'Shop not found' });
        }
        const shop = shopResult.rows[0];

        // Fetch ALL Invoices
        const invoicesSql = `
      SELECT 
        id, 
        date, 
        type, 
        invoice_no as reference, 
        bill_amount as amount,
        'Salesman: ' || salesman_name || (CASE WHEN notes IS NOT NULL THEN ' (' || notes || ')' ELSE '' END) as description 
      FROM invoices 
      WHERE shop_id = $1
    `;

        // Fetch ALL Recoveries
        const recoveriesSql = `
      SELECT 
        id, 
        date, 
        'Recovery' as type, 
        mode || (CASE WHEN cheque_ref_no IS NOT NULL THEN ' #' || cheque_ref_no ELSE '' END) as reference, 
        amount,
        'Salesman: ' || salesman_name as description 
      FROM recoveries
      WHERE shop_id = $1
    `;

        const invoicesResult = await db.query(invoicesSql, [customerId]);
        const recoveriesResult = await db.query(recoveriesSql, [customerId]);

        const invoices = invoicesResult.rows;
        const recoveries = recoveriesResult.rows;

        // Normalize transactions
        const allTransactions = [
            ...invoices.map(inv => ({
                ...inv,
                debit: inv.type === 'Return' ? 0 : inv.amount,
                credit: inv.type === 'Return' ? inv.amount : 0
            })),
            ...recoveries.map(rec => ({
                ...rec,
                debit: 0,
                credit: rec.amount
            }))
        ].sort((a, b) => new Date(a.date) - new Date(b.date));

        // 1. Calculate the Global Initial Balance (at t=0)
        let totalNetMovement = 0;
        allTransactions.forEach(t => {
            totalNetMovement += (t.debit - t.credit);
        });
        const globalInitialBalance = shop.current_balance - totalNetMovement;

        // 2. Filter Transactions and Calculate Displayed Opening Balance
        let displayedOpeningBalance = globalInitialBalance;
        let filteredTransactions = [];

        if (startDate) {
            const start = new Date(startDate);
            allTransactions.forEach(t => {
                const tDate = new Date(t.date);
                if (tDate < start) {
                    displayedOpeningBalance += (t.debit - t.credit);
                } else {
                    if (!endDate || tDate <= new Date(endDate)) {
                        filteredTransactions.push(t);
                    }
                }
            });
        } else {
            filteredTransactions = endDate
                ? allTransactions.filter(t => new Date(t.date) <= new Date(endDate))
                : allTransactions;
        }

        const ledger = [];

        // Add Opening Balance row
        if (startDate || Math.abs(displayedOpeningBalance) > 0.01) {
            ledger.push({
                id: 'opening',
                date: startDate || (filteredTransactions.length > 0 ? filteredTransactions[0].date : new Date().toISOString().split('T')[0]),
                type: 'Opening Balance',
                reference: '-',
                description: 'Brought Forward',
                debit: displayedOpeningBalance > 0 ? displayedOpeningBalance : 0,
                credit: displayedOpeningBalance < 0 ? Math.abs(displayedOpeningBalance) : 0,
                balance: displayedOpeningBalance
            });
        }

        let runningBalance = displayedOpeningBalance;
        filteredTransactions.forEach(entry => {
            runningBalance += (entry.debit - entry.credit);
            ledger.push({ ...entry, balance: runningBalance });
        });

        res.json(ledger);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/dms/stats
// Fetch dashboard stats
router.get('/stats', async (req, res) => {
    try {
        const db = getDatabase();
        const stats = {};

        const customersRow = await db.query("SELECT COUNT(*) as count FROM shops");
        stats.totalCustomers = parseInt(customersRow.rows[0].count, 10);

        const salesRow = await db.query("SELECT SUM(bill_amount) as total FROM invoices");
        stats.totalSales = salesRow.rows[0].total || 0;

        const recoveredRow = await db.query("SELECT SUM(amount) as total FROM recoveries");
        stats.totalRecovered = recoveredRow.rows[0].total || 0;

        stats.totalOutstanding = stats.totalSales - stats.totalRecovered;

        res.json(stats);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/dms/customers/:id/ledger/export
// Export customer ledger to Excel
router.get('/customers/:id/ledger/export', async (req, res) => {
    try {
        const db = getDatabase();
        const customerId = req.params.id;

        // Fetch Customer Details
        const customerResult = await db.query(`SELECT name as ShopName, current_balance FROM shops WHERE id = $1`, [customerId]);
        if (customerResult.rows.length === 0) return res.status(404).json({ error: 'Customer not found' });
        const customer = customerResult.rows[0];

        // Fetch Invoices
        const invoicesSql = `
      SELECT 
        date, 
        'Invoice' as type, 
        invoice_no as reference, 
        bill_amount as debit, 
        0 as credit, 
        'Salesman: ' || salesman_name as description 
      FROM invoices 
      WHERE shop_id = $1
    `;

        // Fetch Recoveries
        const recoveriesSql = `
      SELECT 
        date, 
        'Recovery' as type, 
        mode || (CASE WHEN cheque_ref_no IS NOT NULL THEN ' #' || cheque_ref_no ELSE '' END) as reference, 
        0 as debit, 
        amount as credit, 
        'Salesman: ' || salesman_name as description 
      FROM recoveries
      WHERE shop_id = $1
    `;

        const invoicesResult = await db.query(invoicesSql, [customerId]);
        const recoveriesResult = await db.query(recoveriesSql, [customerId]);

        const invoices = invoicesResult.rows;
        const recoveries = recoveriesResult.rows;

        // Combine and sort by date
        const transactions = [...invoices, ...recoveries].sort((a, b) => new Date(a.date) - new Date(b.date));

        // Calculate Net Movement
        let netMovement = 0;
        transactions.forEach(t => {
            netMovement += (t.debit - t.credit);
        });

        // Calculate Opening Balance
        const openingBalance = customer.current_balance - netMovement;

        const data = [];

        // Add Opening Balance row
        if (Math.abs(openingBalance) > 0.01) {
            data.push({
                Date: transactions.length > 0 ? transactions[0].date : new Date().toISOString().split('T')[0],
                Type: 'Opening Balance',
                Reference: '-',
                Description: 'Brought Forward',
                Debit: openingBalance > 0 ? openingBalance : 0,
                Credit: openingBalance < 0 ? Math.abs(openingBalance) : 0,
                Balance: openingBalance
            });
        }

        let runningBalance = openingBalance;
        transactions.forEach(entry => {
            runningBalance += (entry.debit - entry.credit);
            data.push({
                Date: entry.date,
                Type: entry.type,
                Reference: entry.reference,
                Description: entry.description,
                Debit: entry.debit,
                Credit: entry.credit,
                Balance: runningBalance
            });
        });

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, 'Ledger');

        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Disposition', `attachment; filename=${customer.ShopName}_Ledger.xlsx`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/dms/customers/:id/aging
// Calculate Aging Analysis (0-30, 31-60, 60-90, 90+)
router.get('/customers/:id/aging', async (req, res) => {
    try {
        const db = getDatabase();
        const customerId = req.params.id;

        const shopResult = await db.query('SELECT current_balance FROM shops WHERE id = $1', [customerId]);
        if (shopResult.rows.length === 0) return res.status(404).json({ error: 'Shop not found' });
        const shop = shopResult.rows[0];

        let remainingBalance = shop.current_balance;
        const aging = {
            '0-30': 0,
            '31-60': 0,
            '61-90': 0,
            '90+': 0
        };

        if (remainingBalance <= 0) {
            return res.json(aging); // No debt
        }

        // Fetch invoices sorted by date DESC (newest first)
        const invoicesResult = await db.query(`SELECT date, bill_amount FROM invoices WHERE shop_id = $1 ORDER BY date DESC`, [customerId]);
        const invoices = invoicesResult.rows;

        const today = new Date();

        for (const inv of invoices) {
            if (remainingBalance <= 0) break;

            const invDate = new Date(inv.date);
            const diffTime = Math.abs(today - invDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            const amountToAllocate = Math.min(remainingBalance, inv.bill_amount);

            if (diffDays <= 30) aging['0-30'] += amountToAllocate;
            else if (diffDays <= 60) aging['31-60'] += amountToAllocate;
            else if (diffDays <= 90) aging['61-90'] += amountToAllocate;
            else aging['90+'] += amountToAllocate;

            remainingBalance -= amountToAllocate;
        }

        if (remainingBalance > 0) {
            aging['90+'] += remainingBalance;
        }

        res.json(aging);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;