const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const questionsPath = path.join(process.cwd(), 'data', 'questions.json');

function getQuestions() {
    try {
        if (fs.existsSync(questionsPath)) {
            return JSON.parse(fs.readFileSync(questionsPath, 'utf8'));
        }
        return [];
    } catch (e) { return []; }
}

app.get('/api/questions', (req, res) => {
    try {
        const { mode, category, limit } = req.query;
        let allQuestions = getQuestions();
        let result = [];

        // --- MODE LATIHAN (PER SUBTES) ---
        if (mode === 'practice') {
            // Kita ambil nama kategori LENGKAP dari frontend (kecilkan huruf biar aman)
            // Contoh: frontend kirim "Literasi Bahasa Inggris", kita cari persis itu.
            const targetCategory = category ? category.toLowerCase() : '';
            
            // FILTER SPESIFIK (STRICT MODE)
            // Hanya ambil soal yang label kategorinya mengandung nama LENGKAP tadi.
            // Jadi "Literasi Bahasa Inggris" TIDAK AKAN cocok dengan "Literasi Bahasa Indonesia".
            const filtered = allQuestions.filter(q => 
                q.category && 
                typeof q.category === 'string' && 
                q.category.toLowerCase().includes(targetCategory)
            );

            // Tentukan jumlah soal sesuai permintaan (Limit)
            const qty = limit ? parseInt(limit) : 20;

            if (filtered.length > 0) {
                // Acak urutan soal, lalu ambil sejumlah qty
                result = filtered.sort(() => 0.5 - Math.random()).slice(0, qty);
            } else {
                // INFO DEBUG: Jika kosong, kita kasih tau di console server (bisa dicek di logs Vercel)
                console.log(`⚠️ Soal untuk kategori '${category}' tidak ditemukan persis. Cek ejaan di database.`);
                
                // PLAN B (Darurat): Ambil acak daripada stuck loading (Opsional, bisa dihapus kalau mau strict banget)
                // Kalau kamu yakin datanya lengkap, bagian ini sebenarnya jarang tereksekusi.
                result = allQuestions.sort(() => 0.5 - Math.random()).slice(0, qty);
            }
        } 
        // --- MODE FULL (SIMULASI UTBK) ---
        else {
            // Ambil 155 Soal acak dari semua kategori
            result = allQuestions.slice(0, 155); 
        }
        
        res.json(result);

    } catch (error) {
        console.error("Server Error:", error);
        res.json([]);
    }
});

// Login Mockup
app.post('/api/auth/login', (req, res) => {
    res.json({ message: "Login OK", user: { name: "Peserta", email: req.body.email } });
});

// Serve Frontend
app.get('/', (req, res) => {
    const htmlPath = path.join(process.cwd(), 'index.html');
    if (fs.existsSync(htmlPath)) res.sendFile(htmlPath);
    else res.status(404).send("Index html not found");
});

module.exports = app;