// =================================================================
//                      SERVER KEBAB 95 API (VERSI FINAL + UPLOAD)
// =================================================================

// 1. IMPOR PAKET & MIDDLEWARE
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Impor middleware kustom
const authMiddleware = require('./middleware/authMiddleware');
const adminMiddleware = require('./middleware/adminMiddleware');
const upload = require('./middleware/uploadMiddleware'); // <-- Impor middleware upload

// 2. INISIALISASI & KONFIGURASI MIDDLEWARE UTAMA
const app = express();
const port = process.env.API_PORT || 3001;

app.use(cors());
app.use(express.json());
app.use('/public', express.static('public')); // <-- Membuat folder public bisa diakses

// 3. KONFIGURASI KONEKSI DATABASE
const pool = mysql.createPool({
    host: process.env.DB_HOST, user: process.env.DB_USER, password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME, waitForConnections: true, connectionLimit: 10, queueLimit: 0
});

// 4. DEFINISI API ROUTES / ENDPOINTS

// ====== AUTHENTICATION ROUTES ======
app.post('/api/auth/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'Username dan password harus diisi.' });
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword]);
        res.status(201).json({ message: 'User berhasil didaftarkan!' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Username sudah digunakan.' });
        res.status(500).json({ message: 'Terjadi kesalahan pada server', error: error.message });
    }
});
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'Username dan password harus diisi.' });
    try {
        const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
        if (users.length === 0) return res.status(401).json({ message: 'Username atau password salah.' });
        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: 'Username atau password salah.' });
        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '3h' });
        res.json({ message: 'Login berhasil!', token });
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan pada server', error: error.message });
    }
});

// ====== PUBLIC ROUTES ======
app.get('/api/outlets', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM outlets');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Database query failed', error: error.message });
    }
});
app.get('/api/comments/:outlet_id', async (req, res) => {
    //
    try {
        const { outlet_id } = req.params;
        const [rows] = await pool.query('SELECT * FROM komentar WHERE outlet_id = ? ORDER BY waktu_posting DESC', [outlet_id]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Database query failed', error: error.message });
    }
});

// ====== PROTECTED ROUTES ======

// Rute untuk ADMIN mengedit outlet yang sudah ada
app.put('/api/outlets/:id', authMiddleware, adminMiddleware, async (req, res) => {
    const { id } = req.params; // Ambil ID dari parameter URL
    const { nama_outlet, alamat, latitude, longitude, jam_operasional, telepon } = req.body;

    // Validasi sederhana
    if (!nama_outlet || !alamat || !latitude || !longitude) {
        return res.status(400).json({ message: 'Data outlet tidak lengkap.' });
    }

    try {
        const query = `
            UPDATE outlets 
            SET nama_outlet = ?, alamat = ?, latitude = ?, longitude = ?, jam_operasional = ?, telepon = ? 
            WHERE id = ?
        `;
        const [result] = await pool.query(query, [nama_outlet, alamat, latitude, longitude, jam_operasional, telepon, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Outlet dengan ID tersebut tidak ditemukan.' });
        }
        
        res.json({ message: `Outlet dengan ID ${id} berhasil diupdate.` });
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengupdate outlet di database', error: error.message });
    }
});

// Rute untuk ADMIN menghapus outlet
app.delete('/api/outlets/:id', authMiddleware, adminMiddleware, async (req, res) => {
    const { id } = req.params; // Ambil ID dari parameter URL

    try {
        const query = 'DELETE FROM outlets WHERE id = ?';
        const [result] = await pool.query(query, [id]);

        // Cek apakah ada baris yang terhapus
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Outlet dengan ID tersebut tidak ditemukan.' });
        }

        res.json({ message: `Outlet dengan ID ${id} berhasil dihapus.` });
    } catch (error) {
        res.status(500).json({ message: 'Gagal menghapus outlet dari database', error: error.message });
    }
});

app.get('/api/profile', authMiddleware, (req, res) => {
    res.json({ message: 'Anda berhasil mengakses rute yang dilindungi!', user: req.user });
});
app.post('/api/outlets', authMiddleware, adminMiddleware, async (req, res) => {
    const { nama_outlet, alamat, latitude, longitude, jam_operasional, telepon } = req.body;
    if (!nama_outlet || !alamat || !latitude || !longitude) return res.status(400).json({ message: 'Data outlet tidak lengkap.' });
    try {
        const query = `INSERT INTO outlets (nama_outlet, alamat, latitude, longitude, jam_operasional, telepon) VALUES (?, ?, ?, ?, ?, ?)`;
        const [result] = await pool.query(query, [nama_outlet, alamat, latitude, longitude, jam_operasional, telepon]);
        res.status(201).json({ message: 'Outlet baru berhasil ditambahkan!', outletId: result.insertId });
    } catch (error) {
        res.status(500).json({ message: 'Gagal menambahkan outlet ke database', error: error.message });
    }
});
app.post('/api/comments', authMiddleware, async (req, res) => {
    const user_id = req.user.id;
    const { outlet_id, isi_komentar } = req.body;
    if (!outlet_id || !isi_komentar) return res.status(400).json({ message: 'Outlet ID dan isi komentar tidak boleh kosong.' });
    try {
        const query = `INSERT INTO komentar (outlet_id, user_id, isi_komentar) VALUES (?, ?, ?)`;
        const [result] = await pool.query(query, [outlet_id, user_id, isi_komentar]);
        res.status(201).json({ message: 'Komentar berhasil ditambahkan!', commentId: result.insertId });
    } catch (error) {
        if (error.code === 'ER_NO_REFERENCED_ROW_2') return res.status(404).json({ message: 'Outlet dengan ID tersebut tidak ditemukan.' });
        res.status(500).json({ message: 'Gagal menambahkan komentar ke database', error: error.message });
    }
});

// Rute untuk USER LOGIN mengunggah foto (FITUR BARU)
app.post('/api/photos/upload', authMiddleware, upload.single('photo'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Tidak ada file yang diunggah.' });
    }
    const { outlet_id, caption } = req.body;
    const user_id = req.user.id;
    const file_path = req.file.path.replace(/\\/g, "/"); 
    if (!outlet_id) {
        return res.status(400).json({ message: 'Outlet ID harus disertakan.' });
    }
    try {
        const query = 'INSERT INTO photos (outlet_id, user_id, file_path, caption) VALUES (?, ?, ?, ?)';
        await pool.query(query, [outlet_id, user_id, file_path, caption || null]);
        res.status(201).json({ message: 'File berhasil diunggah!', filePath: file_path });
    } catch (error) {
        res.status(500).json({ message: 'Gagal menyimpan data foto ke database', error: error.message });
    }
});

// 5. JALANKAN SERVER
app.listen(port, () => {
    console.log(`🚀 Server Express berjalan di http://localhost:${port}`);
});