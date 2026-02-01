const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());

// INI KUNCINYA: Memberitahu Express untuk melayani file statis dari folder 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Load Database Soal
const questionsPath = path.join(__dirname, 'data', 'questions.json');
let questionsData = [];

try {
    const fileContent = fs.readFileSync(questionsPath, 'utf8');
    questionsData = JSON.parse(fileContent);
    console.log(`✅ Database Soal Terhubung: ${questionsData.length} butir soal.`);
} catch (err) {
    console.error("❌ Gagal membaca data/questions.json. Pastikan file ada!", err.message);
}

// Database User Sementara (Disimpan di memori RAM)
// Kalau server restart, user akan hilang (Cukup untuk simulasi/demo)
let users = [
    { id: 1, name: "Admin Demo", email: "admin@gmail.com", password: "123", school: "Sekolah Admin" }
];

// ==========================================
// 2. API OTENTIKASI (LOGIN & REGISTER)
// ==========================================

// A. REGISTER
app.post('/api/auth/register', (req, res) => {
    const { username, email, password, school } = req.body;

    // Validasi sederhana
    if (!username || !email || !password) {
        return res.status(400).json({ message: "Data tidak lengkap!" });
    }

    // Cek apakah email sudah ada
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
        return res.status(400).json({ message: "Email sudah terdaftar!" });
    }

    // Simpan user baru
    const newUser = {
        id: Date.now(),
        name: username,
        email,
        password,
        school: school || "Umum"
    };
    users.push(newUser);

    console.log(`👤 User Baru Terdaftar: ${username} (${email})`);
    res.json({ message: "Registrasi Berhasil", user: newUser });
});

// B. LOGIN
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;

    console.log(`🔐 Percobaan Login: ${email}`);

    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
        res.json({
            message: "Login Berhasil",
            token: "fake-jwt-token-" + Date.now(),
            user: {
                name: user.name,
                email: user.email,
                school: user.school
            }
        });
    } else {
        // FITUR DEMO: Kalau malas daftar, ketik email apa saja asal password ada, tetap masuk
        // Hapus bagian 'else' di dalam ini kalau mau loginnya ketat harus daftar dulu.
        if (email && password) {
             const demoUser = { name: "Peserta Tamu", school: "Umum", email };
             console.log("⚠️ Login User Tamu (Auto-Allow)");
             return res.json({ 
                message: "Login Demo Berhasil", 
                token: "demo-token", 
                user: demoUser 
            });
        }
        
        res.status(401).json({ message: "Email atau Password Salah!" });
    }
});

// ==========================================
// 3. API SOAL & UJIAN
// ==========================================

// AMBIL SOAL (Filter Kategori & Acak)
app.get('/api/questions', (req, res) => {
    const { mode, category } = req.query;
    
    // Pastikan database soal ada
    if (!questionsData.length) {
        return res.status(500).json({ message: "Database soal kosong/rusak." });
    }

    let result = [...questionsData];

    // Filter Kategori (Jika mode latihan)
    if (mode === 'practice' && category) {
        result = result.filter(q => q.category === category);
        
        // Acak urutan soal
        result = result.sort(() => 0.5 - Math.random());
        
        // Ambil maksimal 20 soal
        result = result.slice(0, 20);
    } 
    // Jika mode full tryout, ambil semua (atau batasi 180)
    else if (mode === 'full') {
        result = result.slice(0, 180);
    }

    // Hapus kunci jawaban sebelum dikirim ke frontend (biar aman)
    const secureQuestions = result.map(q => {
        const { correct, explanation, ...rest } = q;
        return rest;
    });

    console.log(`📤 Mengirim ${secureQuestions.length} soal kategori '${category || 'Semua'}'`);
    res.json(secureQuestions);
});

// SUBMIT JAWABAN (Hitung Skor)
app.post('/api/submit', (req, res) => {
    const { answers } = req.body;
    
    if (!answers || !Array.isArray(answers)) {
        return res.status(400).json({ message: "Format jawaban salah" });
    }

    let correctCount = 0;
    
    answers.forEach(ans => {
        // Cari soal asli di database berdasarkan ID
        const originalQuestion = questionsData.find(q => q.id === ans.id);
        
        // Cek jawaban
        if (originalQuestion && originalQuestion.correct === ans.choice) {
            correctCount++;
        }
    });

    // Hitung Skor (Skala 1000)
    const totalSoal = answers.length || 1;
    const score = Math.round((correctCount / totalSoal) * 1000);
    
    let chanceLabel = "Perlu Belajar Lagi";
    if (score > 700) chanceLabel = "Peluang Tinggi Lolos PTN!";
    else if (score > 500) chanceLabel = "Cukup Bagus, Tingkatkan!";

    console.log(`📝 Siswa Submit: Skor ${score} (${correctCount}/${totalSoal})`);
    
    res.json({
        score,
        correctCount,
        totalQuestions: totalSoal,
        chanceLabel
    });
});

// PENTING: Jika bukan memanggil API, maka kirimkan index.html agar website muncul
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ==========================================
// 4. JALANKAN SERVER
// ==========================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server siap di port ${PORT}`);
    console.log(`🔗 Coba buka di browser: http://localhost:${PORT}/api/questions`);
});