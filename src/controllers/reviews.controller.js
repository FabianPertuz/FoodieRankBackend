const { getDb, getClient } = require('../db/mongo.client');
const { ObjectId } = require('mongodb');
const rankingUtil = require('../utils/ranking.util');
const fs = require('fs');
const path = require('path');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const reviewsData = require('../data/reviews.json');
const restaurantData = require('../data/restaurant.json');


// ==================== CREAR RESEÑA ====================
async function create(req, res, next) {
  const client = getClient();
  const session = client.startSession();

  try {
    const db = getDb();
    const { resourceType, resourceId, rating, comment } = req.body;
    const resourceObjectId = new ObjectId(resourceId);
    const now = new Date();

    // Validar tipo de recurso
    if (!['restaurant', 'dish'].includes(resourceType)) {
      return res.status(400).json({ error: true, message: 'Invalid resource type' });
    }

    // Validar existencia del recurso
    const collectionName = resourceType === 'restaurant' ? 'restaurants' : 'dishes';
    const resource = await db.collection(collectionName).findOne(
      resourceType === 'restaurant'
        ? { _id: resourceObjectId, approved: true }
        : { _id: resourceObjectId }
    );
    if (!resource)
      return res.status(404).json({ error: true, message: `${resourceType} not found or not approved` });

    // Evitar reseñas duplicadas por usuario
    const existing = await db.collection('reviews').findOne({
      resourceType,
      resourceId: resourceObjectId,
      author: new ObjectId(req.user._id)
    });
    if (existing)
      return res.status(409).json({ error: true, message: 'You already reviewed this resource' });

    let resultReview;
    await session.withTransaction(async () => {
      const reviewDoc = {
        resourceType,
        resourceId: resourceObjectId,
        rating: Number(rating),
        comment: comment?.trim() || '',
        author: new ObjectId(req.user._id),
        likes: 0,
        dislikes: 0,
        createdAt: now,
        updatedAt: now
      };

      const r = await db.collection('reviews').insertOne(reviewDoc, { session });
      reviewDoc._id = r.insertedId;
      resultReview = reviewDoc;

      // Actualizar rating agregado
      await db.collection(collectionName).updateOne(
        { _id: resourceObjectId },
        { $inc: { ratingCount: 1, ratingSum: rating }, $set: { updatedAt: now } },
        { session }
      );

      // Actualizar ranking solo si es restaurante
      if (resourceType === 'restaurant') {
        const restaurant = await db.collection('restaurants').findOne({ _id: resourceObjectId }, { session });
        const newScore = rankingUtil.computeScore(restaurant);
        await db.collection('restaurants').updateOne(
          { _id: resourceObjectId },
          { $set: { rankingScore: newScore } },
          { session }
        );
      }
    });

    res.status(201).json({ message: 'Review created', review: resultReview });
  } catch (err) {
    next(err);
  } finally {
    await session.endSession();
  }
}

// ==================== ACTUALIZAR RESEÑA ====================
async function update(req, res, next) {
  try {
    const db = getDb();
    const id = new ObjectId(req.params.id);
    const review = await db.collection('reviews').findOne({ _id: id });
    if (!review) return res.status(404).json({ error: true, message: 'Review not found' });

    const userId = new ObjectId(req.user._id);
    if (!review.author.equals(userId) && req.user.role !== 'admin')
      return res.status(403).json({ error: true, message: 'Forbidden' });

    const updateData = { updatedAt: new Date() };
    if (req.body.rating) updateData.rating = Number(req.body.rating);
    if (req.body.comment) updateData.comment = req.body.comment.trim();

    const diff = req.body.rating ? req.body.rating - review.rating : 0;
    await db.collection('reviews').updateOne({ _id: id }, { $set: updateData });

    if (diff !== 0) {
      const collection = review.resourceType === 'restaurant' ? 'restaurants' : 'dishes';
      await db.collection(collection).updateOne(
        { _id: review.resourceId },
        { $inc: { ratingSum: diff }, $set: { updatedAt: new Date() } }
      );
    }

    res.json({ message: 'Review updated' });
  } catch (err) {
    next(err);
  }
}

