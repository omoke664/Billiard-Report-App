// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mpesaRoutes = require('./routes/mpesa.routes');
const authRoutes = require('./routes/auth.routes');
const settingsRoutes = require('./routes/settings.routes');

const app = express();

// Only these origins are allowed to call this API.
// Add your deployed frontend's URL here once it's live
// (e.g. "https://billiard-tracker.vercel.app").
const allowedOrigins = [
    'http://localhost:3000',
];

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (e.g. curl, Postman, server-to-server)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
};

app.use(cors(corsOptions));
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
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});