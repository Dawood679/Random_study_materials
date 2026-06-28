/**
 * 05 — Advanced Queries
 * ---------------------
 * - where operators: equals, not, in, notIn, lt, lte, gt, gte
 * - String operators: contains, startsWith, endsWith, mode (case-insensitive)
 * - Logical operators: AND, OR, NOT
 * - Relation filters: some, every, none, is, isNot
 * - orderBy (single + multi field, relation ordering)
 * - select (field projection)
 * - take + skip (offset pagination)
 * - cursor-based pagination
 * - distinct
 */

require("dotenv").config();
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("=".repeat(60));
  console.log("05 — ADVANCED QUERIES");
  console.log("=".repeat(60));

  // ─────────────────────────────────────────────────────────────────────────
  // Basic where operators
  // ─────────────────────────────────────────────────────────────────────────

  console.log("\n🔍 WHERE — equals (shorthand):");
  const adminUsers = await prisma.user.findMany({
    where: { role: "ADMIN" },  // shorthand for { role: { equals: "ADMIN" } }
    select: { username: true, role: true },
  });
  adminUsers.forEach((u) => console.log(`   ${u.username} (${u.role})`));

  console.log("\n🔍 WHERE — not equals:");
  const nonAdmins = await prisma.user.findMany({
    where: { role: { not: "ADMIN" } },
    select: { username: true, role: true },
  });
  nonAdmins.forEach((u) => console.log(`   ${u.username} (${u.role})`));

  console.log("\n🔍 WHERE — in / notIn:");
  const specificRoles = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "MODERATOR"] } },
    select: { username: true, role: true },
  });
  specificRoles.forEach((u) => console.log(`   ${u.username} (${u.role})`));

  console.log("\n🔍 WHERE — gt / gte / lt / lte (numeric):");
  const highViewPosts = await prisma.post.findMany({
    where: { viewCount: { gte: 1000 }, deletedAt: null },
    select: { title: true, viewCount: true },
    orderBy: { viewCount: "desc" },
  });
  highViewPosts.forEach((p) => console.log(`   [${p.viewCount}] ${p.title}`));

  console.log("\n🔍 WHERE — DateTime comparison:");
  const recentPosts = await prisma.post.findMany({
    where: {
      publishedAt: { gte: new Date("2024-03-01") },
      deletedAt: null,
    },
    select: { title: true, publishedAt: true },
    orderBy: { publishedAt: "asc" },
  });
  recentPosts.forEach((p) =>
    console.log(`   ${p.publishedAt?.toDateString()}: ${p.title}`)
  );

  // ─────────────────────────────────────────────────────────────────────────
  // String operators
  // ─────────────────────────────────────────────────────────────────────────

  console.log("\n🔍 String — contains (case-insensitive):");
  const searchResults = await prisma.post.findMany({
    where: {
      title: { contains: "prisma", mode: "insensitive" },
      deletedAt: null,
    },
    select: { title: true },
  });
  searchResults.forEach((p) => console.log(`   ${p.title}`));

  console.log("\n🔍 String — startsWith / endsWith:");
  const startsWithAdv = await prisma.post.findMany({
    where: { title: { startsWith: "Advanced", mode: "insensitive" } },
    select: { title: true },
  });
  const endsWithTips = await prisma.post.findMany({
    where: { title: { endsWith: "Tips", mode: "insensitive" } },
    select: { title: true },
  });
  console.log("   startsWith 'Advanced':", startsWithAdv.map((p) => p.title));
  console.log("   endsWith 'Tips'      :", endsWithTips.map((p) => p.title));

  // ─────────────────────────────────────────────────────────────────────────
  // Logical operators: AND, OR, NOT
  // ─────────────────────────────────────────────────────────────────────────

  console.log("\n🔍 Logical — AND (implicit, using object):");
  const andResult = await prisma.post.findMany({
    where: {
      status: "PUBLISHED",
      viewCount: { gt: 500 },
      deletedAt: null,
    },
    select: { title: true, viewCount: true, status: true },
  });
  andResult.forEach((p) => console.log(`   [${p.viewCount}] ${p.title}`));

  console.log("\n🔍 Logical — OR:");
  const orResult = await prisma.post.findMany({
    where: {
      OR: [
        { title: { contains: "Prisma", mode: "insensitive" } },
        { title: { contains: "Express", mode: "insensitive" } },
      ],
      deletedAt: null,
    },
    select: { title: true },
  });
  orResult.forEach((p) => console.log(`   ${p.title}`));

  console.log("\n🔍 Logical — NOT:");
  const notResult = await prisma.user.findMany({
    where: {
      NOT: { role: "USER" },
    },
    select: { username: true, role: true },
  });
  notResult.forEach((u) => console.log(`   ${u.username} (${u.role})`));

  // ─────────────────────────────────────────────────────────────────────────
  // Relation filters: some, every, none
  // ─────────────────────────────────────────────────────────────────────────

  console.log("\n🔍 Relation filter — some (users with at least 1 published post):");
  const authorsWithPosts = await prisma.user.findMany({
    where: {
      posts: { some: { status: "PUBLISHED", deletedAt: null } },
    },
    select: { username: true },
  });
  authorsWithPosts.forEach((u) => console.log(`   ${u.username}`));

  console.log("\n🔍 Relation filter — none (users with NO draft posts):");
  const noDrafts = await prisma.user.findMany({
    where: {
      posts: { none: { status: "DRAFT" } },
    },
    select: { username: true },
  });
  noDrafts.forEach((u) => console.log(`   ${u.username}`));

  console.log("\n🔍 Relation filter — is / isNot (posts with a category):");
  const postsWithCategory = await prisma.post.findMany({
    where: {
      category: { isNot: null },
      deletedAt: null,
    },
    select: { title: true, category: { select: { name: true } } },
    take: 3,
  });
  postsWithCategory.forEach((p) =>
    console.log(`   "${p.title}" → Category: ${p.category?.name}`)
  );

  // ─────────────────────────────────────────────────────────────────────────
  // orderBy — single, multi-field, relation
  // ─────────────────────────────────────────────────────────────────────────

  console.log("\n🔍 ORDER BY — multi-field:");
  const multiOrder = await prisma.post.findMany({
    where: { deletedAt: null },
    orderBy: [{ status: "asc" }, { viewCount: "desc" }],  // first by status, then by viewCount
    select: { title: true, status: true, viewCount: true },
  });
  multiOrder.forEach((p) => console.log(`   [${p.status}|${p.viewCount}] ${p.title}`));

  console.log("\n🔍 ORDER BY — relation count (posts with most comments first):");
  const byComments = await prisma.post.findMany({
    where: { deletedAt: null },
    orderBy: { comments: { _count: "desc" } },
    select: { title: true, _count: { select: { comments: true } } },
    take: 3,
  });
  byComments.forEach((p) =>
    console.log(`   [${p._count.comments} comments] ${p.title}`)
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Pagination — offset (take + skip)
  // ─────────────────────────────────────────────────────────────────────────

  console.log("\n📄 OFFSET PAGINATION — Page 1 (limit 2):");
  const page1 = await prisma.post.findMany({
    where: { status: "PUBLISHED", deletedAt: null },
    orderBy: { publishedAt: "desc" },
    take: 2,
    skip: 0,
    select: { id: true, title: true },
  });
  page1.forEach((p) => console.log(`   [${p.id}] ${p.title}`));

  console.log("\n📄 OFFSET PAGINATION — Page 2 (limit 2):");
  const page2 = await prisma.post.findMany({
    where: { status: "PUBLISHED", deletedAt: null },
    orderBy: { publishedAt: "desc" },
    take: 2,
    skip: 2,
    select: { id: true, title: true },
  });
  page2.forEach((p) => console.log(`   [${p.id}] ${p.title}`));

  // ─────────────────────────────────────────────────────────────────────────
  // Cursor-based pagination (better for large datasets)
  // ─────────────────────────────────────────────────────────────────────────

  console.log("\n📄 CURSOR PAGINATION — First page:");
  const cursorPage1 = await prisma.post.findMany({
    where: { status: "PUBLISHED", deletedAt: null },
    orderBy: { id: "asc" },
    take: 2,
    select: { id: true, title: true },
  });
  cursorPage1.forEach((p) => console.log(`   [id:${p.id}] ${p.title}`));

  const lastId = cursorPage1[cursorPage1.length - 1]?.id;
  console.log(`\n📄 CURSOR PAGINATION — Next page (cursor after id: ${lastId}):`);
  const cursorPage2 = await prisma.post.findMany({
    where: { status: "PUBLISHED", deletedAt: null },
    orderBy: { id: "asc" },
    take: 2,
    skip: 1,          // skip the cursor itself
    cursor: { id: lastId },
    select: { id: true, title: true },
  });
  cursorPage2.forEach((p) => console.log(`   [id:${p.id}] ${p.title}`));

  // ─────────────────────────────────────────────────────────────────────────
  // distinct
  // ─────────────────────────────────────────────────────────────────────────

  console.log("\n🔍 DISTINCT — unique statuses in posts:");
  const distinctStatuses = await prisma.post.findMany({
    distinct: ["status"],
    select: { status: true },
  });
  distinctStatuses.forEach((p) => console.log(`   ${p.status}`));

  console.log("\n✅ Advanced queries complete!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