// ==================== ELIMINAR RESEÑA ====================
async function remove(req, res, next) {
  const client = getClient();
  const session = client.startSession();

  try {
    const db = getDb();
    const id = new ObjectId(req.params.id);
    const review = await db.collection('reviews').findOne({ _id: id });
    if (!review) return res.status(404).json({ error: true, message: 'Review not found' });

    const userId = new ObjectId(req.user._id);
    if (!review.author.equals(userId) && req.user.role !== 'admin')
      return res.status(403).json({ error: true, message: 'Forbidden' });

    await session.withTransaction(async () => {
      await db.collection('reviews').deleteOne({ _id: id }, { session });

      const collection = review.resourceType === 'restaurant' ? 'restaurants' : 'dishes';
      await db.collection(collection).updateOne(
        { _id: review.resourceId },
        { $inc: { ratingCount: -1, ratingSum: -review.rating }, $set: { updatedAt: new Date() } },
        { session }
      );

      if (review.resourceType === 'restaurant') {
        const restaurant = await db.collection('restaurants').findOne({ _id: review.resourceId }, { session });
        const newScore = rankingUtil.computeScore(restaurant);
        await db.collection('restaurants').updateOne(
          { _id: review.resourceId },
          { $set: { rankingScore: newScore } },
          { session }
        );
      }
    });

    res.json({ message: 'Review removed' });
  } catch (err) {
    next(err);
  } finally {
    await session.endSession();
  }
}

// ==================== REACCIONAR (LIKE / DISLIKE / REMOVE) ====================
async function react(req, res, next) {
  const client = getClient();
  const session = client.startSession();

  try {
    const db = getDb();
    const reviewId = new ObjectId(req.params.id);
    const { type } = req.body; // 'like' | 'dislike' | 'remove'

    const review = await db.collection('reviews').findOne({ _id: reviewId });
    if (!review) return res.status(404).json({ error: true, message: 'Review not found' });

    const userId = new ObjectId(req.user._id);
    if (review.author.equals(userId))
      return res.status(403).json({ error: true, message: 'Cannot react to your own review' });

    await session.withTransaction(async () => {
      const reactionsCol = db.collection('reactions');
      const existing = await reactionsCol.findOne({ reviewId, userId }, { session });

      if (type === 'remove') {
        if (existing) {
          const field = existing.type === 'like' ? 'likes' : 'dislikes';
          await db.collection('reviews').updateOne({ _id: reviewId }, { $inc: { [field]: -1 } }, { session });
          await reactionsCol.deleteOne({ _id: existing._id }, { session });
        }
        return;
      }

      if (!existing) {
        await reactionsCol.insertOne({ reviewId, userId, type, createdAt: new Date() }, { session });
        await db.collection('reviews').updateOne(
          { _id: reviewId },
          { $inc: { [type === 'like' ? 'likes' : 'dislikes']: 1 } },
          { session }
        );
      } else if (existing.type !== type) {
        await reactionsCol.updateOne({ _id: existing._id }, { $set: { type, updatedAt: new Date() } }, { session });
        await db.collection('reviews').updateOne(
          { _id: reviewId },
          {
            $inc: type === 'like' ? { likes: 1, dislikes: -1 } : { likes: -1, dislikes: 1 }
          },
          { session }
        );
      }
    });

    res.json({ message: 'Reaction processed' });
  } catch (err) {
    next(err);
  } finally {
    await session.endSession();
  }
}

// ==================== LISTAR RESEÑAS POR RECURSO ====================
async function listByResource(req, res, next) {
  try {
    const db = getDb();
    const { resourceType, resourceId } = req.params;
    const resourceObjectId = new ObjectId(resourceId);

    const reviews = await db
      .collection('reviews')
      .find({ resourceType, resourceId: resourceObjectId })
      .sort({ createdAt: -1 })
      .toArray();

    res.json({ count: reviews.length, reviews });
  } catch (err) {
    next(err);
  }
}

async function exportReviewsCSV(req, res) {
  try {
    const db = getDb();
    const { resourceId } = req.params;
    const resourceObjectId= new ObjectId(resourceId)
    const restaurante = await db
     .collection('restaurants')
     .find({ resourceId: resourceObjectId})
    ;
    if (!restaurante) {
      return res.status(404).json({ error: 'Restaurante no encontrado' });
    }
  
    const reseñasRestaurante = reviewsData.filter(r => r.resourceId === parseInt(resourceId));

    if (reseñasRestaurante.length === 0) {
      return res.status(404).json({ error: 'No hay reseñas para este restaurante' });
    }  const exportDir = path.join(__dirname, '../exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir);
    }

    const fileName = `reviews_restaurante_${resourceId}.csv`;
    const filePath = path.join(exportDir, filename)
    const csvWriter = createCsvWriter({
      path: filePath,
      header: [
        { id: 'comentario', title: 'Comentario' },
        { id: 'calificacion', title: 'Calificación' },
        { id: 'autor', title: 'Autor' },
        { id: 'fecha', title: 'Fecha' },
      ]
    });
    await csvWriter.writeRecords(reseñasRestaurante);

    res.json({
      message: 'Archivo CSV generado exitosamente',
      archivo: `/exports/${fileName}`
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al generar el archivo CSV' })
    console.log(error);
  }
}; 

module.exports = { create, update, remove, react, listByResource, exportReviewsCSV }