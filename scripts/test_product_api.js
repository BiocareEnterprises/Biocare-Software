const axios = require('axios');

async function testProductApi() {
    try {
        const product = {
            name: 'API Test Product',
            sku: 'API_TEST_001',
            rate: 150,
            stock_quantity: 20,
            cost_price: 75.50
        };

        console.log('Sending product:', product);
        const res = await axios.post('http://localhost:5000/api/products', product);
        console.log('Response status:', res.status);
        console.log('Response body:', res.data);

        if (res.data.cost_price === 75.50) {
            console.log('SUCCESS: cost_price returned correctly.');
        } else {
            console.log('FAILURE: cost_price mismatch. Expected 75.50, got', res.data.cost_price);
        }

    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}

testProductApi();
