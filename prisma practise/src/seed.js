require("dotenv").config();
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...\n");

  // ── Reset ──────────────────────────────────────────────────────────────────
  await prisma.comment.deleteMany();
  await prisma.post.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.category.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();
  console.log("✓ Old data cleared");

  // ── Categories ─────────────────────────────────────────────────────────────
  const [techCat, lifestyleCat] = await Promise.all([
    prisma.category.create({
      data: { name: "Technology", slug: "technology", description: "Tech news and tutorials" },
    }),
    prisma.category.create({
      data: { name: "Lifestyle", slug: "lifestyle", description: "Life tips and stories" },
    }),
  ]);
  console.log("✓ Categories created");

  // ── Tags ───────────────────────────────────────────────────────────────────
  const [jsTag, nodeTag, prismaTag, expressTag, dbTag] = await Promise.all([
    prisma.tag.create({ data: { name: "JavaScript", color: "#f7df1e" } }),
    prisma.tag.create({ data: { name: "Node.js", color: "#339933" } }),
    prisma.tag.create({ data: { name: "Prisma", color: "#2d3748" } }),
    prisma.tag.create({ data: { name: "Express", color: "#000000" } }),
    prisma.tag.create({ data: { name: "Database", color: "#3b82f6" } }),
  ]);
  console.log("✓ Tags created");

  // ── Users (with nested Profile creation) ──────────────────────────────────
  const alice = await prisma.user.create({
    data: {
      email: "alice@example.com",
      username: "alice",
      password: "hashed_pass_alice",
      role: "ADMIN",
      profile: {
        create: {
          bio: "Full-stack developer & open source enthusiast",
          avatar: "https://i.pravatar.cc/150?u=alice",
          website: "https://alice.dev",
          location: "Karachi, Pakistan",
          meta: { twitter: "@alice_dev", github: "alice" },
        },
      },
    },
    include: { profile: true },
  });

  const bob = await prisma.user.create({
    data: {
      email: "bob@example.com",
      username: "bob",
      password: "hashed_pass_bob",
      role: "MODERATOR",
      profile: {
        create: {
          bio: "Backend engineer, loves databases",
          location: "Lahore, Pakistan",
          meta: { github: "bob_codes" },
        },
      },
    },
    include: { profile: true },
  });

  const charlie = await prisma.user.create({
    data: {
      email: "charlie@example.com",
      username: "charlie",
      password: "hashed_pass_charlie",
      role: "USER",
      profile: {
        create: {
          bio: "Junior dev learning Prisma",
          avatar: "https://i.pravatar.cc/150?u=charlie",
        },
      },
    },
    include: { profile: true },
  });
  console.log("✓ Users + Profiles created (alice, bob, charlie)");

  // ── Posts (with nested tag connections) ────────────────────────────────────
  const post1 = await prisma.post.create({
    data: {
      title: "Getting Started with Prisma ORM",
      slug: "getting-started-prisma",
      content: "Prisma is a next-generation ORM that makes database access easy with type safety. In this post we explore the basics of setup and first queries.",
      excerpt: "Learn Prisma from scratch — setup, schema, and first queries.",
      status: "PUBLISHED",
      publishedAt: new Date("2024-01-10"),
      viewCount: 1200,
      authorId: alice.id,
      categoryId: techCat.id,
      tags: { connect: [{ id: prismaTag.id }, { id: jsTag.id }, { id: dbTag.id }] },
    },
  });

  const post2 = await prisma.post.create({
    data: {
      title: "Express.js REST API Best Practices",
      slug: "express-rest-best-practices",
      content: "Building production-ready REST APIs with Express requires knowing the right patterns — routing, middleware, error handling, and validation.",
      excerpt: "Production patterns for Express REST APIs.",
      status: "PUBLISHED",
      publishedAt: new Date("2024-02-05"),
      viewCount: 850,
      authorId: alice.id,
      categoryId: techCat.id,
      tags: { connect: [{ id: expressTag.id }, { id: nodeTag.id }, { id: jsTag.id }] },
    },
  });

  const post3 = await prisma.post.create({
    data: {
      title: "Prisma Relations Explained",
      slug: "prisma-relations-explained",
      content: "Understanding 1-1, 1-many, and many-many relations in Prisma with real examples and schema definitions.",
      excerpt: "Deep dive into Prisma relations.",
      status: "PUBLISHED",
      publishedAt: new Date("2024-03-12"),
      viewCount: 2100,
      authorId: bob.id,
      categoryId: techCat.id,
      tags: { connect: [{ id: prismaTag.id }, { id: dbTag.id }] },
    },
  });

  const post4 = await prisma.post.create({
    data: {
      title: "Advanced Prisma Queries",
      slug: "advanced-prisma-queries",
      content: "Learn filtering, sorting, pagination, aggregations, and raw SQL queries in Prisma.",
      excerpt: "Master advanced querying techniques in Prisma.",
      status: "PUBLISHED",
      publishedAt: new Date("2024-04-20"),
      viewCount: 1750,
      authorId: bob.id,
      categoryId: techCat.id,
      tags: { connect: [{ id: prismaTag.id }, { id: dbTag.id }, { id: jsTag.id }] },
    },
  });

  const post5 = await prisma.post.create({
    data: {
      title: "Node.js Performance Tips",
      slug: "nodejs-performance-tips",
      content: "Optimize your Node.js applications with these practical performance tips covering event loop, clustering, caching, and more.",
      excerpt: "Make your Node.js apps faster.",
      status: "PUBLISHED",
      publishedAt: new Date("2024-05-01"),
      viewCount: 980,
      authorId: alice.id,
      categoryId: techCat.id,
      tags: { connect: [{ id: nodeTag.id }, { id: jsTag.id }] },
    },
  });

  const post6 = await prisma.post.create({
    data: {
      title: "10 Healthy Habits for Developers",
      slug: "healthy-habits-developers",
      content: "Sitting all day coding? These 10 habits will keep you healthy, focused, and energized throughout your dev journey.",
      excerpt: "Stay healthy while coding every day.",
      status: "PUBLISHED",
      publishedAt: new Date("2024-05-15"),
      viewCount: 430,
      authorId: charlie.id,
      categoryId: lifestyleCat.id,
      tags: { connect: [] },
    },
  });

  const post7 = await prisma.post.create({
    data: {
      title: "Draft: Prisma Migrations Deep Dive",
      slug: "prisma-migrations-deep-dive",
      content: "This is a draft exploring how Prisma handles database migrations under the hood.",
      status: "DRAFT",
      authorId: bob.id,
      categoryId: techCat.id,
      tags: { connect: [{ id: prismaTag.id }] },
    },
  });

  const post8 = await prisma.post.create({
    data: {
      title: "Archived: Old JavaScript Tips",
      slug: "archived-old-js-tips",
      content: "These tips are outdated but preserved for historical reference.",
      status: "ARCHIVED",
      viewCount: 50,
      authorId: charlie.id,
      categoryId: techCat.id,
      tags: { connect: [{ id: jsTag.id }] },
    },
  });
  console.log("✓ Posts created (8 posts — published, draft, archived)");

  // ── Comments (including nested reply) ─────────────────────────────────────
  const c1 = await prisma.comment.create({
    data: { body: "Great intro to Prisma! Really helped me get started.", postId: post1.id, authorId: bob.id },
  });
  const c2 = await prisma.comment.create({
    data: { body: "Thanks! Glad it helped.", postId: post1.id, authorId: alice.id, parentId: c1.id },
  });
  await prisma.comment.create({
    data: { body: "Can you write more about migrations?", postId: post1.id, authorId: charlie.id },
  });

  await prisma.comment.create({
    data: { body: "Best Express guide I've read. Bookmarked!", postId: post2.id, authorId: charlie.id },
  });
  await prisma.comment.create({
    data: { body: "Would love to see error handling covered more deeply.", postId: post2.id, authorId: bob.id },
  });

  await prisma.comment.create({
    data: { body: "The many-many example with Tags is very clear.", postId: post3.id, authorId: charlie.id },
  });
  await prisma.comment.create({
    data: { body: "What about self-referencing relations?", postId: post3.id, authorId: alice.id },
  });

  await prisma.comment.create({
    data: { body: "groupBy with having is powerful — didn't know about it!", postId: post4.id, authorId: charlie.id, likes: 5 },
  });
  await prisma.comment.create({
    data: { body: "Raw queries section was exactly what I needed.", postId: post4.id, authorId: alice.id, likes: 3 },
  });

  await prisma.comment.create({
    data: { body: "Clustering tip alone saved my app!", postId: post5.id, authorId: bob.id },
  });

  await prisma.comment.create({
    data: { body: "Standing desk changed my life as a dev.", postId: post6.id, authorId: alice.id },
  });

  // Soft-deleted post for demo
  await prisma.post.update({
    where: { id: post8.id },
    data: { deletedAt: new Date() },
  });

  console.log("✓ Comments created (11 comments, including 1 reply)");
  console.log("✓ Post #8 soft-deleted");

  console.log("\n✅ Seed complete!");
  console.log("   Users  : 3 (alice=ADMIN, bob=MODERATOR, charlie=USER)");
  console.log("   Posts  : 8 (6 published, 1 draft, 1 archived/soft-deleted)");
  console.log("   Tags   : 5");
  console.log("   Comments: 11");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
