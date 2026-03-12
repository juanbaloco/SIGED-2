const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Token de acceso requerido' });
  }

  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expirado', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ success: false, message: 'Token inválido' });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !req.user.roles) {
    return res.status(401).json({ success: false, message: 'No autenticado' });
  }
  const hasRole = roles.some(r => req.user.roles.includes(r));
  if (!hasRole) {
    return res.status(403).json({ success: false, message: 'No tiene permisos para realizar esta acción' });
  }
  next();
};

module.exports = { authenticate, authorize };