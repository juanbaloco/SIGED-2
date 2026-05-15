require('dotenv').config();
const express  = require('express');
const helmet   = require('helmet');
const cors     = require('cors');
const morgan   = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const logger   = require('./config/logger');
const { initDb } = require('./config/database');
const { errorHandler, notFound } = require('./middlewares/errorHandler');

const app = express();

// ─── Seguridad ────────────────────────────────────────────────────────────────
app.use(helmet());
app.set('trust proxy', 1);

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting global
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, message: 'Demasiadas peticiones. Intente más tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
}));

// Rate limiting estricto para login y recuperación
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Demasiados intentos de acceso. Espere 15 minutos.' },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/recover-password', authLimiter);

// ─── Parsers & utilidades ──────────────────────────────────────────────────────
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));

// ─── Rutas ────────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', env: process.env.NODE_ENV }));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/cv', require('./routes/cvRoutes'));

const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');//esto tiene que corregirse
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ─── Manejo de errores ────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Inicio del servidor ──────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;

(async () => {
  try {
    await initDb();
    logger.info('✅ Database initialized');
    app.listen(PORT, () => {
      logger.info(`🚀 SIGEP II Backend running on port ${PORT} [${process.env.NODE_ENV}]`);
    });
  } catch (err) {
    logger.error('Failed to start server', { error: err.message });
    process.exit(1);
  }
})();

module.exports = app;