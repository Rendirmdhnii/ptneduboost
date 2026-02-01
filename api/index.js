const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// 1. DATABASE SOAL
const questionsPath = path.join(process.cwd(), 'data', 'questions.json');

function getQuestions() {
    try {
        if (fs.existsSync(questionsPath)) {
            return JSON.parse(fs.readFileSync(questionsPath, 'utf8'));
        }
        return [];
    } catch (e) { return []; }
}

// 2. API UTAMA
app.get('/api/questions', (req, res) => {
    try {
        const { mode, category } = req.query;
        let allQuestions = getQuestions();
        let result = [];

        // JIKA MODE LATIHAN (PER SUBTES)
        if (mode === 'practice') {
            const keyword = category ? category.split(' ')[0].toLowerCase() : '';

            // CARA 1: Cari yang kategorinya mengandung kata kunci (Aman dari crash)
            const filtered = allQuestions.filter(q => 
                q.category && typeof q.category === 'string' && q.category.toLowerCase().includes(keyword)
            );

            // CARA 2 (PLAN B): Jika hasil filter kosong, ambil 20 soal ACAK dari semua data
            if (filtered.length > 0) {
                result = filtered.sort(() => 0.5 - Math.random()).slice(0, 20);
            } else {
                console.log("Filter kosong, mengaktifkan Plan B (Soal Acak).");
                result = allQuestions.sort(() => 0.5 - Math.random()).slice(0, 20);
            }
        } 
        // JIKA MODE FULL
        else {
            result = allQuestions.slice(0, 180);
        }
        
        // Kirim hasil (Jangan pernah kirim kosong/error)
        res.json(result);

    } catch (error) {
        console.error("Server Error:", error);
        // PLAN C (DARURAT): Jika server error, kirim array kosong agar frontend tidak stuck
        res.json([]);
    }
});

// API LOGIN
app.post('/api/auth/login', (req, res) => {
    res.json({ message: "Login OK", user: { name: "Peserta", email: req.body.email } });
});

// ROUTE HALAMAN DEPAN
app.get('/', (req, res) => {
    const htmlPath = path.join(process.cwd(), 'index.html');
    if (fs.existsSync(htmlPath)) res.sendFile(htmlPath);
    else res.status(404).send("File index.html tidak ditemukan.");
});

module.exports = app;