/**
 * 07 — Middleware & Client Extensions
 * ------------------------------------
 * - prisma.$use() — middleware (deprecated in v5, still works in v4)
 * - Prisma Client Extensions ($extends) — the modern approach
 *   - result extensions: computed fields
 *   - query extensions: intercept queries (like middleware)
 *   - model extensions: add custom methods to models
 * - Logging middleware example
 * - Soft-delete middleware example
 */

require("dotenv").config();
const { PrismaClient } = require("@prisma/client");

async function main() {
  console.log("=".repeat(60));
  console.log("07 — MIDDLEWARE & CLIENT EXTENSIONS");
  console.log("=".repeat(60));

  // ─────────────────────────────────────────────────────────────────────────
  // $use Middleware (Prisma v4 style — still supported in v5)
  // ─────────────────────────────────────────────────────────────────────────

  console.log("\n⚙️  $use Middleware — Query logging:");
  const prismaWithLog = new PrismaClient();

  prismaWithLog.$use(async (params, next) => {
    const before = Date.now();
    const result = await next(params);
    const after = Date.now();
    console.log(`   [${params.model}.${params.action}] took ${after - before}ms`);
    return result;
  });

  await prismaWithLog.user.findMany({ take: 2 });
  await prismaWithLog.post.count();
  await prismaWithLog.$disconnect();

  // ─────────────────────────────────────────────────────────────────────────
  // Prisma Client Extensions — result extension (computed fields)
  // ─────────────────────────────────────────────────────────────────────────

  console.log("\n⚙️  $extends — result extension (computed field):");
  const prismaWithComputed = new PrismaClient().$extends({
    result: {
      user: {
        // Add a computed 'displayName' field
        displayName: {
          needs: { username: true, role: true },
          compute(user) {
            return `${user.username} [${user.role}]`;
          },
        },
      },
      post: {
        // Add isPopular computed field
        isPopular: {
          needs: { viewCount: true },
          compute(post) {
            return post.viewCount > 1000;
          },
        },
        // Add readTime computed field (avg 200 words/min)
        readTime: {
          needs: { content: true },
          compute(post) {
            const wordCount = post.content.split(" ").length;
            return `${Math.ceil(wordCount / 200)} min read`;
          },
        },
      },
    },
  });

  const users = await prismaWithComputed.user.findMany({
    select: { username: true, role: true },
  });
  console.log("   Users with computed displayName:");
  users.forEach((u) => console.log(`     ${u.displayName}`));

  const posts = await prismaWithComputed.post.findMany({
    where: { deletedAt: null },
    select: { title: true, viewCount: true, content: true },
    take: 4,
  });
  console.log("\n   Posts with computed isPopular + readTime:");
  posts.forEach((p) =>
    console.log(`     "${p.title}" | popular: ${p.isPopular} | ${p.readTime}`)
  );

  await prismaWithComputed.$disconnect();

  // ─────────────────────────────────────────────────────────────────────────
  // Prisma Client Extensions — query extension (intercept all queries)
  // ─────────────────────────────────────────────────────────────────────────

  console.log("\n⚙️  $extends — query extension (auto soft-delete filter):");

  const prismaWithSoftDelete = new PrismaClient().$extends({
    query: {
      post: {
        // Automatically exclude soft-deleted posts from all findMany queries
        async findMany({ args, query }) {
          args.where = { ...args.where, deletedAt: null };
          return query(args);
        },
        async findFirst({ args, query }) {
          args.where = { ...args.where, deletedAt: null };
          return query(args);
        },
      },
    },
  });

  // Now we don't need deletedAt: null — it's added automatically!
  const posts2 = await prismaWithSoftDelete.post.findMany({
    select: { id: true, title: true, deletedAt: true },
  });
  console.log(`   Posts returned (auto-filtered): ${posts2.length}`);
  console.log(`   None should have deletedAt set:`);
  posts2.forEach((p) => console.log(`     id:${p.id} deletedAt:${p.deletedAt ?? "null (good!)"}`));

  await prismaWithSoftDelete.$disconnect();

  // ─────────────────────────────────────────────────────────────────────────
  // Prisma Client Extensions — model extension (custom methods)
  // ─────────────────────────────────────────────────────────────────────────

  console.log("\n⚙️  $extends — model extension (custom methods on prisma.user):");

  const prismaWithMethods = new PrismaClient().$extends({
    model: {
      user: {
        // Custom method: find active admins
        async findActiveAdmins() {
          return this.findMany({
            where: { role: "ADMIN", isActive: true, deletedAt: null },
            select: { id: true, username: true, email: true },
          });
        },
        // Custom method: soft delete
        async softDelete(id) {
          return this.update({
            where: { id },
            data: { deletedAt: new Date() },
          });
        },
      },
      post: {
        // Custom method: get trending posts (high view count)
        async findTrending(limit = 5) {
          return this.findMany({
            where: { status: "PUBLISHED", deletedAt: null, viewCount: { gt: 500 } },
            orderBy: { viewCount: "desc" },
            take: limit,
            select: { id: true, title: true, viewCount: true },
          });
        },
      },
    },
  });

  const admins = await prismaWithMethods.user.findActiveAdmins();
  console.log("   Active Admins:", admins.map((a) => a.username));

  const trending = await prismaWithMethods.post.findTrending(3);
  console.log("\n   Trending Posts:");
  trending.forEach((p) => console.log(`     [${p.viewCount} views] ${p.title}`));

  await prismaWithMethods.$disconnect();

  // ─────────────────────────────────────────────────────────────────────────
  // Combining multiple extensions with $extends chaining
  // ─────────────────────────────────────────────────────────────────────────

  console.log("\n⚙️  Chaining multiple extensions:");
  const base = new PrismaClient();

  const prismaFull = base
    .$extends({
      result: {
        user: {
          displayName: {
            needs: { username: true, role: true },
            compute: (u) => `${u.username} (${u.role})`,
          },
        },
      },
    })
    .$extends({
      model: {
        user: {
          async findAdmins() {
            return this.findMany({ where: { role: "ADMIN" }, select: { username: true, role: true } });
          },
        },
      },
    });

  const adminList = await prismaFull.user.findAdmins();
  console.log("   Admins via chained extension:");
  adminList.forEach((u) => console.log(`     ${u.displayName}`));

  await prismaFull.$disconnect();

  console.log("\n✅ Middleware & Extensions example complete!");
}

main().catch(console.error);
