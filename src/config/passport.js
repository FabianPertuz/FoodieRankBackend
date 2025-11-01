const passport = require('passport');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const { getDb } = require('../db/mongo.client');
const { ObjectId } = require('mongodb');

const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET || 'change_this_secret'
};

passport.use(
  new JwtStrategy(opts, async (payload, done) => {
    try {
      const db = getDb();
      const id = typeof payload.id === 'string' ? new ObjectId(payload.id) : payload.id;

      // Buscar usuario activo
      const user = await db.collection('users').findOne(
        { _id: id },
        { projection: { password: 0 } } // excluir el password directamente desde Mongo
      );

      if (!user) return done(null, false);

      // Reforzar integridad: si el rol cambió en DB, se actualiza automáticamente
      user.role = user.role || payload.role || 'user';

      return done(null, user);
    } catch (err) {
      return done(err, false);
    }
  })
);

module.exports = passport;
