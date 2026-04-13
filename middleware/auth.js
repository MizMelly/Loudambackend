const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'No token, authorization denied',
      });
    }

    const token = authHeader.startsWith('Bearer ')
      ? authHeader.replace('Bearer ', '')
      : authHeader;

    req.user = jwt.verify(token, process.env.JWT_SECRET);

    next();
  } catch (err) {
    res.status(401).json({
      success: false,
      message: 'Invalid token',
    });
  }
};

module.exports = auth;