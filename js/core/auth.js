// ==========================================
// js/core/auth.js
// Fungsi login, logout, manajemen sesi & user
// ==========================================

// ---- Data Users ----

async function getUsers() {
    try {
        const data = await fetchAPI('action=list&table=Users');
        if (data && Array.isArray(data) && data.length > 0) return data;
    } catch (err) {
        console.warn('Gagal load users dari Sheets, gunakan default');
    }
    return [
        { id: '1', nama: 'Admin Utama',    username: 'admin',       password: 'admin123', role: 'Administrator',     email: 'admin@pln.co.id',       status: 'Aktif' },
        { id: '2', nama: 'Tim Perencanaan',username: 'perencanaan', password: 'plan123',  role: 'Perencanaan',       email: 'perencanaan@pln.co.id', status: 'Aktif' },
        { id: '3', nama: 'Tim Pengawas',   username: 'pengawas',    password: 'awas123',  role: 'Pengawas Lapangan', email: 'pengawas@pln.co.id',    status: 'Nonaktif' }
    ];
}

async function saveUser(userData, isUpdate = false) {
    const currentUser = state.currentUser ? state.currentUser.nama : 'Admin';
    const payload = {
        action: isUpdate ? 'update' : 'create',
        table: 'Users',
        user: currentUser,
        data: {
            nama:     userData.nama,
            username: userData.username,
            password: userData.password,
            email:    userData.email || '',
            role:     userData.role,
            status:   userData.status
        }
    };
    if (isUpdate) payload.id = userData.id;
    return await fetchAPI('', 'POST', payload);
}

async function deleteUserFromSheets(id) {
    const currentUser = state.currentUser ? state.currentUser.nama : 'Admin';
    return await fetchAPI('', 'POST', { action: 'delete', table: 'Users', id: id, user: currentUser });
}

// ---- Login / Logout ----

function renderLogin() {
    const mainWrapper = document.querySelector('.md\\:ml-64');
    const sidebar = document.getElementById('sidebar');
    if (mainWrapper) mainWrapper.classList.add('hidden');
    if (sidebar)     sidebar.classList.add('hidden');

    let loginDiv = document.getElementById('login-page');
    if (!loginDiv) {
        loginDiv = document.createElement('div');
        loginDiv.id = 'login-page';
        document.body.appendChild(loginDiv);
    }

    loginDiv.innerHTML = `
        <div class="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-sky-900 flex items-center justify-center p-4 relative overflow-hidden">
            <div class="absolute inset-0 overflow-hidden pointer-events-none">
                <div class="absolute -top-40 -right-40 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl"></div>
                <div class="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
                <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand/5 rounded-full blur-3xl"></div>
            </div>
            <div class="w-full max-w-md relative z-10">
                <div class="text-center mb-8">
                    <div class="inline-flex items-center justify-center w-16 h-16 bg-brand rounded-2xl mb-4 shadow-lg shadow-brand/30">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <h1 class="text-3xl font-bold text-white tracking-tight">RAB & Monitoring</h1>
                    <p class="text-sky-300 text-sm mt-1 font-medium">Sistem Perencanaan Pekerjaan PLN</p>
                </div>
                <div class="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 shadow-2xl">
                    <h2 class="text-xl font-bold text-white mb-1">Masuk ke Sistem</h2>
                    <p class="text-sky-200 text-sm mb-6">Masukkan kredensial akun Anda</p>
                    <div id="login-error" class="hidden mb-4 bg-red-500/20 border border-red-400/30 text-red-200 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        <span id="login-error-msg">Username atau password salah.</span>
                    </div>
                    <form onsubmit="doLogin(event)" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-sky-100 mb-1.5">Username</label>
                            <div class="relative">
                                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                                </span>
                                <input type="text" id="login-username" required placeholder="Masukkan username"
                                    class="w-full bg-white/10 border border-white/20 text-white placeholder-slate-400 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-sky-400 focus:bg-white/15 transition">
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-sky-100 mb-1.5">Password</label>
                            <div class="relative">
                                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                                </span>
                                <input type="password" id="login-password" required placeholder="Masukkan password"
                                    class="w-full bg-white/10 border border-white/20 text-white placeholder-slate-400 rounded-xl pl-10 pr-10 py-3 text-sm focus:outline-none focus:border-sky-400 focus:bg-white/15 transition">
                                <button type="button" onclick="togglePasswordVisibility()" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                                    <svg id="eye-icon" xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                                </button>
                            </div>
                        </div>
                        <div class="flex items-center gap-2">
                            <input type="checkbox" id="login-remember" class="w-4 h-4 rounded border-white/30 bg-white/10 text-brand">
                            <label for="login-remember" class="text-sm text-sky-200">Ingat saya</label>
                        </div>
                        <button type="submit" id="btn-login"
                            class="w-full bg-brand hover:bg-sky-600 text-white font-semibold py-3 rounded-xl text-sm transition-all shadow-lg shadow-brand/30 flex items-center justify-center gap-2 mt-2">
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/></svg>
                            Masuk
                        </button>
                    </form>
                    <p class="text-center text-xs text-slate-500 mt-6">© 2026 PLN ULP Buleleng · Sistem Internal</p>
                </div>
            </div>
        </div>
    `;
}

