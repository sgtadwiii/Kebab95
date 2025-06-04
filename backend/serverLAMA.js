// =================================================================
//                      SERVER KEBAB 95 API
// =================================================================

// 1. IMPOR PAKET YANG DIBUTUHKAN
// -----------------------------------------------------------------
const express = require('express');
const mysql = require('mysql2/promise'); // Menggunakan versi promise untuk async/await
const cors = require('cors');
const bcrypt = require('bcryptjs'); // Untuk hashing password
const jwt = require('jsonwebtoken'); // Untuk membuat token login
require('dotenv').config(); // Muat variabel dari file .env
const authMiddleware = require('./middleware/authMiddleware');

// 2. INISIALISASI & KONFIGURASI MIDDLEWARE
// -----------------------------------------------------------------
const app = express();
const port = process.env.API_PORT || 3001;

app.use(cors()); // Middleware untuk mengizinkan Cross-Origin Resource Sharing
app.use(express.json()); // Middleware untuk mengizinkan Express membaca body request dalam format JSON
app.use('/public', express.static('public')); // Middleware untuk menyajikan file statis (gambar upload)

// 3. KONFIGURASI KONEKSI DATABASE
// -----------------------------------------------------------------
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// 4. DEFINISI API ROUTES / ENDPOINTS
// =================================================================

// ====== AUTHENTICATION ROUTES (FITUR BARU) ======
// -----------------------------------------------------------------

// Endpoint untuk mendaftarkan user baru
app.post('/api/auth/register', async (req, res) => {
    const { username, password } = req.body;

    // Validasi input sederhana
    if (!username || !password) {
        return res.status(400).json({ message: 'Username dan password harus diisi.' });
    }

    try {
        // Hash password sebelum disimpan ke database
        const hashedPassword = await bcrypt.hash(password, 10); // Angka 10 adalah salt rounds

        // Simpan user baru ke database
        const query = 'INSERT INTO users (username, password) VALUES (?, ?)';
        await pool.query(query, [username, hashedPassword]);

        res.status(201).json({ message: 'User berhasil didaftarkan!' });
    } catch (error) {
        // Tangani error jika username sudah ada
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Username sudah digunakan.' });
        }
        // Error server lainnya
        res.status(500).json({ message: 'Terjadi kesalahan pada server', error: error.message });
    }
});

// Endpoint untuk login user
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username dan password harus diisi.' });
    }

    try {
        // Cari user berdasarkan username
        const query = 'SELECT * FROM users WHERE username = ?';
        const [users] = await pool.query(query, [username]);

        // Jika user tidak ditemukan
        if (users.length === 0) {
            return res.status(401).json({ message: 'Username atau password salah.' });
        }

        const user = users[0];

        // Bandingkan password yang diinput dengan hash di database
        const isMatch = await bcrypt.compare(password, user.password);

        // Jika password tidak cocok
        if (!isMatch) {
            return res.status(401).json({ message: 'Username atau password salah.' });
        }

        // Jika password cocok, buat JSON Web Token (JWT)
        const token = jwt.sign(
            { id: user.id, role: user.role }, // Payload token
            process.env.JWT_SECRET, // Kunci rahasia dari file .env
            { expiresIn: '2h' } // Token akan kadaluarsa dalam 2 jam
        );
        
        // Kirim token ke client
        res.json({ message: 'Login berhasil!', token });

    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan pada server', error: error.message });
    }
});


// ====== PUBLIC ROUTES (UNTUK MENGAMBIL DATA) ======
// -----------------------------------------------------------------

// ====== PROTECTED ROUTES (HANYA UNTUK USER YANG LOGIN) ======
// -----------------------------------------------------------------

// Rute tes untuk mendapatkan profil user yang sedang login
app.get('/api/profile', authMiddleware, (req, res) => {
    // Kode di dalam sini hanya akan berjalan jika request berhasil melewati authMiddleware.
    // Karena sudah lolos, kita punya akses ke 'req.user' yang di-set di middleware.
    res.json({
        message: 'Anda berhasil mengakses rute yang dilindungi!',
        user: req.user
    });
});

// Endpoint untuk mengambil semua data outlet
app.get('/api/outlets', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM outlets');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Database query failed', error: error.message });
    }
});

// Endpoint untuk mengambil komentar berdasarkan outlet_id
app.get('/api/comments/:outlet_id', async (req, res) => {
    try {
        const { outlet_id } = req.params;
        const query = 'SELECT * FROM komentar WHERE outlet_id = ? ORDER BY waktu_posting DESC';
        const [rows] = await pool.query(query, [outlet_id]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Database query failed', error: error.message });
    }
});

// Rute untuk USER LOGIN menambah komentar baru
// Dilindungi oleh authMiddleware, jadi hanya user yang login bisa akses
app.post('/api/comments', authMiddleware, async (req, res) => {
    // 1. Ambil user_id dari token yang sudah diverifikasi oleh authMiddleware
    const user_id = req.user.id;

    // 2. Ambil data dari body request
    const { outlet_id, isi_komentar } = req.body;

    // 3. Validasi input
    if (!outlet_id || !isi_komentar) {
        return res.status(400).json({ message: 'Outlet ID dan isi komentar tidak boleh kosong.' });
    }

    try {
        // 4. Masukkan data ke database
        const query = `
            INSERT INTO komentar (outlet_id, user_id, isi_komentar) 
            VALUES (?, ?, ?)
        `;
        const [result] = await pool.query(query, [outlet_id, user_id, isi_komentar]);

        res.status(201).json({ message: 'Komentar berhasil ditambahkan!', commentId: result.insertId });
    } catch (error) {
        // Tangani jika outlet_id tidak valid
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(404).json({ message: 'Outlet dengan ID tersebut tidak ditemukan.' });
        }
        res.status(500).json({ message: 'Gagal menambahkan komentar ke database', error: error.message });
    }
});


// 5. JALANKAN SERVER
// -----------------------------------------------------------------
app.listen(port, () => {
    console.log(`🚀 Server Express berjalan di http://localhost:${port}`);
});