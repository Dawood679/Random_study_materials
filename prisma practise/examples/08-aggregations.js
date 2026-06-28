/**
 * 08 — Aggregations
 * -----------------
 * - count()
 * - aggregate() — _sum, _avg, _min, _max, _count
 * - groupBy() — group + aggregate
 * - having — filter after groupBy
 * - orderBy on aggregates
 */

require("dotenv").config();
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("=".repeat(60));
  console.log("08 — AGGREGATIONS");
  console.log("=".repeat(60));

  // ─────────────────────────────────────────────────────────────────────────
  // count
  // ─────────────────────────────────────────────────────────────────────────

  console.log("\n📊 COUNT:");

  const totalUsers = await prisma.user.count();
  console.log(`   Total users: ${totalUsers}`);

  const activeUsers = await prisma.user.count({ where: { isActive: true } });
  console.log(`   Active users: ${activeUsers}`);

  const publishedPosts = await prisma.post.count({
    where: { status: "PUBLISHED", deletedAt: null },
  });
  console.log(`   Published posts: ${publishedPosts}`);

  // ─────────────────────────────────────────────────────────────────────────
  // aggregate — _sum, _avg, _min, _max, _count
  // ─────────────────────────────────────────────────────────────────────────

  console.log("\n📊 AGGREGATE — viewCount stats across all posts:");
  const viewStats = await prisma.post.aggregate({
    where: { status: "PUBLISHED", deletedAt: null },
    _count: { id: true },          // count of records
    _sum:   { viewCount: true },   // total views
    _avg:   { viewCount: true },   // average views
    _min:   { viewCount: true },   // least viewed
    _max:   { viewCount: true },   // most viewed
  });
  console.log(`   Published posts count : ${viewStats._count.id}`);
  console.log(`   Total views (sum)     : ${viewStats._sum.viewCount}`);
  console.log(`   Average views (avg)   : ${viewStats._avg.viewCount?.toFixed(1)}`);
  console.log(`   Min views             : ${viewStats._min.viewCount}`);
  console.log(`   Max views             : ${viewStats._max.viewCount}`);

  console.log("\n📊 AGGREGATE — comment likes stats:");
  const likeStats = await prisma.comment.aggregate({
    _sum: { likes: true },
    _avg: { likes: true },
    _max: { likes: true },
  });
  console.log(`   Total comment likes: ${likeStats._sum.likes}`);
  console.log(`   Avg likes/comment : ${likeStats._avg.likes?.toFixed(2)}`);
  console.log(`   Max likes on one  : ${likeStats._max.likes}`);

  // ─────────────────────────────────────────────────────────────────────────
  // groupBy — group records by a field
  // ─────────────────────────────────────────────────────────────────────────

  console.log("\n📊 GROUP BY — posts grouped by status:");
  const byStatus = await prisma.post.groupBy({
    by: ["status"],
    _count: { id: true },
    _sum: { viewCount: true },
    orderBy: { _count: { id: "desc" } },
  });
  byStatus.forEach((s) =>
    console.log(`   ${s.status}: ${s._count.id} posts, ${s._sum.viewCount ?? 0} total views`)
  );

  console.log("\n📊 GROUP BY — posts grouped by authorId (with user join):");
  const byAuthor = await prisma.post.groupBy({
    by: ["authorId"],
    where: { deletedAt: null },
    _count: { id: true },
    _sum: { viewCount: true },
    _avg: { viewCount: true },
    orderBy: { _sum: { viewCount: "desc" } },
  });

  // Manually fetch usernames for display
  const authorIds = byAuthor.map((a) => a.authorId);
  const authors = await prisma.user.findMany({
    where: { id: { in: authorIds } },
    select: { id: true, username: true },
  });
  const authorMap = Object.fromEntries(authors.map((a) => [a.id, a.username]));

  byAuthor.forEach((a) =>
    console.log(
      `   @${authorMap[a.authorId]}: ${a._count.id} posts | ` +
      `${a._sum.viewCount ?? 0} total views | ` +
      `${a._avg.viewCount?.toFixed(0)} avg`
    )
  );

  console.log("\n📊 GROUP BY — users grouped by role:");
  const byRole = await prisma.user.groupBy({
    by: ["role"],
    _count: true,
    orderBy: { _count: { role: "desc" } },
  });
  byRole.forEach((r) => console.log(`   ${r.role}: ${r._count} user(s)`));

  // ─────────────────────────────────────────────────────────────────────────
  // having — filter AFTER groupBy (like SQL HAVING clause)
  // ─────────────────────────────────────────────────────────────────────────

  console.log("\n📊 HAVING — authors with more than 2 posts:");
  const prolificAuthors = await prisma.post.groupBy({
    by: ["authorId"],
    where: { deletedAt: null },
    _count: { id: true },
    having: {
      id: { _count: { gt: 2 } },  // only groups where post count > 2
    },
    orderBy: { _count: { id: "desc" } },
  });
  prolificAuthors.forEach((a) =>
    console.log(`   authorId ${a.authorId}: ${a._count.id} posts`)
  );

  console.log("\n📊 HAVING — tags used in more than 3 posts:");
  const popularTagsGrouped = await prisma.post.groupBy({
    by: ["authorId"],
    where: { status: "PUBLISHED", deletedAt: null },
    _sum: { viewCount: true },
    having: {
      viewCount: { _sum: { gt: 1000 } },  // total views > 1000
    },
  });
  console.log(`   Authors with >1000 total views: ${popularTagsGrouped.length}`);
  popularTagsGrouped.forEach((a) =>
    console.log(`   authorId ${a.authorId}: ${a._sum.viewCount} total views`)
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Practical: Dashboard stats in one parallel call
  // ─────────────────────────────────────────────────────────────────────────

  console.log("\n📊 DASHBOARD STATS — parallel aggregations:");
  const [totalPosts, totalViews, avgViews, mostViewed, commentStats] = await Promise.all([
    prisma.post.count({ where: { status: "PUBLISHED", deletedAt: null } }),
    prisma.post.aggregate({ _sum: { viewCount: true }, where: { deletedAt: null } }),
    prisma.post.aggregate({ _avg: { viewCount: true }, where: { status: "PUBLISHED", deletedAt: null } }),
    prisma.post.findFirst({
      where: { status: "PUBLISHED", deletedAt: null },
      orderBy: { viewCount: "desc" },
      select: { title: true, viewCount: true },
    }),
    prisma.comment.aggregate({ _count: { id: true }, _avg: { likes: true } }),
  ]);

  console.log("   ┌─────────────────────────────────────┐");
  console.log(`   │ Published Posts : ${String(totalPosts).padEnd(18)}│`);
  console.log(`   │ Total Views     : ${String(totalViews._sum.viewCount).padEnd(18)}│`);
  console.log(`   │ Avg Views/Post  : ${String(avgViews._avg.viewCount?.toFixed(0)).padEnd(18)}│`);
  console.log(`   │ Most Viewed     : ${String(mostViewed?.viewCount).padEnd(18)}│`);
  console.log(`   │ Total Comments  : ${String(commentStats._count.id).padEnd(18)}│`);
  console.log("   └─────────────────────────────────────┘");

  console.log("\n✅ Aggregations example complete!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
