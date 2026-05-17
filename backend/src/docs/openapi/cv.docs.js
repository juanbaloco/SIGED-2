/**
 * Documentación OpenAPI del módulo Hoja de Vida (HU-006 a HU-015 + OBS #2).
 * Solo anotaciones JSDoc — sin código ejecutable.
 * swagger-jsdoc lo lee gracias al glob en src/config/swagger.js.
 */

/**
 * @openapi
 * /cv/summary:
 *   get:
 *     tags: [Hoja de Vida — Resumen]
 *     summary: Resumen completo de mi HV
 *     description: Devuelve datos personales, formación, experiencia, gerencia y bandera `managementEnabled`.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Resumen completo.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:    { $ref: '#/components/schemas/CvSummary' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       500: { $ref: '#/components/responses/ServerError' }
 */

/**
 * @openapi
 * /cv/export/pdf:
 *   get:
 *     tags: [Hoja de Vida — Exportación]
 *     summary: Descargar HV en PDF (HU-015)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: PDF generado con `pdfkit`.
 *         content:
 *           application/pdf:
 *             schema: { type: string, format: binary }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       500: { $ref: '#/components/responses/ServerError' }
 */

/**
 * @openapi
 * /cv/personal:
 *   get:
 *     tags: [Hoja de Vida — Datos Personales]
 *     summary: Obtener mis datos personales (HU-006)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Datos personales (o `null` si no han sido registrados).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:    { $ref: '#/components/schemas/PersonalInfo' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       500: { $ref: '#/components/responses/ServerError' }
 *   put:
 *     tags: [Hoja de Vida — Datos Personales]
 *     summary: Crear o actualizar mis datos personales (HU-006/007)
 *     description: |
 *       El body usa **camelCase**. La respuesta usa **snake_case** (ver OBS #3).
 *       Si la sección está validada (`validated = 1`), devuelve **423**.
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [firstName, lastName, documentTypeId, documentNumber, birthDate, gender, mobile, email, country, department, city, zoneType]
 *             properties:
 *               firstName:         { type: string, example: 'Juan' }
 *               middleName:        { type: string, nullable: true }
 *               lastName:          { type: string, example: 'Pérez' }
 *               secondLastName:    { type: string, nullable: true }
 *               documentTypeId:    { type: integer, example: 1 }
 *               documentNumber:    { type: string, example: '1234567890' }
 *               birthDate:         { type: string, format: date, example: '1990-05-15' }
 *               gender:            { type: string, enum: ['M', 'F', 'O'] }
 *               phone:             { type: string, nullable: true }
 *               mobile:            { type: string, example: '3001234567' }
 *               email:             { type: string, format: email }
 *               country:           { type: string, example: 'Colombia' }
 *               department:        { type: string, example: 'Valle del Cauca' }
 *               city:              { type: string, example: 'Cali' }
 *               zoneType:          { type: string, enum: ['URBANA', 'RURAL'] }
 *               address:           { type: string, nullable: true, description: 'Obligatoria si zoneType=URBANA' }
 *               addressComplement: { type: string, nullable: true, description: 'Obligatorio si zoneType=RURAL' }
 *     responses:
 *       200:
 *         description: Datos guardados.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:    { $ref: '#/components/schemas/PersonalInfo' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       423: { $ref: '#/components/responses/Locked' }
 *       500: { $ref: '#/components/responses/ServerError' }
 */

/**
 * @openapi
 * /cv/education:
 *   get:
 *     tags: [Hoja de Vida — Formación]
 *     summary: Listar mi formación académica (HU-008)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Lista de registros de formación.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:    { type: array, items: { $ref: '#/components/schemas/Education' } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *   post:
 *     tags: [Hoja de Vida — Formación]
 *     summary: Crear registro de formación (HU-008)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [level, institution, title]
 *             properties:
 *               level:            { type: string, enum: ['PREGRADO', 'POSGRADO', 'TARJETA_PROFESIONAL'] }
 *               institution:      { type: string, example: 'Universidad Autónoma de Occidente' }
 *               title:            { type: string, example: 'Ingeniería Informática' }
 *               startDate:        { type: string, format: date, nullable: true }
 *               endDate:          { type: string, format: date, nullable: true }
 *               professionalCard: { type: string, nullable: true }
 *     responses:
 *       201:
 *         description: Registro creado, devuelve lista actualizada.
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */

/**
 * @openapi
 * /cv/education/{id}:
 *   put:
 *     tags: [Hoja de Vida — Formación]
 *     summary: Actualizar registro de formación
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [level, institution, title]
 *             properties:
 *               level:            { type: string, enum: ['PREGRADO', 'POSGRADO', 'TARJETA_PROFESIONAL'] }
 *               institution:      { type: string, example: 'Universidad del Valle' }
 *               title:            { type: string, example: 'Maestría en Ingeniería' }
 *               startDate:        { type: string, format: date, nullable: true }
 *               endDate:          { type: string, format: date, nullable: true }
 *               professionalCard: { type: string, nullable: true }
 *     responses:
 *       200: { description: Actualizado, devuelve lista actualizada. }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       423: { $ref: '#/components/responses/Locked' }
 *   delete:
 *     tags: [Hoja de Vida — Formación]
 *     summary: Eliminar registro de formación
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Eliminado, devuelve lista actualizada. }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       423: { $ref: '#/components/responses/Locked' }
 */

