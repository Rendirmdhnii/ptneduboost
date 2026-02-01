const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Load Database Soal dengan process.cwd() agar terbaca di Vercel
const questionsPath = path.join(process.cwd(), 'data', 'questions.json');

function getQuestions() {
  try {
    if (fs.existsSync(questionsPath)) {
      return JSON.parse(fs.readFileSync(questionsPath, 'utf8'));
    }
    return [];
  } catch (e) {
    console.error("Error baca data:", e);
    return [];
  }
}

app.get('/api/questions', (req, res) => {
  const { mode, category } = req.query;
  let result = getQuestions();

  if (mode === 'practice' && category) {
    // Cari soal berdasarkan teks kategori
    const filtered = result.filter(q => 
      q.category && q.category.toLowerCase().includes(category.toLowerCase())
    );
    
    // LOGIKA ANTI MACET: Jika kosong, ambil 20 soal acak
    if (filtered.length > 0) {
      result = filtered.slice(0, 20);
    } else {
      console.log('Kategori kosong, ambil acak');
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

module.exports = app;
