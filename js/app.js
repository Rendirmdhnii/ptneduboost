// === LOGIC NAVIGASI UTAMA (CLIENT SIDE) ===

document.addEventListener('DOMContentLoaded', () => {
    // 1. Cek apakah database soal terbaca
    if (typeof BANK_SOAL === 'undefined') {
        console.error("CRITICAL: File database.js belum dimuat!");
        alert("Database soal belum masuk! Pastikan file js/database.js ada isinya.");
        return;
    }

    // 2. Cek Status Login
    const user = localStorage.getItem('username');
    if (user) {
        showDashboard(user);
    } else {
        showView('view-login'); // Pastikan ID di HTML adalah view-login (atau sesuaikan)
    }
});

// --- NAVIGASI ---
function showView(viewId) {
    // Sembunyikan semua view
    document.querySelectorAll('section').forEach(el => el.classList.add('hidden'));
    
    // Munculkan view target (jika ada)
    const target = document.getElementById(viewId);
    if (target) {
        target.classList.remove('hidden');
    } else {
        // Fallback kalau ID beda (misal view-landing vs view-login)
        if(viewId === 'view-login') document.querySelector('section:first-of-type').classList.remove('hidden');
    }
}

function showDashboard(nama) {
    showView('view-dashboard');
    // Update nama user di dashboard
    const nameDisplay = document.querySelector('.user-name-display') || document.getElementById('user-greet');
    if(nameDisplay) nameDisplay.innerText = nama;
}

// --- EVENT LISTENERS ---

// 1. Tombol Login
const btnLogin = document.getElementById('btn-login'); // Cek ID tombol loginmu di HTML
if(btnLogin) {
    btnLogin.addEventListener('click', () => {
        const input = document.querySelector('input[type="text"]');
        if(input && input.value.trim()) {
            localStorage.setItem('username', input.value);
            showDashboard(input.value);
        } else {
            alert("Nama harus diisi!");
        }
    });
}

// 2. Tombol Logout
const btnLogout = document.getElementById('btn-logout');
if(btnLogout) {
    btnLogout.addEventListener('click', () => {
        localStorage.clear();
        location.reload();
    });
}

// 3. Tombol Mulai Simulasi Full
const btnSimulasi = document.querySelector('#btn-simulasi-full, #btn-start-exam'); 
if(btnSimulasi) {
    btnSimulasi.addEventListener('click', () => {
        if(typeof startFullSimulation === 'function') {
            startFullSimulation();
        } else {
            alert("Script exam.js belum siap!");
        }
    });
}