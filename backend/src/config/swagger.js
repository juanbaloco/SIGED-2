const swaggerJSDoc = require('swagger-jsdoc');

const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'SIGEP II API',
      version: '1.0.0',
      description: 'API del Sistema de Gestión de Empleo Público — Hoja de Vida del Servidor Público',
    },
    servers: [
      { url: 'http://localhost:3001/api', description: 'Entorno de desarrollo' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/*.js'],
});

module.exports = swaggerSpec;