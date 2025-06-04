const multer = require('multer');
const path = require('path');
const fs = require('fs'); // <-- Impor modul File System

// Konfigurasi Penyimpanan
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = 'public/uploads/';
        // Cek dan buat direktori jika belum ada
        // { recursive: true } akan membuat folder induknya juga jika diperlukan (misal: public)
        fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = req.user.id + '-' + Date.now();
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Filter File (Hanya Izinkan Gambar)
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const mimeType = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

    if (mimeType && extname) {
        return cb(null, true);
    }
    cb(new Error('Error: Hanya file gambar (jpeg, jpg, png, gif) yang diizinkan!'));
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Batas ukuran file 5MB
    fileFilter: fileFilter
});

module.exports = upload;