const { getDb } = require('../db/mongo.client');
const { ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// ==================== REGISTER ====================
async function register(req, res, next) {
  try {
    const db = getDb();
    const { nombre, email, password } = req.body;

    const exists = await db.collection('users').findOne({ email });
    if (exists) return res.status(400).json({ error: true, message: 'Usuario ya existe' });

    // 🚫 Ignorar cualquier intento de enviar role desde el body
    const finalRole = 'user';
    const hash = await bcrypt.hash(password, 10);

    const result = await db.collection('users').insertOne({
      nombre,
      email,
      password: hash,
      role: finalRole,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Generar token
    const token = jwt.sign(
      { id: result.insertedId.toString(), role: finalRole },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );

    res.status(201).json({
      msg: `Usuario registrado correctamente como ${finalRole}`,
      token: `Bearer ${token}`,
      userId: result.insertedId
    });
  } catch (err) {
    next(err);
  }
}

// ==================== LOGIN ====================
async function login(req, res, next) {
  try {
    const db = getDb();
    const { email, password } = req.body;

    const user = await db.collection('users').findOne({ email });
    if (!user) return res.status(400).json({ error: true, message: 'Usuario no encontrado' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: true, message: 'Password incorrecto' });

    const token = jwt.sign(
      { id: user._id.toString(), role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );

    res.json({ token: `Bearer ${token}` });
  } catch (err) {
    next(err);
  }
}

// ==================== ME ====================
async function me(req, res, next) {
  try {
    const db = getDb();
    const userId = new ObjectId(req.user._id);

    const user = await db.collection('users').findOne(
      { _id: userId },
      { projection: { password: 0 } }
    );

    if (!user) return res.status(404).json({ error: true, message: 'Usuario no encontrado' });
    res.json(user);
  } catch (err) {
    next(err);
  }
}

// ==================== CHANGE ROLE (solo admin) ====================
async function changeRole(req, res, next) {
  try {
    const db = getDb();
    const id = new ObjectId(req.params.id);
    const { role } = req.body;

    // ✅ Solo admins pueden cambiar roles
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: true, message: 'Solo los administradores pueden cambiar roles' });
    }

    // Validar rol permitido
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: true, message: 'Rol inválido' });
    }

    await db.collection('users').updateOne(
      { _id: id },
      { $set: { role, updatedAt: new Date() } }
    );

    const user = await db.collection('users').findOne(
      { _id: id },
      { projection: { password: 0 } }
    );

    if (!user) return res.status(404).json({ error: true, message: 'Usuario no encontrado' });

    res.json({ message: 'Rol actualizado correctamente', user: { _id: user._id, role: user.role } });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, me, changeRole };
