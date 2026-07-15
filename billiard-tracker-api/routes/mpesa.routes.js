// routes/mpesa.routes.js
const express = require('express');
const router = express.Router();
const mpesaService = require('../services/mpesa.service');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Endpoint 1: Your PWA frontend will call this to trigger a payment
router.post('/stkpush', async (req, res) => {
    try {
        const { phone, amount, reference } = req.body;

        if (!phone || !amount) {
            return res.status(400).json({ error: 'Phone number and amount are required' });
        }

        // Trigger the STK Push
        const response = await mpesaService.initiateStkPush(phone, amount, reference || 'Billiard');

        res.json({
            success: true,
            message: 'STK Push sent successfully. Check phone for PIN prompt.',
            checkoutRequestID: response.CheckoutRequestID,
            merchantRequestID: response.MerchantRequestID
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Endpoint 2: Safaricom will call this URL when the user enters their PIN
router.post('/till-callback', async (req, res) => {
    try {
        const callbackData = req.body.Body.stkCallback;
        const resultCode = callbackData.ResultCode;

        // ResultCode 0 means success. Anything else is a failure/cancellation.
        if (resultCode === 0) {
            const metadata = callbackData.CallbackMetadata.Item;

            // Helper function to extract values from Daraja's weird metadata array
            const getValue = (name) => metadata.find(item => item.Name === name)?.Value;

            // Inside routes/mpesa.routes.js, update the transactionData object:

            const transactionData = {
                transId: getValue('MpesaReceiptNumber')?.toString() || 'UNKNOWN',
                transTime: getValue('TransactionDate')?.toString() || new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14),
                transAmount: getValue('Amount')?.toString() || '0',
                businessShortCode: getValue('BusinessShortCode')?.toString() || process.env.MPESA_TILL_NUMBER || 'UNKNOWN', // <-- Updated fallback
                msisdn: getValue('PhoneNumber')?.toString() || 'UNKNOWN',
                firstName: getValue('FirstName') || null,
                middleName: getValue('MiddleName') || null,
                lastName: getValue('LastName') || null,
                billRefNumber: getValue('AccountReference') || 'No Reference',
                orgAccountBalance: getValue('OrgAccountBalance')?.toString() || '0',
            };

            // Save to database!
            await prisma.transaction.create({
                data: transactionData
            });

            console.log(`✅ Payment Received: KES ${transactionData.transAmount} from ${transactionData.msisdn}`);
        } else {
            console.log(`❌ Payment Failed or Cancelled. ResultCode: ${resultCode}`);
            console.log('Description:', callbackData.ResultDesc);
        }

        // Always return 200 OK to Safaricom so they know you received it
        res.status(200).send('OK');

    } catch (error) {
        console.error('Callback Error:', error);
        res.status(500).send('Internal Server Error');
    }
});
// ADD THIS TO routes/mpesa.routes.js

router.get('/dashboard-data', async (req, res) => {
    try {
        // 1. Get the latest 50 transactions for the history list
        const recentTransactions = await prisma.transaction.findMany({
            orderBy: { createdAt: 'desc' },
            take: 50,
        });

        // 2. Get ALL transactions to calculate total revenue and count
        // (For a billiard hall, even 10,000 transactions is instant for JS to calculate)
        const allTransactions = await prisma.transaction.findMany({
            select: { transAmount: true, orgAccountBalance: true }
        });

        // Calculate total revenue (parsing the String to a Float)
        const totalRevenue = allTransactions.reduce((sum, tx) => {
            return sum + parseFloat(tx.transAmount || '0');
        }, 0);

        // Get the most recent balance reported by M-Pesa
        const latestBalance = allTransactions.length > 0
            ? allTransactions[0].orgAccountBalance
            : '0.00';

        res.json({
            success: true,
            stats: {
                totalRevenue: totalRevenue.toFixed(2),
                transactionCount: allTransactions.length,
                currentBalance: latestBalance
            },
            recentTransactions: recentTransactions
        });

    } catch (error) {
        console.error("Dashboard Data Error:", error);
        res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
});

// ADD THIS TO routes/mpesa.routes.js (before module.exports)

router.get('/reports', async (req, res) => {
    try {
        // Fetch all successful transactions (you can add date filters here later)
        const allTransactions = await prisma.transaction.findMany({
            orderBy: { createdAt: 'asc' },
        });

        // 1. Daily Revenue & Games (Last 14 days for Home Page)
        const dailyStats = {};
        const customerStats = {};
        const heatmapStats = {};

        const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        allTransactions.forEach(tx => {
            const amount = parseFloat(tx.transAmount) || 0;
            const date = new Date(tx.createdAt);
            const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
            const dayName = daysOfWeek[date.getDay()];
            const hour = date.getHours(); // 0-23
            const phone = tx.msisdn || 'Unknown';

            // Daily Aggregation
            if (!dailyStats[dateStr]) {
                dailyStats[dateStr] = { revenue: 0, games: 0, date: dateStr };
            }
            dailyStats[dateStr].revenue += amount;
            dailyStats[dateStr].games += Math.round(amount / 100); // 1 Game = 100 KES

            // Customer Aggregation
            if (!customerStats[phone]) {
                customerStats[phone] = { phone, totalSpent: 0, visits: 0, lastName: tx.lastName || '' };
            }
            customerStats[phone].totalSpent += amount;
            customerStats[phone].visits += 1;

            // Heatmap Aggregation (Day of Week + Hour)
            const heatmapKey = `${dayName}-${hour}`;
            if (!heatmapStats[heatmapKey]) {
                heatmapStats[heatmapKey] = { day: dayName, hour: hour, revenue: 0, count: 0 };
            }
            heatmapStats[heatmapKey].revenue += amount;
            heatmapStats[heatmapKey].count += 1;
        });

        // Convert objects to arrays and sort
        const dailyArray = Object.values(dailyStats).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // Get top 5 customers
        const topCustomers = Object.values(customerStats)
            .sort((a, b) => b.totalSpent - a.totalSpent)
            .slice(0, 5);

        // Format heatmap for frontend (group by day)
        const heatmapArray = Object.values(heatmapStats).sort((a, b) => {
            const dayDiff = daysOfWeek.indexOf(a.day) - daysOfWeek.indexOf(b.day);
            if (dayDiff !== 0) return dayDiff;
            return a.hour - b.hour;
        });

        res.json({
            success: true,
            dailyStats: dailyArray,
            topCustomers,
            heatmapStats: heatmapArray,
            totalAllTime: {
                revenue: dailyArray.reduce((sum, day) => sum + day.revenue, 0),
                games: dailyArray.reduce((sum, day) => sum + day.games, 0)
            }
        });

    } catch (error) {
        console.error("Reports Data Error:", error);
        res.status(500).json({ error: "Failed to fetch reports data" });
    }
});

module.exports = router;