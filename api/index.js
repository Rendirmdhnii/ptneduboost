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

        if (mode === 'practice') {
            const catLower = category ? category.toLowerCase() : '';
            let filtered = [];

            // --- LOGIKA FILTER PINTAR ---
            
            // KASUS 1: LITERASI (Harus Spesifik agar tidak campur)
            if (catLower.includes('literasi')) {
                // Cari yang mengandung nama LENGKAP. 
                // Contoh: "literasi bahasa inggris" hanya akan cocok dengan soal yang labelnya ada "inggris"-nya.
                filtered = allQuestions.filter(q => 
                    q.category && q.category.toLowerCase().includes(catLower)
                );
            } 
            // KASUS 2: PENALARAN (Boleh Umum)
            // Agar "Penalaran Induktif" tetap bisa menarik soal "Penalaran Umum"
            else {
                const firstWord = catLower.split(' ')[0]; // Ambil "penalaran" saja
                filtered = allQuestions.filter(q => 
                    q.category && q.category.toLowerCase().includes(firstWord)
                );
            }

            // --- ATUR JUMLAH SOAL ---
            const qty = limit ? parseInt(limit) : 20;

            if (filtered.length > 0) {
                result = filtered.sort(() => 0.5 - Math.random()).slice(0, qty);
            } else {
                // Plan B: Jika kosong, ambil acak (Daripada error)
                console.log(`Soal spesifik ${category} kosong. Mengambil acak.`);
                result = allQuestions.sort(() => 0.5 - Math.random()).slice(0, qty);
            }
        } 
        else {
            // MODE FULL (155 Soal)
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