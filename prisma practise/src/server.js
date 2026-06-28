require("dotenv").config();
const express = require("express");
const { PrismaClient } = require("@prisma/client");

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

app.use(express.json());

// ── Health Check ───────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ message: "Prisma Practice API is running!", port: PORT });
});

// ── Users ──────────────────────────────────────────────────────────────────

// GET /users — all users with their profiles
app.get("/users", async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { deletedAt: null },
      include: {
        profile: true,
        _count: { select: { posts: true, comments: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ count: users.length, data: users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /users/:id — single user with posts and profile
app.get("/users/:id", async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        profile: true,
        posts: {
          where: { deletedAt: null, status: "PUBLISHED" },
          include: { tags: true, category: true },
          orderBy: { publishedAt: "desc" },
        },
      },
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /users — create user with nested profile
app.post("/users", async (req, res) => {
  try {
    const { email, username, password, role, bio, website, location } = req.body;
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password,
        role: role || "USER",
        profile: {
          create: { bio, website, location },
        },
      },
      include: { profile: true },
    });
    res.status(201).json(user);
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(409).json({ error: "Email or username already exists" });
    }
    res.status(500).json({ error: err.message });
  }
});

// ── Posts ──────────────────────────────────────────────────────────────────

// GET /posts — all published posts (supports ?page=1&limit=5&search=prisma)
app.get("/posts", async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 5;
    const search = req.query.search;

    const where = {
      deletedAt: null,
      status: "PUBLISHED",
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { content: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const [posts, total] = await prisma.$transaction([
      prisma.post.findMany({
        where,
        include: {
          author: { select: { id: true, username: true, email: true } },
          category: true,
          tags: true,
          _count: { select: { comments: true } },
        },
        orderBy: { publishedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.post.count({ where }),
    ]);

    res.json({
      data: posts,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /posts/:id — single post with all relations
app.get("/posts/:id", async (req, res) => {
  try {
    const post = await prisma.post.findFirst({
      where: { id: Number(req.params.id), deletedAt: null },
      include: {
        author: { include: { profile: true } },
        category: true,
        tags: true,
        comments: {
          where: { parentId: null },
          include: {
            author: { select: { username: true, id: true } },
            replies: {
              include: { author: { select: { username: true } } },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });
    if (!post) return res.status(404).json({ error: "Post not found" });

    // increment view count
    await prisma.post.update({
      where: { id: post.id },
      data: { viewCount: { increment: 1 } },
    });

    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /posts/:id — partial update
app.patch("/posts/:id", async (req, res) => {
  try {
    const { title, content, excerpt, status, categoryId } = req.body;
    const post = await prisma.post.update({
      where: { id: Number(req.params.id) },
      data: {
        ...(title && { title }),
        ...(content && { content }),
        ...(excerpt && { excerpt }),
        ...(status && { status }),
        ...(categoryId && { categoryId: Number(categoryId) }),
        ...(status === "PUBLISHED" && { publishedAt: new Date() }),
      },
    });
    res.json(post);
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ error: "Post not found" });
    res.status(500).json({ error: err.message });
  }
});

// DELETE /posts/:id — soft delete (set deletedAt)
app.delete("/posts/:id", async (req, res) => {
  try {
    await prisma.post.update({
      where: { id: Number(req.params.id) },
      data: { deletedAt: new Date() },
    });
    res.json({ message: "Post soft-deleted successfully" });
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ error: "Post not found" });
    res.status(500).json({ error: err.message });
  }
});

// ── Stats (Aggregations) ────────────────────────────────────────────────────
app.get("/stats", async (req, res) => {
  try {
    const [userCount, postStats, topAuthors, tagStats] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.post.aggregate({
        where: { deletedAt: null },
        _count: { id: true },
        _sum: { viewCount: true },
        _avg: { viewCount: true },
        _max: { viewCount: true },
      }),
      prisma.post.groupBy({
        by: ["authorId"],
        where: { deletedAt: null, status: "PUBLISHED" },
        _count: { id: true },
        _sum: { viewCount: true },
        orderBy: { _sum: { viewCount: "desc" } },
        take: 3,
      }),
      prisma.tag.findMany({
        include: { _count: { select: { posts: true } } },
        orderBy: { posts: { _count: "desc" } },
      }),
    ]);

    res.json({ users: userCount, posts: postStats, topAuthors, tags: tagStats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Comments ───────────────────────────────────────────────────────────────
app.post("/posts/:id/comments", async (req, res) => {
  try {
    const { body, authorId, parentId } = req.body;
    const comment = await prisma.comment.create({
      data: {
        body,
        postId: Number(req.params.id),
        authorId: Number(authorId),
        ...(parentId && { parentId: Number(parentId) }),
      },
      include: { author: { select: { username: true } } },
    });
    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Start Server ────────────────────────────────────────────────────────────
app.listen(PORT, async () => {
  console.log(`\n🚀 Prisma Practice API running on http://localhost:${PORT}`);
  console.log("\n📋 Available Routes:");
  console.log("   GET    /               — health check");
  console.log("   GET    /users          — all users with profiles");
  console.log("   GET    /users/:id      — user with their posts");
  console.log("   POST   /users          — create user + profile");
  console.log("   GET    /posts          — paginated posts (?page=1&limit=5&search=)");
  console.log("   GET    /posts/:id      — post with author, tags, comments");
  console.log("   PATCH  /posts/:id      — partial update");
  console.log("   DELETE /posts/:id      — soft delete");
  console.log("   POST   /posts/:id/comments — add comment");
  console.log("   GET    /stats          — aggregation stats\n");
});

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
