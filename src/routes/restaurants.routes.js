const express = require('express');
const { body, param, query } = require('express-validator');
const validator = require('../middlewares/validator.middleware');
const { jwtAuth, requireRole } = require('../middlewares/auth.middleware');
const RestaurantsController = require('../controllers/restaurants.controller');

const router = express.Router();

/**
 * @route POST /restaurants/propose
 * @desc Permite a un usuario proponer un nuevo restaurante
 * @access Usuario autenticado (user)
 */
router.post(
  '/propose',
  jwtAuth,
  [
    body('name').isString().trim().notEmpty().withMessage('El nombre es obligatorio'),
    body('description').optional().isString().trim(),
    body('categoryId').optional().isMongoId().withMessage('El ID de categoría no es válido'),
    body('location').isString().trim().notEmpty().withMessage('La ubicación es obligatoria')
  ],
  validator,
  RestaurantsController.propose
);

/**
 * @route GET /restaurants
 * @desc Lista pública de restaurantes con filtros y paginación
 * @access Público
 */
router.get(
  '/',
  [
    query('category').optional().isMongoId().withMessage('El ID de categoría no es válido'),
    query('sort').optional().isIn(['name', 'createdAt', 'rating']).withMessage('Campo de orden no válido'),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt()
  ],
  validator,
  RestaurantsController.list
);

/**
 * @route GET /restaurants/:id
 * @desc Obtiene un restaurante por ID
 * @access Público
 */
router.get(
  '/:id',
  [param('id').isMongoId().withMessage('El ID del restaurante no es válido')],
  validator,
  RestaurantsController.getById
);

/**
 * @route PATCH /restaurants/:id/approve
 * @desc Aprueba un restaurante propuesto
 * @access Admin
 */
router.patch(
  '/:id/approve',
  jwtAuth,
  requireRole('admin'),
  [param('id').isMongoId().withMessage('El ID del restaurante no es válido')],
  validator,
  RestaurantsController.approve
);

/**
 * @route PUT /restaurants/:id
 * @desc Edita un restaurante (solo admin)
 * @access Admin
 */
router.put(
  '/:id',
  jwtAuth,
  requireRole('admin'),
  [
    param('id').isMongoId().withMessage('El ID del restaurante no es válido'),
    body('name').optional().isString().trim(),
    body('description').optional().isString().trim(),
    body('categoryId').optional().isMongoId(),
    body('location').optional().isString().trim(),
    body('approved').optional().isBoolean()
  ],
  validator,
  RestaurantsController.update
);

/**
 * @route DELETE /restaurants/:id
 * @desc Elimina un restaurante (solo admin)
 * @access Admin
 */
router.delete(
  '/:id',
  jwtAuth,
  requireRole('admin'),
  [param('id').isMongoId().withMessage('El ID del restaurante no es válido')],
  validator,
  RestaurantsController.remove
);

module.exports = router;
