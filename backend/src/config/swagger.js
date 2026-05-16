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
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
      schemas: {
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Credenciales inválidas' },
          },
        },
        PersonalInfo: {
          type: 'object',
          description: 'Datos personales del servidor público (HU-006/007). Snake_case porque refleja la BD.',
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
            validated:          { type: 'integer', enum: [0, 1], example: 0 },
            validated_by:       { type: 'string', format: 'uuid', nullable: true },
            validated_at:       { type: 'string', format: 'date-time', nullable: true },
            attachment_path:    { type: 'string', nullable: true },
            attachment_name:    { type: 'string', nullable: true },
            created_at:         { type: 'string', format: 'date-time', example: '2026-05-10 10:47:42' },
            updated_at:         { type: 'string', format: 'date-time', example: '2026-05-10 10:47:42' },
          },
        },
        Education: {
          type: 'object',
          properties: {
            id:                { type: 'integer', example: 1 },
            user_id:           { type: 'string', format: 'uuid' },
            level:             { type: 'string', enum: ['PREGRADO', 'POSGRADO', 'TARJETA_PROFESIONAL'], example: 'PREGRADO' },
            institution:       { type: 'string', example: 'Universidad Autónoma de Occidente' },
            title:             { type: 'string', example: 'Ingeniería Informática' },
            start_date:        { type: 'string', format: 'date', nullable: true },
            end_date:          { type: 'string', format: 'date', nullable: true },
            professional_card: { type: 'string', nullable: true, example: 'COPNIA-12345' },
            attachment_path:   { type: 'string', nullable: true },
            attachment_name:   { type: 'string', nullable: true },
            validated:         { type: 'integer', enum: [0, 1], example: 0 },
          },
        },
        Work: {
          type: 'object',
          properties: {
            id:               { type: 'integer', example: 1 },
            user_id:          { type: 'string', format: 'uuid' },
            experience_type:  { type: 'string', enum: ['PUBLICA', 'PRIVADA', 'DOCENTE'], example: 'PUBLICA' },
            employer:         { type: 'string', example: 'Alcaldía de Cali' },
            position:         { type: 'string', example: 'Analista de sistemas' },
            start_date:       { type: 'string', format: 'date' },
            end_date:         { type: 'string', format: 'date', nullable: true },
            is_current:       { type: 'integer', enum: [0, 1], example: 0 },
            responsibilities: { type: 'string', nullable: true },
            attachment_path:  { type: 'string', nullable: true },
            attachment_name:  { type: 'string', nullable: true },
            validated:        { type: 'integer', enum: [0, 1], example: 0 },
          },
        },
        Management: {
          type: 'object',
          properties: {
            user_id:            { type: 'string', format: 'uuid' },
            hierarchical_level: { type: 'string', example: 'Directivo' },
            position_name:      { type: 'string', example: 'Director de Tecnología' },
            entity_name:        { type: 'string', example: 'Gobernación del Valle' },
            start_date:         { type: 'string', format: 'date' },
            attachment_path:    { type: 'string', nullable: true },
            attachment_name:    { type: 'string', nullable: true },
            validated:          { type: 'integer', enum: [0, 1], example: 0 },
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
        ValidationResult: {
          type: 'object',
          description: 'Resultado de validar/desvalidar una sección de la HV (OBS #2).',
          properties: {
            section:      { type: 'string', enum: ['personal', 'education', 'work', 'management'], example: 'education' },
            targetUserId: { type: 'string', format: 'uuid' },
            recordId:     { type: 'integer', nullable: true, example: 5 },
            validated:    { type: 'boolean', example: true },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                accessToken:        { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                refreshToken:       { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                mustChangePassword: { type: 'boolean', example: false },
                user: {
                  type: 'object',
                  properties: {
                    id:    { type: 'string', format: 'uuid' },
                    email: { type: 'string', format: 'email' },
                    roles: { type: 'array', items: { type: 'string' }, example: ['JTH'] },
                  },
                },
              },
            },
          },
        },
      },
      responses: {
        Unauthorized: {
          description: 'No autenticado o token expirado.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: { success: false, message: 'Token de acceso requerido' } } },
        },
        Forbidden: {
          description: 'Sin permisos suficientes (rol incorrecto).',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: { success: false, message: 'No tiene permisos para realizar esta acción' } } },
        },
        BadRequest: {
          description: 'Datos inválidos en la petición.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: { success: false, message: 'Campo obligatorio: firstName' } } },
        },
        NotFound: {
          description: 'Recurso no encontrado.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: { success: false, message: 'Registro no encontrado' } } },
        },
        Conflict: {
          description: 'Conflicto con un recurso existente.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: { success: false, message: 'Ya existe un usuario con ese documento o correo' } } },
        },
        Locked: {
          description: 'Recurso bloqueado (cuenta bloqueada / sección validada).',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: { success: false, message: 'La sección está validada. Solicite al JTH levantar la validación.' } } },
        },
        TooManyRequests: {
          description: 'Demasiadas peticiones — rate limit alcanzado.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: { success: false, message: 'Demasiados intentos de acceso. Espere 15 minutos.' } } },
        },
        ServerError: {
          description: 'Error interno del servidor.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
      },
    },
  },
  apis: [
    './src/routes/*.js',
    './src/docs/openapi/*.js',
  ],
});

module.exports = swaggerSpec;
// Documentación Swagger UI: http://localhost:3001/api/docs