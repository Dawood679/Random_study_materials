/**
 * 03 — CRUD Operations
 * --------------------
 * - create
 * - createMany
 * - findUnique
 * - findUniqueOrThrow
 * - findFirst
 * - findMany
 * - update
 * - updateMany
 * - upsert (basic)
 * - delete
 * - deleteMany
 * - count
 */

require("dotenv").config();
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("=".repeat(60));
  console.log("03 — CRUD OPERATIONS");
  console.log("=".repeat(60));

  // ─────────────────────────────────────────────────────────────────────────
  // CREATE
  // ─────────────────────────────────────────────────────────────────────────

  // ── create — single record ────────────────────────────────────────────────
  console.log("\n📝 CREATE — Single record:");
  const newTag = await prisma.tag.create({
    data: { name: "CRUD_TEST_TAG", color: "#ff5733" },
  });
  console.log("   Created tag:", newTag);

  // ── createMany — multiple records at once ─────────────────────────────────
  console.log("\n📝 CREATE MANY — multiple records:");
  const { count: tagsInserted } = await prisma.tag.createMany({
    data: [
      { name: "CRUD_TAG_A", color: "#aaaaaa" },
      { name: "CRUD_TAG_B", color: "#bbbbbb" },
      { name: "CRUD_TAG_C", color: "#cccccc" },
    ],
    skipDuplicates: true,  // unique constraint violation ko skip karo
  });
  console.log(`   Inserted ${tagsInserted} tags`);

  // ─────────────────────────────────────────────────────────────────────────
  // READ
  // ─────────────────────────────────────────────────────────────────────────

  // ── findUnique — @id ya @unique field se dhundo ──────────────────────────
  console.log("\n🔍 FIND UNIQUE — by unique field:");
  const foundByEmail = await prisma.user.findUnique({
    where: { email: "alice@example.com" },
    select: { id: true, username: true, email: true, role: true },
  });
  console.log("   User by email:", foundByEmail);

  // ── findUniqueOrThrow — not found pe error throw karta hai ───────────────
  console.log("\n🔍 FIND UNIQUE OR THROW — throws if not found:");
  try {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: 99999 },
    });
  } catch (err) {
    console.log("   Error:", err.constructor.name, "—", "Record not found (as expected)");
  }

  // ── findFirst — condition se pehla record ─────────────────────────────────
  console.log("\n🔍 FIND FIRST — first record matching condition:");
  const firstAdminUser = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    orderBy: { createdAt: "asc" },
  });
  console.log("   First ADMIN:", firstAdminUser?.username);

  // ── findMany — multiple records ───────────────────────────────────────────
  console.log("\n🔍 FIND MANY — all published posts (id, title only):");
  const publishedPosts = await prisma.post.findMany({
    where: { status: "PUBLISHED", deletedAt: null },
    select: { id: true, title: true, viewCount: true },
    orderBy: { viewCount: "desc" },
  });
  publishedPosts.forEach((p) => console.log(`   [${p.viewCount} views] ${p.title}`));

  // ── count ─────────────────────────────────────────────────────────────────
  console.log("\n🔍 COUNT:");
  const publishedCount = await prisma.post.count({ where: { status: "PUBLISHED", deletedAt: null } });
  const draftCount = await prisma.post.count({ where: { status: "DRAFT" } });
  console.log(`   Published posts: ${publishedCount}`);
  console.log(`   Draft posts    : ${draftCount}`);

  // ─────────────────────────────────────────────────────────────────────────
  // UPDATE
  // ─────────────────────────────────────────────────────────────────────────

  // ── update — single record ────────────────────────────────────────────────
  console.log("\n✏️  UPDATE — single record:");
  const updatedTag = await prisma.tag.update({
    where: { name: "CRUD_TEST_TAG" },
    data: { color: "#00ff00" },
  });
  console.log("   Updated tag color:", updatedTag.color);

  // ── update — increment / decrement ────────────────────────────────────────
  console.log("\n✏️  UPDATE — increment viewCount:");
  const post = await prisma.post.findFirst({ where: { status: "PUBLISHED" } });
  const updatedPost = await prisma.post.update({
    where: { id: post.id },
    data: { viewCount: { increment: 10 } },  // also: decrement, multiply, divide, set
    select: { id: true, viewCount: true },
  });
  console.log("   Post viewCount incremented:", updatedPost);

  // ── updateMany — multiple records ─────────────────────────────────────────
  console.log("\n✏️  UPDATE MANY — deactivate test users:");
  const testEmail = `test_crud_${Date.now()}@example.com`;
  await prisma.user.create({ data: { email: testEmail, username: `test_${Date.now()}`, password: "pass" } });
  const { count: deactivated } = await prisma.user.updateMany({
    where: { email: { contains: "test_crud_" } },
    data: { isActive: false },
  });
  console.log(`   Deactivated ${deactivated} test user(s)`);

  // ─────────────────────────────────────────────────────────────────────────
  // UPSERT
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n🔄 UPSERT — create if not exists, update if exists:");
  const upsertedTag = await prisma.tag.upsert({
    where: { name: "TypeScript" },
    update: { color: "#3178c6" },
    create: { name: "TypeScript", color: "#3178c6" },
  });
  console.log("   Upserted tag:", upsertedTag.name, upsertedTag.color);

  // Run again — same name, will update
  const upsertedAgain = await prisma.tag.upsert({
    where: { name: "TypeScript" },
    update: { color: "#2d5fa8" },
    create: { name: "TypeScript", color: "#3178c6" },
  });
  console.log("   Upserted again (updated color):", upsertedAgain.color);

  // ─────────────────────────────────────────────────────────────────────────
  // DELETE
  // ─────────────────────────────────────────────────────────────────────────

  // ── delete — single record ────────────────────────────────────────────────
  console.log("\n🗑️  DELETE — single record:");
  const deletedTag = await prisma.tag.delete({
    where: { name: "CRUD_TEST_TAG" },
  });
  console.log("   Deleted tag:", deletedTag.name);

  // ── deleteMany — multiple records ─────────────────────────────────────────
  console.log("\n🗑️  DELETE MANY — cleanup test tags:");
  const { count: deletedCount } = await prisma.tag.deleteMany({
    where: { name: { in: ["CRUD_TAG_A", "CRUD_TAG_B", "CRUD_TAG_C"] } },
  });
  console.log(`   Deleted ${deletedCount} test tags`);

  // cleanup test users and upserted tag
  await prisma.user.deleteMany({ where: { email: { contains: "test_crud_" } } });
  await prisma.tag.deleteMany({ where: { name: "TypeScript" } });

  console.log("\n✅ CRUD operations complete!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
