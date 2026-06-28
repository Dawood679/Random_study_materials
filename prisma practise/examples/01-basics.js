/**
 * 01 — Prisma Basics
 * ------------------
 * - Prisma kya hai?
 * - PrismaClient kaise use karte hain
 * - $connect / $disconnect
 * - $queryRaw se database ping
 * - Environment variables (.env)
 * - Logging options
 */

require("dotenv").config();
const { PrismaClient } = require("@prisma/client");

// ── 1. PrismaClient instantiation ─────────────────────────────────────────
// log array mein "query", "info", "warn", "error" pass kar sakte ho
const prisma = new PrismaClient({
  log: [
    { emit: "stdout", level: "info" },
    { emit: "stdout", level: "warn" },
    { emit: "stdout", level: "error" },
    // query logging sirf debug k liye uncomment karo:
    // { emit: "stdout", level: "query" },
  ],
});

async function main() {
  console.log("=".repeat(60));
  console.log("01 — PRISMA BASICS");
  console.log("=".repeat(60));

  // ── 2. $connect ──────────────────────────────────────────────────────────
  // Explicitly connect karna optional hai — Prisma auto-connect karta hai
  // pehle query pe. Lekin explicit karna good practice hai.
  await prisma.$connect();
  console.log("\n✓ Connected to database");

  // ── 3. Raw SQL ping ───────────────────────────────────────────────────────
  // $queryRaw tagged template literal leta hai (SQL injection safe)
  const pingResult = await prisma.$queryRaw`SELECT 1+1 AS result, NOW() AS current_time`;
  console.log("\n📡 Database Ping:");
  console.log(pingResult);

  // ── 4. Database version ───────────────────────────────────────────────────
  const versionResult = await prisma.$queryRaw`SELECT version()`;
  console.log("\n🗄️  Database Version:");
  console.log(versionResult[0].version);

  // ── 5. List all tables ────────────────────────────────────────────────────
  const tables = await prisma.$queryRaw`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `;
  console.log("\n📋 Tables in database:");
  tables.forEach((t) => console.log("  -", t.table_name));

  // ── 6. Simple first query ─────────────────────────────────────────────────
  const userCount = await prisma.user.count();
  const postCount = await prisma.post.count();
  console.log(`\n📊 Quick Stats:`);
  console.log(`   Users : ${userCount}`);
  console.log(`   Posts : ${postCount}`);

  // ── 7. findFirst — simplest read ──────────────────────────────────────────
  const firstUser = await prisma.user.findFirst({
    orderBy: { createdAt: "asc" },
  });
  console.log("\n👤 First User:");
  console.log(`   id       : ${firstUser?.id}`);
  console.log(`   email    : ${firstUser?.email}`);
  console.log(`   username : ${firstUser?.username}`);
  console.log(`   role     : ${firstUser?.role}`);
  console.log(`   createdAt: ${firstUser?.createdAt}`);

  // ── 8. Prisma Client properties ───────────────────────────────────────────
  console.log("\n🔧 PrismaClient model accessors:");
  const models = ["user", "post", "profile", "category", "tag", "comment"];
  models.forEach((m) => console.log(`   prisma.${m}`));

  // ── 9. Error handling ─────────────────────────────────────────────────────
  console.log("\n⚠️  Error handling example:");
  try {
    await prisma.user.findUniqueOrThrow({ where: { id: 99999 } });
  } catch (err) {
    console.log(`   Caught: ${err.constructor.name} — ${err.message.split("\n")[0]}`);
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    console.log("\n✓ Disconnected from database");
  });
