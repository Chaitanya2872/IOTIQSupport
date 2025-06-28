const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Add logging middleware to debug requests
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    if (req.body && Object.keys(req.body).length > 0) {
        console.log('Request body:', req.body);
    }
    next();
});

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

// Check if environment variables are loaded
console.log('Environment check:');
console.log('EMAIL_SERVICE:', process.env.EMAIL_SERVICE ? 'Set' : 'Missing');
console.log('EMAIL_USER:', process.env.EMAIL_USER ? 'Set' : 'Missing');
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 'Set' : 'Missing');
console.log('ADMIN_EMAIL:', process.env.ADMIN_EMAIL ? 'Set' : 'Missing');

// Routes
try {
    const emailRoutes = require('./routes/email');
    app.use('/api', emailRoutes);
    console.log('Email routes loaded successfully');
} catch (error) {
    console.error('Error loading email routes:', error);
}

// Test route to verify server is working
app.get('/api/test', (req, res) => {
    res.json({ 
        message: 'Server is working', 
        timestamp: new Date().toISOString(),
        env: {
            EMAIL_SERVICE: !!process.env.EMAIL_SERVICE,
            EMAIL_USER: !!process.env.EMAIL_USER,
            EMAIL_PASS: !!process.env.EMAIL_PASS,
            ADMIN_EMAIL: !!process.env.ADMIN_EMAIL
        }
    });
});

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
    console.log('404 - Route not found:', req.path);
    res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Frontend served from: ${path.join(__dirname, '../frontend')}`);
    console.log(`API endpoint: http://localhost:${PORT}/api/send-email`);
    console.log(`Test endpoint: http://localhost:${PORT}/api/test`);
});