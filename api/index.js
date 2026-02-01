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

// 2. API ROUTES
app.get('/api/questions', (req, res) => {
    const { mode, category } = req.query;
    let result = getQuestions();
    
    if (mode === 'practice' && category) {
        // --- LOGIKA PENCARIAN PINTAR (KEYWORD MATCHING) ---
        // Masalah: Database cuma punya "Penalaran Umum", tapi User minta "Penalaran Induktif"
        // Solusi: Kita ambil kata depannya saja. Contoh: "Penalaran"
        
        const mainKeyword = category.split(' ')[0]; // Ambil kata pertama (misal: "Penalaran", "Literasi", "Pengetahuan")

        const filtered = result.filter(q => 
            q.category && q.category.includes(mainKeyword)
        );

        // Jika ketemu soal yang cocok kata depannya, tampilkan.
        if (filtered.length > 0) {
            // Acak urutannya supaya gak bosan, ambil 20
            result = filtered.sort(() => 0.5 - Math.random()).slice(0, 20);
        } else {
            // FALLBACK: Kalau beneran gak ada, ambil soal acak apapun (daripada error)
            console.log(`Soal kategori ${category} kosong. Mengambil acak.`);
            result = result.sort(() => 0.5 - Math.random()).slice(0, 20);
        }

    } else if (mode === 'full') {
        result = result.slice(0, 180);
    }
    
    res.json(result);
});

app.post('/api/auth/login', (req, res) => {
    res.json({ message: "Login OK", user: { name: "Peserta", email: req.body.email } });
});

// 3. ROUTE UTAMA (Agar Web Muncul)
app.get('/', (req, res) => {
    const htmlPath = path.join(process.cwd(), 'index.html');
    if (fs.existsSync(htmlPath)) {
        res.sendFile(htmlPath);
    } else {
        res.status(404).send("File index.html tidak ditemukan.");
    }
});

module.exports = app;