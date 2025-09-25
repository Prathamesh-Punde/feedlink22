const jwt = require('jsonwebtoken');

/**
 * Authentication middleware
 * Checks if the user is authenticated via JWT token
 * If not, redirects to login page
 */
function auth(req, res, next) {
  try {
    // Get token from cookies, authorization header, or query parameter
    let token = null;
    
    // Check for token in cookies
    if (req.headers.cookie) {
      const cookies = req.headers.cookie.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      }, {});
      token = cookies.token;
    }
    
    // If no token in cookies, check authorization header
    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
    
    // If no token found yet, check localStorage via query param
    if (!token && req.query && req.query.token) {
      token = req.query.token;
    }

    // If no token found anywhere, redirect to login
    if (!token) {
      // For API requests, send JSON response
      if (req.originalUrl.startsWith('/api/')) {
        return res.status(401).json({ 
          success: false, 
          message: 'Authentication required'
        });
      }
      
      // For page requests, redirect to login
      return res.redirect('/login.html?message=Please login to access this page');
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
    
    // Add the user data to the request object
    req.user = decoded;
    
    // Proceed to the next middleware
    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    
    // For API requests, send JSON response
    if (req.originalUrl.startsWith('/api/')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid or expired token'
      });
    }
    
    // For page requests, redirect to login
    return res.redirect('/login.html?message=Your session has expired. Please login again.');
  }
}

module.exports = auth;