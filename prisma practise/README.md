# Prisma ORM — Zero to Advanced

A complete, runnable practice project covering every Prisma concept with Express.js and PostgreSQL.

---

## Quick Start

```bash
# 1. PostgreSQL start karo (Docker)
docker-compose up -d

# 2. Dependencies install karo
npm install

# 3. Prisma generate karo
npm run db:generate

# 4. Database migrate karo (tables banate hain)
npm run db:migrate

# 5. Seed data dalo
npm run seed

# 6. Express server chalao
npm start
```

Then examples run karo:

```bash
npm run example:basics
npm run example:schema
npm run example:crud
npm run example:relations
npm run example:queries
npm run example:transactions
npm run example:middleware
npm run example:aggregations
npm run example:raw
npm run example:advanced
```

---

## Table of Contents

1. [What is Prisma?](#1-what-is-prisma)
2. [Installation & Setup](#2-installation--setup)
3. [Schema & Data Models](#3-schema--data-models)
4. [Field Types](#4-field-types)
5. [Migrations](#5-migrations)
6. [PrismaClient — Singleton](#6-prismaclient--singleton)
7. [CRUD Operations](#7-crud-operations)
8. [Relations](#8-relations)
9. [Advanced Queries](#9-advanced-queries)
10. [Transactions](#10-transactions)
11. [Middleware & Extensions](#11-middleware--extensions)
12. [Aggregations & GroupBy](#12-aggregations--groupby)
13. [Raw Queries](#13-raw-queries)
14. [Advanced Patterns](#14-advanced-patterns)
15. [Error Handling](#15-error-handling)
16. [Prisma Studio](#16-prisma-studio)
17. [Express REST API Routes](#17-express-rest-api-routes)
18. [Quick Command Reference](#18-quick-command-reference)

---

## 1. What is Prisma?

Prisma ek **next-generation ORM** (Object-Relational Mapper) hai jo Node.js aur TypeScript ke liye bana hai.

### Mongoose vs Sequelize vs Prisma

| Feature | Mongoose | Sequelize | Prisma |
|---------|----------|-----------|--------|
| Database | MongoDB only | SQL (many) | SQL (many) |
| Type Safety | Partial | Partial | Full (TypeScript) |
| Schema | JS code | JS code | Separate `.prisma` file |
| Migrations | Manual | Built-in | Built-in (migration history) |
| Query API | Chainable | Chainable | Object-based |
| Raw Queries | Yes | Yes | Yes |
| Studio GUI | Compass | - | Prisma Studio |

### Prisma ke 3 main components:

1. **Prisma Schema** (`prisma/schema.prisma`) — database ka blueprint
2. **Prisma Client** — type-safe query builder (auto-generated)
3. **Prisma Migrate** — database migrations tool

---

## 2. Installation & Setup

```bash
# New project setup
npm init -y
npm install @prisma/client express dotenv
npm install -D prisma

# Prisma initialize karo
npx prisma init

# Schema likho (prisma/schema.prisma)
# Phir client generate karo
npx prisma generate
```

### .env file

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
```

---

## 3. Schema & Data Models

Prisma schema file (`prisma/schema.prisma`) mein saari model definitions hoti hain.

```prisma
// Generator — Prisma Client generate karta hai
generator client {
  provider = "prisma-client-js"
}

// Datasource — database connection
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Model — ek database table
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  posts     Post[]
  createdAt DateTime @default(now())
}

model Post {
  id       Int    @id @default(autoincrement())
  title    String
  author   User   @relation(fields: [authorId], references: [id])
  authorId Int
}
```

### Model Directives

| Directive | Description |
|-----------|-------------|
| `@id` | Primary key |
| `@default(autoincrement())` | Auto-increment integer |
| `@default(cuid())` | Random CUID string |
| `@default(uuid())` | UUID v4 |
| `@default(now())` | Current timestamp |
| `@unique` | Unique constraint |
| `@updatedAt` | Auto-update on every change |
| `@map("col_name")` | Map to different DB column name |
| `@@map("table_name")` | Map model to different DB table name |
| `@@index([field1, field2])` | Composite index |
| `@@unique([field1, field2])` | Composite unique constraint |

---

## 4. Field Types

```prisma
model Example {
  id        Int       @id @default(autoincrement())
  name      String                    // VARCHAR — required
  bio       String?                   // VARCHAR — optional (nullable)
  age       Int                       // INTEGER
  score     Float                     // FLOAT
  price     Decimal                   // DECIMAL (precise)
  isActive  Boolean   @default(true)  // BOOLEAN
  createdAt DateTime  @default(now()) // TIMESTAMP
  metadata  Json?                     // JSON
  role      Role      @default(USER)  // ENUM
  bigNum    BigInt                    // BIGINT
  data      Bytes                     // BINARY
}

enum Role {
  USER
  ADMIN
  MODERATOR
}
```

### Type Mapping (PostgreSQL)

| Prisma Type | PostgreSQL Type |
|-------------|----------------|
| `String` | `TEXT` / `VARCHAR` |
| `Int` | `INTEGER` |
| `Float` | `DOUBLE PRECISION` |
| `Decimal` | `DECIMAL` |
| `Boolean` | `BOOLEAN` |
| `DateTime` | `TIMESTAMP` |
| `Json` | `JSONB` |
| `BigInt` | `BIGINT` |
| `Bytes` | `BYTEA` |

---

## 5. Migrations

```bash
# Development migration (schema change ke baad)
npx prisma migrate dev --name add_user_table

# Production migration
npx prisma migrate deploy

# Reset database (WARNING: deletes all data!)
npx prisma migrate reset --force

# Check migration status
npx prisma migrate status

# Push schema without migration file (prototyping only)
npx prisma db push
```

### Migration files

```
prisma/
  migrations/
    20240101000000_init/
      migration.sql       ← auto-generated SQL
    20240102000000_add_posts/
      migration.sql
  schema.prisma
```

---

## 6. PrismaClient — Singleton

```js
// src/client.js
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
});

module.exports = prisma;
```

**Singleton pattern kyun?** — Node.js mein require() cached hota hai, is liye ek file se import karo har jagah.

```js
// kisi bhi file mein
const prisma = require("./src/client");
```

---

## 7. CRUD Operations

### Create

```js
// Single record
const user = await prisma.user.create({
  data: {
    email: "alice@example.com",
    username: "alice",
    password: "hashed_pass",
  },
});

// Many records at once
const { count } = await prisma.user.createMany({
  data: [
    { email: "bob@example.com", username: "bob", password: "pass" },
    { email: "charlie@example.com", username: "charlie", password: "pass" },
  ],
  skipDuplicates: true,
});
```

### Read

```js
// By unique field
const user = await prisma.user.findUnique({
  where: { email: "alice@example.com" },
});

// Throws error if not found
const user = await prisma.user.findUniqueOrThrow({
  where: { id: 1 },
});

// First matching record
const user = await prisma.user.findFirst({
  where: { role: "ADMIN" },
  orderBy: { createdAt: "desc" },
});

// All matching records
const users = await prisma.user.findMany({
  where: { isActive: true },
  orderBy: { username: "asc" },
  take: 10,
  skip: 0,
});

// Count
const count = await prisma.user.count({
  where: { role: "USER" },
});
```

### Update

```js
// Single record
const user = await prisma.user.update({
  where: { id: 1 },
  data: { isActive: false },
});

// Increment / Decrement
await prisma.post.update({
  where: { id: 1 },
  data: { viewCount: { increment: 1 } },
  // also: decrement, multiply, divide, set
});

// Many records
const { count } = await prisma.user.updateMany({
  where: { role: "USER" },
  data: { isActive: false },
});
```

### Upsert (Create or Update)

```js
const user = await prisma.user.upsert({
  where: { email: "alice@example.com" },
  update: { username: "alice_updated" },
  create: { email: "alice@example.com", username: "alice", password: "pass" },
});
```

### Delete

```js
// Single
await prisma.user.delete({ where: { id: 1 } });

// Many
const { count } = await prisma.user.deleteMany({
  where: { isActive: false },
});
```

---

## 8. Relations

### 1-to-1 Relation

```prisma
model User {
  id      Int      @id @default(autoincrement())
  profile Profile?
}

model Profile {
  id     Int  @id @default(autoincrement())
  userId Int  @unique
  user   User @relation(fields: [userId], references: [id])
}
```

```js
// Create with nested profile
const user = await prisma.user.create({
  data: {
    email: "alice@example.com",
    username: "alice",
    password: "pass",
    profile: {
      create: { bio: "Full-stack developer" },
    },
  },
  include: { profile: true },
});

// Query with include
const userWithProfile = await prisma.user.findUnique({
  where: { id: 1 },
  include: { profile: true },
});
```

### 1-to-Many Relation

```prisma
model User {
  id    Int    @id @default(autoincrement())
  posts Post[]
}

model Post {
  id       Int  @id @default(autoincrement())
  authorId Int
  author   User @relation(fields: [authorId], references: [id])
}
```

```js
// User with posts
const user = await prisma.user.findUnique({
  where: { id: 1 },
  include: {
    posts: {
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      take: 5,
    },
  },
});

// Count without loading
const user = await prisma.user.findUnique({
  where: { id: 1 },
  include: {
    _count: { select: { posts: true } },
  },
});
```

### Many-to-Many Relation

```prisma
model Post {
  id   Int   @id @default(autoincrement())
  tags Tag[]
}

model Tag {
  id    Int    @id @default(autoincrement())
  name  String @unique
  posts Post[]
}
// Prisma automatically creates a join table _PostToTag
```

```js
// Connect existing tags
await prisma.post.update({
  where: { id: 1 },
  data: {
    tags: {
      connect: [{ id: 1 }, { id: 2 }],
    },
  },
});

// Disconnect
await prisma.post.update({
  where: { id: 1 },
  data: { tags: { disconnect: { id: 1 } } },
});

// Set (replace all)
await prisma.post.update({
  where: { id: 1 },
  data: { tags: { set: [{ id: 2 }, { id: 3 }] } },
});

// connectOrCreate
await prisma.post.update({
  where: { id: 1 },
  data: {
    tags: {
      connectOrCreate: {
        where: { name: "Docker" },
        create: { name: "Docker", color: "#0db7ed" },
      },
    },
  },
});
```

### Self-Referencing Relation

```prisma
model Comment {
  id       Int       @id @default(autoincrement())
  parentId Int?
  parent   Comment?  @relation("Replies", fields: [parentId], references: [id])
  replies  Comment[] @relation("Replies")
}
```

---

## 9. Advanced Queries

### Where Operators

```js
// Comparison
{ viewCount: { gt: 100 } }      // greater than
{ viewCount: { gte: 100 } }     // greater than or equal
{ viewCount: { lt: 100 } }      // less than
{ viewCount: { lte: 100 } }     // less than or equal

// String
{ title: { contains: "prisma", mode: "insensitive" } }
{ title: { startsWith: "Getting" } }
{ title: { endsWith: "Guide" } }

// List
{ role: { in: ["ADMIN", "MODERATOR"] } }
{ role: { notIn: ["USER"] } }

// Null
{ deletedAt: null }              // is null
{ deletedAt: { not: null } }     // is not null
```

### Logical Operators

```js
// AND (implicit — just use object)
{ status: "PUBLISHED", viewCount: { gt: 500 }, deletedAt: null }

// AND (explicit)
{ AND: [{ status: "PUBLISHED" }, { viewCount: { gt: 500 } }] }

// OR
{ OR: [
  { title: { contains: "Prisma" } },
  { title: { contains: "Express" } },
]}

// NOT
{ NOT: { role: "USER" } }
```

### Relation Filters

```js
// some — at least one related record matches
{ posts: { some: { status: "PUBLISHED" } } }

// every — ALL related records match
{ posts: { every: { status: "PUBLISHED" } } }

// none — NO related records match
{ posts: { none: { status: "DRAFT" } } }

// is / isNot (for 1-1 relations)
{ profile: { is: null } }       // has no profile
{ category: { isNot: null } }   // has a category
```

### Ordering & Pagination

```js
// Multi-field orderBy
orderBy: [{ status: "asc" }, { viewCount: "desc" }]

// Order by relation count
orderBy: { comments: { _count: "desc" } }

// Offset pagination
{ take: 10, skip: 20 }  // page 3

// Cursor pagination (better for large tables)
{
  take: 10,
  skip: 1,
  cursor: { id: lastId },
  orderBy: { id: "asc" },
}

// distinct
prisma.post.findMany({
  distinct: ["status"],
  select: { status: true },
})
```

### Select (Field Projection)

```js
// Pick specific fields
select: { id: true, title: true, viewCount: true }

// Nested select
include: {
  author: { select: { username: true, email: true } },
}

// Note: cannot use include and select together at top level
```

---

## 10. Transactions

### Sequential Transaction (Array)

```js
const [count1, count2] = await prisma.$transaction([
  prisma.user.count(),
  prisma.post.count(),
]);
```

### Interactive Transaction (Callback)

```js
const result = await prisma.$transaction(async (tx) => {
  // tx use karo — not prisma
  const post = await tx.post.create({ data: { ... } });
  const comment = await tx.comment.create({ data: { postId: post.id, ... } });

  // Agar koi error aaye to SAB rollback ho jata hai
  return { post, comment };
});
```

### With Options

```js
await prisma.$transaction(async (tx) => {
  // ...
}, {
  maxWait: 5000,           // wait ms before acquiring tx
  timeout: 10000,          // max tx duration
  isolationLevel: "ReadCommitted",
});
```

---

## 11. Middleware & Extensions

### $use Middleware (v4 style)

```js
prisma.$use(async (params, next) => {
  const before = Date.now();
  const result = await next(params);
  console.log(`${params.model}.${params.action} — ${Date.now() - before}ms`);
  return result;
});
```

### $extends — Result (Computed Fields)

```js
const prisma = new PrismaClient().$extends({
  result: {
    user: {
      displayName: {
        needs: { username: true, role: true },
        compute: (user) => `${user.username} [${user.role}]`,
      },
    },
  },
});
```

### $extends — Query (Intercept)

```js
const prisma = new PrismaClient().$extends({
  query: {
    post: {
      async findMany({ args, query }) {
        args.where = { ...args.where, deletedAt: null };  // auto soft-delete filter
        return query(args);
      },
    },
  },
});
```

### $extends — Model (Custom Methods)

```js
const prisma = new PrismaClient().$extends({
  model: {
    user: {
      async findAdmins() {
        return this.findMany({ where: { role: "ADMIN" } });
      },
    },
  },
});

await prisma.user.findAdmins();
```

---

## 12. Aggregations & GroupBy

### count()

```js
const count = await prisma.user.count({ where: { isActive: true } });
```

### aggregate()

```js
const stats = await prisma.post.aggregate({
  where: { status: "PUBLISHED" },
  _count: { id: true },
  _sum:   { viewCount: true },
  _avg:   { viewCount: true },
  _min:   { viewCount: true },
  _max:   { viewCount: true },
});
```

### groupBy()

```js
const byStatus = await prisma.post.groupBy({
  by: ["status"],
  _count: { id: true },
  _sum:   { viewCount: true },
  orderBy: { _count: { id: "desc" } },
});
```

### having (filter after groupBy)

```js
const prolific = await prisma.post.groupBy({
  by: ["authorId"],
  _count: { id: true },
  having: {
    id: { _count: { gt: 2 } },  // only authors with more than 2 posts
  },
});
```

---

## 13. Raw Queries

### $queryRaw (SELECT — returns results)

```js
// Tagged template — auto-parameterized (SQL injection safe!)
const users = await prisma.$queryRaw`
  SELECT id, email FROM users WHERE role = ${role} LIMIT 10
`;
```

### $executeRaw (INSERT/UPDATE/DELETE — returns affected rows)

```js
const affected = await prisma.$executeRaw`
  UPDATE posts SET "viewCount" = "viewCount" + 1
  WHERE status = 'PUBLISHED'
`;
```

### Prisma.sql — composable fragments

```js
const { Prisma } = require("@prisma/client");

const whereClause = status
  ? Prisma.sql`WHERE status = ${status}`
  : Prisma.empty;

const result = await prisma.$queryRaw(
  Prisma.sql`SELECT * FROM posts ${whereClause}`
);
```

### $queryRawUnsafe (⚠️ only for dynamic identifiers)

```js
// ⚠️ Only use when column/table names are dynamic — NEVER with user input!
const col = "viewCount"; // Must be validated against allowlist!
const result = await prisma.$queryRawUnsafe(
  `SELECT "${col}" FROM posts LIMIT 5`
);
```

---

## 14. Advanced Patterns

### Soft Delete

```js
// Soft delete — deletedAt set karo
await prisma.post.update({
  where: { id: 1 },
  data: { deletedAt: new Date() },
});

// Query active records — deletedAt: null
const active = await prisma.post.findMany({
  where: { deletedAt: null },
});

// Query deleted records
const deleted = await prisma.post.findMany({
  where: { deletedAt: { not: null } },
});

// Restore
await prisma.post.update({
  where: { id: 1 },
  data: { deletedAt: null },
});

// Hard delete
await prisma.post.delete({ where: { id: 1 } });
```

### createMany + Batch

```js
const { count } = await prisma.tag.createMany({
  data: [{ name: "Go" }, { name: "Rust" }],
  skipDuplicates: true,
});

const { count } = await prisma.post.updateMany({
  where: { status: "DRAFT" },
  data: { status: "PUBLISHED" },
});

const { count } = await prisma.tag.deleteMany({
  where: { name: { startsWith: "OLD_" } },
});
```

### Optimistic Concurrency

```js
// Version field use karo
model Post {
  id      Int @id @default(autoincrement())
  version Int @default(0)
  title   String
}

// Update sirf tab karo agar version match kare
await prisma.post.updateMany({
  where: { id: 1, version: expectedVersion },
  data: { title: "New Title", version: { increment: 1 } },
});
```

---

## 15. Error Handling

```js
const { PrismaClient, Prisma } = require("@prisma/client");

try {
  await prisma.user.create({ data: { email: "duplicate@example.com", ... } });
} catch (err) {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002": // Unique constraint violation
        console.log("Duplicate field:", err.meta?.target);
        break;
      case "P2025": // Record not found
        console.log("Record not found");
        break;
      case "P2003": // Foreign key constraint
        console.log("FK constraint failed");
        break;
    }
  }
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| `P2000` | Value too long for field |
| `P2001` | Record not found (where condition) |
| `P2002` | Unique constraint failed |
| `P2003` | Foreign key constraint failed |
| `P2004` | Constraint failed on database |
| `P2025` | Record to update/delete not found |
| `P2034` | Transaction conflict (retry needed) |

---

## 16. Prisma Studio

```bash
npx prisma studio
# Opens at http://localhost:5555
```

Prisma Studio ek GUI tool hai jo browser mein khulta hai aur database ke saare tables ko visually browse, create, edit, delete karne deta hai.

---

## 17. Express REST API Routes

Server chalao (`npm start`) aur yeh routes test karo:

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/` | Health check |
| GET | `/users` | All users with profiles |
| GET | `/users/:id` | User with published posts |
| POST | `/users` | Create user + profile |
| GET | `/posts` | Paginated posts (`?page=1&limit=5&search=prisma`) |
| GET | `/posts/:id` | Post with author, tags, nested comments |
| PATCH | `/posts/:id` | Partial update |
| DELETE | `/posts/:id` | Soft delete |
| POST | `/posts/:id/comments` | Add comment |
| GET | `/stats` | Aggregation dashboard |

### Example Requests

```bash
# Get all users
curl http://localhost:3001/users

# Search posts
curl "http://localhost:3001/posts?search=prisma&limit=3"

# Create user
curl -X POST http://localhost:3001/users \
  -H "Content-Type: application/json" \
  -d '{"email":"newuser@test.com","username":"newuser","password":"pass","bio":"Hello!"}'

# Soft delete a post
curl -X DELETE http://localhost:3001/posts/1

# Get stats
curl http://localhost:3001/stats
```

---

## 18. Quick Command Reference

```bash
# ── Prisma CLI ────────────────────────────────────────────────────────────
npx prisma init                        # New Prisma project
npx prisma generate                    # PrismaClient generate karo
npx prisma migrate dev --name init     # Dev migration
npx prisma migrate deploy              # Production migration
npx prisma migrate reset --force       # DB reset (WARNING: deletes data)
npx prisma migrate status              # Migration status
npx prisma db push                     # Schema push (no migration file)
npx prisma db pull                     # Existing DB se schema pull karo
npx prisma studio                      # GUI at http://localhost:5555

# ── npm scripts ───────────────────────────────────────────────────────────
npm start                              # Express server (port 3001)
npm run seed                           # Seed data
npm run db:migrate                     # Create + apply migration
npm run db:studio                      # Open Prisma Studio
npm run db:reset                       # Reset DB
npm run example:basics                 # Run examples
npm run example:schema
npm run example:crud
npm run example:relations
npm run example:queries
npm run example:transactions
npm run example:middleware
npm run example:aggregations
npm run example:raw
npm run example:advanced

# ── Docker ────────────────────────────────────────────────────────────────
docker-compose up -d                   # PostgreSQL start
docker-compose down                    # PostgreSQL stop
docker-compose down -v                 # PostgreSQL stop + volume delete
```

---

## Project Structure

```
prisma practise/
├── package.json              ← scripts and dependencies
├── .env                      ← DATABASE_URL (gitignore this!)
├── .env.example              ← template
├── docker-compose.yml        ← PostgreSQL container
├── README.md                 ← this file
│
├── prisma/
│   ├── schema.prisma         ← all models (User, Post, Profile, Category, Tag, Comment)
│   └── migrations/           ← auto-generated migration SQL files
│
├── src/
│   ├── client.js             ← PrismaClient singleton
│   ├── seed.js               ← seed data (3 users, 8 posts, 5 tags, 11 comments)
│   └── server.js             ← Express REST API
│
└── examples/
    ├── 01-basics.js          ← connect, ping, first query
    ├── 02-schema.js          ← field types, enums, defaults, constraints
    ├── 03-crud.js            ← create/read/update/delete/upsert
    ├── 04-relations.js       ← 1-1, 1-many, many-many, self-referencing
    ├── 05-queries.js         ← where, orderBy, pagination, cursor, distinct
    ├── 06-transactions.js    ← sequential + interactive transactions, rollback
    ├── 07-middleware.js      ← $use + $extends (result/query/model)
    ├── 08-aggregations.js    ← count, aggregate, groupBy, having
    ├── 09-raw-queries.js     ← $queryRaw, $executeRaw, Prisma.sql
    └── 10-advanced.js        ← upsert, soft-delete, batch ops, error codes
```

---

## Schema Models Overview

```
User ──────────────────────────────────────────────────────
│  id, email, username, password, role(enum), isActive
│  createdAt, updatedAt, deletedAt(soft-delete)
│
├── 1-to-1 ──→ Profile (bio, avatar, website, location, meta(JSON))
├── 1-to-many → Post[]
└── 1-to-many → Comment[]

Post ─────────────────────────────────────────────────────
│  id, title, slug, content, excerpt, status(enum)
│  viewCount, publishedAt, createdAt, updatedAt, deletedAt
│
├── many-to-1 → User (author)
├── many-to-1 → Category?
├── many-to-many ↔ Tag[]
└── 1-to-many  → Comment[]

Category: id, name, slug, description
Tag: id, name, color
Comment: id, body, likes, parentId (self-ref replies)
```

---

*Zero to Advanced Prisma — Happy Coding!*
