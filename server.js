const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());

// 1. Beritahu server untuk melayani file statis dari folder 'public'
app.use(express.static(path.join(process.cwd(), 'public')));

// 2. Load Data Soal
const questionsPath = path.join(process.cwd(), 'data', 'questions.json');
let questionsData = [];
try {
    questionsData = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));
} catch (e) {
    console.error("Gagal muat data/questions.json");
}

// 3. API Routes
app.get('/api/questions', (req, res) => {
    const { mode, category } = req.query;
    let result = [...questionsData];
    if (mode === 'practice' && category) {
        result = result.filter(q => q.category === category).slice(0, 20);
    } else if (mode === 'full') {
        result = result.slice(0, 180);
    }
    res.json(result);
});

app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    res.json({ message: "Login Berhasil", user: { name: "User", school: "SMA", email } });
});

// 4. KUNCI UTAMA: Kirim index.html jika tidak ada rute yang cocok (Fallback)
app.get('*', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server jalan di port ${PORT}`));