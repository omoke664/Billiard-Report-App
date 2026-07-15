// services/mpesa.service.js
const axios = require('axios');

class MpesaService {
    constructor() {
        this.consumerKey = process.env.MPESA_CONSUMER_KEY;
        this.consumerSecret = process.env.MPESA_CONSUMER_SECRET;
        this.passkey = process.env.MPESA_PASSKEY;
        this.tillNumber = process.env.MPESA_TILL_NUMBER;
        // Use sandbox URL for now. We will change this to 'https://api.safaricom.co.ke' when we go live.
        this.baseUrl = 'https://sandbox.safaricom.co.ke';
    }

    // 1. Generate OAuth Access Token
    async getAccessToken() {
        const url = `${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`;
        const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');

        try {
            const response = await axios.get(url, {
                headers: { Authorization: `Basic ${auth}` }
            });
            return response.data.access_token;
        } catch (error) {
            console.error('Token Generation Error:', error.response?.data || error.message);
            throw new Error('Failed to generate M-Pesa access token');
        }
    }

    // 2. Generate the Timestamp and Password for STK Push
    generatePassword() {
        const timestamp = this.getTimestamp();
        const rawString = `${this.tillNumber}${this.passkey}${timestamp}`;
        const password = Buffer.from(rawString).toString('base64');
        return { password, timestamp };
    }

    getTimestamp() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        return `${year}${month}${day}${hours}${minutes}${seconds}`;
    }

    // 3. Trigger the STK Push
    async initiateStkPush(phoneNumber, amount, accountReference) {
        const token = await this.getAccessToken();
        const { password, timestamp } = this.generatePassword();
        const url = `${this.baseUrl}/mpesa/stkpush/v1/processrequest`;

        const payload = {
            BusinessShortCode: this.tillNumber,
            Password: password,
            Timestamp: timestamp,
            TransactionType: 'CustomerPayBillOnline', // Crucial for Till Numbers!
            Amount: Math.round(amount),
            PartyA: phoneNumber, // Customer phone (e.g., 254712345678)
            PartyB: this.tillNumber,
            PhoneNumber: phoneNumber,
            CallBackURL: process.env.MPESA_CALLBACK_URL,
            AccountReference: accountReference, // e.g., "Table 1" or "John Doe"
            TransactionDesc: 'Billiard Payment'
        };

        try {
            const response = await axios.post(url, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            console.error('STK Push Error:', error.response?.data || error.message);
            throw new Error('STK Push failed');
        }
    }
}

module.exports = new MpesaService();