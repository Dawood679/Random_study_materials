const { PrismaClient } = require("@prisma/client");

// Singleton pattern — Node.js mein har require() naya module nahi banata
// isliye ek hi instance hota hai throughout the app
const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
});

// Graceful shutdown
process.on("beforeExit", async () => {
  await prisma.$disconnect();
});

module.exports = prisma;
