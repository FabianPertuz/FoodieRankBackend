const express = require('express');
const { body, param } = require('express-validator');
const validator = require('../middlewares/validator.middleware');
const { jwtAuth } = require('../middlewares/auth.middleware');
const DishesController = require('../controllers/dishes.controller');

const router = express.Router();

/**
 * @route POST /api/v1/dishes/:restaurantId
 * @desc Crear un nuevo plato (solo usuario autenticado)
 */
router.post(
  '/:restaurantId',
  jwtAuth,
  [
    param('restaurantId').isMongoId(),
    body('name').isString().notEmpty(),
    body('description').optional().isString(),
    body('price').isFloat({ min: 0 }).withMessage('El precio debe ser un número mayor o igual a 0')
  ],
  validator,
  DishesController.create
);

/**
 * @route GET /api/v1/dishes
 * @desc Obtener todos los platos (público)
 */
router.get('/', DishesController.listAll);

/**
 * @route GET /api/v1/dishes/restaurant/:restaurantId
 * @desc Obtener todos los platos de un restaurante específico (público)
 */
router.get(
  '/restaurant/:restaurantId',
  [param('restaurantId').isMongoId()],
  validator,
  DishesController.listByRestaurant
);

/**
 * @route PATCH /api/v1/dishes/:id
 * @desc Actualizar un plato (solo usuario autenticado)
 */
router.patch(
  '/:id',
  jwtAuth,
  [
    param('id').isMongoId(),
    body('name').optional().isString(),
    body('description').optional().isString(),
    body('price').optional().isFloat({ min: 0 })
  ],
  validator,
  DishesController.update
);

/**
 * @route DELETE /api/v1/dishes/:id
 * @desc Eliminar un plato (solo usuario autenticado)
 */
router.delete(
  '/:id',
  jwtAuth,
  [param('id').isMongoId()],
  validator,
  DishesController.remove
);

module.exports = router;
