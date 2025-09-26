const jwt = require('jsonwebtoken');

const auth = (roles = []) => {
  return (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'No token provided' });

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'a51bf9319cb2f11abbe848b20b1a39f18071df20f9731a78a7dc7d9cfefd136f60500e5211cfb9337f6b38a84c31fe124b631f8924883fb80eaca18920b0698bc55d5a9f1a1331a761060c0a130a5d13850010bbd3d3ed3149f6856b4f46ab2eb1b5432254dbdbfa7b10cda8f4d7bf2ca79c06478a70e56fa4f5c9d47e42a78cd58a68e45fd7c0404fde1d1094684d2b560bcd005b0322ef392405fb687e9dcc08a597e9a8b0b349be7dd82ec1db07ead9ea7467d476654e10332a8cd8413268dec6f97f05edb57707386566603ab1488b8c5db4899538f36cf398aa4eb6fe7edc61617c12f6c84ac95a7951ab9e30d0b301986e15d274a5beeefdd8e94120d2');
      req.user = decoded;
      if (roles.length && !roles.includes(decoded.role)) {
        return res.status(403).json({ message: 'Access denied' });
      }
      next();
    } catch (error) {
      res.status(401).json({ message: 'Invalid token' });
    }
  };
};

module.exports = auth;