/**
 * @openapi
 * /cv/work:
 *   get:
 *     tags: [Hoja de Vida — Experiencia]
 *     summary: Listar mi experiencia laboral (HU-009)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Lista de experiencias.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:    { type: array, items: { $ref: '#/components/schemas/Work' } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *   post:
 *     tags: [Hoja de Vida — Experiencia]
 *     summary: Crear experiencia laboral (HU-009)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [experienceType, employer, position, startDate]
 *             properties:
 *               experienceType:   { type: string, enum: ['PUBLICA', 'PRIVADA', 'DOCENTE'] }
 *               employer:         { type: string, example: 'Alcaldía de Cali' }
 *               position:         { type: string, example: 'Analista de sistemas' }
 *               startDate:        { type: string, format: date, example: '2023-02-01' }
 *               endDate:          { type: string, format: date, nullable: true }
 *               isCurrent:        { type: boolean, nullable: true }
 *               responsibilities: { type: string, nullable: true }
 *     responses:
 *       201: { description: Creada, devuelve lista actualizada. }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */

/**
 * @openapi
 * /cv/work/{id}:
 *   put:
 *     tags: [Hoja de Vida — Experiencia]
 *     summary: Actualizar experiencia laboral
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [experienceType, employer, position, startDate]
 *             properties:
 *               experienceType:   { type: string, enum: ['PUBLICA', 'PRIVADA', 'DOCENTE'] }
 *               employer:         { type: string, example: 'Gobernación del Valle' }
 *               position:         { type: string, example: 'Director TI' }
 *               startDate:        { type: string, format: date, example: '2024-01-01' }
 *               endDate:          { type: string, format: date, nullable: true }
 *               isCurrent:        { type: boolean, nullable: true }
 *               responsibilities: { type: string, nullable: true }
 *     responses:
 *       200: { description: Actualizada, devuelve lista actualizada. }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       423: { $ref: '#/components/responses/Locked' }
 *   delete:
 *     tags: [Hoja de Vida — Experiencia]
 *     summary: Eliminar experiencia laboral
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Eliminada, devuelve lista actualizada. }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       423: { $ref: '#/components/responses/Locked' }
 */

/**
 * @openapi
 * /cv/management:
 *   get:
 *     tags: [Hoja de Vida — Gerencia Pública]
 *     summary: Obtener mi sección de Gerencia Pública (HU-010)
 *     description: Solo accesible si el cargo lo habilita (ver `isManagementEnabled`).
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Datos de gerencia.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:    { $ref: '#/components/schemas/Management' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *   put:
 *     tags: [Hoja de Vida — Gerencia Pública]
 *     summary: Crear o actualizar Gerencia Pública (HU-010)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [hierarchicalLevel, positionName, entityName, startDate]
 *             properties:
 *               hierarchicalLevel: { type: string, example: 'Directivo' }
 *               positionName:      { type: string, example: 'Director de Tecnología' }
 *               entityName:        { type: string, example: 'Gobernación del Valle' }
 *               startDate:         { type: string, format: date, example: '2024-01-01' }
 *     responses:
 *       200: { description: Datos guardados. }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       423: { $ref: '#/components/responses/Locked' }
 */

/**
 * @openapi
 * /cv/attachments/{section}/{id}:
 *   get:
 *     tags: [Hoja de Vida — Adjuntos]
 *     summary: Descargar / previsualizar adjunto (HU-014)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: section
 *         required: true
 *         schema: { type: string, enum: [personal, management, education, work] }
 *       - in: path
 *         name: id
 *         required: false
 *         description: Requerido para `education` y `work`. Opcional para `personal` y `management`.
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Archivo binario (PDF o JPG).
 *         content:
 *           application/pdf:  { schema: { type: string, format: binary } }
 *           image/jpeg:       { schema: { type: string, format: binary } }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */

/**
 * @openapi
 * /cv/validate:
 *   put:
 *     tags: [Hoja de Vida — Validación JTH]
 *     summary: Marcar o desmarcar una sección como validada (OBS #2)
 *     description: |
 *       Solo accesible para roles **JTH** y **ADMIN**.
 *       - Para `personal` y `management`: no se envía `recordId`.
 *       - Para `education` y `work`: `recordId` es obligatorio.
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, section, validated]
 *             properties:
 *               userId:    { type: string, format: uuid, example: '5b15e7ad-d4a1-4e9d-a08c-ab3b2af77cc7' }
 *               section:   { type: string, enum: [personal, education, work, management] }
 *               recordId:  { type: integer, nullable: true, description: 'Requerido solo para education y work' }
 *               validated: { type: boolean, example: true }
 *     responses:
 *       200:
 *         description: Validación aplicada.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:    { $ref: '#/components/schemas/ValidationResult' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */