const fs = require('fs');
const path = require('path');

// Cari file database
const dbPath = path.join(__dirname, 'data', 'questions.json');

try {
    console.log("Membaca database...");
    const rawData = fs.readFileSync(dbPath, 'utf8');
    let questions = JSON.parse(rawData);

    // Daftar Prioritas (TPS dulu, baru Literasi)
    const priority = [
        "penalaran umum",
        "penalaran induktif",
        "penalaran deduktif",
        "penalaran kuantitatif",
        "pengetahuan & pemahaman umum",
        "pemahaman bacaan & menulis",
        "pengetahuan kuantitatif",
        "literasi bahasa indonesia",
        "literasi bahasa inggris",
        "penalaran matematika"
    ];

    // Urutkan Soal
    questions.sort((a, b) => {
        const catA = a.category ? a.category.toLowerCase() : '';
        const catB = b.category ? b.category.toLowerCase() : '';
        
        let idxA = priority.findIndex(p => catA.includes(p));
        let idxB = priority.findIndex(p => catB.includes(p));

        if (idxA === -1) idxA = 99;
        if (idxB === -1) idxB = 99;

        return idxA - idxB;
    });

    // Nomori Ulang ID (1 sampai Selesai)
    questions = questions.map((q, index) => {
        q.id = index + 1; 
        return q;
    });

    // Simpan Perubahan (WAJIB)
    fs.writeFileSync(dbPath, JSON.stringify(questions, null, 2));
    console.log(`✅ SUKSES! ${questions.length} soal sudah diurutkan & ID diperbaiki (1-${questions.length}).`);

} catch (error) {
    console.error("❌ Gagal:", error.message);
}