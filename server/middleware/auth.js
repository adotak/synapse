// ============================================
// Auth Middleware — protects routes that need login
// ============================================
// This middleware runs BEFORE your route handler.
// It checks if the request has a valid JWT token.
// If yes → attaches the user's ID to req.user and calls next()
// If no → sends back a 401 Unauthorized error

const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  try {
    // Step 1: Get the Authorization header
    // The frontend sends it as: "Bearer eyJhbGciOiJI..."
    const authHeader = req.header('Authorization');

    if (!authHeader) {
      return res.status(401).json({ error: 'No token provided. Please log in.' });
    }

    // Step 2: Extract the token (remove "Bearer " prefix)
    // "Bearer eyJhbGci..." → "eyJhbGci..."
    const token = authHeader.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No token provided. Please log in.' });
    }

    // Step 3: Verify the token using our secret key
    // jwt.verify() will throw an error if the token is invalid or expired
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Step 4: Attach the user info to the request object
    // Now any route handler after this can access req.user.id
    req.user = { id: decoded.id };

    // Step 5: Continue to the next middleware or route handler
    next();
  } catch (error) {
    // If jwt.verify() fails (expired token, tampered token, etc.)
    console.error('Auth middleware error:', error.message);
    res.status(401).json({ error: 'Invalid or expired token. Please log in again.' });
  }
};

module.exports = auth;
