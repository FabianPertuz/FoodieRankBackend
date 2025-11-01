const express = require('express');
const { body, param } = require('express-validator');
const validator = require('../middlewares/validator.middleware');
const { jwtAuth } = require('../middlewares/auth.middleware');
const ReviewsController = require('../controllers/reviews.controller');

const router = express.Router();

/**
 * @route POST /api/v1/reviews
 * @desc Crear reseña (solo usuarios autenticados)
 * @body { resourceType: 'restaurant' | 'dish', resourceId, rating, comment }
 */
router.post(
  '/',
  jwtAuth,
  [
    body('resourceType').isIn(['restaurant', 'dish']),
    body('resourceId').isMongoId(),
    body('rating').isInt({ min: 1, max: 5 }),
    body('comment').optional().isString()
  ],
  validator,
  ReviewsController.create
);

/**
 * @route PATCH /api/v1/reviews/:id
 * @desc Actualizar reseña (solo el autor o admin)
 */
router.patch(
  '/:id',
  jwtAuth,
  [
    param('id').isMongoId(),
    body('rating').optional().isInt({ min: 1, max: 5 }),
    body('comment').optional().isString()
  ],
  validator,
  ReviewsController.update
);

/**
 * @route DELETE /api/v1/reviews/:id
 * @desc Eliminar reseña (solo el autor o admin)
 */
router.delete(
  '/:id',
  jwtAuth,
  [param('id').isMongoId()],
  validator,
  ReviewsController.remove
);

/**
 * @route POST /api/v1/reviews/:id/react
 * @desc Reaccionar (like/dislike/remove) - solo usuarios autenticados
 * @body { type: 'like' | 'dislike' | 'remove' }
 */
router.post(
  '/:id/react',
  jwtAuth,
  [
    param('id').isMongoId(),
    body('type').isIn(['like', 'dislike', 'remove'])
  ],
  validator,
  ReviewsController.react
);

/**
 * @route GET /api/v1/reviews/:resourceType/:resourceId
 * @desc Listar reseñas de un restaurante o plato (público)
 */
router.get(
  '/:resourceType/:resourceId',
  [
    param('resourceType').isIn(['restaurant', 'dish']),
    param('resourceId').isMongoId()
  ],
  validator,
  ReviewsController.listByResource
);

module.exports = router;
