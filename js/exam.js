// === MESIN UJIAN (OFFLINE MODE) ===

// Konfigurasi Sesi (Blocking Time)
const SESI_CONFIG = {
    1: { name: "TPS", duration: 90, startIdx: 0, endIdx: 60 },
    2: { name: "Literasi", duration: 75, startIdx: 60, endIdx: 120 },
    3: { name: "Matematika", duration: 30, startIdx: 120, endIdx: 180 }
};

let currentSession = 1;
let examTimer;

function startFullSimulation() {
    // Pindah Tampilan
    document.getElementById('view-dashboard').classList.add('hidden');
    document.getElementById('view-ujian').classList.remove('hidden');
    
    // Mulai Sesi 1
    loadSession(1);
}

function loadSession(sessionNum) {
    currentSession = sessionNum;
    const config = SESI_CONFIG[sessionNum];

    if(!config) {
        finishExam();
        return;
    }

    alert(`MASUK SESI ${sessionNum}: ${config.name}\nWaktu: ${config.duration} Menit`);
    
    // Render Soal Pertama Sesi Ini
    renderQuestion(config.startIdx);
    
    // Jalankan Timer
    startTimer(config.duration * 60);
}

function renderQuestion(index) {
    // AMBIL DATA DARI VARIABLE GLOBAL (Bukan Fetch)
    const data = BANK_SOAL[index];
    
    if(!data) return; // Cegah error kalau index ga ada

    const container = document.querySelector('.soal-wrapper') || document.getElementById('question-container');
    if(container) {
        container.innerHTML = `
            <div style="margin-bottom:20px;">
                <h3>Soal No. ${index + 1} (${data.category})</h3>
                <p style="font-size:1.1rem; line-height:1.6;">${data.question}</p>
            </div>
            <div class="options-list">
                ${(data.options || []).map((opt, i) => `
                    <button class="option-btn" onclick="selectAnswer(this)">${String.fromCharCode(65+i)}. ${opt}</button>
                `).join('')}
            </div>
        `;
    }
}

function startTimer(seconds) {
    clearInterval(examTimer);
    let timeLeft = seconds;
    const display = document.getElementById('timer-display') || document.querySelector('.timer-badge');

    examTimer = setInterval(() => {
        timeLeft--;
        if(display) {
            const m = Math.floor(timeLeft / 60);
            const s = timeLeft % 60;
            display.innerText = `${m}:${s < 10 ? '0'+s : s}`;
        }

        if(timeLeft <= 0) {
            clearInterval(examTimer);
            alert("Waktu Habis! Lanjut sesi berikutnya.");
            loadSession(currentSession + 1);
        }
    }, 1000);
}

function finishExam() {
    clearInterval(examTimer);
    alert("Selamat! Simulasi Selesai.");
    location.reload();
}

function selectAnswer(btn) {
    // UI Only: Ganti warna tombol biar kelihatan dipilih
    const parent = btn.parentElement;
    parent.querySelectorAll('.option-btn').forEach(b => b.style.backgroundColor = 'white');
    btn.style.backgroundColor = '#dbeafe'; // Biru muda
}