const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// ⚠️ PERUBAHAN PENTING:
// Sekarang membaca file 'database_soal.json', bukan 'questions.json' lagi.
const questionsPath = path.join(process.cwd(), 'data', 'database_soal.json');

// Fungsi Membaca Database
function getQuestions() {
    try {
        if (fs.existsSync(questionsPath)) {
            const data = fs.readFileSync(questionsPath, 'utf8');
            return JSON.parse(data);
        }
        return [];
    } catch (e) {
        console.error("Gagal membaca database:", e);
        return []; 
    }
}

// API Utama
app.get('/api/questions', (req, res) => {
    try {
        const { mode, category, limit } = req.query;
        let allQuestions = getQuestions();
        let result = [];

        // --- MODE LATIHAN (PER SUBTES) ---
        if (mode === 'practice') {
            const targetCategory = category ? category.toLowerCase() : '';
            
            // Filter Spesifik (Strict)
            const filtered = allQuestions.filter(q => 
                q.category && 
                typeof q.category === 'string' && 
                q.category.toLowerCase().includes(targetCategory)
            );

            const qty = limit ? parseInt(limit) : 20;

            if (filtered.length > 0) {
                result = filtered.sort(() => 0.5 - Math.random()).slice(0, qty);
            } else {
                result = allQuestions.sort(() => 0.5 - Math.random()).slice(0, qty);
            }
        } 
        // --- MODE FULL (SIMULASI UTBK 180 SOAL) ---
        else {
            // Kita susun ulang agar rapi (TPS di atas, Literasi di bawah)
            const orderOfExam = [
                "penalaran umum", 
                "penalaran induktif", 
                "penalaran deduktif", 
                "penalaran kuantitatif",
                "pengetahuan & pemahaman umum", 
                "pemahaman bacaan & menulis", 
                "pengetahuan kuantitatif",
                "literasi bahasa indonesia", 
                "literasi bahasa inggris", 
                "penalaran matematika"
            ];

            let sortedExam = [];
            let takenIds = new Set(); 

            // 1. Ambil soal berdasarkan urutan kategori
            orderOfExam.forEach(catKey => {
                const subtestQuestions = allQuestions.filter(q => 
                    q.category && 
                    q.category.toLowerCase().includes(catKey) &&
                    !takenIds.has(q.id)
                );
                // Masukkan urut (tanpa acak)
                subtestQuestions.forEach(q => {
                    sortedExam.push(q);
                    takenIds.add(q.id);
                });
            });

            // 2. Masukkan sisa soal yang mungkin tidak tertangkap filter di atas
            const remaining = allQuestions.filter(q => !takenIds.has(q.id));
            sortedExam.push(...remaining);

            // 3. Batasi 180 (Sesuai database asli kamu)
            result = sortedExam.slice(0, 180);
            
            console.log(`Mengirim ${result.length} soal untuk simulasi full.`);
        }
        
        res.json(result);

    } catch (error) {
        console.error("Server Error:", error);
        res.json([]);
    }
});

// API Login Mockup
app.post('/api/auth/login', (req, res) => {
    res.json({ message: "Login OK", user: { name: "Peserta", email: req.body.email } });
});

// Route Halaman Depan
app.get('/', (req, res) => {
    const htmlPath = path.join(process.cwd(), 'index.html');
    if (fs.existsSync(htmlPath)) {
        res.sendFile(htmlPath);
    } else {
        res.status(404).send("Error: File index.html tidak ditemukan.");
    }
});

module.exports = app;