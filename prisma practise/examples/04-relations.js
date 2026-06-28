/**
 * 04 — Relations
 * --------------
 * - 1-to-1   : User ↔ Profile
 * - 1-to-many: User → Posts, Post → Comments
 * - many-many : Post ↔ Tag
 * - Self-referencing: Comment → Comment (replies)
 *
 * Prisma relation operations:
 * - include   : load related records
 * - select    : pick specific fields from related records
 * - create    : nested create (parent + child in one query)
 * - connect   : link to existing record
 * - disconnect: unlink relation
 * - set       : replace entire relation set
 * - connectOrCreate
 */

require("dotenv").config();
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("=".repeat(60));
  console.log("04 — RELATIONS");
  console.log("=".repeat(60));

  // ─────────────────────────────────────────────────────────────────────────
  // 1-to-1 : User ↔ Profile
  // ─────────────────────────────────────────────────────────────────────────

  console.log("\n🔗 1-to-1: User with Profile (include):");
  const userWithProfile = await prisma.user.findUnique({
    where: { email: "alice@example.com" },
    include: { profile: true },
  });
  console.log(`   User   : ${userWithProfile.username}`);
  console.log(`   Bio    : ${userWithProfile.profile?.bio}`);
  console.log(`   Website: ${userWithProfile.profile?.website}`);
  console.log(`   Meta   : ${JSON.stringify(userWithProfile.profile?.meta)}`);

  // Nested create — 1-to-1 create with parent
  console.log("\n🔗 1-to-1: Create user WITH profile (nested create):");
  const newUserWithProfile = await prisma.user.create({
    data: {
      email: `rel_test_${Date.now()}@test.com`,
      username: `rel_user_${Date.now()}`,
      password: "pass",
      profile: {
        create: {
          bio: "Test user for relations example",
          location: "Islamabad",
        },
      },
    },
    include: { profile: true },
  });
  console.log(`   Created: ${newUserWithProfile.username} | Bio: ${newUserWithProfile.profile?.bio}`);

  // ─────────────────────────────────────────────────────────────────────────
  // 1-to-many : User → Posts
  // ─────────────────────────────────────────────────────────────────────────

  console.log("\n🔗 1-to-many: User with their Posts (include with where/orderBy):");
  const authorWithPosts = await prisma.user.findUnique({
    where: { email: "alice@example.com" },
    include: {
      posts: {
        where: { status: "PUBLISHED", deletedAt: null },
        orderBy: { viewCount: "desc" },
        select: { id: true, title: true, viewCount: true, status: true },
      },
    },
  });
  console.log(`   Author: ${authorWithPosts.username} — ${authorWithPosts.posts.length} published posts`);
  authorWithPosts.posts.forEach((p) =>
    console.log(`     [${p.viewCount} views] ${p.title}`)
  );

  // _count — count related records without loading them
  console.log("\n🔗 _count — count related records:");
  const usersWithCount = await prisma.user.findMany({
    include: {
      _count: { select: { posts: true, comments: true } },
    },
  });
  usersWithCount.forEach((u) =>
    console.log(`   ${u.username}: ${u._count.posts} posts, ${u._count.comments} comments`)
  );

  // ─────────────────────────────────────────────────────────────────────────
  // many-to-many : Post ↔ Tag
  // ─────────────────────────────────────────────────────────────────────────

  console.log("\n🔗 many-many: Post with Tags (include):");
  const postWithTags = await prisma.post.findFirst({
    where: { status: "PUBLISHED" },
    include: { tags: true },
    orderBy: { viewCount: "desc" },
  });
  console.log(`   Post: "${postWithTags.title}"`);
  console.log(`   Tags: ${postWithTags.tags.map((t) => t.name).join(", ")}`);

  // Connect existing tag to a post
  console.log("\n🔗 many-many: connect existing tag to post:");
  const testTag = await prisma.tag.create({ data: { name: "REL_TEST_TAG", color: "#abc" } });
  const updatedPost = await prisma.post.update({
    where: { id: postWithTags.id },
    data: { tags: { connect: { id: testTag.id } } },
    include: { tags: { select: { name: true } } },
  });
  console.log(`   Tags after connect: ${updatedPost.tags.map((t) => t.name).join(", ")}`);

  // Disconnect a tag from post
  console.log("\n🔗 many-many: disconnect tag from post:");
  const disconnected = await prisma.post.update({
    where: { id: postWithTags.id },
    data: { tags: { disconnect: { id: testTag.id } } },
    include: { tags: { select: { name: true } } },
  });
  console.log(`   Tags after disconnect: ${disconnected.tags.map((t) => t.name).join(", ")}`);

  // set — replace all tags at once
  console.log("\n🔗 many-many: set — replace all tags:");
  const jsTag = await prisma.tag.findUnique({ where: { name: "JavaScript" } });
  const nodeTag = await prisma.tag.findUnique({ where: { name: "Node.js" } });
  const setResult = await prisma.post.update({
    where: { id: postWithTags.id },
    data: {
      tags: {
        set: [{ id: jsTag.id }, { id: nodeTag.id }],  // replaces all existing tags
      },
    },
    include: { tags: { select: { name: true } } },
  });
  console.log(`   Tags after set: ${setResult.tags.map((t) => t.name).join(", ")}`);

  // connectOrCreate — connect if exists, create if not
  console.log("\n🔗 many-many: connectOrCreate:");
  const coResult = await prisma.post.update({
    where: { id: postWithTags.id },
    data: {
      tags: {
        connectOrCreate: {
          where: { name: "Docker" },
          create: { name: "Docker", color: "#0db7ed" },
        },
      },
    },
    include: { tags: { select: { name: true } } },
  });
  console.log(`   Tags after connectOrCreate: ${coResult.tags.map((t) => t.name).join(", ")}`);

  // ─────────────────────────────────────────────────────────────────────────
  // Self-referencing: Comment → Comment (replies)
  // ─────────────────────────────────────────────────────────────────────────

  console.log("\n🔗 Self-referencing: Comments with nested Replies:");
  const commentsWithReplies = await prisma.comment.findMany({
    where: { parentId: null, post: { deletedAt: null } },
    include: {
      author: { select: { username: true } },
      replies: {
        include: { author: { select: { username: true } } },
      },
    },
    take: 3,
  });
  commentsWithReplies.forEach((c) => {
    console.log(`   💬 @${c.author.username}: "${c.body}"`);
    c.replies.forEach((r) =>
      console.log(`      ↳ @${r.author.username}: "${r.body}"`)
    );
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Nested CREATE — Post with nested comment and tag connect
  // ─────────────────────────────────────────────────────────────────────────

  console.log("\n🔗 Nested Create — post with comment in one query:");
  const aliceUser = await prisma.user.findUnique({ where: { email: "alice@example.com" } });
  const techCat = await prisma.category.findUnique({ where: { slug: "technology" } });

  const nestedPost = await prisma.post.create({
    data: {
      title: "Nested Create Demo",
      slug: `nested-create-${Date.now()}`,
      content: "Created in a single Prisma query with nested relations.",
      status: "DRAFT",
      authorId: aliceUser.id,
      categoryId: techCat.id,
      tags: { connect: [{ id: jsTag.id }] },
      comments: {
        create: {
          body: "Auto-generated comment via nested create",
          authorId: aliceUser.id,
        },
      },
    },
    include: {
      tags: { select: { name: true } },
      comments: { select: { body: true } },
      author: { select: { username: true } },
    },
  });
  console.log(`   Post created: "${nestedPost.title}"`);
  console.log(`   Author      : ${nestedPost.author.username}`);
  console.log(`   Tags        : ${nestedPost.tags.map((t) => t.name).join(", ")}`);
  console.log(`   Comment     : "${nestedPost.comments[0]?.body}"`);

  // ── Cleanup ────────────────────────────────────────────────────────────────
  await prisma.post.delete({ where: { id: nestedPost.id } });
  await prisma.user.delete({ where: { id: newUserWithProfile.id } });
  await prisma.tag.deleteMany({ where: { name: { in: ["REL_TEST_TAG", "Docker"] } } });
  // restore original tags on modified post
  const prismaTag = await prisma.tag.findUnique({ where: { name: "Prisma" } });
  const dbTag = await prisma.tag.findUnique({ where: { name: "Database" } });
  await prisma.post.update({
    where: { id: postWithTags.id },
    data: { tags: { set: [{ id: jsTag.id }, { id: nodeTag.id }, { id: prismaTag.id }, { id: dbTag.id }] } },
  });

  console.log("\n✅ Relations example complete!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
