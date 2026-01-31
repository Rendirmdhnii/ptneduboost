const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'rahasia_negara_pahamin_2026';

// ===========================================
// 1. KONEKSI DATABASE (VERSI AMAN)
// ===========================================
const MONGO_URI = 'mongodb+srv://User2003:Rendy%40123@cluster0.ldclokk.mongodb.net/pahamin_db?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ SUKSES: Database Terhubung!"))
    .catch(err => console.error("❌ ERROR: Gagal Konek Database", err));

// ===========================================
// 2. MODEL DATA
// ===========================================
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

// Load Soal
const loadQuestions = () => {
    try {
        const rawData = fs.readFileSync(path.join(__dirname, 'data', 'questions.json'));
        return JSON.parse(rawData);
    } catch (error) { return []; }
};

// ===========================================
// 3. API ROUTES
// ===========================================

app.get('/', (req, res) => {
    res.send('Server PAHAMIN is Running on Vercel!');
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

        res.json({ message: "Pendaftaran berhasil! Silakan login." });
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

// API SOAL
app.get('/api/questions', (req, res) => {
    const { mode, category } = req.query;
    let allQuestions = loadQuestions();
    
    if (mode === 'practice' && category) {
        allQuestions = allQuestions.filter(q => q.category === category);
    }
    
    const safeQuestions = allQuestions.map(q => {
        const { correct, explanation, ...safeData } = q;
        return safeData;
    });
    res.json(safeQuestions);
});

// API SUBMIT
app.post('/api/submit', async (req, res) => {
    const { mode, answers, token } = req.body;
    const allQuestions = loadQuestions();
    
    let userId = null;
    if (token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            userId = decoded.id;
        } catch (e) {}
    }

    let correctCount = 0;
    const results = answers.map(ans => {
        const originalQ = allQuestions.find(q => q.id === ans.id);
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

    let totalScore = 0;
    if (mode === 'full') {
        const totalQuestions = allQuestions.length || 1;
        totalScore = Math.round((correctCount / totalQuestions) * 1000);
    }

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
    if (mode === 'full') {
        if (totalScore >= 700) {
            chanceLabel = "Sangat Kompetitif (Aman)";
            recommendations = ["Teknik Informatika - UI/ITB", "Kedokteran - UNAIR"];
        } else if (totalScore >= 550) {
            chanceLabel = "Kompetitif";
            recommendations = ["Sistem Informasi - UB", "Hukum - UNDIP"];
        } else {
            chanceLabel = "Perbanyak Latihan";
            recommendations = ["Fokus perbaiki materi dasar"];
        }
    }

    res.json({ mode, score: totalScore, correctCount, recommendations, chanceLabel, details: results });
});

// ===========================================
// 4. CONFIG KHUSUS VERCEL (PENTING!)
// ===========================================
// Ini biar Vercel bisa menjalankan servernya
module.exports = app;

// Ini biar tetep bisa jalan di laptop (node server.js)
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server jalan di http://localhost:${PORT}`);
    });
}