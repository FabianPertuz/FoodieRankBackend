const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = process.env.DB_NAME || 'foodierank';

if (!MONGO_URI) {
  console.error('MONGO_URI not set in env');
  process.exit(1);
}

let client;
let db;

async function connectToMongo() {
  client = new MongoClient(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  await client.connect();
  db = client.db(DB_NAME);

  await db.collection('users').createIndex({ email: 1 }, { unique: true });
  await db.collection('restaurants').createIndex({ name: 1, location: 1 });
  await db.collection('categories').createIndex({ name: 1 }, { unique: true });
  await db.collection('dishes').createIndex({ restaurantId: 1, name: 1 }, { unique: true, partialFilterExpression: { restaurantId: { $exists: true } } });
  console.log(`Connected to MongoDB: ${DB_NAME}`);
}

function getDb() {
  if (!db) throw new Error('Mongo not connected');
  return db;
}

function getClient() {
  if (!client) throw new Error('Mongo client not initialized');
  return client;
}

module.exports = { connectToMongo, getDb, getClient };
