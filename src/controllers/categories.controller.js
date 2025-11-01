const { getDb } = require('../db/mongo.client');
const { ObjectId } = require('mongodb');

async function list(req, res, next) {
  try {
    const db = getDb();
    const items = await db.collection('categories').find().toArray();
    res.json(items);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const db = getDb();
    const { name, description } = req.body;

    const doc = {
      name: name.trim(),
      description: description || '',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const r = await db.collection('categories').insertOne(doc);
    res.status(201).json({ message: 'Category created', category: { _id: r.insertedId, ...doc } });
  } catch (err) {
    if (err.code === 11000) {
      const e = new Error('Category already exists');
      e.status = 409;
      return next(e);
    }
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const db = getDb();
    const id = new ObjectId(req.params.id);

    // Hacer update
    await db.collection('categories').updateOne(
      { _id: id },
      { $set: { name: req.body.name, description: req.body.description || '', updatedAt: new Date() } }
    );

    // Traer el documento actualizado
    const category = await db.collection('categories').findOne({ _id: id });
    if (!category) return res.status(404).json({ error: true, message: 'Not found' });

    res.json({ message: 'Category updated', category });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const db = getDb();
    const id = new ObjectId(req.params.id);

    const r = await db.collection('categories').findOneAndDelete({ _id: id });
    if (!r.value) return res.status(404).json({ error: true, message: 'Not found' });

    // reasignar restaurantes a "Sin categoría"
    await db.collection('restaurants').updateMany(
      { categoryId: id },
      { $unset: { categoryId: "" }, $set: { categoryName: 'Sin categoría' }}
    );

    res.json({ message: 'Category deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create, update, remove };
