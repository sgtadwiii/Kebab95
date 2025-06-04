const jwt = require('jsonwebtoken');
require('dotenv').config();

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    
    if (authHeader == null) {
        return res.status(401).json({ message: "Akses ditolak. Tidak ada token." });
    }
    
    // Token dikirim dalam format "Bearer <token>"
    // Kita ambil bagian tokennya saja
    const token = authHeader.split(' ')[1];

    if (token == null) {
        return res.status(401).json({ message: "Format token salah." });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: "Token tidak valid." });
        }
        req.user = decoded;
        next();
    });
};

module.exports = authMiddleware;