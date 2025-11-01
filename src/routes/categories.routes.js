const express = require('express');
const { body, param } = require('express-validator');
const { jwtAuth, requireRole } = require('../middlewares/auth.middleware');
const validator = require('../middlewares/validator.middleware');
const CategoriesController = require('../controllers/categories.controller');

const router = express.Router();

router.get('/', CategoriesController.list);
router.post(
  '/',
  jwtAuth,
  requireRole('admin'),
  [body('name').isString().notEmpty()],
  validator,
  CategoriesController.create
);

router.put(
  '/:id',
  jwtAuth,
  requireRole('admin'),
  [param('id').isMongoId(), body('name').isString().notEmpty()],
  validator,
  CategoriesController.update
);

router.delete(
  '/:id',
  jwtAuth,
  requireRole('admin'),
  [param('id').isMongoId()],
  validator,
  CategoriesController.remove
);

module.exports = router;
