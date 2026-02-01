const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// 1. Load Database Soal
const questionsPath = path.join(__dirname, 'data', 'questions.json');
let questionsData = [];

try {
    if (fs.existsSync(questionsPath)) {
        questionsData = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));
        console.log(`✅ Berhasil memuat ${questionsData.length} soal.`);
    } else {
        console.error("❌ File data/questions.json tidak ditemukan!");
    }
} catch (e) {
    console.error("❌ Gagal membaca database soal:", e.message);
}

// 2. API Pencarian Soal (LOGIKA BARU)
app.get('/api/questions', (req, res) => {
    const { mode, category } = req.query;
    let result = [...questionsData];
    
    // Jika mode latihan dan ada kategori yang dipilih
    if (mode === 'practice' && category) {
        // FILTER PINTAR: Mencari kata yang mirip (misal: "Penalaran" akan cocok dengan "Penalaran Umum")
        const filtered = result.filter(q => 
            q.category && q.category.toLowerCase().includes(category.toLowerCase())
        );

        // LOGIKA ANTI KOSONG:
        // Jika soal spesifik ketemu, pakai itu.
        if (filtered.length > 0) {
            result = filtered.slice(0, 20);
        } else {
            // Jika KOSONG (misal kategori belum ada di DB), ambil 20 soal acak dari yang ada
            console.log(`⚠️ Soal kategori '${category}' kosong. Mengambil soal acak.`);
            result = result.sort(() => 0.5 - Math.random()).slice(0, 20);
        }
    } 
    // Jika mode Full (Simulasi UTBK)
    else if (mode === 'full') {
        result = result.slice(0, 180);
    }

    res.json(result);
});

// 3. API Login (Tetap sama)
app.post('/api/auth/login', (req, res) => {
    const { email } = req.body;
    res.json({ message: "Login Berhasil", user: { name: "Peserta", school: "Sekolah", email } });
});

// 4. Fallback (Penting untuk Vercel)
app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (req, res) => {
    // Cek apakah ada folder public, jika tidak coba root
    const publicPath = path.join(__dirname, 'public', 'index.html');
    if (fs.existsSync(publicPath)) {
        res.sendFile(publicPath);
    } else {
        res.sendFile(path.join(__dirname, 'index.html'));
    }
});

// Export untuk Vercel
module.exports = app;