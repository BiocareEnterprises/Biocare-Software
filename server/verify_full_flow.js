const API_URL = 'http://localhost:5000/api';

async function post(url, data) {
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!res.ok) {
        const err = await res.text();
        throw new Error(`POST ${url} failed: ${res.status} ${err}`);
    }
    return res.json();
}

async function get(url) {
    const res = await fetch(url);
    if (!res.ok) {
        const err = await res.text();
        throw new Error(`GET ${url} failed: ${res.status} ${err}`);
    }
    return res.json();
}

async function runVerification() {
    try {
        console.log('--- Starting Full System Verification ---');

        // 1. Create a new Shop
        console.log('\n1. Creating Test Shop...');
        const shopRes = await post(`${API_URL}/shops`, {
            name: `Test Shop ${Date.now()}`,
            address: '123 Test St',
            initial_balance: 1000 // Opening Balance
        });
        const shopId = shopRes.id;
        console.log(`   Shop Created: ID ${shopId}, Name: ${shopRes.name}, Initial Balance: ${shopRes.current_balance}`);

        // 2. Create an Invoice (Sale)
        console.log('\n2. Creating Invoice...');
        const invoiceRes = await post(`${API_URL}/sales`, {
            invoice_no: `INV-${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            shop_id: shopId,
            salesman_name: 'Tester',
            bill_amount: 5000
        });
        console.log(`   Invoice Created: Amount 5000. New Shop Balance: ${invoiceRes.new_balance}`);

        // 3. Create a Recovery (Payment)
        console.log('\n3. Creating Recovery...');
        const recoveryRes = await post(`${API_URL}/recovery`, {
            date: new Date().toISOString().split('T')[0],
            salesman_name: 'Tester',
            shop_id: shopId,
            mode: 'Cash',
            amount: 2000
        });
        console.log(`   Recovery Created: Amount 2000. New Shop Balance: ${recoveryRes.new_balance}`);

        // 4. Verify Ledger
        console.log('\n4. Verifying Ledger...');
        const ledger = await get(`${API_URL}/dms/customers/${shopId}/ledger`);

        console.log('   Ledger Entries:');
        ledger.forEach(entry => {
            console.log(`   - [${entry.date}] ${entry.type}: Debit ${entry.debit}, Credit ${entry.credit}, Balance ${entry.balance}`);
        });

        // Checks
        const openingEntry = ledger.find(e => e.type === 'Opening Balance');
        const finalEntry = ledger[ledger.length - 1];

        let passed = true;

        if (!openingEntry || openingEntry.balance !== 1000) {
            console.error('   [FAIL] Opening Balance incorrect or missing. Expected 1000.');
            passed = false;
        } else {
            console.log('   [PASS] Opening Balance verified (1000).');
        }

        // Expected Final: 1000 (Open) + 5000 (Sale) - 2000 (Rec) = 4000
        if (finalEntry.balance !== 4000) {
            console.error(`   [FAIL] Final Balance incorrect. Expected 4000, got ${finalEntry.balance}.`);
            passed = false;
        } else {
            console.log('   [PASS] Final Balance verified (4000).');
        }

        if (passed) {
            console.log('\n--- VERIFICATION SUCCESSFUL ---');
        } else {
            console.log('\n--- VERIFICATION FAILED ---');
        }

    } catch (error) {
        console.error('Verification Error:', error.message);
    }
}

runVerification();
