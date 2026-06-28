/**
 * 02 — Schema & Field Types
 * -------------------------
 * - Prisma schema file ka overview
 * - Field types: String, Int, Boolean, DateTime, Enum, Json, Float
 * - @id, @default, @unique, @updatedAt, @map, @@map
 * - Optional fields (?) vs required fields
 * - Enum usage
 * - JSON fields
 * - Model introspection
 */

require("dotenv").config();
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("=".repeat(60));
  console.log("02 — SCHEMA & FIELD TYPES");
  console.log("=".repeat(60));

  // ── 1. Field types via reading existing data ───────────────────────────────
  console.log("\n📌 Reading User — shows String, Enum, Boolean, DateTime fields:");
  const user = await prisma.user.findFirst({ include: { profile: true } });
  console.log({
    id: user.id,              // Int (@id @default(autoincrement()))
    email: user.email,        // String (@unique)
    role: user.role,          // Enum (Role: USER | ADMIN | MODERATOR)
    isActive: user.isActive,  // Boolean (@default(true))
    createdAt: user.createdAt,// DateTime (@default(now()))
    updatedAt: user.updatedAt,// DateTime (@updatedAt — auto set on every update)
    deletedAt: user.deletedAt,// DateTime? (optional — null means not deleted)
  });

  // ── 2. Enum values ────────────────────────────────────────────────────────
  console.log("\n📌 Enum — Role field values:");
  const usersByRole = await prisma.user.groupBy({
    by: ["role"],
    _count: true,
  });
  usersByRole.forEach((r) => console.log(`   ${r.role}: ${r._count} user(s)`));

  console.log("\n📌 Enum — PostStatus field values:");
  const postsByStatus = await prisma.post.groupBy({
    by: ["status"],
    _count: true,
  });
  postsByStatus.forEach((p) => console.log(`   ${p.status}: ${p._count} post(s)`));

  // ── 3. Optional fields ────────────────────────────────────────────────────
  console.log("\n📌 Optional fields (?) — null when not provided:");
  const profile = await prisma.profile.findFirst();
  console.log({
    bio: profile.bio,         // String? — may be null
    avatar: profile.avatar,   // String? — may be null
    website: profile.website, // String? — may be null
    location: profile.location,
    birthDate: profile.birthDate, // DateTime? — may be null
    meta: profile.meta,       // Json? — may be null
  });

  // ── 4. JSON field ─────────────────────────────────────────────────────────
  console.log("\n📌 Json field — profile.meta:");
  const profileWithMeta = await prisma.profile.findFirst({
    where: { meta: { not: null } },
  });
  if (profileWithMeta?.meta) {
    console.log("   Stored JSON:", profileWithMeta.meta);
    console.log("   Access key :", profileWithMeta.meta.github || profileWithMeta.meta.twitter);
  }

  // ── 5. @unique constraint ─────────────────────────────────────────────────
  console.log("\n📌 @unique — trying to create duplicate email (should fail):");
  try {
    await prisma.user.create({
      data: {
        email: "alice@example.com",  // already exists
        username: "alice_duplicate",
        password: "pass123",
      },
    });
  } catch (err) {
    console.log("   Error code:", err.code);      // P2002
    console.log("   Field     :", err.meta?.target);
    console.log("   Message   :", "Unique constraint failed — duplicate email");
  }

  // ── 6. @default values ────────────────────────────────────────────────────
  console.log("\n📌 @default — creating user with only required fields:");
  const minUser = await prisma.user.create({
    data: {
      email: `schema_test_${Date.now()}@example.com`,
      username: `schema_user_${Date.now()}`,
      password: "pass",
    },
  });
  console.log({
    role: minUser.role,       // defaults to "USER"
    isActive: minUser.isActive, // defaults to true
    deletedAt: minUser.deletedAt, // defaults to null
    createdAt: minUser.createdAt, // auto-set by @default(now())
  });
  // Cleanup
  await prisma.user.delete({ where: { id: minUser.id } });

  // ── 7. @@index usage ──────────────────────────────────────────────────────
  console.log("\n📌 @@index — query on indexed field (fast lookup):");
  const publishedPosts = await prisma.post.findMany({
    where: { status: "PUBLISHED" },  // status field has @@index
    select: { id: true, title: true, status: true },
    take: 3,
  });
  publishedPosts.forEach((p) => console.log(`   [${p.status}] ${p.title}`));

  // ── 8. @map / @@map — Prisma field vs actual DB column ───────────────────
  console.log("\n📌 @@map — Prisma model name vs DB table name:");
  console.log("   Prisma model 'User'    → DB table 'users'    (@@map(\"users\"))");
  console.log("   Prisma model 'Post'    → DB table 'posts'    (@@map(\"posts\"))");
  console.log("   Prisma model 'Profile' → DB table 'profiles' (@@map(\"profiles\"))");

  const tableCheck = await prisma.$queryRaw`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name IN ('users','posts','profiles','tags','categories','comments')
    ORDER BY table_name
  `;
  console.log("   Actual DB tables:", tableCheck.map((t) => t.table_name));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
