const UserModel = require('../models/user.model');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

exports.getAll = asyncHandler(async (req, res) => {
  const users = UserModel.findAll();
  res.json({ success: true, count: users.length, users });
});

exports.getOne = asyncHandler(async (req, res, next) => {
  const user = UserModel.findById(req.params.id);
  if (!user) return next(new AppError('User not found', 404));
  const { password, ...safeUser } = user;
  res.json({ success: true, user: safeUser });
});

exports.update = asyncHandler(async (req, res, next) => {
  const updated = UserModel.update(req.params.id, req.body);
  if (!updated) return next(new AppError('User not found', 404));
  res.json({ success: true, user: updated });
});

exports.remove = asyncHandler(async (req, res, next) => {
  const deleted = UserModel.delete(req.params.id);
  if (!deleted) return next(new AppError('User not found', 404));
  res.json({ success: true, message: 'User deleted', user: deleted });
});
