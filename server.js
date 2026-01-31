const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'rahasia_negara_pahamin_2026';

// === BAGIAN DIAGNOSA JSON ===
let databaseSoal = [];
let statusSoal = "Belum dimuat";

try {
    // Kita coba paksa baca file JSON-nya
    databaseSoal = require('./data/questions.json');
    statusSoal = "✅ SUKSES: " + databaseSoal.length + " soal berhasil dimuat.";
} catch (error) {
    // Kalau error, kita catat errornya apa
    console.error("Gagal baca JSON:", error);
    statusSoal = "❌ ERROR JSON: " + error.message;
    
    // Data Darurat (Supaya website tidak blank)
    databaseSoal = [
        {
            "id": 1,
            "category": "Pengetahuan Kuantitatif",
            "text": "Darurat! File questions.json kamu error. Coba cek syntax JSON-nya.",
            "options": { "A": "Cek", "B": "File", "C": "JSON", "D": "Kamu", "E": "Sekarang" },
            "correct": "C",
            "explanation": "File JSON harus valid formatnya."
        }
    ];
}

// 1. KONEKSI DATABASE
const MONGO_URI = 'mongodb+srv://User2003:Rendy123@cluster0.ldclokk.mongodb.net/pahamin_db?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ Database Terhubung!"))
    .catch(err => console.error("❌ Gagal Konek Database", err));

// 2. MODEL DATA
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    school: { type: String, default: '-' },
    createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', UserSchema);

const ResultSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    examType: String,
    score: Number,
    correctCount: Number,
    date: { type: Date, default: Date.now },
    details: Array
});
const Result = mongoose.model('Result', ResultSchema);

// Middleware
app.use(cors({ origin: '*', methods: ['GET', 'POST'] }));
app.use(bodyParser.json());
app.use(express.static('public'));

// 3. API ROUTES

// HALAMAN UTAMA (UNTUK CEK STATUS)
app.get('/', (req, res) => {
    res.json({
        status: "Server Online",
        pesan_soal: statusSoal, // <--- INI NANTI KITA BACA
        jumlah_soal: databaseSoal.length
    });
});

app.get('/api/questions', (req, res) => {
    const { mode, category } = req.query;
    let filteredQuestions = databaseSoal; 
    
    if (mode === 'practice' && category) {
        filteredQuestions = databaseSoal.filter(q => q.category === category);
    }
    
    const safeQuestions = filteredQuestions.map(q => {
        const { correct, explanation, ...safeData } = q;
        return safeData;
    });
    res.json(safeQuestions);
});

// AUTH & SUBMIT (Sama seperti sebelumnya)
app.post('/api/auth/register', async (req, res) => {
    const { username, email, password, school } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: "Email sudah terdaftar!" });
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, email, password: hashedPassword, school });
        await newUser.save();
        res.json({ message: "Pendaftaran berhasil!" });
    } catch (err) { res.status(500).json({ message: "Server Error saat Register." }); }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "Email tidak ditemukan!" });
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Password salah!" });
        const token = jwt.sign({ id: user._id, name: user.username }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { name: user.username, school: user.school } });
    } catch (err) { res.status(500).json({ message: "Server Error saat Login." }); }
});

app.post('/api/submit', async (req, res) => {
    const { mode, answers, token } = req.body;
    let userId = null;
    if (token) { try { const decoded = jwt.verify(token, JWT_SECRET); userId = decoded.id; } catch (e) {} }

    let correctCount = 0;
    const results = answers.map(ans => {
        const originalQ = databaseSoal.find(q => q.id === ans.id);
        if (!originalQ) return null;
        const isCorrect = ans.choice === originalQ.correct;
        if (isCorrect) correctCount++;
        return { id: ans.id, userChoice: ans.choice, correctChoice: originalQ.correct, isCorrect: isCorrect, explanation: originalQ.explanation };
    }).filter(item => item !== null);

    let totalScore = 0;
    const totalQuestions = databaseSoal.length || 1;
    const divisor = mode === 'full' ? totalQuestions : answers.length;
    totalScore = Math.round((correctCount / (divisor || 1)) * 1000);

    if (userId) { try { const newHistory = new Result({ userId, examType: mode, score: totalScore, correctCount, details: results }); await newHistory.save(); } catch (err) {} }

    let chanceLabel = totalScore >= 700 ? "Sangat Kompetitif" : totalScore >= 500 ? "Kompetitif" : "Perlu Belajar Lagi";
    res.json({ mode, score: totalScore, correctCount, chanceLabel, details: results });
});

// Config Vercel
module.exports = app;
if (require.main === module) { app.listen(PORT, () => console.log(`Server jalan di http://localhost:${PORT}`)); }