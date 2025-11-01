const { body, param } = require('express-validator');
const { jwtAuth, requireRole } = require('../middlewares/auth.middleware');
const validator = require('../middlewares/validator.middleware');
const UsersController = require('../controllers/users.controller');

const router = require('express').Router();

// ==================== REGISTRO ====================
router.post(
  '/register',
  [
    body('nombre').notEmpty().withMessage('El nombre es obligatorio'),
    body('email').isEmail().withMessage('Debe ser un email válido'),
    body('password').isLength({ min: 6 }).withMessage('El password debe tener al menos 6 caracteres'),
  ],
  validator,
  UsersController.register
);

// ==================== LOGIN ====================
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Debe ser un email válido'),
    body('password').notEmpty().withMessage('El password es obligatorio'),
  ],
  validator,
  UsersController.login
);

// ==================== PERFIL (PROTEGIDO) ====================
router.get('/me', jwtAuth, UsersController.me);

// ==================== CAMBIAR ROL (SOLO ADMIN) ====================
router.patch(
  '/:id/role',
  jwtAuth,
  requireRole('admin'), // 🔒 Solo admin puede acceder
  [
    param('id').isMongoId().withMessage('ID inválido'),
    body('role').isIn(['user', 'admin']).withMessage('Rol inválido'),
  ],
  validator,
  UsersController.changeRole
);

module.exports = router;
