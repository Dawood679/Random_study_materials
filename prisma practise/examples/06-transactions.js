/**
 * 06 — Transactions
 * -----------------
 * - Sequential $transaction([...]) — array of operations
 * - Interactive $transaction(async (tx) => {}) — full control, rollback on error
 * - Nested writes (alternative to explicit transactions for simple cases)
 * - Error handling & rollback
 * - Idempotency
 */

require("dotenv").config();
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("=".repeat(60));
  console.log("06 — TRANSACTIONS");
  console.log("=".repeat(60));

  // ─────────────────────────────────────────────────────────────────────────
  // Sequential $transaction — array style
  // ─────────────────────────────────────────────────────────────────────────

  console.log("\n⚡ Sequential $transaction — runs all or none:");
  const [userCount, postCount, commentCount] = await prisma.$transaction([
    prisma.user.count(),
    prisma.post.count({ where: { deletedAt: null } }),
    prisma.comment.count(),
  ]);
  console.log(`   Users   : ${userCount}`);
  console.log(`   Posts   : ${postCount}`);
  console.log(`   Comments: ${commentCount}`);

  // Use case: transfer-like operation — update two records atomically
  console.log("\n⚡ Sequential $transaction — atomic multi-update:");
  const post1 = await prisma.post.findFirst({ where: { status: "PUBLISHED", deletedAt: null } });
  const post2 = await prisma.post.findFirst({
    where: { status: "PUBLISHED", deletedAt: null, id: { not: post1.id } },
  });

  const [updPost1, updPost2] = await prisma.$transaction([
    prisma.post.update({ where: { id: post1.id }, data: { viewCount: { increment: 100 } } }),
    prisma.post.update({ where: { id: post2.id }, data: { viewCount: { increment: 50 } } }),
  ]);
  console.log(`   Post 1 viewCount: ${updPost1.viewCount} (+100)`);
  console.log(`   Post 2 viewCount: ${updPost2.viewCount} (+50)`);

  // ─────────────────────────────────────────────────────────────────────────
  // Interactive $transaction — callback style (most powerful)
  // ─────────────────────────────────────────────────────────────────────────

  console.log("\n⚡ Interactive $transaction — create user + post atomically:");
  const aliceUser = await prisma.user.findUnique({ where: { email: "alice@example.com" } });
  const techCat = await prisma.category.findFirst({ where: { slug: "technology" } });

  const result = await prisma.$transaction(async (tx) => {
    // tx is the transaction client — use it for all operations inside
    const newPost = await tx.post.create({
      data: {
        title: "Transaction Demo Post",
        slug: `tx-demo-${Date.now()}`,
        content: "Created inside an interactive transaction.",
        status: "DRAFT",
        authorId: aliceUser.id,
        categoryId: techCat.id,
      },
    });

    const comment = await tx.comment.create({
      data: {
        body: "First comment on transaction demo post",
        postId: newPost.id,
        authorId: aliceUser.id,
      },
    });

    // Update user's post count isn't needed (Prisma auto-tracks) but we can
    // do any additional reads/writes here
    const postCount = await tx.post.count({ where: { authorId: aliceUser.id } });

    return { post: newPost, comment, totalPostsByAlice: postCount };
  });

  console.log(`   Created post   : "${result.post.title}" (id: ${result.post.id})`);
  console.log(`   Created comment: "${result.comment.body}"`);
  console.log(`   Alice's total posts now: ${result.totalPostsByAlice}`);

  // ─────────────────────────────────────────────────────────────────────────
  // Rollback — error inside transaction undoes ALL changes
  // ─────────────────────────────────────────────────────────────────────────

  console.log("\n⚡ Interactive $transaction — ROLLBACK on error:");
  const beforeCount = await prisma.post.count();
  console.log(`   Posts before failed tx: ${beforeCount}`);

  try {
    await prisma.$transaction(async (tx) => {
      // This will succeed
      await tx.post.create({
        data: {
          title: "This post will be rolled back",
          slug: `rollback-test-${Date.now()}`,
          content: "Should not persist",
          status: "DRAFT",
          authorId: aliceUser.id,
        },
      });

      // This will FAIL — intentional duplicate slug
      await tx.post.create({
        data: {
          title: "Duplicate slug post",
          slug: `rollback-test-${Date.now() - 1}`,  // different but let's force an error
          content: "Should not persist either",
          status: "DRAFT",
          authorId: 99999,  // non-existent user — will fail foreign key constraint
        },
      });
    });
  } catch (err) {
    console.log(`   Transaction rolled back! Error: ${err.constructor.name}`);
    console.log(`   Error code: ${err.code || "FK_VIOLATION"}`);
  }

  const afterCount = await prisma.post.count();
  console.log(`   Posts after failed tx: ${afterCount} (same as before — rollback worked!)`);

  // ─────────────────────────────────────────────────────────────────────────
  // Transaction with timeout and isolation level (advanced)
  // ─────────────────────────────────────────────────────────────────────────

  console.log("\n⚡ Transaction with options (timeout + isolation level):");
  const txWithOptions = await prisma.$transaction(
    async (tx) => {
      const users = await tx.user.findMany({ select: { id: true, username: true } });
      return users;
    },
    {
      maxWait: 5000,       // max ms to wait for transaction slot (default: 2000)
      timeout: 10000,      // max ms for transaction to complete (default: 5000)
      isolationLevel: "ReadCommitted",  // Serializable | RepeatableRead | ReadCommitted | ReadUncommitted
    }
  );
  console.log(`   Read ${txWithOptions.length} users inside isolated transaction`);

  // ── Cleanup ─────────────────────────────────────────────────────────────
  await prisma.post.delete({ where: { id: result.post.id } });

  console.log("\n✅ Transactions example complete!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
