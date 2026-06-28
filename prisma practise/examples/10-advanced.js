/**
 * 10 — Advanced Patterns
 * ----------------------
 * - Upsert (advanced)
 * - Soft Delete pattern (full implementation)
 * - Batch operations
 * - Optimistic concurrency
 * - PrismaClientKnownRequestError — error codes
 * - Nested transactions
 * - createManyAndReturn (v5.14+)
 * - Fluent API
 * - Type safety with Prisma.UserGetPayload
 */

require("dotenv").config();
const { PrismaClient, Prisma } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("=".repeat(60));
  console.log("10 — ADVANCED PATTERNS");
  console.log("=".repeat(60));

  // ─────────────────────────────────────────────────────────────────────────
  // Upsert — advanced usage
  // ─────────────────────────────────────────────────────────────────────────

  console.log("\n🔥 UPSERT — create or update a Category:");

  const categoryData = { name: "DevOps", slug: "devops", description: "DevOps and CI/CD" };
  const cat1 = await prisma.category.upsert({
    where: { slug: "devops" },
    update: { description: "DevOps, Docker, and Kubernetes" },
    create: categoryData,
  });
  console.log(`   Category: "${cat1.name}" | desc: ${cat1.description}`);

  // Run again — will update
  const cat2 = await prisma.category.upsert({
    where: { slug: "devops" },
    update: { description: "DevOps, Docker, Kubernetes, and CI/CD pipelines" },
    create: categoryData,
  });
  console.log(`   After 2nd upsert: ${cat2.description}`);

  // ─────────────────────────────────────────────────────────────────────────
  // Soft Delete Pattern — full implementation
  // ─────────────────────────────────────────────────────────────────────────

  console.log("\n🔥 SOFT DELETE — find, soft-delete, restore, hard-delete:");

  const aliceUser = await prisma.user.findUnique({ where: { email: "alice@example.com" } });

  // Create a test post to soft-delete
  const testPost = await prisma.post.create({
    data: {
      title: "Soft Delete Demo",
      slug: `soft-delete-demo-${Date.now()}`,
      content: "This post will be soft-deleted then restored.",
      status: "PUBLISHED",
      publishedAt: new Date(),
      authorId: aliceUser.id,
    },
  });
  console.log(`   Created post: "${testPost.title}" (id: ${testPost.id})`);

  // Soft delete — set deletedAt
  const softDeleted = await prisma.post.update({
    where: { id: testPost.id },
    data: { deletedAt: new Date() },
    select: { id: true, title: true, deletedAt: true },
  });
  console.log(`   Soft-deleted at: ${softDeleted.deletedAt}`);

  // Query active posts — deletedAt: null
  const activePosts = await prisma.post.findMany({
    where: { deletedAt: null, status: "PUBLISHED" },
    select: { id: true, title: true },
  });
  const isVisible = activePosts.some((p) => p.id === testPost.id);
  console.log(`   Is post visible in active list? ${isVisible} (should be false)`);

  // Query deleted posts
  const deletedPosts = await prisma.post.findMany({
    where: { deletedAt: { not: null } },
    select: { id: true, title: true, deletedAt: true },
  });
  console.log(`   Deleted posts count: ${deletedPosts.length}`);

  // Restore — set deletedAt back to null
  await prisma.post.update({
    where: { id: testPost.id },
    data: { deletedAt: null },
  });
  console.log("   Post restored (deletedAt = null)");

  // Hard delete — permanent
  await prisma.post.delete({ where: { id: testPost.id } });
  console.log("   Post hard-deleted (permanent)");

  // ─────────────────────────────────────────────────────────────────────────
  // Batch operations
  // ─────────────────────────────────────────────────────────────────────────

  console.log("\n🔥 BATCH OPS — createMany + updateMany + deleteMany:");

  // createMany
  const { count: created } = await prisma.tag.createMany({
    data: [
      { name: "BATCH_TAG_1", color: "#111" },
      { name: "BATCH_TAG_2", color: "#222" },
      { name: "BATCH_TAG_3", color: "#333" },
      { name: "BATCH_TAG_4", color: "#444" },
    ],
    skipDuplicates: true,
  });
  console.log(`   createMany: inserted ${created} tags`);

  // updateMany
  const { count: updated } = await prisma.tag.updateMany({
    where: { name: { startsWith: "BATCH_TAG" } },
    data: { color: "#ffffff" },
  });
  console.log(`   updateMany: updated ${updated} tags color to #ffffff`);

  // deleteMany
  const { count: deleted } = await prisma.tag.deleteMany({
    where: { name: { startsWith: "BATCH_TAG" } },
  });
  console.log(`   deleteMany: deleted ${deleted} tags`);

  // ─────────────────────────────────────────────────────────────────────────
  // Error handling — PrismaClientKnownRequestError codes
  // ─────────────────────────────────────────────────────────────────────────

  console.log("\n🔥 ERROR HANDLING — Prisma error codes:");

  async function safeCreate(email, username) {
    try {
      return await prisma.user.create({
        data: { email, username, password: "pass" },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        switch (err.code) {
          case "P2002":
            return { error: `Duplicate field: ${err.meta?.target}`, code: err.code };
          case "P2025":
            return { error: "Record not found", code: err.code };
          case "P2003":
            return { error: "Foreign key constraint failed", code: err.code };
          default:
            return { error: `Prisma error ${err.code}`, code: err.code };
        }
      }
      throw err;  // re-throw non-Prisma errors
    }
  }

  // P2002 — unique constraint violation
  const dupResult = await safeCreate("alice@example.com", "new_alice");
  console.log("   P2002 (duplicate):", dupResult);

  async function safeDelete(id) {
    try {
      return await prisma.user.delete({ where: { id } });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
        return { error: "User not found — nothing to delete", code: "P2025" };
      }
      throw err;
    }
  }

  // P2025 — record not found
  const notFoundResult = await safeDelete(99999);
  console.log("   P2025 (not found):", notFoundResult);

  // Common Prisma error codes:
  console.log("\n   Common Prisma error codes:");
  console.log("   P2000 — Value too long for field");
  console.log("   P2001 — Record not found (where condition)");
  console.log("   P2002 — Unique constraint failed");
  console.log("   P2003 — Foreign key constraint failed");
  console.log("   P2004 — Constraint failed on DB");
  console.log("   P2025 — Record to update/delete not found");
  console.log("   P2034 — Transaction conflict (retry needed)");

  // ─────────────────────────────────────────────────────────────────────────
  // Fluent API — chainable relation traversal
  // ─────────────────────────────────────────────────────────────────────────

  console.log("\n🔥 FLUENT API — traverse relations:");
  const user = await prisma.user.findUnique({ where: { email: "bob@example.com" } });

  // Get all comments on bob's posts
  const bobsPostComments = await prisma.user
    .findUnique({ where: { id: user.id } })
    .posts()
    .then(async (posts) => {
      const postIds = posts.filter((p) => !p.deletedAt).map((p) => p.id);
      return prisma.comment.findMany({
        where: { postId: { in: postIds } },
        include: { author: { select: { username: true } } },
        take: 5,
      });
    });

  console.log(`   Comments on Bob's posts:`);
  bobsPostComments.forEach((c) =>
    console.log(`     @${c.author.username}: "${c.body.substring(0, 50)}"`)
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Nested transactions — transaction inside transaction
  // ─────────────────────────────────────────────────────────────────────────

  console.log("\n🔥 NESTED WRITES — create post + comment + update user in one tx:");
  const txResult = await prisma.$transaction(async (tx) => {
    const techCat = await tx.category.findFirst({ where: { slug: "technology" } });
    const jsTag = await tx.tag.findFirst({ where: { name: "JavaScript" } });

    const post = await tx.post.create({
      data: {
        title: "Advanced Transaction Demo",
        slug: `adv-tx-demo-${Date.now()}`,
        content: "Created in a complex transaction with multiple nested operations.",
        status: "PUBLISHED",
        publishedAt: new Date(),
        authorId: aliceUser.id,
        categoryId: techCat.id,
        tags: { connect: [{ id: jsTag.id }] },
        comments: {
          create: [
            { body: "First comment auto-created", authorId: aliceUser.id },
            { body: "Second comment auto-created", authorId: aliceUser.id },
          ],
        },
      },
      include: { tags: true, comments: true },
    });

    // Update view count atomically in same tx
    const updatedPost = await tx.post.update({
      where: { id: post.id },
      data: { viewCount: { increment: 1 } },
      select: { id: true, viewCount: true },
    });

    return { post, updatedPost };
  });

  console.log(`   Post created: "${txResult.post.title}"`);
  console.log(`   Tags        : ${txResult.post.tags.map((t) => t.name).join(", ")}`);
  console.log(`   Comments    : ${txResult.post.comments.length} (created in same tx)`);
  console.log(`   ViewCount   : ${txResult.updatedPost.viewCount} (incremented in same tx)`);

  // ── Cleanup ───────────────────────────────────────────────────────────────
  await prisma.post.delete({ where: { id: txResult.post.id } });
  await prisma.category.delete({ where: { slug: "devops" } });

  console.log("\n✅ Advanced patterns example complete!");
  console.log("\n🎓 You've covered ALL Prisma concepts — zero to advanced!");
  console.log("   Next step: Run the Express server with 'npm start' and explore the API.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
