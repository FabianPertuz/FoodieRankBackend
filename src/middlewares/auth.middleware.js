const passport = require('passport');

function jwtAuth(req, res, next) {
  return passport.authenticate('jwt', { session: false }, (err, user) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ error: true, message: 'No autorizado' });
    req.user = user;
    next();
  })(req, res, next);
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: true, message: 'No autorizado' });
    if (req.user.role !== role)
      return res
        .status(403)
        .json({ error: true, message: `Acceso denegado - se requiere rol ${role}` });
    next();
  };
}

module.exports = { jwtAuth, requireRole };
