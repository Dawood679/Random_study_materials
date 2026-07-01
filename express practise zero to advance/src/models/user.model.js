// In-memory user store — replace with a real DB (Mongoose/Prisma) in production
const bcrypt = require('bcryptjs');

const users = [];
let nextId = 1;

const UserModel = {
  findAll() {
    return users.map(({ password, ...u }) => u);
  },

  findById(id) {
    return users.find((u) => u.id === Number(id)) || null;
  },

  findByEmail(email) {
    return users.find((u) => u.email === email) || null;
  },

  async create({ name, email, password, role = 'user' }) {
    const hashed = await bcrypt.hash(password, 12);
    const user = { id: nextId++, name, email, password: hashed, role, createdAt: new Date() };
    users.push(user);
    const { password: _, ...safeUser } = user;
    return safeUser;
  },

  update(id, fields) {
    const user = users.find((u) => u.id === Number(id));
    if (!user) return null;
    const allowed = ['name', 'email'];
    allowed.forEach((f) => { if (fields[f] !== undefined) user[f] = fields[f]; });
    const { password, ...safeUser } = user;
    return safeUser;
  },

  delete(id) {
    const index = users.findIndex((u) => u.id === Number(id));
    if (index === -1) return null;
    const [deleted] = users.splice(index, 1);
    const { password, ...safeUser } = deleted;
    return safeUser;
  },

  async comparePassword(plaintext, hash) {
    return bcrypt.compare(plaintext, hash);
  },
};

module.exports = UserModel;
