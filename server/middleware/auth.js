const jwt = require('jsonwebtoken');
function auth(req, res, next) {
  try {
    
    let token = null;
    
    if (req.headers.cookie) {
      const cookies = req.headers.cookie.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      }, {});
      token = cookies.token;
    }
    
    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
    
    if (!token && req.query && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      if (req.originalUrl.startsWith('/api/')) {
        return res.status(401).json({ 
          success: false, 
          message: 'Authentication required'
        });
      }
      
      return res.redirect('/login.html?message=Please login to access this page');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
    
    req.user = decoded;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    
    if (req.originalUrl.startsWith('/api/')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid or expired token'
      });
    }
    
    return res.redirect('/login.html?message=Your session has expired. Please login again.');
  }
}

module.exports = auth;