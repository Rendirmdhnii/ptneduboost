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

// 2. API ROUTES (Untuk Soal & Login)
app.get('/api/questions', (req, res) => {
    const { mode, category } = req.query;
    let result = getQuestions();
    
    if (mode === 'practice' && category) {
        const filtered = result.filter(q => 
            q.category && q.category.toLowerCase().includes(category.toLowerCase())
        );
        // Anti-Macet: Ambil acak jika kategori kosong
        if (filtered.length > 0) result = filtered.slice(0, 20);
        else result = result.sort(() => 0.5 - Math.random()).slice(0, 20);
    } else if (mode === 'full') {
        result = result.slice(0, 180);
    }
    res.json(result);
});

app.post('/api/auth/login', (req, res) => {
    res.json({ message: "Login OK", user: { name: "Peserta", email: req.body.email } });
});

// 3. ROUTE HALAMAN DEPAN (FIX CANNOT GET /)
// Ini yang bikin website kamu muncul!
app.get('/', (req, res) => {
    const htmlPath = path.join(process.cwd(), 'index.html');
    if (fs.existsSync(htmlPath)) {
        res.sendFile(htmlPath);
    } else {
        res.status(404).send("Error: File index.html tidak ditemukan di root project!");
    }
});

module.exports = app;