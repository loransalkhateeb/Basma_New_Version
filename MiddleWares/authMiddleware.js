const jwt = require('jsonwebtoken');
require('dotenv').config()
module.exports = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid token' });
  }
};


const authorizeAdmin = (req, res, next) => {
  if (req.user.role === 'Student') {
    return res.status(403).json({
      error: req.body.lang === 'en' ? 'Students are not authorized to access the Dashboard' : 'الطلاب غير مخولين للوصول الى الداشبوورد',
    });
  }

 
  if (req.user.role !== 'Admin' && req.user.role !== 'Teacher') { 
    return res.status(403).json({
      error: req.body.lang === 'en' ? 'You are not authorized to access the Dashboard' : 'انت غير مخول للوصول الى الداشبوورد',
    });
  }

 
  next();
};