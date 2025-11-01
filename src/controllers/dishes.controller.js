const { getDb } = require('../db/mongo.client');
const { ObjectId } = require('mongodb');

// ==================== CREAR PLATO ====================
async function create(req, res, next) {
  try {
    const db = getDb();
    const restaurantId = new ObjectId(req.params.restaurantId);

    // Verificar si el restaurante existe y está aprobado
    const restaurant = await db.collection('restaurants').findOne({
      _id: restaurantId,
      approved: true
    });

    if (!restaurant) {
      return res.status(404).json({
        error: true,
        message: 'Restaurant not found or not approved'
      });
    }

    const doc = {
      restaurantId,
      name: req.body.name.trim(),
      description: req.body.description?.trim() || '',
      price: req.body.price != null ? Number(req.body.price) : 0,
      createdBy: new ObjectId(req.user._id),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Verificar si ya existe un plato con el mismo nombre en el restaurante
    const exists = await db.collection('dishes').findOne({
      restaurantId,
      name: doc.name
    });
    if (exists) {
      return res.status(409).json({
        error: true,
        message: 'Dish with same name already exists in this restaurant'
      });
    }

    const result = await db.collection('dishes').insertOne(doc);
    doc._id = result.insertedId;

    res.status(201).json({ message: 'Dish created', dish: doc });
  } catch (err) {
    next(err);
  }
}

// ==================== ACTUALIZAR PLATO ====================
async function update(req, res, next) {
  try {
    const db = getDb();
    const id = new ObjectId(req.params.id);

    const dish = await db.collection('dishes').findOne({ _id: id });
    if (!dish)
      return res.status(404).json({ error: true, message: 'Dish not found' });

    const userId = new ObjectId(req.user._id);

    if (!dish.createdBy.equals(userId) && req.user.role !== 'admin') {
      return res.status(403).json({ error: true, message: 'Forbidden' });
    }

    const updateData = {
      ...req.body,
      updatedAt: new Date()
    };

    await db.collection('dishes').updateOne({ _id: id }, { $set: updateData });

    const updated = await db.collection('dishes').findOne({ _id: id });
    res.json({ message: 'Dish updated', dish: updated });
  } catch (err) {
    next(err);
  }
}

// ==================== ELIMINAR PLATO ====================
async function remove(req, res, next) {
  try {
    const db = getDb();
    const id = new ObjectId(req.params.id);

    const dish = await db.collection('dishes').findOne({ _id: id });
    if (!dish)
      return res.status(404).json({ error: true, message: 'Dish not found' });

    const userId = new ObjectId(req.user._id);

    if (!dish.createdBy.equals(userId) && req.user.role !== 'admin') {
      return res.status(403).json({ error: true, message: 'Forbidden' });
    }

    await db.collection('dishes').deleteOne({ _id: id });
    await db.collection('reviews').deleteMany({ resourceType: 'dish', resourceId: id });

    res.json({ message: 'Dish removed' });
  } catch (err) {
    next(err);
  }
}

// ==================== LISTAR PLATOS POR RESTAURANTE ====================
async function listByRestaurant(req, res, next) {
  try {
    const db = getDb();
    const restaurantId = new ObjectId(req.params.restaurantId);

    const dishes = await db.collection('dishes').find({ restaurantId }).toArray();

    res.json({
      count: dishes.length,
      dishes
    });
  } catch (err) {
    next(err);
  }
}

// ==================== LISTAR TODOS LOS PLATOS (PÚBLICO) ====================
async function listAll(req, res, next) {
  try {
    const db = getDb();

    // Filtros opcionales
    const { name, minPrice, maxPrice } = req.query;
    const query = {};

    if (name) query.name = { $regex: name, $options: 'i' };
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    const dishes = await db.collection('dishes').find(query).toArray();

    res.json({
      count: dishes.length,
      filters: { name, minPrice, maxPrice },
      dishes
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { create, update, remove, listByRestaurant, listAll };
