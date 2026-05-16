/**
 * Documentación OpenAPI del módulo Autenticación + Administración de Usuarios
 * (HU-001 a HU-005). Solo anotaciones JSDoc, sin código ejecutable.
 */

/**
 * @openapi
 * /auth/document-types:
 *   get:
 *     tags: [Autenticación]
 *     summary: Listar tipos de documento disponibles
 *     description: Devuelve los tipos de documento configurados (CC, CE, PA, NIT, etc.).
 *     responses:
 *       200:
 *         description: Lista de tipos de documento.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:   { type: integer, example: 1 }
 *                       code: { type: string, example: 'CC' }
 *                       name: { type: string, example: 'Cédula de Ciudadanía' }
 *       500: { $ref: '#/components/responses/ServerError' }
 */

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Autenticación]
 *     summary: Iniciar sesión (HU-001)
 *     description: Autentica al servidor público con tipo y número de documento. Devuelve `accessToken` y `refreshToken`.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [documentTypeId, documentNumber, password]
 *             properties:
 *               documentTypeId: { type: integer, example: 1 }
 *               documentNumber: { type: string, example: '00000000' }
 *               password:       { type: string, format: password, example: 'Admin@2024!' }
 *     responses:
 *       200:
 *         description: Login exitoso.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/LoginResponse' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       423: { $ref: '#/components/responses/Locked' }
 *       429: { $ref: '#/components/responses/TooManyRequests' }
 *       500: { $ref: '#/components/responses/ServerError' }
 */

/**
 * @openapi
 * /auth/recover-password:
 *   post:
 *     tags: [Autenticación]
 *     summary: Solicitar recuperación de contraseña (HU-002)
 *     description: |
 *       Envía al correo del servidor una contraseña temporal **y** un enlace de restablecimiento.
 *       Límite: máximo 3 solicitudes por día por usuario.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [documentTypeId, documentNumber]
 *             properties:
 *               documentTypeId: { type: integer, example: 1 }
 *               documentNumber: { type: string, example: '00000000' }
 *     responses:
 *       200:
 *         description: Respuesta neutra anti-enumeración (independiente de si el usuario existe).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: 'Si los datos son correctos, recibirá un correo con instrucciones para restablecer su contraseña' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       429: { $ref: '#/components/responses/TooManyRequests' }
 *       500: { $ref: '#/components/responses/ServerError' }
 */

/**
 * @openapi
 * /auth/verify-reset-token:
 *   get:
 *     tags: [Autenticación]
 *     summary: Verificar si un token de reset sigue válido
 *     description: Llamado por el frontend al cargar la página de reset desde el enlace del correo.
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Token válido, devuelve fecha de expiración. }
 *       400:
 *         description: Token inválido o expirado.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */

/**
 * @openapi
 * /auth/reset-password:
 *   post:
 *     tags: [Autenticación]
 *     summary: Restablecer contraseña con token del correo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, newPassword]
 *             properties:
 *               token:       { type: string }
 *               newPassword: { type: string, format: password, example: 'Nueva@2026' }
 *     responses:
 *       200: { description: Contraseña actualizada exitosamente. }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       500: { $ref: '#/components/responses/ServerError' }
 */

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     tags: [Autenticación]
 *     summary: Renovar accessToken con refreshToken
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200:
 *         description: Nuevo accessToken emitido.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken: { type: string }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */

/**
 * @openapi
 * /auth/me:
 *   get:
 *     tags: [Autenticación]
 *     summary: Datos del usuario autenticado
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Información del usuario actual.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:    { type: string, format: uuid }
 *                     email: { type: string, format: email }
 *                     roles: { type: array, items: { type: string } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags: [Autenticación]
 *     summary: Cerrar sesión (revoca refreshToken)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200: { description: Sesión cerrada. }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */

/**
 * @openapi
 * /auth/change-password:
 *   put:
 *     tags: [Autenticación]
 *     summary: Cambiar mi contraseña (HU-003)
 *     description: |
 *       Cambia la contraseña del usuario autenticado.
 *       La nueva contraseña debe tener mínimo 6 caracteres, incluir letras, números y al menos un carácter especial.
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [newPassword]
 *             properties:
 *               currentPassword: { type: string, format: password, example: 'Vieja@2025' }
 *               newPassword:     { type: string, format: password, example: 'Nueva@2026' }
 *     responses:
 *       200: { description: Contraseña actualizada correctamente. }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       500: { $ref: '#/components/responses/ServerError' }
 */

/**
 * @openapi
 * /auth/users:
 *   post:
 *     tags: [Administración de Usuarios]
 *     summary: Crear usuario inicial (HU-004 — JTH/ADMIN)
 *     description: |
 *       El JTH crea las credenciales iniciales de un nuevo servidor público.
 *       Se le envía un correo de bienvenida con la contraseña temporal.
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [documentTypeId, documentNumber, email]
 *             properties:
 *               documentTypeId: { type: integer, example: 1 }
 *               documentNumber: { type: string, example: '1098765432' }
 *               email:          { type: string, format: email, example: 'nuevo@empleado.gov.co' }
 *               roleCode:       { type: string, enum: ['SERVIDOR', 'JTH'], default: 'SERVIDOR' }
 *     responses:
 *       201:
 *         description: Usuario creado.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:             { type: string, format: uuid }
 *                     email:          { type: string }
 *                     documentType:   { type: string, example: 'Cédula de Ciudadanía' }
 *                     documentNumber: { type: string }
 *                     role:           { type: string, example: 'SERVIDOR' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       409: { $ref: '#/components/responses/Conflict' }
 *       500: { $ref: '#/components/responses/ServerError' }
 */

/**
 * @openapi
 * /auth/users/{userId}/roles/{roleCode}/disable:
 *   put:
 *     tags: [Administración de Usuarios]
 *     summary: Inhabilitar rol de un usuario (HU-005 — JTH/ADMIN)
 *     description: |
 *       Registra la fecha de fin de un rol activo de un usuario.
 *       Si era el último rol activo, el usuario queda inactivo y se revocan sus refresh tokens.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: path
 *         name: roleCode
 *         required: true
 *         schema: { type: string, enum: [SERVIDOR, JTH, ADMIN] }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [endDate]
 *             properties:
 *               endDate: { type: string, format: date, example: '2026-06-30' }
 *     responses:
 *       200: { description: Rol inhabilitado correctamente. }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       500: { $ref: '#/components/responses/ServerError' }
 */