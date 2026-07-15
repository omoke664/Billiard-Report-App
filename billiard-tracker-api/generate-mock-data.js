// generate-mock-data.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Realistic Kenyan customer data (Our "Regulars" and randoms)
const customers = [
    { phone: "254711111111", first: "John", last: "Kamau" },
    { phone: "254722222222", first: "Mary", last: "Wanjiku" },
    { phone: "254733333333", first: "Brian", last: "Ochieng" },
    { phone: "254744444444", first: "Faith", last: "Njeri" },
    { phone: "254755555555", first: "Kevin", last: "Mutua" },
    { phone: "254708374149", first: "Test", last: "User" }, // The sandbox test number
];

const references = ["Table 1", "Table 2", "Table 3", "Table 4", "Drinks", "Snacks"];
const amounts = [100, 100, 100, 100, 200, 300, 500]; // Weighted towards 100

// Helper to generate random M-Pesa receipt format (e.g., UFM3K9C9OO)
const generateReceipt = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "UFM";
    for (let i = 0; i < 7; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
    return result;
};

// Helper to generate realistic timestamps (biased towards evenings and weekends)
const generateRealisticDate = (daysAgo) => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);

    // Bias hours: 40% chance of being between 16:00 and 23:00 (Peak billiard hours)
    let hour;
    if (Math.random() < 0.4) {
        hour = Math.floor(Math.random() * (23 - 16 + 1)) + 16; // 16 to 23
    } else {
        hour = Math.floor(Math.random() * 24); // Random hour
    }

    const minute = Math.floor(Math.random() * 60);
    const second = Math.floor(Math.random() * 60);

    date.setHours(hour, minute, second);
    return date;
};

async function seedDatabase() {
    console.log("🧹 Clearing existing mock data...");
    await prisma.transaction.deleteMany({});

    console.log("🎲 Generating 150 realistic transactions...");
    const transactionsToCreate = [];
    let runningBalance = 5000; // Starting mock balance

    for (let i = 0; i < 150; i++) {
        const daysAgo = Math.floor(Math.random() * 30); // Last 30 days
        const date = generateRealisticDate(daysAgo);
        const customer = customers[Math.floor(Math.random() * customers.length)];
        const amount = amounts[Math.floor(Math.random() * amounts.length)];
        const ref = references[Math.floor(Math.random() * references.length)];

        runningBalance += amount;

        // Format time exactly as Daraja does: YYYYMMDDHHmmss
        const transTime = date.getFullYear().toString() +
            String(date.getMonth() + 1).padStart(2, '0') +
            String(date.getDate()).padStart(2, '0') +
            String(date.getHours()).padStart(2, '0') +
            String(date.getMinutes()).padStart(2, '0') +
            String(date.getSeconds()).padStart(2, '0');

        transactionsToCreate.push({
            transId: generateReceipt(),
            transTime: transTime,
            transAmount: amount.toString(),
            businessShortCode: "174379",
            msisdn: customer.phone,
            firstName: customer.first,
            middleName: null,
            lastName: customer.last,
            billRefNumber: ref,
            orgAccountBalance: runningBalance.toString(),
            createdAt: date,
            updatedAt: date,
        });
    }

    // Sort by date ascending so the running balance makes chronological sense
    transactionsToCreate.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    console.log("💾 Saving to database...");
    await prisma.transaction.createMany({
        data: transactionsToCreate
    });

    console.log("✅ Success! 150 mock transactions have been added.");
    console.log("🚀 Restart your frontend (or just refresh) to see the beautiful new charts!");
}

seedDatabase()
    .catch((e) => {
        console.error("❌ Error seeding database:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });