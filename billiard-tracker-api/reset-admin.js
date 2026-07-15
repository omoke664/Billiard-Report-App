// reset-admin.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
    const username = "admin";
    const plainPassword = "Admin123!"; // Easy to remember for testing
    const securityQuestion = "What is your favorite color?";
    const securityAnswer = "blue";

    const passwordHash = await bcrypt.hash(plainPassword, 10);
    const answerHash = await bcrypt.hash(securityAnswer.toLowerCase(), 10);

    // Delete existing admin to avoid conflicts
    await prisma.user.deleteMany({ where: { username } });

    await prisma.user.create({
        data: { username, passwordHash, securityQuestion, securityAnswer: answerHash },
    });

    console.log("✅ Admin user reset successfully!");
    console.log(`👤 Username: ${username}`);
    console.log(`🔑 Password: ${plainPassword}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());