function togglePasswordVisibility() {
    const pwInput = document.getElementById('login-password');
    pwInput.type = pwInput.type === 'password' ? 'text' : 'password';
}

function doLogin(event) {
    event.preventDefault();
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    const errorDiv = document.getElementById('login-error');
    const errorMsg = document.getElementById('login-error-msg');
    const btn      = document.getElementById('btn-login');
    const loginSVG = `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/></svg> Masuk`;

    btn.disabled = true;
    btn.innerHTML = `<svg class="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg> Memverifikasi...`;

    getUsers().then(users => {
        const user = users.find(u => u.username === username && u.password === password);

        if (!user) {
            errorDiv.classList.remove('hidden');
            errorMsg.textContent = 'Username atau password salah.';
            btn.disabled = false; btn.innerHTML = loginSVG; return;
        }
        if (user.status === 'Nonaktif') {
            errorDiv.classList.remove('hidden');
            errorMsg.textContent = 'Akun Anda tidak aktif. Hubungi Administrator.';
            btn.disabled = false; btn.innerHTML = loginSVG; return;
        }

        state.currentUser = user;
        const remember = document.getElementById('login-remember').checked;
        if (remember) localStorage.setItem('pln_session', JSON.stringify(user));
        else sessionStorage.setItem('pln_session', JSON.stringify(user));

        const loginDiv = document.getElementById('login-page');
        if (loginDiv) loginDiv.remove();

        const mainWrapper = document.querySelector('.md\\:ml-64');
        const sidebar = document.getElementById('sidebar');
        if (mainWrapper) mainWrapper.classList.remove('hidden');
        if (sidebar)     sidebar.classList.remove('hidden');

        updateUserUI();
        navigate('dashboard');
        showToast(`Selamat datang, ${user.nama}!`);
    }).catch(err => {
        console.error('Login error:', err);
        errorDiv.classList.remove('hidden');
        errorMsg.textContent = 'Gagal memverifikasi login. Cek koneksi ke Google Sheets.';
        btn.disabled = false; btn.innerHTML = loginSVG;
    });
}

function doLogout() {
    if (!confirm('Apakah Anda yakin ingin keluar dari sistem?')) return;
    localStorage.removeItem('pln_session');
    sessionStorage.removeItem('pln_session');
    state.currentUser = null;
    const mainWrapper = document.querySelector('.md\\:ml-64');
    const sidebar = document.getElementById('sidebar');
    if (mainWrapper) mainWrapper.classList.add('hidden');
    if (sidebar)     sidebar.classList.add('hidden');
    renderLogin();
}
