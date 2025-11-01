const { getDb } = require('../db/mongo.client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Registro
async function register(req, res, next) {
  try {
    const db = getDb();
    const { nombre, email, password } = req.body;

    // Validar email único
    const existing = await db.collection('users').findOne({ email });
    if (existing) return res.status(400).json({ error: true, message: 'Email already in use' });

    const hashed = await bcrypt.hash(password, 10);

    const result = await db.collection('users').insertOne({
      nombre,
      email,
      password: hashed,
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Construir user manualmente
    const user = {
      _id: result.insertedId,
      nombre,
      email,
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Generar token
    const token = jwt.sign({ id: user._id.toString(), role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.status(201).json({ token: `Bearer ${token}`, user });
  } catch (err) {
    next(err);
  }
}

// Login
async function login(req, res, next) {
  try {
    const db = getDb();
    const { email, password } = req.body;

    const user = await db.collection('users').findOne({ email });
    if (!user) return res.status(400).json({ error: true, message: 'Invalid email or password' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: true, message: 'Invalid email or password' });

    delete user.password;

    const token = jwt.sign({ id: user._id.toString(), role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.json({ token: `Bearer ${token}`, user });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login };
