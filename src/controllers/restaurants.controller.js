const { ObjectId } = require('mongodb');
const { getDb } = require('../db/mongo.client');

const RestaurantsController = {
  /**
   * Proponer un nuevo restaurante (solo usuarios autenticados)
   */
  async propose(req, res, next) {
    try {
      const db = getDb();
      const { name, description, categoryId, location } = req.body;
      const userId = req.user._id; // tomado del token JWT

      const newRestaurant = {
        name,
        description: description || '',
        categoryId: categoryId ? new ObjectId(categoryId) : null,
        location,
        proposedBy: userId,
        approved: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await db.collection('restaurants').insertOne(newRestaurant);

      res.status(201).json({
        message: 'Restaurante propuesto exitosamente. Esperando aprobación del administrador.',
        restaurantId: result.insertedId
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Listar todos los restaurantes (público)
   */
  async list(req, res, next) {
    try {
      const db = getDb();
      const { category, sort, page = 1, limit = 10 } = req.query;

      const filters = { approved: true };
      if (category) filters.categoryId = new ObjectId(category);

      const sortOptions = {};
      if (sort) sortOptions[sort] = 1; // orden ascendente

      const restaurants = await db
        .collection('restaurants')
        .find(filters)
        .sort(sortOptions)
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .toArray();

      const total = await db.collection('restaurants').countDocuments(filters);

      res.json({
        total,
        page: Number(page),
        limit: Number(limit),
        data: restaurants
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Obtener un restaurante por su ID
   */
  async getById(req, res, next) {
    try {
      const db = getDb();
      const { id } = req.params;

      const restaurant = await db
        .collection('restaurants')
        .findOne({ _id: new ObjectId(id) });

      if (!restaurant) {
        return res.status(404).json({ error: true, message: 'Restaurante no encontrado' });
      }

      res.json(restaurant);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Aprobar un restaurante (solo admin)
   */
  async approve(req, res, next) {
    try {
      const db = getDb();
      const { id } = req.params;

      const result = await db
        .collection('restaurants')
        .updateOne(
          { _id: new ObjectId(id) },
          { $set: { approved: true, updatedAt: new Date() } }
        );

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: true, message: 'Restaurante no encontrado' });
      }

      res.json({ message: 'Restaurante aprobado exitosamente' });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Editar un restaurante (solo admin)
   */
  async update(req, res, next) {
    try {
      const db = getDb();
      const { id } = req.params;
      const updates = { ...req.body, updatedAt: new Date() };

      if (updates.categoryId) {
        updates.categoryId = new ObjectId(updates.categoryId);
      }

      const result = await db
        .collection('restaurants')
        .updateOne(
          { _id: new ObjectId(id) },
          { $set: updates }
        );

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: true, message: 'Restaurante no encontrado' });
      }

      res.json({ message: 'Restaurante actualizado exitosamente' });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Eliminar un restaurante (solo admin)
   */
  async remove(req, res, next) {
    try {
      const db = getDb();
      const { id } = req.params;

      const result = await db
        .collection('restaurants')
        .deleteOne({ _id: new ObjectId(id) });

      if (result.deletedCount === 0) {
        return res.status(404).json({ error: true, message: 'Restaurante no encontrado' });
      }

      res.json({ message: 'Restaurante eliminado exitosamente' });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = RestaurantsController;
