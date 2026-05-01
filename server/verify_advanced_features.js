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
        console.log('--- Starting Advanced Features Verification ---');

        // 1. Create a new Shop
        console.log('\n1. Creating Test Shop for Returns...');
        const shopRes = await post(`${API_URL}/shops`, {
            name: `Return Test Shop ${Date.now()}`,
            address: '123 Return St',
            initial_balance: 1000
        });
        const shopId = shopRes.id;
        console.log(`   Shop Created: ID ${shopId}, Initial Balance: 1000`);

        // 2. Create a Sales Return
        console.log('\n2. Creating Sales Return (Credit Note)...');
        const returnRes = await post(`${API_URL}/sales`, {
            invoice_no: `RET-${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            shop_id: shopId,
            salesman_name: 'Tester',
            bill_amount: 200,
            type: 'Return',
            notes: 'Damaged Goods'
        });
        console.log(`   Return Created: Amount 200. New Balance: ${returnRes.new_balance}`);

        if (returnRes.new_balance !== 800) {
            console.error('   [FAIL] Balance update incorrect. Expected 800.');
        } else {
            console.log('   [PASS] Balance updated correctly (1000 - 200 = 800).');
        }

        // 3. Verify Ledger Entry
        console.log('\n3. Verifying Ledger for Return...');
        const ledger = await get(`${API_URL}/dms/customers/${shopId}/ledger`);
        const returnEntry = ledger.find(e => e.type === 'Return' || e.credit === 200);

        if (returnEntry) {
            console.log('   [PASS] Return entry found in ledger.');
            console.log(`   Entry: ${JSON.stringify(returnEntry)}`);
        } else {
            console.error('   [FAIL] Return entry NOT found in ledger.');
        }

        // 4. Test Aging Analysis
        console.log('\n4. Testing Aging Analysis...');
        // Create an old invoice (45 days ago)
        const oldDate = new Date();
        oldDate.setDate(oldDate.getDate() - 45);
        const oldDateStr = oldDate.toISOString().split('T')[0];

        await post(`${API_URL}/sales`, {
            invoice_no: `OLD-${Date.now()}`,
            date: oldDateStr,
            shop_id: shopId,
            salesman_name: 'Tester',
            bill_amount: 5000
        });
        console.log(`   Created Old Invoice (45 days ago) for 5000.`);

        const aging = await get(`${API_URL}/dms/customers/${shopId}/aging`);
        console.log('   Aging Result:', aging);

        if (aging['31-60'] >= 5000) {
            console.log('   [PASS] Aging correctly identified 31-60 days bucket.');
        } else {
            console.error('   [FAIL] Aging bucket incorrect.');
        }

        console.log('\n--- VERIFICATION COMPLETE ---');

    } catch (error) {
        console.error('Verification Error:', error.message);
    }
}

runVerification();
