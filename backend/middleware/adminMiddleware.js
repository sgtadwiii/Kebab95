const adminMiddleware = (req, res, next) => {
    // Middleware ini berjalan setelah authMiddleware, jadi req.user sudah ada
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Akses ditolak. Rute ini hanya untuk admin.' });
    }
};

module.exports = adminMiddleware;