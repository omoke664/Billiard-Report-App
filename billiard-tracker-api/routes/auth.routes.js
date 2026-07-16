// routes/auth.routes.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_billiard_key_change_this_in_production';

// 1. LOGIN ENDPOINT
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await prisma.user.findUnique({ where: { username } });

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate a token valid for 7 days
        const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

        res.json({ success: true, token, username: user.username });
    } catch (error) {
        console.error("Server error:", error)
        res.status(500).json({ error: 'Server error' });
    }
});

// 2. GET SECURITY QUESTION (For Forgot Password)
router.post('/get-question', async (req, res) => {
    try {
        const { username } = req.body;
        const user = await prisma.user.findUnique({ where: { username } });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ success: true, securityQuestion: user.securityQuestion });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// 3. RECOVER PASSWORD (Verify Answer & Reset)
router.post('/recover-password', async (req, res) => {
    try {
        const { username, securityAnswer, newPassword } = req.body;
        const user = await prisma.user.findUnique({ where: { username } });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const isAnswerValid = await bcrypt.compare(securityAnswer.toLowerCase(), user.securityAnswer);
        if (!isAnswerValid) {
            return res.status(401).json({ error: 'Incorrect security answer' });
        }

        // Update password
        const newHash = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: user.id },
            data: { passwordHash: newHash },
        });

        res.json({ success: true, message: 'Password updated successfully. Please login.' });
    } catch (error) {
        console.error("Server error")
        res.status(500).json({ error: 'Server error' });
    }
});

// ADD THIS TO routes/auth.routes.js

router.post('/register', async (req, res) => {
    try {
        const { username, password, securityQuestion, securityAnswer } = req.body;

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({ where: { username } });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const answerHash = await bcrypt.hash(securityAnswer.toLowerCase(), 10);

        await prisma.user.create({
            data: {
                username,
                passwordHash,
                securityQuestion,
                securityAnswer: answerHash,
            },
        });

        res.json({ success: true, message: 'Account created successfully! Please log in.' });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ error: 'Server error during registration' });
    }
});



router.post('/register', async (req, res) => {
    try {
        const { username, password, securityQuestion, securityAnswer } = req.body;

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({ where: { username } });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const answerHash = await bcrypt.hash(securityAnswer.toLowerCase(), 10);

        await prisma.user.create({
            data: {
                username,
                passwordHash,
                securityQuestion,
                securityAnswer: answerHash,
            },
        });

        res.json({ success: true, message: 'Account created successfully! Please log in.' });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ error: 'Server error during registration' });
    }
});
module.exports = router;