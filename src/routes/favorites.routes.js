// src/routes/favorites.routes.js
const express = require('express');
const { body, param } = require('express-validator');
const validator = require('../middlewares/validator.middleware');
const { jwtAuth } = require('../middlewares/auth.middleware');
const FavoritesController = require('../controllers/favorites.controller');

const router = express.Router();

// GET /api/v1/favorites  -> lista favoritos del user (auth)
router.get('/', jwtAuth, FavoritesController.list);

// POST /api/v1/favorites  -> agregar favorito
router.post(
  '/',
  jwtAuth,
  [
    body('resourceType').isIn(['restaurant','dish']),
    body('resourceId').isMongoId()
  ],
  validator,
  FavoritesController.add
);

// DELETE /api/v1/favorites/:id -> eliminar favorito
router.delete(
  '/:id',
  jwtAuth,
  [ param('id').isMongoId() ],
  validator,
  FavoritesController.remove
);

module.exports = router;
