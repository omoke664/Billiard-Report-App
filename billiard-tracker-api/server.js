// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mpesaRoutes = require('./routes/mpesa.routes');
const authRoutes = require('./routes/auth.routes');
const settingsRoutes = require('./routes/settings.routes');

const app = express();
app.use(cors());
app.use(express.json()); 

// Register Routes
app.use('/api/mpesa', mpesaRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/settings', settingsRoutes);

// Health check
app.get('/', (req, res) => {
    res.send('Billiard Business Tracker API is running! 🎱');
});

const PORT = process.env.PORT || 3001;
app.use('/api/auth', authRoutes);
app.use('/api/settings', settingsRoutes);
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});