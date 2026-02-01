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
        // MENERIMA PARAMETER 'LIMIT' DARI FRONTEND
        const { mode, category, limit } = req.query;
        let allQuestions = getQuestions();
        let result = [];

        // MODE LATIHAN (PER SUBTES)
        if (mode === 'practice') {
            const keyword = category ? category.split(' ')[0].toLowerCase() : '';
            
            // Filter berdasarkan kata kunci
            const filtered = allQuestions.filter(q => 
                q.category && typeof q.category === 'string' && q.category.toLowerCase().includes(keyword)
            );

            // Tentukan jumlah soal (Default 20 jika tidak diminta)
            const qty = limit ? parseInt(limit) : 20;

            if (filtered.length > 0) {
                result = filtered.sort(() => 0.5 - Math.random()).slice(0, qty);
            } else {
                // Plan B: Ambil acak jika kategori kosong
                result = allQuestions.sort(() => 0.5 - Math.random()).slice(0, qty);
            }
        } 
        // MODE FULL (SIMULASI UTBK - 155 Soal Total)
        else {
            result = allQuestions.slice(0, 155); 
        }
        
        res.json(result);

    } catch (error) {
        res.json([]);
    }
});

app.post('/api/auth/login', (req, res) => {
    res.json({ message: "Login OK", user: { name: "Peserta", email: req.body.email } });
});

app.get('/', (req, res) => {
    const htmlPath = path.join(process.cwd(), 'index.html');
    if (fs.existsSync(htmlPath)) res.sendFile(htmlPath);
    else res.status(404).send("File index.html tidak ditemukan.");
});

module.exports = app;