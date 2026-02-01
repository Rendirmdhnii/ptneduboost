let appState = {
    mode: null, questions: [], currentIndex: 0,
    answers: {}, timerInterval: null, endTime: null,
    user: { name: '', school: '' }
};

function saveUserInfo() {
    const name = document.getElementById('input-name').value;
    const school = document.getElementById('input-school').value;
    if (!name || !school) return alert("Mohon isi Nama dan Asal Sekolah!");
    
    appState.user = { name, school };
    document.getElementById('display-name').innerText = name.toUpperCase();
    document.getElementById('display-school').innerText = school.toUpperCase();
    document.getElementById('auth-overlay').classList.add('hidden');
    document.getElementById('main-header').classList.remove('hidden');
    document.getElementById('landing-page').classList.remove('hidden');
}

function confirmPracticeStart() {
    const cat = document.getElementById('chapter-dropdown').value;
    fetchQuestions('practice', cat);
}
function startFullMode() { fetchQuestions('full'); }

async function fetchQuestions(mode, cat = null) {
    let url = `http://localhost:3000/api/questions?mode=${mode}` + (cat ? `&category=${cat}` : '');

    try {
        const res = await fetch(url);
        if(!res.ok) throw new Error("Gagal koneksi ke server");
        
        appState.questions = await res.json();
        
        if(appState.questions.length === 0) {
            alert("Soal tidak ditemukan atau database kosong.");
            return;
        }

        appState.mode = mode; appState.answers = {}; appState.currentIndex = 0;
        setupExamUI();
    } catch (e) { 
        console.error(e); 
        alert("Gagal memuat soal! Pastikan Backend (node server.js) sudah berjalan."); 
    }
}

function setupExamUI() {
    document.getElementById('landing-page').classList.add('hidden');
    document.getElementById('exam-container').classList.remove('hidden');

    if (appState.mode === 'full') {
        appState.endTime = new Date().getTime() + (195 * 60 * 1000);
        appState.timerInterval = setInterval(updateTimer, 1000);
    } else {
        document.getElementById('timer-display').innerText = "LATIHAN";
    }
    renderNavigation();
    loadQuestion(0);
}

function loadQuestion(idx) {
    appState.currentIndex = idx;
    const q = appState.questions[idx];
    document.getElementById('section-title').innerText = `${q.category_name} - No. ${idx+1}`;
    
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    const navItem = document.getElementById(`nav-${idx}`);
    if(navItem) navItem.classList.add('active');

    document.getElementById('btn-prev').disabled = (idx === 0);
    document.getElementById('btn-next').disabled = (idx === appState.questions.length - 1);

    let html = `<div class="q-text">${q.question}</div><div class="options-container">`;
    if(q.options) {
        for (const [key, val] of Object.entries(q.options)) {
            const checked = appState.answers[q.id] === key ? 'checked' : '';
            const selected = appState.answers[q.id] === key ? 'selected' : '';
            html += `
                <div class="option-label ${selected}" onclick="selectAnswer(${q.id}, '${key}', this)">
                    <input type="radio" name="q-${q.id}" ${checked}>
                    <div><b>${key}.</b> ${val}</div>
                </div>`;
        }
    }
    html += `</div>`;
    document.getElementById('question-area').innerHTML = html;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function selectAnswer(id, choice, el) {
    el.parentNode.querySelectorAll('.option-label').forEach(e => e.classList.remove('selected'));
    el.classList.add('selected');
    el.querySelector('input').checked = true;
    appState.answers[id] = choice;
    const navItem = document.getElementById(`nav-${appState.currentIndex}`);
    if(navItem) navItem.classList.add('answered');
}

function nextQuestion() { if(appState.currentIndex < appState.questions.length - 1) loadQuestion(appState.currentIndex + 1); }
function prevQuestion() { if(appState.currentIndex > 0) loadQuestion(appState.currentIndex - 1); }

function renderNavigation() {
    const grid = document.getElementById('nav-grid');
    grid.innerHTML = '';
    appState.questions.forEach((q, i) => {
        const div = document.createElement('div');
        div.className = 'nav-item';
        div.id = `nav-${i}`;
        div.innerText = i + 1;
        div.onclick = () => loadQuestion(i);
        grid.appendChild(div);
    });
}

function updateTimer() {
    const diff = appState.endTime - new Date().getTime();
    if (diff < 0) { clearInterval(appState.timerInterval); alert("Waktu Habis!"); submitExam(); return; }
    
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    document.getElementById('timer-display').innerText = 
        `${h}:${m<10?'0'+m:m}:${s<10?'0'+s:s}`;
}

async function submitExam() {
    if(!confirm("Yakin selesai?")) return;
    clearInterval(appState.timerInterval);
    const payload = { mode: appState.mode, answers: Object.keys(appState.answers).map(k => ({ id: parseInt(k), choice: appState.answers[k] })) };
    
    try {
        const res = await fetch('http://localhost:3000/api/submit', { 
            method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) 
        });
        const data = await res.json();
        
        document.getElementById('exam-container').classList.add('hidden');
        document.getElementById('result-page').classList.remove('hidden');
        
        if(data.mode === 'full') {
            document.getElementById('score-board').classList.remove('hidden');
            document.getElementById('final-score').innerText = data.score;
            document.getElementById('chance-label').innerText = data.chanceLabel;
            document.getElementById('recommendations').innerHTML = "<b>Rekomendasi:</b><ul>" + data.recommendations.map(r=>`<li>${r}</li>`).join('')+"</ul>";
        }
        
        const review = document.getElementById('review-container');
        review.innerHTML = '<h3>Pembahasan</h3>';
        data.details.forEach((d, i) => {
            const q = appState.questions.find(x => x.id === d.id);
            const color = d.isCorrect ? '#d4edda' : '#f8d7da';
            review.innerHTML += `
                <div style="background:${color}; padding:15px; margin-bottom:15px; border-radius:8px;">
                    <p><b>No ${i+1}.</b> ${q.question}</p>
                    <p>Jawab: <b>${d.userChoice||'-'}</b> | Kunci: <b>${d.correctChoice}</b></p>
                    <div style="background:white; padding:10px; margin-top:5px;">${d.explanation}</div>
                </div>`;
        });
    } catch(e) { console.error(e); alert("Gagal submit jawaban."); }
}