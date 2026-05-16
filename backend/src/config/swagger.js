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
      schemas: {
        PersonalInfo: {
            type: 'object',
            description: 'Información personal del servidor público (HU-06/HU-007)',
            properties: {
              user_id:            { type: 'string', format: 'uuid', example: '5b15e7ad-d4a1-4e9d-a08c-ab3b2af77cc7' },
              first_name:         { type: 'string', example: 'Juan' },
              middle_name:        { type: 'string', example: 'Carlos', nullable: true },
              last_name:          { type: 'string', example: 'Pérez' },
              second_last_name:   { type: 'string', example: 'García', nullable: true },
              document_type_id:   { type: 'integer', example: 1 },
              document_number:    { type: 'string', example: '1234567890' },
              birth_date:         { type: 'string', format: 'date', example: '1990-05-15' },
              gender:             { type: 'string', enum: ['M', 'F', 'O'], example: 'M' },
              phone:              { type: 'string', example: '6022345678', nullable: true },
              mobile:             { type: 'string', example: '3001234567' },
              email:              { type: 'string', format: 'email', example: 'juan@example.com' },
              country:            { type: 'string', example: 'Colombia' },
              department:         { type: 'string', example: 'Valle del Cauca' },
              city:               { type: 'string', example: 'Cali' },
              zone_type:          { type: 'string', enum: ['URBANA', 'RURAL'], example: 'URBANA' },
              address:            { type: 'string', example: 'Calle 25 # 10-15', nullable: true },
              address_complement: { type: 'string', example: 'Vereda La Esperanza', nullable: true },
              validated:          { type: 'integer', enum: [0, 1], example: 0, description: '1 si el JTH validó este registro, 0 si no' },
              validated_by:       { type: 'string', format: 'uuid', nullable: true, example: null },
              validated_at:       { type: 'string', format: 'date-time', nullable: true, example: null },
              attachment_path:    { type: 'string', nullable: true, example: null },
              attachment_name:    { type: 'string', nullable: true, example: null },
              created_at:         { type: 'string', format: 'date-time', example: '2026-05-10 10:47:42' },
              updated_at:         { type: 'string', format: 'date-time', example: '2026-05-10 10:47:42' },
            },
          },
          Education: {
            type: 'object',
            properties: {
              id:                { type: 'integer', example: 1 },
              level:             { type: 'string', enum: ['PREGRADO', 'POSGRADO', 'TARJETA_PROFESIONAL'], example: 'PREGRADO' },
              institution:       { type: 'string', example: 'Universidad Autonoma de Occidente' },
              title:             { type: 'string', example: 'Ingeniería Informática' },
              startDate:         { type: 'string', format: 'date', example: '2010-01-01', nullable: true },
              endDate:           { type: 'string', format: 'date', example: '2015-12-31', nullable: true },
              professionalCard:  { type: 'string', example: 'COPNIA-12345', nullable: true },
            },
          },
          Work: {
            type: 'object',
            properties: {
              id:                { type: 'integer', example: 1 },
              experienceType:    { type: 'string', enum: ['PUBLICA', 'PRIVADA', 'DOCENTE'], example: 'PUBLICA' },
              employer:          { type: 'string', example: 'Ministerio de Educación' },
              position:          { type: 'string', example: 'Analista de Sistemas' },
              startDate:         { type: 'string', format: 'date', example: '2016-01-01' },
              endDate:           { type: 'string', format: 'date', example: '2020-12-31', nullable: true },
            },
          },
          Management: {
            type: 'object',
            properties: {
              hierarchicalLevel: { type: 'string', example: 'DIRECTIVO' },
              positionName:      { type: 'string', example: 'Director de Tecnología' },
              entityName:        { type: 'string', example: 'Ministerio de Tecnologías de la Información' },
              startDate:         { type: 'string', format: 'date', example: '2021-01-01' },
            },
          },
          CvSummary: {
            type: 'object',
            properties: {
              personal:          { $ref: '#/components/schemas/PersonalInfo' },
              education:         { type: 'array', items: { $ref: '#/components/schemas/Education' } },
              work:              { type: 'array', items: { $ref: '#/components/schemas/Work' } },
              management:        { $ref: '#/components/schemas/Management', nullable: true },
              managementEnabled: { type: 'boolean', example: false },
            },
          },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean',
            example: false },

          },
          message: { type: 'string',
          example: 'Credenciales invalidas',
         },  
        },
      },
    },
        
        
  },
  apis: ['./src/routes/*.js'],
});

module.exports = swaggerSpec;