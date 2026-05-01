const express = require('express');
const cors = require('cors');
const path = require('path');
const { initializeDatabase } = require('./db');
const salesRoutes = require('./routes/sales');
const recoveryRoutes = require('./routes/recovery');
const chequesRoutes = require('./routes/cheques');
const dmsRoutes = require('./routes/dms');
const productsRoutes = require('./routes/products');
const registerRoutes = require('./routes/register');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/sales', salesRoutes);
app.use('/api/recovery', recoveryRoutes);
app.use('/api/cheques', chequesRoutes);
app.use('/api/dms', dmsRoutes);
app.use('/api/shops', require('./routes/shops'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/products', productsRoutes);
app.use('/api/register', registerRoutes);

// Serve static files from React app
app.use(express.static(path.join(__dirname, '../client/dist')));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// Start server
async function startServer() {
    try {
        await initializeDatabase();
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();
