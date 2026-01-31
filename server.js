const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// === BAGIAN INI YANG KITA PERBAIKI ===
// Kita pakai 'require' supaya Vercel otomatis membawa file ini
let databaseSoal = [];
try {
    databaseSoal = require('./data/questions.json');
    console.log("✅ Soal berhasil dimuat: " + databaseSoal.length + " butir.");
} catch (e) {
    console.error("❌ Gagal load soal:", e);
    // Data cadangan kalau file gagal dibaca (supaya tidak error)
    databaseSoal = [
        {
            "id": 1,
            "category": "Pengetahuan Kuantitatif",
            "text": "Jika 2x + 3 = 9, berapakah nilai x?",
            "options": { "A": "1", "B": "2", "C": "3", "D": "4", "E": "5" },
            "correct": "C",
            "explanation": "2x = 6, maka x = 3"
        }
    ];
}

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'rahasia_negara_pahamin_2026';

// 1. KONEKSI DATABASE (Password Baru Kamu)
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

app.get('/', (req, res) => {
    res.send('Server PAHAMIN is Running! Soal Loaded: ' + databaseSoal.length);
});

// REGISTER
app.post('/api/auth/register', async (req, res) => {
    const { username, email, password, school } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: "Email sudah terdaftar!" });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, email, password: hashedPassword, school });
        await newUser.save();

        res.json({ message: "Pendaftaran berhasil!" });
    } catch (err) {
        res.status(500).json({ message: "Server Error saat Register." });
    }
});

// LOGIN
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "Email tidak ditemukan!" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Password salah!" });

        const token = jwt.sign({ id: user._id, name: user.username }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { name: user.username, school: user.school } });
    } catch (err) {
        res.status(500).json({ message: "Server Error saat Login." });
    }
});

// API AMBIL SOAL
app.get('/api/questions', (req, res) => {
    const { mode, category } = req.query;
    let filteredQuestions = databaseSoal; // Pakai variable global
    
    // Filter kategori kalau mode latihan
    if (mode === 'practice' && category) {
        filteredQuestions = databaseSoal.filter(q => q.category === category);
    }
    
    // Keamanan: Jangan kirim kunci jawaban ke frontend
    const safeQuestions = filteredQuestions.map(q => {
        const { correct, explanation, ...safeData } = q;
        return safeData;
    });
    res.json(safeQuestions);
});

// API KIRIM JAWABAN (SUBMIT)
app.post('/api/submit', async (req, res) => {
    const { mode, answers, token } = req.body;
    
    let userId = null;
    if (token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            userId = decoded.id;
        } catch (e) {}
    }

    let correctCount = 0;
    const results = answers.map(ans => {
        const originalQ = databaseSoal.find(q => q.id === ans.id);
        if (!originalQ) return null;
        
        const isCorrect = ans.choice === originalQ.correct;
        if (isCorrect) correctCount++;
        
        return {
            id: ans.id,
            userChoice: ans.choice,
            correctChoice: originalQ.correct,
            isCorrect: isCorrect,
            explanation: originalQ.explanation
        };
    }).filter(item => item !== null);

    // Hitung Skor (Skala 1000 ala UTBK)
    let totalScore = 0;
    const totalQuestions = databaseSoal.length || 1; 
    // Kalau mode practice, pembaginya jumlah soal yg dikerjakan saja
    const divisor = mode === 'full' ? totalQuestions : answers.length;
    
    totalScore = Math.round((correctCount / (divisor || 1)) * 1000);

    // Simpan History ke Database
    if (userId) {
        try {
            const newHistory = new Result({
                userId, examType: mode, score: totalScore, correctCount, details: results
            });
            await newHistory.save();
        } catch (err) { console.error("Gagal simpan history:", err); }
    }

    let recommendations = [];
    let chanceLabel = "";
    if (totalScore >= 700) {
        chanceLabel = "Sangat Kompetitif (Aman)";
    } else if (totalScore >= 500) {
        chanceLabel = "Kompetitif";
    } else {
        chanceLabel = "Perlu Belajar Lagi";
    }

    res.json({ mode, score: totalScore, correctCount, chanceLabel, details: results });
});

// Config Vercel
module.exports = app;
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server jalan di http://localhost:${PORT}`);
    });
}