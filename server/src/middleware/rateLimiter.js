const rateLimit = require('express-rate-limit');

// Rate limiter for authentication routes (login, forgot password, etc.)
// Limits to 5 requests per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // Increased from 5 to 100 for testing
  message: { error: 'Too many login attempts from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

// General API rate limiter
// Limits to 1000 requests per 1 minute per IP
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 1000, // Increased from 100 to 1000 for testing
  message: { error: 'Too many requests from this IP, please try again after a minute' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  authLimiter,
  apiLimiter
};
