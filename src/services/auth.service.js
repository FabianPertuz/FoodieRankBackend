const bcrypt = require('bcrypt');
const { getDb } = require('../db/mongo.client');
const { signToken } = require('../utils/jwt.util');
const { ObjectId } = require('mongodb');

const SALT_ROUNDS = 10;

async function register({ name, email, password }) {
  const db = getDb();
  const users = db.collection('users');

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  const now = new Date();
  const doc = {
    name,
    email: email.toLowerCase(),
    password: hashed,
    role: 'user',
    createdAt: now,
    updatedAt: now
  };

  try {
    const r = await users.insertOne(doc);
    doc._id = r.insertedId;
    delete doc.password;
    return doc;
  } catch (err) {
    if (err.code === 11000) {
      const e = new Error('Email already registered');
      e.status = 409;
      throw e;
    }
    throw err;
  }
}

async function login(email, password) {
  const db = getDb();
  const users = db.collection('users');
  const user = await users.findOne({ email: email.toLowerCase() });
  if (!user) {
    const e = new Error('Invalid credentials');
    e.status = 401;
    throw e;
  }
  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    const e = new Error('Invalid credentials');
    e.status = 401;
    throw e;
  }
  const token = signToken(user);
  delete user.password;
  return { token, user: { _id: user._id, email: user.email, name: user.name, role: user.role } };
}

module.exports = { register, login };
