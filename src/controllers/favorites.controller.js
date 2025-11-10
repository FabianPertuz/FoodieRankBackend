// src/controllers/favorites.controller.js
const { getDb } = require('../db/mongo.client');
const { ObjectId } = require('mongodb');

async function list(req, res, next) {
  try {
    const db = getDb();
    const userId = typeof req.user._id === 'string' ? new ObjectId(req.user._id) : req.user._id;

    const favs = await db.collection('favorites').find({ userId }).toArray();
    // populate minimal resource info (restaurant or dish)
    const results = await Promise.all(favs.map(async f => {
      const col = f.resourceType === 'restaurant' ? 'restaurants' : 'dishes';
      const resource = await db.collection(col).findOne({ _id: f.resourceId }, { projection: { name: 1, description: 1, image: 1 }});
      return { _id: f._id, resourceType: f.resourceType, resource: resource || null, createdAt: f.createdAt };
    }));

    res.json(results);
  } catch (err) {
    next(err);
  }
}

async function add(req, res, next) {
  try {
    const db = getDb();
    const { resourceType, resourceId } = req.body;

    if (!['restaurant', 'dish'].includes(resourceType)) {
      return res.status(400).json({ error: true, message: 'Invalid resourceType' });
    }

    const resourceObjectId = new ObjectId(resourceId);
    const col = resourceType === 'restaurant' ? 'restaurants' : 'dishes';

    // resource existence check
    const resource = await db.collection(col).findOne({ _id: resourceObjectId });
    if (!resource) return res.status(404).json({ error: true, message: `${resourceType} not found` });

    const userId = typeof req.user._id === 'string' ? new ObjectId(req.user._id) : req.user._id;

    // avoid duplicates
    const existing = await db.collection('favorites').findOne({ userId, resourceType, resourceId: resourceObjectId });
    if (existing) return res.status(409).json({ error: true, message: 'Already favorited' });

    const doc = { userId, resourceType, resourceId: resourceObjectId, createdAt: new Date() };
    const r = await db.collection('favorites').insertOne(doc);
    doc._id = r.insertedId;

    res.status(201).json({ message: 'Added to favorites', favorite: doc });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const db = getDb();
    const favId = typeof req.params.id === 'string' ? new ObjectId(req.params.id) : req.params.id;
    const userId = typeof req.user._id === 'string' ? new ObjectId(req.user._id) : req.user._id;

    const r = await db.collection('favorites').findOneAndDelete({ _id: favId, userId });
    if (!r.value) return res.status(404).json({ error: true, message: 'Favorite not found' });

    res.json({ message: 'Favorite removed' });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, add, remove };
