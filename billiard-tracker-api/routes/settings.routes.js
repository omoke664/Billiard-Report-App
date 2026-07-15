// routes/settings.routes.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_billiard_key_change_this_in_production';

// Middleware to verify the user is logged in
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid or expired token.' });
        req.user = user;
        next();
    });
};

// 1. GET USER SETTINGS
router.get('/', authenticateToken, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.userId },
            select: {
                enableNotifications: true,
                dailySummary: true,
                sessionTimeout: true,
                displayDensity: true,
            }
        });
        res.json({ success: true, settings: user });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// 2. UPDATE USER SETTINGS
router.put('/', authenticateToken, async (req, res) => {
    try {
        const { enableNotifications, dailySummary, sessionTimeout, displayDensity } = req.body;

        await prisma.user.update({
            where: { id: req.user.userId },
            data: {
                enableNotifications: enableNotifications !== undefined ? enableNotifications : undefined,
                dailySummary: dailySummary !== undefined ? dailySummary : undefined,
                sessionTimeout: sessionTimeout !== undefined ? sessionTimeout : undefined,
                displayDensity: displayDensity !== undefined ? displayDensity : undefined,
            }
        });

        res.json({ success: true, message: 'Settings updated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// 3. CHANGE PASSWORD
router.put('/change-password', authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await prisma.user.findUnique({ where: { id: req.user.userId } });

        if (!user) return res.status(404).json({ error: 'User not found' });

        const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        const newHash = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: user.id },
            data: { passwordHash: newHash },
        });

        res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;