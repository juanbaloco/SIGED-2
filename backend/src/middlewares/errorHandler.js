const logger = require('../config/logger');

const errorHandler = (err, req, res, next) => {
  const status  = err.status || 500;
  const message = err.message || 'Error interno del servidor';

  if (status >= 500) {
    logger.error('Unhandled error', { error: err.message, stack: err.stack, path: req.path });
  }

  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && status >= 500 ? { stack: err.stack } : {}),
  });
};

const notFound = (req, res) => {
  res.status(404).json({ success: false, message: `Ruta no encontrada: ${req.method} ${req.path}` });
};

module.exports = { errorHandler, notFound };