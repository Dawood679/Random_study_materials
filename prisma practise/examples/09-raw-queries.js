/**
 * 09 — Raw Queries
 * ----------------
 * - $queryRaw — SELECT, returns typed results
 * - $executeRaw — INSERT/UPDATE/DELETE, returns affected rows count
 * - Prisma.sql tagged template — safe parameter interpolation
 * - $queryRawUnsafe / $executeRawUnsafe (⚠️ use with caution)
 * - When to use raw queries vs Prisma Client
 */

require("dotenv").config();
const { PrismaClient, Prisma } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("=".repeat(60));
  console.log("09 — RAW QUERIES");
  console.log("=".repeat(60));

  // ─────────────────────────────────────────────────────────────────────────
  // $queryRaw — basic SELECT
  // ─────────────────────────────────────────────────────────────────────────

  console.log("\n🔴 $queryRaw — basic SELECT:");
  const users = await prisma.$queryRaw`
    SELECT id, email, username, role, "createdAt"
    FROM users
    ORDER BY "createdAt" ASC
    LIMIT 5
  `;
  users.forEach((u) =>
    console.log(`   [${u.role}] ${u.username} — ${u.email}`)
  );

  // ─────────────────────────────────────────────────────────────────────────
  // $queryRaw with parameters — SAFE interpolation via tagged template
  // ─────────────────────────────────────────────────────────────────────────

  console.log("\n🔴 $queryRaw with parameters (SQL injection safe):");
  const minViews = 500;
  const statusFilter = "PUBLISHED";

  const popularPosts = await prisma.$queryRaw`
    SELECT id, title, "viewCount", status
    FROM posts
    WHERE "viewCount" >= ${minViews}
      AND status = ${statusFilter}
      AND "deletedAt" IS NULL
    ORDER BY "viewCount" DESC
    LIMIT 5
  `;
  // Prisma automatically parameterizes — no SQL injection possible
  popularPosts.forEach((p) =>
    console.log(`   [${p.viewCount} views] ${p.title}`)
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Prisma.sql — build dynamic queries safely
  // ─────────────────────────────────────────────────────────────────────────

  console.log("\n🔴 Prisma.sql — composable query fragments:");

  function buildPostsQuery(status, minViews) {
    const statusClause = status
      ? Prisma.sql`AND status = ${status}::text::"PostStatus"`
      : Prisma.empty;

    const viewsClause = minViews
      ? Prisma.sql`AND "viewCount" >= ${minViews}`
      : Prisma.empty;

    return Prisma.sql`
      SELECT id, title, "viewCount", status
      FROM posts
      WHERE "deletedAt" IS NULL
      ${statusClause}
      ${viewsClause}
      ORDER BY "viewCount" DESC
    `;
  }

  const dynamicResult = await prisma.$queryRaw(buildPostsQuery("PUBLISHED", 800));
  console.log(`   Dynamic query result (published, >800 views):`);
  dynamicResult.forEach((p) =>
    console.log(`   [${p.viewCount}] ${p.title}`)
  );

  // ─────────────────────────────────────────────────────────────────────────
  // $queryRaw — JOIN example
  // ─────────────────────────────────────────────────────────────────────────

  console.log("\n🔴 $queryRaw — JOIN (posts with author username):");
  const postsWithAuthors = await prisma.$queryRaw`
    SELECT
      p.id,
      p.title,
      p."viewCount",
      u.username AS "authorName",
      u.role AS "authorRole"
    FROM posts p
    INNER JOIN users u ON p."authorId" = u.id
    WHERE p."deletedAt" IS NULL
      AND p.status = 'PUBLISHED'
    ORDER BY p."viewCount" DESC
    LIMIT 5
  `;
  postsWithAuthors.forEach((p) =>
    console.log(`   "${p.title}" by @${p.authorName} (${p.authorRole}) | ${p.viewCount} views`)
  );

  // ─────────────────────────────────────────────────────────────────────────
  // $queryRaw — aggregate functions
  // ─────────────────────────────────────────────────────────────────────────

  console.log("\n🔴 $queryRaw — aggregate with GROUP BY:");
  const statsPerAuthor = await prisma.$queryRaw`
    SELECT
      u.username,
      COUNT(p.id)::int              AS "postCount",
      SUM(p."viewCount")::int       AS "totalViews",
      ROUND(AVG(p."viewCount"), 1)  AS "avgViews"
    FROM users u
    LEFT JOIN posts p ON p."authorId" = u.id AND p."deletedAt" IS NULL
    GROUP BY u.id, u.username
    ORDER BY "totalViews" DESC NULLS LAST
  `;
  statsPerAuthor.forEach((s) =>
    console.log(
      `   @${s.username}: ${s.postCount} posts | ` +
      `${s.totalViews ?? 0} total views | ` +
      `${s.avgViews ?? 0} avg`
    )
  );

  // ─────────────────────────────────────────────────────────────────────────
  // $executeRaw — INSERT / UPDATE / DELETE (returns affected rows count)
  // ─────────────────────────────────────────────────────────────────────────

  console.log("\n🔴 $executeRaw — UPDATE (returns affected row count):");
  const affected = await prisma.$executeRaw`
    UPDATE posts
    SET "viewCount" = "viewCount" + 1
    WHERE status = 'PUBLISHED'
      AND "deletedAt" IS NULL
  `;
  console.log(`   Updated ${affected} rows (incremented viewCount by 1)`);

  // ─────────────────────────────────────────────────────────────────────────
  // Window functions — cannot do this with Prisma Client!
  // ─────────────────────────────────────────────────────────────────────────

  console.log("\n🔴 $queryRaw — Window functions (RANK, ROW_NUMBER):");
  const ranked = await prisma.$queryRaw`
    SELECT
      title,
      "viewCount",
      RANK() OVER (ORDER BY "viewCount" DESC)       AS "viewRank",
      ROW_NUMBER() OVER (ORDER BY "createdAt" ASC)  AS "chronologicalOrder"
    FROM posts
    WHERE "deletedAt" IS NULL AND status = 'PUBLISHED'
    ORDER BY "viewCount" DESC
  `;
  ranked.forEach((p) =>
    console.log(
      `   Rank #${p.viewRank} (post #${p.chronologicalOrder}): "${p.title}" — ${p.viewCount} views`
    )
  );

  // ─────────────────────────────────────────────────────────────────────────
  // $queryRawUnsafe — ⚠️ DANGER: string interpolation (SQL injection risk)
  // Only use when column/table names are dynamic (can't be parameterized)
  // ─────────────────────────────────────────────────────────────────────────

  console.log("\n⚠️  $queryRawUnsafe — dynamic column sort (NEVER use with user input!):");
  const sortColumn = "viewCount"; // In real app: validate this against an allowlist!
  const sortDir = "DESC";
  // $queryRaw cannot parameterize identifiers (column names), only values
  const unsafeResult = await prisma.$queryRawUnsafe(
    `SELECT id, title, "${sortColumn}" FROM posts WHERE "deletedAt" IS NULL ORDER BY "${sortColumn}" ${sortDir} LIMIT 3`
  );
  unsafeResult.forEach((p) =>
    console.log(`   [${p[sortColumn]}] ${p.title}`)
  );
  console.log("   ⚠️  Always validate/allowlist dynamic identifiers before using $queryRawUnsafe!");

  console.log("\n✅ Raw queries example complete!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
