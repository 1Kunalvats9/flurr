const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.split(' ')[1];
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    return res.status(500).json({ error: 'Missing JWT_SECRET in environment' });
  }

  try {
    const payload = jwt.verify(token, jwtSecret);
    const userId = typeof payload === 'object' ? payload.sub : null;

    if (!userId || typeof userId !== 'string') {
      return res.status(401).json({ error: 'Invalid token payload' });
    }

    req.userId = userId;
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = { authMiddleware };
