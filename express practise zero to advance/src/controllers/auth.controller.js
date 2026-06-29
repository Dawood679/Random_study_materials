const jwt = require('jsonwebtoken');
const UserModel = require('../models/user.model');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const signToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password)
    return next(new AppError('name, email, and password are required', 400));

  if (UserModel.findByEmail(email))
    return next(new AppError('Email already registered', 409));

  const user = await UserModel.create({ name, email, password, role });
  const token = signToken(user);

  res.status(201).json({ success: true, token, user });
});

exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) return next(new AppError('email and password required', 400));

  const user = UserModel.findByEmail(email);
  if (!user) return next(new AppError('Invalid credentials', 401));

  const isMatch = await UserModel.comparePassword(password, user.password);
  if (!isMatch) return next(new AppError('Invalid credentials', 401));

  const { password: _, ...safeUser } = user;
  const token = signToken(safeUser);

  res.json({ success: true, token, user: safeUser });
});

exports.me = asyncHandler(async (req, res) => {
  const user = UserModel.findById(req.user.id);
  if (!user) throw new AppError('User not found', 404);
  const { password, ...safeUser } = user;
  res.json({ success: true, user: safeUser });
});
