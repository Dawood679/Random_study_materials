const router = require('express').Router();
const { getAll, getOne, update, remove } = require('../controllers/user.controller');
const { protect, restrictTo } = require('../middleware/auth');

// All user routes require authentication
router.use(protect);

router.get('/', restrictTo('admin'), getAll);
router.get('/:id', getOne);
router.patch('/:id', update);
router.delete('/:id', restrictTo('admin'), remove);

module.exports = router;
