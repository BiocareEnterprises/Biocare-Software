async function testProductApi() {
    try {
        const product = {
            name: 'API Test Product 2',
            sku: 'API_TEST_002',
            rate: 150,
            stock_quantity: 20,
            cost_price: 75.50
        };

        console.log('Sending product:', product);
        const res = await fetch('http://localhost:5000/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(product)
        });

        const data = await res.json();
        console.log('Response status:', res.status);
        console.log('Response body:', data);

        if (data.cost_price === 75.50) {
            console.log('SUCCESS: cost_price returned correctly.');
        } else {
            console.log('FAILURE: cost_price mismatch. Expected 75.50, got', data.cost_price);
        }

    } catch (error) {
        console.error('Error:', error.message);
    }
}

testProductApi();
