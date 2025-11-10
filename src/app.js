require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const passport = require('passport');
const { connectToMongo } = require('./db/mongo.client');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./docs/swagger');
const errorHandler = require('./middlewares/error.middleware');
const authRoutes = require('./routes/auth.routes');
const usersRoutes = require('./routes/users.routes');
const categoriesRoutes = require('./routes/categories.routes');
const restaurantsRoutes = require('./routes/restaurants.routes');
const dishesRoutes = require('./routes/dishes.routes');
const reviewsRoutes = require('./routes/reviews.routes');
const favoritesRoutes = require('./routes/favorites.routes');
// ...


require('./config/passport'); // passport strategy

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());
app.use(cors());
app.use(express.json());

const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
  max: Number(process.env.RATE_LIMIT_MAX) || 120,
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

app.use(passport.initialize());

// routes
app.use(`/api/${process.env.API_VERSION || 'v1'}/auth`, authRoutes);
app.use(`/api/${process.env.API_VERSION || 'v1'}/users`, usersRoutes);
app.use(`/api/${process.env.API_VERSION || 'v1'}/categories`, categoriesRoutes);
app.use(`/api/${process.env.API_VERSION || 'v1'}/restaurants`, restaurantsRoutes);
app.use(`/api/${process.env.API_VERSION || 'v1'}/dishes`, dishesRoutes);
app.use(`/api/${process.env.API_VERSION || 'v1'}/reviews`, reviewsRoutes);
app.use(`/api/${process.env.API_VERSION || 'v1'}/favorites`, favoritesRoutes);

// swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// error handler (last middleware)
app.use(errorHandler);

connectToMongo()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`FoodieRank backend listening on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to connect to DB', err);
    process.exit(1);
  });

module.exports = app;
