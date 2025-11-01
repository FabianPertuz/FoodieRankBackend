const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'FoodieRank API',
      version: process.env.npm_package_version || '0.1.0',
      description: 'API docs for FoodieRank'
    }
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js'] // for basic discovery; you can extend
};

const spec = swaggerJsdoc(options);
module.exports = spec;
