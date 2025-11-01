const express = require('express');
const { body } = require('express-validator');
const validator = require('../middlewares/validator.middleware');
const AuthController = require('../controllers/auth.controller');

const router = express.Router();

// Registro
router.post(
  '/register',
  [
    body('nombre').notEmpty().withMessage('Nombre is required'),
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 chars')
  ],
  validator,
  AuthController.register
);

// Login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  validator,
  AuthController.login
);

module.exports = router;
