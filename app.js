// ==========================================
// TAMBAH CATATAN FUNCTIONS
// ==========================================

function showModalCatatan() {
    const modal = document.getElementById('modal-catatan');
    if (!modal) return;
    
    // Reset form
    document.getElementById('catatan-text').value = '';
    
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        modal.querySelector('div').classList.remove('scale-95');
    }, 10);
}

function closeModalCatatan() {
    const modal = document.getElementById('modal-catatan');
    if (!modal) return;
    
    modal.classList.add('opacity-0');
    modal.querySelector('div').classList.add('scale-95');
    setTimeout(() => modal.classList.add('hidden'), 300);
}

async function saveCatatan(event) {
    event.preventDefault();
    
    const btn = document.getElementById('btn-save-catatan');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = 'Menyimpan...';
    }
    
    try {
        const item = window.currentDetailPekerjaan;
        if (!item || !item.id) {
            throw new Error('Data pekerjaan tidak ditemukan');
        }
        
        const catatanText = document.getElementById('catatan-text').value.trim();
        if (!catatanText) {
            throw new Error('Catatan tidak boleh kosong');
        }
        
        const currentUser = state.currentUser ? state.currentUser.nama : 'Admin';
        const payload = {
            action: 'create',
            table: 'LogAktivitas',
            user: currentUser,
            data: {
                pekerjaan_id: item.id,
                tanggal: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
                catatan: catatanText,
                user: currentUser,
                jenis_aktivitas: 'Catatan Manual'
            }
        };
        
        const result = await fetchAPI('', 'POST', payload);
        if (result) {
            showToast('Catatan berhasil disimpan');
            closeModalCatatan();
            
            // Refresh tab ringkasan untuk menampilkan catatan terbaru
            const container = document.getElementById('detail-tab-content-container');
            if (container && item) {
                loadDetailTabRingkasan(container, item);
            }
        } else {
            throw new Error('Gagal menyimpan catatan ke Google Sheets');
        }
    } catch (error) {
        console.error('Error saving catatan:', error);
        showToast(error.message || 'Gagal menyimpan catatan', 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = 'Simpan Catatan';
        }
    }
}

// ==========================================
// 1. STATE & INISIALISASI
// ==========================================
const state = {
    currentPage: 'dashboard',
    selectedPekerjaanRAB: '',
    selectedPekerjaanNamaRAB: '',
    selectedPengadaanIdRAB: '',
    selectedPengadaanNamaRAB: '',
    selectedPekerjaanRealisasi: '',
    selectedPekerjaanNamaRealisasi: '',
    selectedPengadaanIdRealisasi: '',
    selectedPengadaanNamaRealisasi: '',
    tempRABItems: [],
    editId: null,
    editingRealisasiId: null,
    currentUser: null
};

// Daftar pengguna - ambil dari Google Sheets atau fallback ke default
async function getUsers() {
    try {
        const data = await fetchAPI('action=list&table=Users');
        if (data && Array.isArray(data) && data.length > 0) {
            return data;
        }
    } catch (err) {
        console.warn('Gagal load users dari Sheets, gunakan default');
    }
    
    // Fallback: default users jika Sheets kosong atau error
    return [
        { id: '1', nama: 'Admin Utama', username: 'admin', password: 'admin123', role: 'Administrator', email: 'admin@pln.co.id', status: 'Aktif' },
        { id: '2', nama: 'Tim Perencanaan', username: 'perencanaan', password: 'plan123', role: 'Perencanaan', email: 'perencanaan@pln.co.id', status: 'Aktif' },
        { id: '3', nama: 'Tim Pengawas', username: 'pengawas', password: 'awas123', role: 'Pengawas Lapangan', email: 'pengawas@pln.co.id', status: 'Nonaktif' }
    ];
}

async function saveUser(userData, isUpdate = false) {
    const currentUser = state.currentUser ? state.currentUser.nama : 'Admin';
    const payload = {
        action: isUpdate ? 'update' : 'create',
        table: 'Users',
        user: currentUser,
        data: {
            nama: userData.nama,
            username: userData.username,
            password: userData.password,
            email: userData.email || '',
            role: userData.role,
            status: userData.status
        }
    };
    if (isUpdate) payload.id = userData.id;
    
    return await fetchAPI('', 'POST', payload);
}

async function deleteUserFromSheets(id) {
    const currentUser = state.currentUser ? state.currentUser.nama : 'Admin';
    return await fetchAPI('', 'POST', { action: 'delete', table: 'Users', id: id, user: currentUser });
}

function saveUsers(users) {
    // Deprecated: tidak digunakan lagi, users langsung disimpan ke Sheets via saveUser()
    console.warn('saveUsers() is deprecated, use saveUser() instead');
}

document.addEventListener('DOMContentLoaded', () => {
    // Load saved API URL dari localStorage jika ada
    const savedApiUrl = localStorage.getItem('pln_api_url');
    if (savedApiUrl) CONFIG.API_URL = savedApiUrl;

    // Cek sesi login (localStorage = remember me, sessionStorage = sesi biasa)
    const sessionUser = localStorage.getItem('pln_session') || sessionStorage.getItem('pln_session');
    if (sessionUser) {
        state.currentUser = JSON.parse(sessionUser);
        updateUserUI();
        navigate(state.currentPage);
    } else {
        renderLogin();
    }
});

// ==========================================
// 2. HELPER & UTILITIES
// ==========================================

function formatShortCurrency(amount) {
    if (!amount || isNaN(amount)) return 'Rp 0';
    if (amount >= 1000000000) return 'Rp ' + (amount / 1000000000).toFixed(2).replace('.', ',') + ' M';
    if (amount >= 1000000) return 'Rp ' + (amount / 1000000).toFixed(2).replace('.', ',') + ' Jt';
    return CONFIG.formatCurrency(amount);
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-green-500' : (type === 'error' ? 'bg-red-500' : 'bg-blue-500');
    const icon = type === 'success' ? 'check-circle' : (type === 'error' ? 'alert-circle' : 'info');

    toast.className = bgColor + ' text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 transform transition-all duration-300 translate-y-10 opacity-0 z-50';
    toast.innerHTML = '<i data-lucide="' + icon + '" class="w-5 h-5"></i><span class="text-sm font-medium">' + message + '</span>';

    container.appendChild(toast);
    lucide.createIcons({ root: toast });
    setTimeout(() => toast.classList.remove('translate-y-10', 'opacity-0'), 10);
    setTimeout(() => {
        toast.classList.add('opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

async function fetchAPI(urlParams, method = 'GET', bodyData = null) {
    try {
        let sep = urlParams ? '&' : '';
        let cacheBuster = method === 'GET' ? `${sep}_t=${Date.now()}` : '';
        let url = CONFIG.API_URL + '?' + urlParams + cacheBuster;
        
        // Untuk POST update/delete: sertakan action, table, dan id juga di URL
        // karena beberapa Apps Script membaca dari e.parameter bukan e.postData
        if (method === 'POST' && bodyData) {
            const urlAction = bodyData.action || '';
            const urlId     = bodyData.id     || '';
            const urlTable  = bodyData.table  || '';
            // Hitung prefix: jika urlParams kosong, '?' sudah ada jadi pakai '' atau '&'
            const hasParams = urlParams && urlParams.trim() !== '';
            let extra = '';
            if (urlAction) extra += (hasParams ? '&' : '') + 'action=' + encodeURIComponent(urlAction);
            if (urlTable)  extra += '&table=' + encodeURIComponent(urlTable);
            if (urlId)     extra += '&id='    + encodeURIComponent(urlId);
            url += extra;
        }
        
        let options = { method: method, cache: 'no-store' };
        if (method === 'POST' && bodyData) {
            options.body = JSON.stringify(bodyData);
            options.headers = { 'Content-Type': 'text/plain;charset=utf-8' };
        }

        const response = await fetch(url, options);
        const result = await response.json();

        if (!result.success) throw new Error(result.message || 'Operasi gagal');
        return result.data !== undefined ? result.data : result;
    } catch (error) {
        console.error('API Error:', error);
        showToast(error.message || 'Terjadi kesalahan koneksi', 'error');
        return null;
    }
}

// Helper Universal untuk Hapus Data
async function deleteData(table, id, callback) {
    if (!confirm(`Hapus data ${table} ini dari sistem?`)) return;
    const user = state.currentUser ? state.currentUser.nama : 'Admin';
    const res = await fetchAPI('', 'POST', { action: 'delete', table: table, id: id, user: user });
    if (res) {
        showToast(`Data ${table} berhasil dihapus`);
        callback();
    }
}

// ==========================================
// LOGIN / LOGOUT
// ==========================================

function updateUserUI() {
    const user = state.currentUser;
    if (!user) return;
    // Update sidebar user info
    const sidebarUser = document.querySelector('.sidebar-user-name');
    const sidebarRole = document.querySelector('.sidebar-user-role');
    const sidebarAvatar = document.querySelector('.sidebar-user-avatar');
    const headerGreet = document.querySelector('.header-user-greet');
    if (sidebarUser) sidebarUser.textContent = user.nama;
    if (sidebarRole) sidebarRole.textContent = user.role;
    if (sidebarAvatar) sidebarAvatar.textContent = user.nama.charAt(0).toUpperCase();
    if (headerGreet) headerGreet.textContent = `Halo, ${user.nama.split(' ')[0]}!`;
}

function renderLogin() {
    // Sembunyikan layout utama, tampilkan login fullscreen
    const mainWrapper = document.querySelector('.md\\:ml-64');
    const sidebar = document.getElementById('sidebar');
    if (mainWrapper) mainWrapper.classList.add('hidden');
    if (sidebar) sidebar.classList.add('hidden');

    let loginDiv = document.getElementById('login-page');
    if (!loginDiv) {
        loginDiv = document.createElement('div');
        loginDiv.id = 'login-page';
        document.body.appendChild(loginDiv);
    }

    loginDiv.innerHTML = `
        <div class="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-sky-900 flex items-center justify-center p-4 relative overflow-hidden">
            <!-- Background decorations -->
            <div class="absolute inset-0 overflow-hidden pointer-events-none">
                <div class="absolute -top-40 -right-40 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl"></div>
                <div class="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
                <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand/5 rounded-full blur-3xl"></div>
            </div>

            <div class="w-full max-w-md relative z-10">
                <!-- Logo & Brand -->
                <div class="text-center mb-8">
                    <div class="inline-flex items-center justify-center w-16 h-16 bg-brand rounded-2xl mb-4 shadow-lg shadow-brand/30">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <h1 class="text-3xl font-bold text-white tracking-tight">RAB & Monitoring</h1>
                    <p class="text-sky-300 text-sm mt-1 font-medium">Sistem Perencanaan Pekerjaan PLN</p>
                </div>

                <!-- Login Card -->
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

                    <div class="mt-6 pt-5 border-t border-white/10">
                        <p class="text-xs text-slate-400 text-center mb-3">Akun demo tersedia:</p>
                        <div class="grid grid-cols-3 gap-2">
                            <button onclick="fillDemo('admin','admin123')" class="bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-sky-200 py-1.5 px-2 rounded-lg transition text-center">
                                <div class="font-semibold">admin</div>
                                <div class="text-[10px] text-slate-400">Administrator</div>
                            </button>
                            <button onclick="fillDemo('perencanaan','plan123')" class="bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-sky-200 py-1.5 px-2 rounded-lg transition text-center">
                                <div class="font-semibold">perencanaan</div>
                                <div class="text-[10px] text-slate-400">Perencanaan</div>
                            </button>
                            <button onclick="fillDemo('pengawas','awas123')" class="bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-sky-200 py-1.5 px-2 rounded-lg transition text-center">
                                <div class="font-semibold">pengawas</div>
                                <div class="text-[10px] text-slate-400">Pengawas</div>
                            </button>
                        </div>
                    </div>
                </div>

                <p class="text-center text-xs text-slate-500 mt-6">© 2026 PLN ULP Buleleng · Sistem Internal</p>
            </div>
        </div>
    `;
}

function fillDemo(username, password) {
    document.getElementById('login-username').value = username;
    document.getElementById('login-password').value = password;
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
    const btn = document.getElementById('btn-login');

    btn.disabled = true;
    btn.innerHTML = `<svg class="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg> Memverifikasi...`;

    // Load users dari Sheets lalu verifikasi
    getUsers().then(users => {
        const user = users.find(u => u.username === username && u.password === password);

        if (!user) {
            errorDiv.classList.remove('hidden');
            errorMsg.textContent = 'Username atau password salah.';
            btn.disabled = false;
            btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/></svg> Masuk`;
            return;
        }

        if (user.status === 'Nonaktif') {
            errorDiv.classList.remove('hidden');
            errorMsg.textContent = 'Akun Anda tidak aktif. Hubungi Administrator.';
            btn.disabled = false;
            btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/></svg> Masuk`;
            return;
        }

        // Login berhasil
        state.currentUser = user;
        const remember = document.getElementById('login-remember').checked;
        if (remember) localStorage.setItem('pln_session', JSON.stringify(user));
        else sessionStorage.setItem('pln_session', JSON.stringify(user));

        // Sembunyikan login page
        const loginDiv = document.getElementById('login-page');
        if (loginDiv) loginDiv.remove();

        // Tampilkan layout utama
        const mainWrapper = document.querySelector('.md\\:ml-64');
        const sidebar = document.getElementById('sidebar');
        if (mainWrapper) mainWrapper.classList.remove('hidden');
        if (sidebar) sidebar.classList.remove('hidden');

        updateUserUI();
        navigate('dashboard');
        showToast(`Selamat datang, ${user.nama}!`);
    }).catch(err => {
        console.error('Login error:', err);
        errorDiv.classList.remove('hidden');
        errorMsg.textContent = 'Gagal memverifikasi login. Cek koneksi ke Google Sheets.';
        btn.disabled = false;
        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/></svg> Masuk`;
    });
}

function doLogout() {
    if (!confirm('Apakah Anda yakin ingin keluar dari sistem?')) return;
    localStorage.removeItem('pln_session');
    sessionStorage.removeItem('pln_session');
    state.currentUser = null;
    // Sembunyikan layout utama
    const mainWrapper = document.querySelector('.md\\:ml-64');
    const sidebar = document.getElementById('sidebar');
    if (mainWrapper) mainWrapper.classList.add('hidden');
    if (sidebar) sidebar.classList.add('hidden');
    renderLogin();
}

// ==========================================
// 3. ROUTING & NAVIGATION
// ==========================================

function navigate(page) {
    state.currentPage = page;
    document.querySelectorAll('.nav-link').forEach(el => {
        el.classList.remove('active', 'bg-slate-800', 'text-white');
        if (el.dataset.page === page) el.classList.add('active', 'bg-slate-800', 'text-white');
    });

    const titles = {
        'dashboard': 'Dashboard',
        'rab': 'RAB & Estimator',
        'rekap': 'Rekap RAB',
        'realisasi': 'Data Realisasi',
        'penyedia': 'Data Penyedia',
        'kontrak': 'Data Kontrak',
        'pengadaan': 'Master Pengadaan',
        'pekerjaan': 'Master Pekerjaan',
        'material': 'Master Material',
        'laporan': 'Laporan & Monitoring',
        'log': 'Log Aktivitas',
        'user': 'Manajemen Pengguna',
        'pengaturan': 'Pengaturan Sistem'
    };

    const pageTitleEl = document.getElementById('page-title');
    if (pageTitleEl) pageTitleEl.innerText = titles[page] || 'Dashboard';

    const contentArea = document.getElementById('app-content');
    if (!contentArea) return;

    contentArea.innerHTML = `
        <div class="flex items-center justify-center h-64">
            <div class="flex flex-col items-center gap-3">
                <div class="loader"></div>
                <p class="text-sm text-slate-500">Memuat data...</p>
            </div>
        </div>
    `;

    switch (page) {
        case 'dashboard': renderDashboard(); break;
        case 'rab': renderRAB(); break;
        case 'rekap': renderRekap(); break;
        case 'realisasi': renderRealisasi(); break;
        case 'penyedia': renderPenyedia(); break;
        case 'kontrak': renderKontrak(); break;
        case 'pengadaan': renderPengadaan(); break;
        case 'pekerjaan': renderPekerjaan(); break;
        case 'material': renderMaterial(); break;
        case 'laporan': renderLaporan(); break;
        case 'log': renderLog(); break;
        case 'user': renderUser(); break;
        case 'pengaturan': renderPengaturan(); break;
        default:
            contentArea.innerHTML = `
                <div class="bg-white p-8 rounded-xl border border-slate-200 text-center shadow-sm">
                    <i data-lucide="wrench" class="w-12 h-12 text-slate-300 mx-auto mb-4"></i>
                    <h3 class="text-lg font-semibold text-slate-700">Modul Segera Hadir</h3>
                    <p class="text-slate-500 mt-2">Modul ini akan dilanjutkan pada tahap berikutnya.</p>
                </div>
            `;
            lucide.createIcons();
    }

    if (window.innerWidth < 768) {
        const sidebar = document.getElementById('sidebar');
        if (sidebar && !sidebar.classList.contains('-translate-x-full')) toggleSidebar();
    }
}

// ==========================================
// 4. RENDER DASHBOARD
// ==========================================

async function renderDashboard() {
    const contentArea = document.getElementById('app-content');
    if (!contentArea) return;
    contentArea.innerHTML = '<div class="flex justify-center items-center py-24"><div class="loader"></div></div>';

    const [data, pekerjaanList, kontrakList, realisasiList, pengadaanList] = await Promise.all([
        fetchAPI('action=dashboard'),
        fetchAPI('action=list&table=Pekerjaan') || [],
        fetchAPI('action=list&table=Kontrak') || [],
        fetchAPI('action=list&table=Realisasi') || [],
        fetchAPI('action=list&table=Pengadaan') || []
    ]);

    const pekerjaanArr = Array.isArray(pekerjaanList) ? pekerjaanList : [];
    const kontrakArr = Array.isArray(kontrakList) ? kontrakList : [];
    const realisasiArr = Array.isArray(realisasiList) ? realisasiList : [];
    const pengadaanArr = Array.isArray(pengadaanList) ? pengadaanList : [];

    let totalNilaiKontrak = 0;
    kontrakArr.forEach(k => {
        totalNilaiKontrak += parseFloat(k.nilai_kontrak) || 0;
    });

    let totalPaguPengadaan = 0;
    pengadaanArr.forEach(p => {
        totalPaguPengadaan += parseFloat(p.nilai_pagu) || 0;
    });

    let totalRealisasi = data && data.realisasi ? parseFloat(data.realisasi) : 0;
    if (totalRealisasi === 0) {
        realisasiArr.forEach(r => {
            totalRealisasi += parseFloat(r.nilai) || parseFloat(r.nilai_realisasi) || 0;
        });
    }

    const totalAnggaran = totalPaguPengadaan > 0 ? totalPaguPengadaan : (totalNilaiKontrak > 0 ? totalNilaiKontrak : 0);
    const sisaAnggaran = totalAnggaran > totalRealisasi ? (totalAnggaran - totalRealisasi) : 0;
    const persentaseRealisasi = totalAnggaran > 0 ? ((totalRealisasi / totalAnggaran) * 100).toFixed(1) : (totalNilaiKontrak > 0 ? ((totalRealisasi / totalNilaiKontrak) * 100).toFixed(1) : '0');
    const totalPaket = pekerjaanArr.length;

    // Realisasi kumulatif bulanan riil
    let realisasiPerBulan = new Array(12).fill(0);
    realisasiArr.forEach(r => {
        if (r.tanggal && (r.nilai || r.nilai_realisasi)) {
            const date = new Date(r.tanggal);
            if (!isNaN(date.getTime())) {
                realisasiPerBulan[date.getMonth()] += parseFloat(r.nilai) || parseFloat(r.nilai_realisasi) || 0;
            }
        }
    });

    let realisasiKumulatif = [];
    let akumulasiR = 0;
    for (let i = 0; i < 12; i++) {
        akumulasiR += realisasiPerBulan[i];
        realisasiKumulatif.push(Number((akumulasiR / 1000000000).toFixed(3)));
    }

    let rencanaKumulatif = [];
    let targetBulan = totalAnggaran > 0 ? ((totalAnggaran / 12) / 1000000000) : 0;
    let akumulasiP = 0;
    for (let i = 0; i < 12; i++) {
        akumulasiP += targetBulan;
        rencanaKumulatif.push(Number(akumulasiP.toFixed(3)));
    }

    // Top 5 Penyedia dinamis
    const vendorMap = {};
    kontrakArr.forEach(k => {
        const vName = (k.nama_penyedia || 'Mitra Penyedia').trim();
        const val = parseFloat(k.nilai_kontrak) || 0;
        vendorMap[vName] = (vendorMap[vName] || 0) + val;
    });
    const sortedVendors = Object.entries(vendorMap)
        .map(([name, total]) => ({ name, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

    let topVendorsHTML = '';
    if (sortedVendors.length === 0) {
        topVendorsHTML = '<p class="text-xs text-slate-400 italic py-6 text-center">Belum ada kontrak tercatat.</p>';
    } else {
        const maxVendor = sortedVendors[0].total || 1;
        const colors = ['bg-blue-600', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500', 'bg-sky-400'];
        sortedVendors.forEach((v, idx) => {
            const pct = totalNilaiKontrak > 0 ? ((v.total / totalNilaiKontrak) * 100).toFixed(0) : 0;
            const barPct = Math.max(5, Math.round((v.total / maxVendor) * 100));
            const col = colors[idx % colors.length];
            topVendorsHTML += `
                <div>
                    <div class="flex justify-between mb-1 font-medium"><span class="text-slate-700 truncate max-w-[180px]">${v.name}</span><span class="font-bold text-slate-800">${formatShortCurrency(v.total)} (${pct}%)</span></div>
                    <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden"><div class="${col} h-full rounded-full" style="width: ${barPct}%"></div></div>
                </div>
            `;
        });
    }

    // Komposisi dinamis berdasarkan jenis_kegiatan
    const jenisMap = {};
    pekerjaanArr.forEach(p => {
        const jenis = (p.jenis_kegiatan || 'Lainnya').trim();
        jenisMap[jenis] = (jenisMap[jenis] || 0) + 1;
    });
    const jenisEntries = Object.entries(jenisMap);
    const komposisiLabels = jenisEntries.length ? jenisEntries.map(e => e[0]) : ['Umum'];
    const komposisiValues = jenisEntries.length ? jenisEntries.map(e => e[1]) : [totalPaket || 1];

    let komposisiHTML = '';
    const compColors = ['bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500', 'bg-slate-400', 'bg-sky-500'];
    if (jenisEntries.length === 0) {
        komposisiHTML = '<p class="text-xs text-slate-400 italic py-3 text-center">Belum ada data paket pekerjaan.</p>';
    } else {
        komposisiLabels.slice(0, 5).forEach((label, idx) => {
            const cnt = komposisiValues[idx];
            const pct = totalPaket > 0 ? Math.round((cnt / totalPaket) * 100) : 0;
            const col = compColors[idx % compColors.length];
            komposisiHTML += `
                <div class="flex justify-between items-center"><span class="flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-full ${col}"></span>${label}</span><span class="font-bold text-slate-700">${pct}% (${cnt})</span></div>
            `;
        });
    }

    // Status Pekerjaan dinamis
    let statusCounts = { 'Selesai': 0, 'On Progress': 0, 'Belum Mulai': 0, 'Tunda': 0, 'Batal': 0 };
    kontrakArr.forEach(k => {
        const st = (k.status || 'On Progress').toLowerCase();
        if (st.includes('selesai')) statusCounts['Selesai']++;
        else if (st.includes('batal')) statusCounts['Batal']++;
        else if (st.includes('tunda')) statusCounts['Tunda']++;
        else if (st.includes('belum')) statusCounts['Belum Mulai']++;
        else statusCounts['On Progress']++;
    });
    if (kontrakArr.length === 0 && totalPaket > 0) {
        statusCounts['Belum Mulai'] = totalPaket;
    }

    contentArea.innerHTML = `
        <!-- BARIS 1: FILTER, KARTU STATISTIK & BANNER PLN -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div class="lg:col-span-2 bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between">
                <div class="flex justify-between items-center mb-4 flex-wrap gap-3">
                    <div>
                        <h3 class="text-base font-bold text-slate-800">Ringkasan Pelaksanaan Pekerjaan</h3>
                        <p class="text-xs text-slate-500">Monitoring realisasi fisik, keuangan, dan pengadaan PLN secara langsung dari Google Sheets.</p>
                    </div>
                    <div class="flex items-center gap-2 text-xs">
                        <button onclick="renderDashboard()" title="Refresh Data" class="border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 transition">
                            <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i> Sinkron
                        </button>
                    </div>
                </div>

                <!-- 4 KARTU STATISTIK -->
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div class="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60 border-l-4 border-l-blue-500">
                        <div class="flex items-center gap-2 text-blue-600 mb-1"><i data-lucide="wallet" class="w-4 h-4"></i><span class="text-xs font-semibold">Total Pagu / Anggaran</span></div>
                        <h4 class="text-lg font-bold text-slate-800">${formatShortCurrency(totalAnggaran)}</h4>
                        <span class="text-[10px] text-slate-500">${totalPaguPengadaan > 0 ? 'Pagu Pengadaan' : 'Nilai Kontrak'}</span>
                    </div>
                    <div class="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60 border-l-4 border-l-emerald-500">
                        <div class="flex items-center gap-2 text-emerald-600 mb-1"><i data-lucide="file-check-2" class="w-4 h-4"></i><span class="text-xs font-semibold">Total Kontrak</span></div>
                        <h4 class="text-lg font-bold text-slate-800">${formatShortCurrency(totalNilaiKontrak)}</h4>
                        <span class="text-[10px] text-emerald-600 font-medium">${kontrakArr.length} Kontrak Aktif</span>
                    </div>
                    <div class="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60 border-l-4 border-l-amber-500">
                        <div class="flex items-center gap-2 text-amber-600 mb-1"><i data-lucide="bar-chart-3" class="w-4 h-4"></i><span class="text-xs font-semibold">Realisasi Keuangan</span></div>
                        <h4 class="text-lg font-bold text-slate-800">${formatShortCurrency(totalRealisasi)}</h4>
                        <span class="text-[10px] text-amber-600 font-medium">${persentaseRealisasi}% terserap</span>
                    </div>
                    <div class="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60 border-l-4 border-l-rose-500">
                        <div class="flex items-center gap-2 text-rose-600 mb-1"><i data-lucide="pie-chart" class="w-4 h-4"></i><span class="text-xs font-semibold">Sisa Anggaran</span></div>
                        <h4 class="text-lg font-bold text-slate-800">${formatShortCurrency(sisaAnggaran)}</h4>
                        <span class="text-[10px] text-rose-600 font-medium">Belum terealisasi</span>
                    </div>
                </div>
            </div>

            <!-- BANNER PLN -->
            <div class="bg-gradient-to-br from-blue-900 to-sky-800 rounded-xl p-5 text-white flex flex-col justify-between shadow-sm relative overflow-hidden">
                <div class="absolute -right-6 -bottom-6 opacity-10"><i data-lucide="zap" class="w-48 h-48"></i></div>
                <div>
                    <div class="flex items-center justify-between mb-2">
                        <span class="bg-yellow-400 text-blue-900 text-[10px] font-bold px-2 py-0.5 rounded">PLN</span>
                        <span class="text-xs text-sky-200 font-medium">Monitoring Real-Time</span>
                    </div>
                    <h3 class="text-xl font-bold leading-tight mt-3">Energi untuk Kehidupan yang Lebih Baik</h3>
                </div>
                <div class="mt-4 pt-3 border-t border-blue-700/50 flex justify-between items-center text-xs text-sky-200">
                    <span>${totalPaket} Paket Pekerjaan Terdata</span>
                    <span class="font-semibold text-white flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Google Sheets Aktif</span>
                </div>
            </div>
        </div>

        <!-- BARIS 2: GRAFIK REALISASI VS RENCANA & KOMPOSISI ANGGARAN -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div class="lg:col-span-2 bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                <div class="flex justify-between items-center mb-4">
                    <div>
                        <h3 class="text-sm font-bold text-slate-800">Realisasi vs Target Kumulatif</h3>
                        <p class="text-xs text-slate-500">Berdasarkan pencatatan serapan di sheet Realisasi</p>
                    </div>
                    <div class="flex items-center gap-4 text-xs font-semibold">
                        <span class="flex items-center gap-1.5"><span class="w-3 h-1 bg-blue-500 rounded"></span> Target Rencana</span>
                        <span class="flex items-center gap-1.5"><span class="w-3 h-1 bg-emerald-500 rounded"></span> Realisasi Kumulatif</span>
                    </div>
                </div>
                <div class="h-64 relative">
                    <canvas id="chartRealisasiRencana"></canvas>
                </div>
            </div>

            <div class="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between">
                <div class="flex justify-between items-center mb-2">
                    <h3 class="text-sm font-bold text-slate-800">Komposisi Paket Pekerjaan</h3>
                    <span class="text-[10px] text-slate-400">Total ${totalPaket} Paket</span>
                </div>
                <div class="relative h-44 flex items-center justify-center my-2">
                    <canvas id="chartKomposisi"></canvas>
                    <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span class="text-base font-bold text-slate-800">${totalPaket}</span>
                        <span class="text-[10px] text-slate-400">Total Paket</span>
                    </div>
                </div>
                <div class="space-y-1.5 text-xs pt-2 border-t border-slate-100">
                    ${komposisiHTML}
                </div>
            </div>
        </div>

        <!-- BARIS 3: REALISASI PER BULAN, TOP 5 PENYEDIA, STATUS PEKERJAAN -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div class="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                <div class="flex justify-between items-center mb-3">
                    <h3 class="text-sm font-bold text-slate-800">Realisasi per Bulan</h3>
                    <div class="flex items-center gap-3 text-[10px] font-semibold">
                        <span class="flex items-center gap-1"><span class="w-2 h-2 rounded bg-emerald-500"></span> Realisasi Fisik / Keuangan</span>
                    </div>
                </div>
                <div class="h-56 relative">
                    <canvas id="chartRealisasiBulan"></canvas>
                </div>
            </div>

            <div class="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                <div class="flex justify-between items-center mb-3">
                    <h3 class="text-sm font-bold text-slate-800">Top Mitra Penyedia</h3>
                    <span class="text-[10px] text-slate-400">Berdasarkan Kontrak</span>
                </div>
                <div class="space-y-3 text-xs pt-1">
                    ${topVendorsHTML}
                </div>
            </div>

            <div class="space-y-6">
                <div class="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                    <div class="flex justify-between items-center mb-2">
                        <h3 class="text-sm font-bold text-slate-800">Status Pekerjaan / Kontrak</h3>
                        <span class="text-[10px] text-slate-400">Total ${kontrakArr.length > 0 ? kontrakArr.length : totalPaket} Data</span>
                    </div>
                    <div class="flex items-center gap-4">
                        <div class="relative w-32 h-32 flex items-center justify-center">
                            <canvas id="chartStatus"></canvas>
                            <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span class="text-base font-bold text-slate-800">${kontrakArr.length > 0 ? kontrakArr.length : totalPaket}</span>
                                <span class="text-[9px] text-slate-400">Total</span>
                            </div>
                        </div>
                        <div class="flex-1 space-y-1 text-[11px]">
                            <div class="flex justify-between items-center"><span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-emerald-500"></span>Selesai</span><span class="font-bold">${statusCounts['Selesai']}</span></div>
                            <div class="flex justify-between items-center"><span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-blue-500"></span>On Progress</span><span class="font-bold">${statusCounts['On Progress']}</span></div>
                            <div class="flex justify-between items-center"><span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-amber-500"></span>Belum Mulai</span><span class="font-bold">${statusCounts['Belum Mulai']}</span></div>
                            <div class="flex justify-between items-center"><span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-orange-500"></span>Tunda</span><span class="font-bold">${statusCounts['Tunda']}</span></div>
                            <div class="flex justify-between items-center"><span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-rose-500"></span>Batal</span><span class="font-bold">${statusCounts['Batal']}</span></div>
                        </div>
                    </div>
                </div>

                <div class="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                    <div class="flex justify-between items-center mb-3">
                        <h3 class="text-sm font-bold text-slate-800">Status Sinkronisasi Basis Data</h3>
                        <span class="text-[10px] text-emerald-600 font-semibold">Terkoneksi</span>
                    </div>
                    <div class="space-y-2 text-xs">
                        <div class="flex justify-between text-slate-600 pb-1.5 border-b border-slate-100">
                            <span>Master Pengadaan</span>
                            <span class="font-bold text-slate-800">${pengadaanArr.length} Data</span>
                        </div>
                        <div class="flex justify-between text-slate-600 pb-1.5 border-b border-slate-100">
                            <span>Master Pekerjaan</span>
                            <span class="font-bold text-slate-800">${pekerjaanArr.length} Data</span>
                        </div>
                        <div class="flex justify-between text-slate-600 pb-1.5 border-b border-slate-100">
                            <span>Data Kontrak</span>
                            <span class="font-bold text-slate-800">${kontrakArr.length} Data</span>
                        </div>
                        <div class="flex justify-between text-slate-600">
                            <span>Riwayat Realisasi</span>
                            <span class="font-bold text-slate-800">${realisasiArr.length} Data</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- QUICK ACCESS MENU -->
        <div class="bg-white p-5 rounded-xl shadow-sm border border-slate-100 mb-6">
            <h3 class="text-sm font-bold text-slate-700 mb-3">Quick Access (Akses Cepat)</h3>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <button onclick="navigate('pekerjaan')" class="p-3.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl flex items-center gap-3 transition font-semibold text-xs text-left shadow-sm">
                    <div class="p-2 bg-blue-600 text-white rounded-lg"><i data-lucide="briefcase" class="w-4 h-4"></i></div>
                    <span>Master Pekerjaan</span>
                </button>
                <button onclick="navigate('rab')" class="p-3.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl flex items-center gap-3 transition font-semibold text-xs text-left shadow-sm">
                    <div class="p-2 bg-emerald-600 text-white rounded-lg"><i data-lucide="calculator" class="w-4 h-4"></i></div>
                    <span>Buat RAB Baru</span>
                </button>
                <button onclick="navigate('realisasi')" class="p-3.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl flex items-center gap-3 transition font-semibold text-xs text-left shadow-sm">
                    <div class="p-2 bg-amber-600 text-white rounded-lg"><i data-lucide="trending-up" class="w-4 h-4"></i></div>
                    <span>Input Realisasi</span>
                </button>
                <button onclick="navigate('penyedia')" class="p-3.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl flex items-center gap-3 transition font-semibold text-xs text-left shadow-sm">
                    <div class="p-2 bg-purple-600 text-white rounded-lg"><i data-lucide="building" class="w-4 h-4"></i></div>
                    <span>Data Penyedia</span>
                </button>
            </div>
        </div>
    `;

    lucide.createIcons();
    initDashboardCharts(realisasiKumulatif, rencanaKumulatif, realisasiPerBulan, komposisiLabels, komposisiValues, statusCounts);
}

function initDashboardCharts(realisasiKumulatif = [], rencanaKumulatif = [], realisasiPerBulan = [], komposisiLabels = [], komposisiValues = [], statusCounts = {}) {
    const ctxRR = document.getElementById('chartRealisasiRencana');
    if (ctxRR) {
        new Chart(ctxRR, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
                datasets: [
                    {
                        label: 'Target Rencana (Miliar)',
                        data: rencanaKumulatif,
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderWidth: 2.5,
                        fill: true,
                        tension: 0.3
                    },
                    {
                        label: 'Realisasi Kumulatif (Miliar)',
                        data: realisasiKumulatif,
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        borderWidth: 2.5,
                        fill: true,
                        tension: 0.3
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: true, position: 'bottom' } },
                scales: {
                    y: { grid: { color: '#f1f5f9' }, ticks: { font: { size: 10 } } },
                    x: { grid: { display: false }, ticks: { font: { size: 10 } } }
                }
            }
        });
    }

    const ctxKomposisi = document.getElementById('chartKomposisi');
    if (ctxKomposisi) {
        new Chart(ctxKomposisi, {
            type: 'doughnut',
            data: {
                labels: komposisiLabels,
                datasets: [{
                    data: komposisiValues,
                    backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#94a3b8', '#0ea5e9'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                cutout: '75%'
            }
        });
    }

    const ctxBulan = document.getElementById('chartRealisasiBulan');
    if (ctxBulan) {
        const rBulanMilyar = (realisasiPerBulan || []).map(v => Number((v / 1000000000).toFixed(3)));
        new Chart(ctxBulan, {
            type: 'bar',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
                datasets: [
                    {
                        label: 'Realisasi (Miliar)',
                        data: rBulanMilyar,
                        backgroundColor: '#10b981',
                        borderRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { grid: { color: '#f1f5f9' }, ticks: { font: { size: 9 } } },
                    x: { grid: { display: false }, ticks: { font: { size: 9 } } }
                }
            }
        });
    }

    const ctxStatus = document.getElementById('chartStatus');
    if (ctxStatus) {
        new Chart(ctxStatus, {
            type: 'doughnut',
            data: {
                labels: ['Selesai', 'On Progress', 'Belum Mulai', 'Tunda', 'Batal'],
                datasets: [{
                    data: [
                        statusCounts['Selesai'] || 0,
                        statusCounts['On Progress'] || 0,
                        statusCounts['Belum Mulai'] || 0,
                        statusCounts['Tunda'] || 0,
                        statusCounts['Batal'] || 0
                    ],
                    backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#f97316', '#ef4444'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                cutout: '70%'
            }
        });
    }
}

// ==========================================
// 5. MODUL RAB
// ==========================================

async function renderRAB() {
    const contentArea = document.getElementById('app-content');

    // Kita panggil Pengadaan & Pekerjaan sekaligus agar relasinya bisa di-crosscheck
    const [pekerjaanList, pengadaanList] = await Promise.all([
        fetchAPI('action=list&table=Pekerjaan'),
        fetchAPI('action=list&table=Pengadaan')
    ]);

    window.allPekerjaanList = pekerjaanList || [];
    window.allPengadaanList = pengadaanList || [];

    let dropdownOptions = '<option value="">-- Pilih Paket Pekerjaan --</option>';
    window.allPekerjaanList.forEach(p => {
        let nomor = p.nomor_paket || '-';
        dropdownOptions += '<option value="' + p.id + '">' + nomor + ' : ' + p.nama_pekerjaan + '</option>';
    });

    contentArea.innerHTML = `
        <div class="mb-4">
            <h2 class="text-xl font-bold text-slate-800">Penyusunan RAB</h2>
            <p class="text-sm text-slate-500">Estimator Rencana Anggaran Biaya Pekerjaan</p>
        </div>

        <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-100 mb-6">
            <!-- WIZARD STEPS -->
            <div class="flex flex-col sm:flex-row items-center justify-between border-b border-slate-100 pb-6 mb-6 gap-4">
                <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-sm"><i data-lucide="check" class="w-4 h-4"></i></div>
                    <span class="text-sm font-semibold text-slate-800">Pilih Pekerjaan</span>
                </div>
                <div class="hidden sm:block h-px bg-slate-200 flex-1 mx-4"></div>
                <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center font-bold text-sm">2</div>
                    <span class="text-sm font-semibold text-brand">Rincian RAB Estimator</span>
                </div>
                <div class="hidden sm:block h-px bg-slate-200 flex-1 mx-4"></div>
                <div class="flex items-center gap-2 opacity-50">
                    <div class="w-8 h-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm">3</div>
                    <span class="text-sm font-medium text-slate-500">Review & Simpan</span>
                </div>
            </div>

            <!-- INFORMASI PEKERJAAN -->
            <h3 class="text-base font-bold text-slate-800 mb-4 flex items-center gap-2"><i data-lucide="info" class="w-5 h-5 text-brand"></i> Informasi Pekerjaan</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 bg-slate-50/50 p-5 rounded-xl border border-slate-100">
                <div>
                    <label class="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Pilih Nama Pekerjaan</label>
                    <select id="select-pekerjaan-rab" onchange="handleSelectPekerjaanRAB(this.value)" class="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 bg-white font-medium shadow-sm">
                        ${dropdownOptions}
                    </select>
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Jenis Pekerjaan</label>
                    <div class="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-slate-100 text-slate-700 font-medium flex items-center shadow-inner" id="info-kegiatan">-</div>
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Lokasi / ULP</label>
                    <div class="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-slate-100 text-slate-700 font-medium flex items-center shadow-inner" id="info-lokasi">-</div>
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Tahun Anggaran</label>
                    <div class="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-slate-100 text-slate-700 font-medium flex items-center shadow-inner" id="info-tahun">-</div>
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Volume Paket</label>
                    <div class="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-slate-100 text-brand font-bold flex items-center shadow-inner" id="info-volume">-</div>
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Sumber Anggaran</label>
                    <div class="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-slate-100 text-slate-700 font-medium flex items-center shadow-inner" id="info-sumber">-</div>
                </div>
            </div>

            <!-- RINCIAN RAB ESTIMATOR -->
            <div id="rab-section-container" class="hidden">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                    <h3 class="text-base font-bold text-slate-800 flex items-center gap-2"><i data-lucide="calculator" class="w-5 h-5 text-emerald-500"></i> Rincian Biaya Estimator</h3>
                    <div class="flex gap-2 w-full sm:w-auto">
                        <button onclick="showModalRAB()" id="btn-add-modal" class="bg-brand text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-sky-700 transition flex items-center justify-center gap-1.5 shadow-sm flex-1 sm:flex-none">
                            <i data-lucide="plus" class="w-4 h-4"></i> Tambah Item
                        </button>
                    </div>
                </div>
                
                <div id="rab-table-container">
                    <div class="text-center py-12 text-slate-400 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                        <i data-lucide="calculator" class="w-12 h-12 mx-auto mb-3 text-slate-300"></i>
                        <p>Silakan pilih paket pekerjaan terlebih dahulu.</p>
                    </div>
                </div>

                <div class="mt-8 flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-slate-100">
                    <p class="text-xs text-slate-500">Pastikan semua perhitungan RAB sudah sesuai sebelum melanjutkan ke tahap Review.</p>
                    <div class="flex gap-3 w-full sm:w-auto">
                        <button class="px-5 py-2.5 border border-slate-300 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 w-full sm:w-auto">Simpan Draft</button>
                        <button onclick="saveAllRABToSheets()" id="btn-save-all" class="px-6 py-2.5 bg-brand text-white rounded-xl text-sm font-semibold hover:bg-sky-700 shadow-sm flex items-center justify-center gap-2 w-full sm:w-auto">Lanjut Review <i data-lucide="arrow-right" class="w-4 h-4"></i></button>
                    </div>
                </div>
            </div>
        </div>

        <!-- POPUP MODAL FORM INPUT RAB -->
        <div id="modal-rab" class="fixed inset-0 bg-slate-900/50 z-50 hidden flex items-center justify-center backdrop-blur-sm transition-opacity opacity-0 p-4">
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-8 transform transition-all scale-95 max-h-[90vh] overflow-y-auto">
                <div class="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                    <div class="flex items-center gap-3">
                        <div class="bg-blue-50 text-brand p-2.5 rounded-xl"><i data-lucide="file-text" class="w-6 h-6"></i></div>
                        <div>
                            <h3 class="text-xl font-bold text-slate-800" id="modal-rab-title">Tambah Item RAB</h3>
                        </div>
                    </div>
                    <button type="button" onclick="closeModalRAB()" class="text-slate-400 hover:text-slate-700 p-2"><i data-lucide="x" class="w-6 h-6"></i></button>
                </div>
                <form id="form-rab" onsubmit="saveItemModalToTemp(event)">
                    <input type="hidden" id="modal-edit-index" value="">
                    <div class="space-y-5">
                        <div>
                            <label class="block text-sm font-semibold text-slate-700 mb-1.5">Kategori Jaringan</label>
                            <select id="modal-kategori" class="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:border-brand outline-none bg-white">
                                <option value="JTM">JTM (Jaringan Tegangan Menengah)</option>
                                <option value="JTR">JTR (Jaringan Tegangan Rendah)</option>
                                <option value="Umum">Umum / Lainnya</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-slate-700 mb-1.5">Uraian Pekerjaan / Material</label>
                            <input type="text" id="modal-uraian" required placeholder="Contoh: Tiang Beton 13/350/350+E daN" class="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:border-brand outline-none">
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-semibold text-slate-700 mb-1.5">Satuan</label>
                                <input type="text" id="modal-satuan" required placeholder="Contoh: Btg / m3 / ls" class="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:border-brand outline-none">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-slate-700 mb-1.5">Volume (Vol)</label>
                                <input type="number" step="any" id="modal-volume" value="1" required oninput="calculateModalPreview()" class="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:border-brand outline-none">
                            </div>
                        </div>
                        <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                            <div class="flex items-center justify-between">
                                <p class="text-xs font-bold text-slate-500 uppercase tracking-wider">Harga Satuan (Rp)</p>
                                <button type="button" onclick="openMaterialPickerRAB()" class="text-xs bg-brand text-white px-3 py-1 rounded-lg hover:bg-sky-700 transition flex items-center gap-1">
                                    <i data-lucide="database" class="w-3 h-3"></i> Ambil dari Master Material
                                </button>
                            </div>
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-xs font-medium text-slate-600 mb-1 flex items-center gap-1">
                                        <i data-lucide="lock" class="w-3 h-3 text-slate-400"></i> Material
                                    </label>
                                    <input type="number" step="any" id="modal-harga-material" value="0" placeholder="Gunakan tombol 'Ambil dari Master Material'" class="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-slate-50 outline-none" readonly onfocus="this.blur()">
                                </div>
                                <div>
                                    <label class="block text-xs font-medium text-slate-600 mb-1 flex items-center gap-1">
                                        <i data-lucide="lock" class="w-3 h-3 text-slate-400"></i> Jasa
                                    </label>
                                    <input type="number" step="any" id="modal-harga-jasa" value="0" placeholder="Gunakan tombol 'Ambil dari Master Material'" class="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-slate-50 outline-none" readonly onfocus="this.blur()">
                                </div>
                            </div>
                        </div>
                        <div class="bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-2">
                            <div class="flex justify-between text-xs text-slate-600">
                                <span>Bagian Material: <b id="modal-preview-mat" class="text-slate-800">Rp 0</b></span>
                                <span>Bagian Jasa: <b id="modal-preview-jasa" class="text-slate-800">Rp 0</b></span>
                            </div>
                            <div class="pt-2 border-t border-blue-200 flex justify-between items-center">
                                <span class="text-sm font-bold text-slate-700">Total Harga Item:</span>
                                <input type="text" id="modal-jumlah-preview" readonly class="text-right border-0 bg-transparent text-lg font-bold text-brand outline-none w-1/2" value="Rp 0">
                            </div>
                        </div>
                    </div>
                    <div class="mt-8 flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <button type="button" onclick="closeModalRAB()" class="px-5 py-2.5 border border-slate-300 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50">Batal</button>
                        <button type="submit" class="px-6 py-2.5 bg-brand text-white rounded-xl text-sm font-semibold hover:bg-sky-700 shadow-md">Simpan Item</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    lucide.createIcons();

    if (state.selectedPekerjaanRAB) {
        document.getElementById('select-pekerjaan-rab').value = state.selectedPekerjaanRAB;
        handleSelectPekerjaanRAB(state.selectedPekerjaanRAB);
    }
}

async function handleSelectPekerjaanRAB(id) {
    state.selectedPekerjaanRAB = id;
    const infoContainer = document.getElementById('rab-info-pekerjaan');

    if (window.allPekerjaanList) {
        const selectedObj = window.allPekerjaanList.find(p => String(p.id) === String(id));
        state.selectedPekerjaanNamaRAB = selectedObj ? selectedObj.nama_pekerjaan : '';
        state.selectedPengadaanIdRAB = selectedObj ? (selectedObj.pengadaan_id || '') : '';

        // Cari Pengadaan terkait untuk Tahun & Sumber Anggaran
        let pengadaanObj = null;
        if (state.selectedPengadaanIdRAB && window.allPengadaanList) {
            pengadaanObj = window.allPengadaanList.find(p => String(p.id) === String(state.selectedPengadaanIdRAB));
        }

        state.selectedPengadaanNamaRAB = pengadaanObj ? pengadaanObj.nama_pengadaan : (selectedObj ? selectedObj.nama_pengadaan : '');

        // UPDATE UI PANEL INFO PEKERJAAN
        if (selectedObj && infoContainer) {
            document.getElementById('info-tahun').innerText = pengadaanObj ? pengadaanObj.tahun : '-';
            document.getElementById('info-sumber').innerText = pengadaanObj ? (pengadaanObj.sumber_anggaran || 'APLN') : '-';
            document.getElementById('info-lokasi').innerText = selectedObj.lokasi || '-';
            document.getElementById('info-kegiatan').innerText = selectedObj.jenis_kegiatan || '-';
            document.getElementById('info-volume').innerText = selectedObj.volume_paket || '-';
        }
    }

    const sectionRAB = document.getElementById('rab-section-container');

    if (id) {
        if (sectionRAB) sectionRAB.classList.remove('hidden');

        const allRAB = await fetchAPI('action=list&table=RAB') || [];
        const existingRAB = allRAB.filter(item => String(item.pekerjaan_id) === String(id));

        console.log('=== LOAD RAB DATA ===');
        console.log('All RAB from Sheets:', allRAB);
        console.log('Filtered RAB for pekerjaan_id', id, ':', existingRAB);

        state.tempRABItems = existingRAB.map(item => {
            console.log('Loading item:', item.uraian, 'ID:', item.id, 'Type:', typeof item.id);
            return {
                id: item.id || 'temp_' + Date.now(), // Fallback jika ID kosong
                kategori: item.kategori || 'Umum',
                uraian: item.uraian || '',
                satuan: item.satuan || '',
                volume: parseFloat(item.volume) || 0,
                harga_material: parseFloat(item.harga_material) || 0,
                harga_jasa: parseFloat(item.harga_jasa) || 0,
                isSaved: true,
                _isDirty: false  // Item dari Sheets belum diubah
            };
        });

        console.log('tempRABItems after loading:', state.tempRABItems);

        if (state.tempRABItems.length === 0) {
            state.tempRABItems.push({
                id: 'temp_' + Date.now(),
                kategori: 'JTM',
                uraian: '',
                satuan: '',
                volume: 1,
                harga_material: 0,
                harga_jasa: 0,
                isSaved: false,
                _isDirty: false
            });
        }
        renderRABTable();
    } else {
        if (sectionRAB) sectionRAB.classList.add('hidden');
        state.tempRABItems = [];
        const container = document.getElementById('rab-table-container');
        if (container) container.innerHTML = '<div class="text-center py-12 text-slate-400 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200"><p>Silakan pilih paket pekerjaan terlebih dahulu.</p></div>';
    }
}

function showModalRAB(editIndex = null) {
    const modal = document.getElementById('modal-rab');
    if (!modal) return;
    document.getElementById('form-rab').reset();
    document.getElementById('modal-edit-index').value = '';
    document.getElementById('modal-rab-title').innerText = 'Tambah Item RAB';
    document.getElementById('modal-kategori').value = 'JTM';
    document.getElementById('modal-volume').value = '1';
    document.getElementById('modal-jumlah-preview').value = 'Rp 0';
    document.getElementById('modal-preview-mat').innerText = 'Rp 0';
    document.getElementById('modal-preview-jasa').innerText = 'Rp 0';

    if (editIndex !== null && state.tempRABItems[editIndex]) {
        const item = state.tempRABItems[editIndex];
        document.getElementById('modal-rab-title').innerText = 'Edit Item RAB';
        document.getElementById('modal-edit-index').value = editIndex;
        document.getElementById('modal-kategori').value = item.kategori || 'JTM';
        document.getElementById('modal-uraian').value = item.uraian;
        document.getElementById('modal-satuan').value = item.satuan;
        document.getElementById('modal-volume').value = item.volume;
        document.getElementById('modal-harga-material').value = item.harga_material;
        document.getElementById('modal-harga-jasa').value = item.harga_jasa;
        calculateModalPreview();
    }

    modal.classList.remove('hidden');
    setTimeout(() => { modal.classList.remove('opacity-0'); modal.querySelector('div').classList.remove('scale-95'); }, 10);
}

function closeModalRAB() {
    const modal = document.getElementById('modal-rab');
    modal.classList.add('opacity-0'); modal.querySelector('div').classList.add('scale-95');
    setTimeout(() => modal.classList.add('hidden'), 300);
}

// ---- MATERIAL PICKER untuk RAB ----
async function openMaterialPickerRAB() {
    // Muat data material dari Sheets jika belum ada
    if (!window.allMaterialList || window.allMaterialList.length === 0) {
        showToast('Memuat data material...', 'info');
        const data = await fetchAPI('action=list&table=Material') || [];
        window.allMaterialList = data;
    }

    let pickerDiv = document.getElementById('modal-material-picker');
    if (!pickerDiv) {
        pickerDiv = document.createElement('div');
        pickerDiv.id = 'modal-material-picker';
        document.body.appendChild(pickerDiv);
    }

    const matList = window.allMaterialList;
    let rows = '';
    if (matList.length === 0) {
        rows = '<tr><td colspan="5" class="px-4 py-6 text-center text-slate-400 italic">Belum ada data material. Tambahkan di menu Master Material.</td></tr>';
    } else {
        matList.forEach((m, i) => {
            const nama = m.material || m.nama_material || m.uraian || m.nama || m.item || '-';
            const kategori = m.kategori || m.keterangan || m.kelompok || 'Umum';
            const satuan = m.satuan || m.unit || '-';
            const hargaMat = parseFloat(m.harga) || parseFloat(m.harga_material) || parseFloat(m.harga_satuan) || 0;
            const hargaJasa = parseFloat(m.harga_jasa) || parseFloat(m.jasa) || 0;
            rows += `
                <tr class="hover:bg-blue-50 cursor-pointer transition-colors" onclick="selectMaterialForRAB('${nama.replace(/'/g,"\\'")}','${satuan}',${hargaMat},${hargaJasa})">
                    <td class="px-3 py-2.5 text-center text-slate-400 text-xs">${i + 1}</td>
                    <td class="px-3 py-2.5"><span class="bg-blue-50 text-brand px-2 py-0.5 rounded text-[10px] font-semibold">${kategori}</span></td>
                    <td class="px-3 py-2.5 font-medium text-slate-800 text-xs">${nama}</td>
                    <td class="px-3 py-2.5 text-xs text-slate-500">${satuan}</td>
                    <td class="px-3 py-2.5 text-right text-xs font-semibold text-emerald-600">${CONFIG.formatCurrency(hargaMat)}</td>
                    <td class="px-3 py-2.5 text-right text-xs text-slate-500">${CONFIG.formatCurrency(hargaJasa)}</td>
                </tr>
            `;
        });
    }

    pickerDiv.innerHTML = `
        <div class="fixed inset-0 bg-slate-900/60 z-[60] flex items-center justify-center backdrop-blur-sm p-4">
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                <div class="flex justify-between items-center px-6 py-4 border-b border-slate-100">
                    <div>
                        <h3 class="text-lg font-bold text-slate-800">Pilih Material dari Master</h3>
                        <p class="text-xs text-slate-500 mt-0.5">Klik baris untuk mengisi harga material & jasa secara otomatis</p>
                    </div>
                    <button onclick="closeMaterialPicker()" class="text-slate-400 hover:text-slate-700 p-1">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                </div>
                <div class="px-6 py-3 border-b border-slate-100">
                    <input type="text" id="search-mat-picker" oninput="filterMaterialPicker()" placeholder="Cari nama material, kategori, satuan..." 
                        class="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand">
                </div>
                <div class="overflow-y-auto flex-1">
                    <table class="w-full text-left border-collapse text-xs">
                        <thead class="bg-slate-50 sticky top-0">
                            <tr class="text-slate-600 font-semibold border-b border-slate-200">
                                <th class="px-3 py-2.5 text-center w-10">No</th>
                                <th class="px-3 py-2.5">Kategori</th>
                                <th class="px-3 py-2.5">Nama Material</th>
                                <th class="px-3 py-2.5">Satuan</th>
                                <th class="px-3 py-2.5 text-right">Harga Material</th>
                                <th class="px-3 py-2.5 text-right">Harga Jasa</th>
                            </tr>
                        </thead>
                        <tbody id="material-picker-tbody" class="divide-y divide-slate-100">
                            ${rows}
                        </tbody>
                    </table>
                </div>
                <div class="px-6 py-3 border-t border-slate-100 text-xs text-slate-400 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-brand shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    Harga akan otomatis terisi, Anda tetap bisa mengedit nilai setelah memilih.
                </div>
            </div>
        </div>
    `;
}

function filterMaterialPicker() {
    const q = (document.getElementById('search-mat-picker')?.value || '').toLowerCase().trim();
    const tbody = document.getElementById('material-picker-tbody');
    if (!tbody) return;
    const matList = window.allMaterialList || [];
    const filtered = q ? matList.filter(m => {
        const nama = (m.material || m.nama_material || m.uraian || m.nama || m.item || '').toLowerCase();
        const kategori = (m.kategori || m.keterangan || m.kelompok || '').toLowerCase();
        const satuan = (m.satuan || m.unit || '').toLowerCase();
        return nama.includes(q) || kategori.includes(q) || satuan.includes(q);
    }) : matList;

    let rows = '';
    filtered.forEach((m, i) => {
        const nama = m.material || m.nama_material || m.uraian || m.nama || m.item || '-';
        const kategori = m.kategori || m.keterangan || m.kelompok || 'Umum';
        const satuan = m.satuan || m.unit || '-';
        const hargaMat = parseFloat(m.harga) || parseFloat(m.harga_material) || parseFloat(m.harga_satuan) || 0;
        const hargaJasa = parseFloat(m.harga_jasa) || parseFloat(m.jasa) || 0;
        rows += `
            <tr class="hover:bg-blue-50 cursor-pointer transition-colors" onclick="selectMaterialForRAB('${nama.replace(/'/g,"\\'")}','${satuan}',${hargaMat},${hargaJasa})">
                <td class="px-3 py-2.5 text-center text-slate-400">${i + 1}</td>
                <td class="px-3 py-2.5"><span class="bg-blue-50 text-brand px-2 py-0.5 rounded text-[10px] font-semibold">${kategori}</span></td>
                <td class="px-3 py-2.5 font-medium text-slate-800">${nama}</td>
                <td class="px-3 py-2.5 text-slate-500">${satuan}</td>
                <td class="px-3 py-2.5 text-right font-semibold text-emerald-600">${CONFIG.formatCurrency(hargaMat)}</td>
                <td class="px-3 py-2.5 text-right text-slate-500">${CONFIG.formatCurrency(hargaJasa)}</td>
            </tr>
        `;
    });
    tbody.innerHTML = rows || '<tr><td colspan="6" class="px-4 py-6 text-center text-slate-400 italic">Tidak ditemukan.</td></tr>';
}

function selectMaterialForRAB(nama, satuan, hargaMat, hargaJasa) {
    // Isi form RAB modal
    const uraianEl = document.getElementById('modal-uraian');
    const satuanEl = document.getElementById('modal-satuan');
    const hMatEl = document.getElementById('modal-harga-material');
    const hJasaEl = document.getElementById('modal-harga-jasa');
    
    // Selalu isi nama material/uraian
    if (uraianEl) uraianEl.value = nama;
    if (satuanEl && !satuanEl.value) satuanEl.value = satuan;
    if (hMatEl) hMatEl.value = hargaMat;
    if (hJasaEl) hJasaEl.value = hargaJasa;
    
    calculateModalPreview();
    closeMaterialPicker();
    showToast('Material berhasil dipilih dari Master Material');
}

function closeMaterialPicker() {
    const pickerDiv = document.getElementById('modal-material-picker');
    if (pickerDiv) pickerDiv.remove();
}

function calculateModalPreview() {
    const vol = parseFloat(document.getElementById('modal-volume').value) || 0;
    const hMat = parseFloat(document.getElementById('modal-harga-material').value) || 0;
    const hJasa = parseFloat(document.getElementById('modal-harga-jasa').value) || 0;
    document.getElementById('modal-preview-mat').innerText = CONFIG.formatCurrency(vol * hMat);
    document.getElementById('modal-preview-jasa').innerText = CONFIG.formatCurrency(vol * hJasa);
    document.getElementById('modal-jumlah-preview').value = CONFIG.formatCurrency((vol * hMat) + (vol * hJasa));
}

function saveItemModalToTemp(event) {
    event.preventDefault();
    const editIndex = document.getElementById('modal-edit-index').value;
    
    // Cek apakah ini mode edit item yang sudah ada
    const isEditing = editIndex !== '';
    const existingItem = isEditing ? state.tempRABItems[editIndex] : null;
    
    // SOLUSI: Treat semua edit sebagai item BARU untuk menghindari error update
    // Item yang diedit akan dihapus dari Sheets dan dibuat ulang dengan data baru
    const needsDelete = existingItem && existingItem.isSaved === true && existingItem.id && !existingItem.id.toString().startsWith('temp_');
    
    const newItem = {
        id: 'temp_' + Date.now(), // Selalu generate ID baru
        kategori: document.getElementById('modal-kategori').value,
        uraian: document.getElementById('modal-uraian').value,
        satuan: document.getElementById('modal-satuan').value,
        volume: parseFloat(document.getElementById('modal-volume').value) || 0,
        harga_material: parseFloat(document.getElementById('modal-harga-material').value) || 0,
        harga_jasa: parseFloat(document.getElementById('modal-harga-jasa').value) || 0,
        isSaved: false,  // Tandai sebagai belum disimpan
        _isDirty: false,
        _oldId: needsDelete ? existingItem.id : null // Simpan ID lama untuk dihapus nanti
    };
    
    console.log('=== SAVE ITEM TO TEMP ===');
    console.log('Is Editing:', isEditing);
    console.log('Needs Delete Old:', needsDelete);
    if (needsDelete) console.log('Old ID to delete:', existingItem.id);
    console.log('New Item:', newItem);
    
    if (isEditing) {
        state.tempRABItems[editIndex] = newItem;
    } else {
        state.tempRABItems.push(newItem);
    }
    
    closeModalRAB();
    renderRABTable();
    showToast('Item berhasil diubah. Klik "Simpan ke Sheet" untuk menyimpan.');
}

function removeTempRow(index) {
    const item = state.tempRABItems[index];
    if (item.isSaved) {
        deleteData('RAB', item.id, () => {
            state.tempRABItems.splice(index, 1);
            renderRABTable();
        });
    } else {
        state.tempRABItems.splice(index, 1);
        renderRABTable();
    }
}

function renderRABTable() {
    const container = document.getElementById('rab-table-container');
    if (!container) return;

    let html = `
        <div class="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
            <table class="w-full text-left border-collapse whitespace-nowrap text-xs">
                <thead>
                    <tr class="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold text-center">
                        <th rowspan="2" class="px-3.5 py-3.5 border-r border-slate-200 w-12">NO</th>
                        <th rowspan="2" class="px-3 py-3.5 border-r border-slate-200 w-24">KATEGORI</th>
                        <th rowspan="2" class="px-4 py-3.5 border-r border-slate-200 text-left">URAIAN PEKERJAAN / MATERIAL</th>
                        <th rowspan="2" class="px-3 py-3.5 border-r border-slate-200 w-20">SAT</th>
                        <th rowspan="2" class="px-3 py-3.5 border-r border-slate-200 w-20">VOL</th>
                        <th colspan="2" class="px-3 py-2 border-b border-r border-slate-200 bg-slate-200/60">HARGA SATUAN (Rp)</th>
                        <th colspan="2" class="px-3 py-2 border-b border-r border-slate-200 bg-slate-200/60">HARGA BAGIAN (Rp)</th>
                        <th rowspan="2" class="px-4 py-3.5 border-r border-slate-200 text-right">TOTAL HARGA (Rp)</th>
                        <th rowspan="2" class="px-3 py-3.5 w-20">AKSI</th>
                    </tr>
                    <tr class="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-center">
                        <th class="px-3 py-2 border-r border-slate-200">MATERIAL</th>
                        <th class="px-3 py-2 border-r border-slate-200">JASA</th>
                        <th class="px-3 py-2 border-r border-slate-200">MATERIAL</th>
                        <th class="px-3 py-2 border-r border-slate-200">JASA</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 text-slate-700">
    `;

    if (state.tempRABItems.length === 0) {
        html += '<tr><td colspan="11" class="px-4 py-10 text-center text-slate-400 italic">Belum ada item di daftar. Klik "Input via Popup Form Besar" di atas.</td></tr>';
    } else {
        state.tempRABItems.forEach((item, index) => {
            const vol = parseFloat(item.volume) || 0;
            const hMat = parseFloat(item.harga_material) || 0;
            const hJasa = parseFloat(item.harga_jasa) || 0;
            const bMat = vol * hMat;
            const bJasa = vol * hJasa;
            const totalItem = bMat + bJasa;

            const statusBadge = item._isDirty 
                ? '<span class="text-[9px] bg-orange-100 text-orange-700 px-1 py-0.5 rounded ml-1 font-semibold">Diubah</span>'
                : (item.isSaved 
                    ? '<span class="text-[9px] bg-green-100 text-green-700 px-1 py-0.5 rounded ml-1 font-semibold">Tersimpan</span>' 
                    : '<span class="text-[9px] bg-amber-100 text-amber-700 px-1 py-0.5 rounded ml-1 font-semibold">Baru</span>');
            const katBadge = item.kategori === 'JTM' ? 'bg-purple-100 text-purple-700' : (item.kategori === 'JTR' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-700');

            html += `
                <tr class="hover:bg-blue-50/30 transition-colors">
                    <td class="px-3.5 py-3 text-center border-r border-slate-100 text-slate-500 font-medium">${index + 1} ${statusBadge}</td>
                    <td class="px-3 py-3 text-center border-r border-slate-100"><span class="px-2 py-1 rounded text-[11px] font-bold ${katBadge}">${item.kategori || 'Umum'}</span></td>
                    <td class="px-4 py-3 border-r border-slate-100 font-semibold text-slate-800 whitespace-normal min-w-[220px]">${item.uraian}</td>
                    <td class="px-3 py-3 text-center border-r border-slate-100 text-slate-600">${item.satuan}</td>
                    <td class="px-3 py-3 text-center border-r border-slate-100 font-medium">${vol}</td>
                    <td class="px-3 py-3 text-right border-r border-slate-100">${hMat > 0 ? CONFIG.formatCurrency(hMat) : '-'}</td>
                    <td class="px-3 py-3 text-right border-r border-slate-100">${hJasa > 0 ? CONFIG.formatCurrency(hJasa) : '-'}</td>
                    <td class="px-3 py-3 text-right border-r border-slate-100 text-slate-600 font-medium bg-slate-50/50">${bMat > 0 ? CONFIG.formatCurrency(bMat) : '-'}</td>
                    <td class="px-3 py-3 text-right border-r border-slate-100 text-slate-600 font-medium bg-slate-50/50">${bJasa > 0 ? CONFIG.formatCurrency(bJasa) : '-'}</td>
                    <td class="px-4 py-3 text-right border-r border-slate-100 font-bold text-slate-900 bg-blue-50/20">${CONFIG.formatCurrency(totalItem)}</td>
                    <td class="px-3 py-3 text-center">
                        <div class="flex justify-center gap-1">
                            <button type="button" onclick="showModalRAB(${index})" class="text-blue-500 hover:text-blue-700 p-1" title="Edit"><i data-lucide="edit-2" class="w-4 h-4"></i></button>
                            <button type="button" onclick="removeTempRow(${index})" class="text-red-400 hover:text-red-600 p-1" title="Hapus"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                        </div>
                    </td>
                </tr>
            `;
        });
    }

    html += `
                </tbody>
                <tfoot class="bg-slate-50 text-sm border-t border-slate-200">
                    <tr>
                        <td colspan="9" class="px-4 py-3 text-right font-semibold text-slate-600">Subtotal</td>
                        <td class="px-4 py-3 text-right font-bold text-slate-800" id="footer-subtotal">Rp 0</td>
                        <td></td>
                    </tr>
                    <tr>
                        <td colspan="9" class="px-4 py-2 text-right font-semibold text-slate-600">PPN (11%)</td>
                        <td class="px-4 py-2 text-right font-bold text-slate-800" id="footer-ppn">Rp 0</td>
                        <td></td>
                    </tr>
                    <tr class="bg-blue-50 border-t border-blue-100">
                        <td colspan="9" class="px-4 py-4 text-right font-bold text-brand text-base">TOTAL ANGGARAN KESELURUHAN</td>
                        <td class="px-4 py-4 text-right font-bold text-brand text-base" id="footer-total">Rp 0</td>
                        <td></td>
                    </tr>
                </tfoot>
            </table>
        </div>
    `;

    container.innerHTML = html;
    lucide.createIcons();
    recalculateSubtotalFooter();
}

function recalculateSubtotalFooter() {
    let subtotal = 0;
    state.tempRABItems.forEach(item => {
        const vol = parseFloat(item.volume) || 0;
        const hMat = parseFloat(item.harga_material) || 0;
        const hJasa = parseFloat(item.harga_jasa) || 0;
        subtotal += (vol * hMat) + (vol * hJasa);
    });

    const ppn = subtotal * 0.11;
    const total = subtotal + ppn;

    const subEl = document.getElementById('footer-subtotal');
    const ppnEl = document.getElementById('footer-ppn');
    const totEl = document.getElementById('footer-total');

    if (subEl) subEl.innerText = CONFIG.formatCurrency(subtotal);
    if (ppnEl) ppnEl.innerText = CONFIG.formatCurrency(ppn);
    if (totEl) totEl.innerText = CONFIG.formatCurrency(total);
}

async function saveAllRABToSheets() {
    if (!state.selectedPekerjaanRAB) return showToast('Pilih pekerjaan terlebih dahulu', 'error');

    // Filter item baru: belum disimpan DAN punya uraian yang valid
    const itemsNew = state.tempRABItems.filter(item => {
        const isNew = !item.isSaved || item.id.toString().startsWith('temp_');
        const hasContent = item.uraian && item.uraian.trim() !== '';
        return isNew && hasContent;
    });
    
    // Filter item update: sudah disimpan, punya ID valid, dirty, dan punya uraian
    const itemsUpdated = state.tempRABItems.filter(item => {
        const isSaved = item.isSaved === true;
        const hasValidId = item.id && !item.id.toString().startsWith('temp_');
        const isDirty = item._isDirty === true;
        const hasContent = item.uraian && item.uraian.trim() !== '';
        return isSaved && hasValidId && isDirty && hasContent;
    });

    console.log('=== DEBUG SAVE RAB ===');
    console.log('Total items in array:', state.tempRABItems.length);
    console.log('All items:', state.tempRABItems);
    console.log('Items to create (NEW):', itemsNew.length, itemsNew);
    console.log('Items to update (DIRTY):', itemsUpdated.length, itemsUpdated);

    if (itemsNew.length === 0 && itemsUpdated.length === 0) {
        return showToast('Tidak ada perubahan yang perlu disimpan.', 'info');
    }

    const btn = document.getElementById('btn-save-all');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<div class="loader w-4 h-4 border-2 border-white border-t-transparent"></div> Menyimpan...';
    }

    const currentUser = state.currentUser ? state.currentUser.nama : 'Admin';
    let successCount = 0;
    let errorMessages = [];

    // Simpan item baru
    for (let item of itemsNew) {
        // Jika item ini adalah hasil edit dari item lama, hapus item lama terlebih dahulu
        if (item._oldId) {
            console.log('Deleting old item with ID:', item._oldId);
            try {
                await fetchAPI('', 'POST', {
                    action: 'delete',
                    table: 'RAB',
                    id: String(item._oldId),
                    user: currentUser
                });
                console.log('Old item deleted successfully');
            } catch (delErr) {
                console.error('Failed to delete old item:', delErr);
                // Lanjutkan proses meskipun delete gagal
            }
        }
        
        const vol = parseFloat(item.volume) || 0;
        const hMat = parseFloat(item.harga_material) || 0;
        const hJasa = parseFloat(item.harga_jasa) || 0;
        const bMat = vol * hMat;
        const bJasa = vol * hJasa;
        const jumlahTotal = bMat + bJasa;

        const payload = {
            action: 'create',
            table: 'RAB',
            user: currentUser,
            data: {
                pengadaan_id: state.selectedPengadaanIdRAB,
                nama_pengadaan: state.selectedPengadaanNamaRAB,
                pekerjaan_id: state.selectedPekerjaanRAB,
                nama_pekerjaan: state.selectedPekerjaanNamaRAB,
                kategori: item.kategori,
                uraian: item.uraian,
                satuan: item.satuan,
                volume: vol,
                harga_material: hMat,
                harga_jasa: hJasa,
                bagian_material: bMat,
                bagian_jasa: bJasa,
                jumlah: jumlahTotal
            }
        };
        console.log('Creating item:', item.uraian, 'Old ID deleted:', item._oldId || 'none', payload);
        try {
            const res = await fetchAPI('', 'POST', payload);
            if (res) {
                successCount++;
                console.log('Create success, response:', res);
            } else {
                errorMessages.push(`Gagal create: ${item.uraian}`);
            }
        } catch (err) {
            console.error('Create error:', err);
            errorMessages.push(`Error create ${item.uraian}: ${err.message}`);
        }
    }

    // Update item yang sudah ada dan diubah
    for (let item of itemsUpdated) {
        const vol = parseFloat(item.volume) || 0;
        const hMat = parseFloat(item.harga_material) || 0;
        const hJasa = parseFloat(item.harga_jasa) || 0;
        const bMat = vol * hMat;
        const bJasa = vol * hJasa;
        const jumlahTotal = bMat + bJasa;

        const payload = {
            action: 'update',
            table: 'RAB',
            id: String(item.id), // Pastikan ID dalam bentuk string
            user: currentUser,
            data: {
                kategori: item.kategori,
                uraian: item.uraian,
                satuan: item.satuan,
                volume: vol,
                harga_material: hMat,
                harga_jasa: hJasa,
                bagian_material: bMat,
                bagian_jasa: bJasa,
                jumlah: jumlahTotal
            }
        };
        console.log('=== UPDATE PAYLOAD ===');
        console.log('Item:', item.uraian);
        console.log('ID (original):', item.id, 'Type:', typeof item.id);
        console.log('ID (string):', String(item.id));
        console.log('Full Payload:', JSON.stringify(payload, null, 2));
        
        try {
            const res = await fetchAPI('', 'POST', payload);
            console.log('Update response:', res);
            if (res) {
                successCount++;
                console.log('Update success');
            } else {
                console.error('Update failed - no response');
                errorMessages.push(`Gagal update: ${item.uraian}`);
            }
        } catch (err) {
            console.error('Update error:', err);
            errorMessages.push(`Error update ${item.uraian}: ${err.message}`);
        }
    }

    if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i data-lucide="save" class="w-4 h-4"></i> Simpan ke Sheet';
        lucide.createIcons();
    }

    const totalAttempted = itemsNew.length + itemsUpdated.length;
    if (successCount > 0) {
        showToast(`Berhasil menyimpan ${successCount} dari ${totalAttempted} item ke Google Sheets!`);
        // Reload data dari server untuk sinkronisasi
        await handleSelectPekerjaanRAB(state.selectedPekerjaanRAB);
    } else {
        showToast(`Gagal menyimpan data. ${errorMessages.join('; ')}`, 'error');
    }
    
    console.log('=== SAVE COMPLETED ===');
    console.log('Success:', successCount, '/', totalAttempted);
    console.log('Errors:', errorMessages);
}

// ==========================================
// 6. MODUL REALISASI
// ==========================================

async function renderRealisasi() {
    const contentArea = document.getElementById('app-content');
    const pekerjaanList = await fetchAPI('action=list&table=Pekerjaan') || [];

    window.allPekerjaanList = pekerjaanList;

    let dropdownOptions = '<option value="">-- Pilih Paket Pekerjaan --</option>';
    pekerjaanList.forEach(p => {
        let nomor = p.nomor_paket || '-';
        dropdownOptions += '<option value="' + p.id + '">' + nomor + ' : ' + p.nama_pekerjaan + '</option>';
    });

    contentArea.innerHTML = `
        <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-100 mb-6">
            <div class="flex justify-between items-center mb-6">
                <div>
                    <h2 class="text-lg font-semibold text-slate-800">Input Data Realisasi</h2>
                    <p class="text-sm text-slate-500">Catat progres fisik dan serapan anggaran.</p>
                </div>
                <button onclick="showModalRealisasi()" id="btn-add-realisasi" class="hidden bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-700 transition flex items-center gap-2 shadow-sm">
                    <i data-lucide="plus" class="w-4 h-4"></i> Input Realisasi
                </button>
            </div>
            
            <div class="mb-6">
                <select id="select-pekerjaan-realisasi" onchange="handleSelectPekerjaanRealisasi(this.value)" class="w-full md:w-1/2 border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 shadow-sm">
                    ${dropdownOptions}
                </select>
            </div>
            
            <div id="realisasi-table-container">
                <div class="text-center py-12 text-slate-400 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                    <i data-lucide="trending-up" class="w-12 h-12 mx-auto mb-3 text-slate-300"></i>
                    <p>Silakan pilih paket pekerjaan terlebih dahulu.</p>
                </div>
            </div>
        </div>

        <div id="modal-realisasi" class="fixed inset-0 bg-slate-900/50 z-50 hidden flex items-center justify-center backdrop-blur-sm transition-opacity opacity-0">
            <div class="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 transform transition-all scale-95">
                <div class="flex justify-between items-center mb-5 border-b border-slate-100 pb-4">
                    <h3 class="text-lg font-bold text-slate-800">Tambah Riwayat Realisasi</h3>
                    <button type="button" onclick="closeModalRealisasi()" class="text-slate-400 hover:text-slate-700"><i data-lucide="x" class="w-5 h-5"></i></button>
                </div>
                <form onsubmit="saveRealisasi(event)">
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">Tanggal Realisasi</label>
                            <input type="date" id="realisasi-tanggal" required class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 outline-none">
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-slate-700 mb-1">Nilai Terserap (Rp)</label>
                                <input type="number" id="realisasi-nilai" required class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 outline-none">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-slate-700 mb-1">Progress Fisik (%)</label>
                                <input type="number" step="0.01" max="100" id="realisasi-progress" required class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 outline-none">
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">Keterangan Lapangan</label>
                            <textarea id="realisasi-ket" rows="3" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 outline-none"></textarea>
                        </div>
                    </div>
                    <div class="mt-6 flex justify-end gap-3">
                        <button type="button" onclick="closeModalRealisasi()" class="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50">Batal</button>
                        <button type="submit" id="btn-save-realisasi" class="px-6 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700">Simpan Realisasi</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    lucide.createIcons();
}

function handleSelectPekerjaanRealisasi(id) {
    state.selectedPekerjaanRealisasi = id;
    if (window.allPekerjaanList) {
        const selectedObj = window.allPekerjaanList.find(p => String(p.id) === String(id));
        state.selectedPekerjaanNamaRealisasi = selectedObj ? selectedObj.nama_pekerjaan : '';
        state.selectedPengadaanIdRealisasi = selectedObj ? (selectedObj.pengadaan_id || '') : '';
        state.selectedPengadaanNamaRealisasi = selectedObj ? (selectedObj.nama_pengadaan || '') : '';
    }

    const btnAdd = document.getElementById('btn-add-realisasi');
    if (id) {
        if (btnAdd) btnAdd.classList.remove('hidden');
        loadRealisasiData(id);
    } else {
        if (btnAdd) btnAdd.classList.add('hidden');
        const container = document.getElementById('realisasi-table-container');
        if (container) container.innerHTML = '<div class="text-center py-12 text-slate-400 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200"><p>Silakan pilih paket pekerjaan terlebih dahulu.</p></div>';
    }
}

async function loadRealisasiData(pekerjaanId) {
    const container = document.getElementById('realisasi-table-container');
    if (!container) return;
    container.innerHTML = '<div class="flex justify-center py-12"><div class="loader"></div></div>';

    const allRealisasi = await fetchAPI('action=list&table=Realisasi');
    const realisasiList = (allRealisasi || []).filter(item => String(item.pekerjaan_id) === String(pekerjaanId));

    let html = `
        <div class="overflow-x-auto rounded-lg border border-slate-200">
            <table class="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                    <tr class="bg-emerald-50 border-b border-emerald-100 text-xs uppercase text-emerald-800 font-semibold tracking-wide">
                        <th class="px-4 py-3 text-center w-12">No</th>
                        <th class="px-4 py-3">Tanggal</th>
                        <th class="px-4 py-3 text-right">Nilai Serapan (Rp)</th>
                        <th class="px-4 py-3 text-center">Progress Fisik</th>
                        <th class="px-4 py-3">Keterangan</th>
                        <th class="px-4 py-3 text-center w-24">Aksi</th>
                    </tr>
                </thead>
                <tbody class="text-sm divide-y divide-slate-100">
    `;

    let totalNilai = 0;
    let totalProgress = 0;

    if (realisasiList.length === 0) {
        html += '<tr><td colspan="6" class="px-4 py-8 text-center text-slate-500 italic">Belum ada riwayat realisasi.</td></tr>';
    } else {
        realisasiList.sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal));
        realisasiList.forEach((item, index) => {
            totalNilai += parseFloat(item.nilai) || 0;
            totalProgress += parseFloat(item.progress) || 0;

            html += `
                <tr class="hover:bg-slate-50 transition-colors group">
                    <td class="px-4 py-3 text-center text-slate-500">${index + 1}</td>
                    <td class="px-4 py-3 font-medium text-slate-700">${CONFIG.formatDate(item.tanggal)}</td>
                    <td class="px-4 py-3 text-right font-medium text-emerald-600">${CONFIG.formatCurrency(item.nilai)}</td>
                    <td class="px-4 py-3 text-center font-bold text-slate-700">+${item.progress}%</td>
                    <td class="px-4 py-3 text-slate-500 text-xs whitespace-normal min-w-[200px]">${item.keterangan || '-'}</td>
                    <td class="px-4 py-3 text-center">
                        <div class="flex items-center justify-center gap-2">
                            <button type="button" onclick="editRealisasi('${item.id}')" class="text-blue-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" title="Edit"><i data-lucide="edit-2" class="w-4 h-4"></i></button>
                            <button type="button" onclick="deleteRealisasi('${item.id}')" class="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity" title="Hapus"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                        </div>
                    </td>
                </tr>
            `;
        });
    }

    html += `
                </tbody>
                <tfoot class="bg-slate-50 text-sm border-t border-slate-200">
                    <tr class="font-bold text-slate-800">
                        <td colspan="2" class="px-4 py-4 text-right">TOTAL KUMULATIF</td>
                        <td class="px-4 py-4 text-right text-emerald-600">${CONFIG.formatCurrency(totalNilai)}</td>
                        <td class="px-4 py-4 text-center text-brand text-base">${totalProgress.toFixed(2)}%</td>
                        <td colspan="2"></td>
                    </tr>
                </tfoot>
            </table>
        </div>
    `;

    container.innerHTML = html;
    lucide.createIcons(); // PENTING: Render ulang icon Lucide
}

function showModalRealisasi() {
    const modal = document.getElementById('modal-realisasi');
    if (!modal) return;
    
    // Reset form untuk mode tambah baru
    state.editingRealisasiId = null;
    document.getElementById('realisasi-tanggal').value = new Date().toISOString().split('T')[0];
    document.getElementById('realisasi-nilai').value = '';
    document.getElementById('realisasi-progress').value = '';
    document.getElementById('realisasi-ket').value = '';
    
    // Reset judul dan tombol ke mode tambah
    const modalTitle = document.querySelector('#modal-realisasi h3');
    if (modalTitle) modalTitle.innerText = 'Tambah Riwayat Realisasi';
    const saveBtn = document.getElementById('btn-save-realisasi');
    if (saveBtn) saveBtn.innerText = 'Simpan Realisasi';
    
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        modal.querySelector('div').classList.remove('scale-95');
    }, 10);
}

async function editRealisasi(id) {
    // Fetch data realisasi untuk diedit
    const allRealisasi = await fetchAPI('action=list&table=Realisasi');
    const realisasi = (allRealisasi || []).find(item => String(item.id) === String(id));
    
    if (!realisasi) {
        showToast('Data realisasi tidak ditemukan', 'error');
        return;
    }
    
    // Set mode edit
    state.editingRealisasiId = id;
    
    // Isi form dengan data yang ada
    document.getElementById('realisasi-tanggal').value = realisasi.tanggal;
    document.getElementById('realisasi-nilai').value = realisasi.nilai;
    document.getElementById('realisasi-progress').value = realisasi.progress;
    document.getElementById('realisasi-ket').value = realisasi.keterangan || '';
    
    // Update judul modal dan tombol
    const modalTitle = document.querySelector('#modal-realisasi h3');
    if (modalTitle) modalTitle.innerText = 'Edit Riwayat Realisasi';
    const saveBtn = document.getElementById('btn-save-realisasi');
    if (saveBtn) saveBtn.innerText = 'Update Realisasi';
    
    // Buka modal
    const modal = document.getElementById('modal-realisasi');
    if (!modal) return;
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        modal.querySelector('div').classList.remove('scale-95');
    }, 10);
}

function closeModalRealisasi() {
    const modal = document.getElementById('modal-realisasi');
    if (!modal) return;
    modal.classList.add('opacity-0');
    modal.querySelector('div').classList.add('scale-95');
    setTimeout(() => modal.classList.add('hidden'), 300);
    // Reset state edit
    state.editingRealisasiId = null;
}

async function saveRealisasi(event) {
    event.preventDefault();
    if (!state.selectedPekerjaanRealisasi) return;

    const btn = document.getElementById('btn-save-realisasi');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = 'Menyimpan...';
    }

    const data = {
        pengadaan_id: state.selectedPengadaanIdRealisasi,
        nama_pengadaan: state.selectedPengadaanNamaRealisasi,
        pekerjaan_id: state.selectedPekerjaanRealisasi,
        nama_pekerjaan: state.selectedPekerjaanNamaRealisasi,
        tanggal: document.getElementById('realisasi-tanggal').value,
        nilai: document.getElementById('realisasi-nilai').value,
        progress: document.getElementById('realisasi-progress').value,
        keterangan: document.getElementById('realisasi-ket').value
    };

    // Cek apakah mode edit atau create
    const isUpdate = state.editingRealisasiId && !String(state.editingRealisasiId).startsWith('temp_');
    const currentUser = state.currentUser ? state.currentUser.nama : 'Admin';

    console.log('=== SAVE REALISASI ===');
    console.log('isUpdate:', isUpdate);
    console.log('editingRealisasiId:', state.editingRealisasiId);

    let result = false;

    try {
        if (isUpdate) {
            // DELETE+CREATE strategy for updates
            console.log('Using DELETE+CREATE strategy for realisasi update');
            
            // Step 1: Delete old record
            await fetchAPI(`action=delete&table=Realisasi&id=${encodeURIComponent(state.editingRealisasiId)}&user=${encodeURIComponent(currentUser)}`, 'POST', {});
            console.log('Old realisasi record deleted');
            
            // Step 2: Create new record with updated data
            const createPayload = {
                action: 'create',
                table: 'Realisasi',
                user: currentUser,
                data: data
            };
            console.log('Creating new realisasi record:', createPayload);
            result = await fetchAPI('', 'POST', createPayload);
        } else {
            // Regular create for new records
            const createPayload = {
                action: 'create',
                table: 'Realisasi',
                user: currentUser,
                data: data
            };
            console.log('Creating new realisasi record:', createPayload);
            result = await fetchAPI('', 'POST', createPayload);
        }

        if (result) {
            showToast(isUpdate ? 'Data realisasi berhasil diperbarui' : 'Data realisasi berhasil ditambahkan');
            closeModalRealisasi();
            state.editingRealisasiId = null; // Reset edit mode
            loadRealisasiData(state.selectedPekerjaanRealisasi);
        } else {
            throw new Error('Gagal menyimpan data ke Google Sheets');
        }
    } catch (error) {
        console.error('Error saving realisasi:', error);
        showToast('Gagal menyimpan data realisasi: ' + error.message, 'error');
    }

    if (btn) {
        btn.disabled = false;
        btn.innerHTML = 'Simpan Realisasi';
    }
}

async function deleteRealisasi(id) {
    if (!confirm('Hapus riwayat realisasi ini?')) return;
    const result = await fetchAPI('', 'POST', { action: 'delete', table: 'Realisasi', id: id, user: 'Admin' });
    if (result) {
        showToast('Realisasi dihapus');
        loadRealisasiData(state.selectedPekerjaanRealisasi);
    }
}

// ==========================================
// 7. MODUL PENYEDIA (VENDOR)
// ==========================================

async function renderPenyedia() {
    const contentArea = document.getElementById('app-content');
    if (!contentArea) return;
    contentArea.innerHTML = `
        <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-100 mb-6">
            <div class="flex justify-between items-center mb-6">
                <div>
                    <h2 class="text-lg font-semibold text-slate-800">Manajemen Data Penyedia / Vendor</h2>
                    <p class="text-sm text-slate-500">Daftar mitra penyedia jasa & material terdaftar.</p>
                </div>
                <button onclick="showModalPenyedia()" class="bg-brand text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-sky-700 transition flex items-center gap-2 shadow-sm">
                    <i data-lucide="plus" class="w-4 h-4"></i> Tambah Penyedia
                </button>
            </div>
            
            <div id="penyedia-table-container">
                <div class="flex justify-center py-12"><div class="loader"></div></div>
            </div>
        </div>

        <!-- MODAL TAMBAH PENYEDIA -->
        <div id="modal-penyedia" class="fixed inset-0 bg-slate-900/50 z-50 hidden flex items-center justify-center backdrop-blur-sm transition-opacity opacity-0">
            <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 transform transition-all scale-95">
                <div class="flex justify-between items-center mb-5 border-b border-slate-100 pb-4">
                    <h3 class="text-lg font-bold text-slate-800">Tambah Penyedia Baru</h3>
                    <button type="button" onclick="closeModalPenyedia()" class="text-slate-400 hover:text-slate-700"><i data-lucide="x" class="w-5 h-5"></i></button>
                </div>
                <form onsubmit="savePenyedia(event)">
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">Nama Perusahaan *</label>
                            <input type="text" id="penyedia-nama" required placeholder="Contoh: PT. Raju Bintang" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-brand outline-none">
                        </div>
                        <div class="grid grid-cols-3 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-slate-700 mb-1">Kategori</label>
                                <input type="text" id="penyedia-kategori" placeholder="Contoh: Konstruksi" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-brand outline-none">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-slate-700 mb-1">NPWP</label>
                                <input type="text" id="penyedia-npwp" placeholder="XX.XXX.XXX.X-XXX.XXX" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-brand outline-none">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-slate-700 mb-1">Kontak</label>
                                <input type="text" id="penyedia-kontak" placeholder="08123456789" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-brand outline-none">
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">Alamat</label>
                            <textarea id="penyedia-alamat" rows="2" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-brand outline-none"></textarea>
                        </div>
                    </div>
                    <div class="mt-6 flex justify-end gap-3">
                        <button type="button" onclick="closeModalPenyedia()" class="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50">Batal</button>
                        <button type="submit" id="btn-save-penyedia" class="px-6 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-sky-700">Simpan Penyedia</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    lucide.createIcons();
    loadPenyediaData();
}

async function loadPenyediaData() {
    const container = document.getElementById('penyedia-table-container');
    if (!container) return;
    const penyediaList = await fetchAPI('action=list&table=Penyedia') || [];

    let html = `
        <div class="overflow-x-auto rounded-lg border border-slate-200">
            <table class="w-full text-left border-collapse whitespace-nowrap text-xs">
                <thead>
                    <tr class="bg-slate-100 border-b border-slate-200 uppercase text-slate-700 font-semibold">
                        <th class="px-4 py-3 text-center w-12">No</th>
                        <th class="px-4 py-3">Nama Perusahaan</th>
                        <th class="px-4 py-3">Kategori</th>
                        <th class="px-4 py-3">Kontrak / Telp</th>
                        <th class="px-4 py-3">Alamat</th>
                        <th class="px-4 py-3 text-center w-20">Aksi</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 text-slate-700">
    `;

    if (penyediaList.length === 0) {
        html += '<tr><td colspan="6" class="px-4 py-8 text-center text-slate-400 italic">Belum ada data penyedia terdaftar.</td></tr>';
    } else {
        penyediaList.forEach((p, index) => {
            let namaVendor = p.nama || p.nama_perusahaan || '-';
            html += `
                <tr class="hover:bg-slate-50 transition-colors">
                    <td class="px-4 py-3 text-center text-slate-500">${index + 1}</td>
                    <td class="px-4 py-3 font-bold text-slate-800">${namaVendor}</td>
                    <td class="px-4 py-3"><span class="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium">${p.kategori || 'Umum'}</span></td>
                    <td class="px-4 py-3 text-slate-600">${p.kontak || '-'}</td>
                    <td class="px-4 py-3 text-slate-500 truncate max-w-xs">${p.alamat || '-'}</td>
                    <td class="px-4 py-3 text-center flex justify-center gap-2">
                        <button onclick="editPenyedia('${p.id}')" class="text-blue-500 hover:text-blue-700 p-1"><i data-lucide="edit" class="w-4 h-4"></i></button>
                        <button onclick="deleteData('Penyedia', '${p.id}', loadPenyediaData)" class="text-red-400 hover:text-red-600 p-1"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                    </td>
                </tr>
            `;
        });
    }

    html += `</tbody></table></div>`;
    container.innerHTML = html;
    lucide.createIcons();
}

function showModalPenyedia(isEdit = false) {
    if (!isEdit) {
        state.editId = null;
        document.getElementById('penyedia-nama').value = '';
        document.getElementById('penyedia-kategori').value = '';
        document.getElementById('penyedia-npwp').value = '';
        document.getElementById('penyedia-kontak').value = '';
        document.getElementById('penyedia-alamat').value = '';
        document.getElementById('btn-save-penyedia').innerHTML = 'Simpan Penyedia';
    }
    // Update judul modal sesuai mode
    const titleEl = document.querySelector('#modal-penyedia h3');
    if (titleEl) titleEl.innerText = isEdit ? 'Edit Data Penyedia' : 'Tambah Penyedia Baru';
    const modal = document.getElementById('modal-penyedia');
    if (!modal) return;
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        modal.querySelector('div').classList.remove('scale-95');
    }, 10);
}

function closeModalPenyedia() {
    const modal = document.getElementById('modal-penyedia');
    if (!modal) return;
    modal.classList.add('opacity-0');
    modal.querySelector('div').classList.add('scale-95');
    setTimeout(() => modal.classList.add('hidden'), 300);
}

async function editPenyedia(id) {
    const list = await fetchAPI('action=list&table=Penyedia') || [];
    const item = list.find(p => p.id === id);
    if (!item) return showToast('Data tidak ditemukan', 'error');

    state.editId = id;
    document.getElementById('penyedia-nama').value = item.nama || item.nama_perusahaan || '';
    document.getElementById('penyedia-kategori').value = item.kategori || '';
    document.getElementById('penyedia-npwp').value = item.npwp || '';
    document.getElementById('penyedia-kontak').value = item.kontak || '';
    document.getElementById('penyedia-alamat').value = item.alamat || '';
    
    document.getElementById('btn-save-penyedia').innerHTML = 'Update Penyedia';
    showModalPenyedia(true);
}

async function savePenyedia(event) {
    event.preventDefault();
    const btn = document.getElementById('btn-save-penyedia');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = 'Menyimpan...';
    }

    const data = {
        nama: document.getElementById('penyedia-nama').value,
        npwp: document.getElementById('penyedia-npwp').value,
        kontak: document.getElementById('penyedia-kontak').value,
        alamat: document.getElementById('penyedia-alamat').value,
        kategori: document.getElementById('penyedia-kategori').value,
        status: 'Aktif'
    };

    const isUpdate = state.editId && !String(state.editId).startsWith('temp_');
    const currentUser = state.currentUser ? state.currentUser.nama : 'Admin';

    console.log('=== SAVE PENYEDIA ===');
    console.log('isUpdate:', isUpdate);
    console.log('editId:', state.editId);

    let result = false;

    try {
        if (isUpdate) {
            // DELETE+CREATE strategy for updates
            console.log('Using DELETE+CREATE strategy for penyedia update');
            
            // Step 1: Delete old record
            await fetchAPI(`action=delete&table=Penyedia&id=${encodeURIComponent(state.editId)}&user=${encodeURIComponent(currentUser)}`, 'POST', {});
            console.log('Old penyedia record deleted');
            
            // Step 2: Create new record with updated data
            const createPayload = {
                action: 'create',
                table: 'Penyedia',
                user: currentUser,
                data: data
            };
            console.log('Creating new penyedia record:', createPayload);
            result = await fetchAPI('', 'POST', createPayload);
        } else {
            // Regular create for new records
            const createPayload = {
                action: 'create',
                table: 'Penyedia',
                user: currentUser,
                data: data
            };
            console.log('Creating new penyedia record:', createPayload);
            result = await fetchAPI('', 'POST', createPayload);
        }

        if (result) {
            showToast(isUpdate ? 'Penyedia berhasil diperbarui' : 'Penyedia berhasil ditambahkan');
            closeModalPenyedia();
            state.editId = null; // Reset edit mode
            loadPenyediaData();
        } else {
            throw new Error('Gagal menyimpan data ke Google Sheets');
        }
    } catch (error) {
        console.error('Error saving penyedia:', error);
        showToast('Gagal menyimpan data penyedia: ' + error.message, 'error');
    }

    if (btn) {
        btn.disabled = false;
        btn.innerHTML = 'Simpan Penyedia';
    }
}

// ==========================================
// 8. MODUL KONTRAK
// ==========================================

async function renderKontrak() {
    const contentArea = document.getElementById('app-content');
    if (!contentArea) return;

    // Load Pekerjaan & Penyedia untuk dropdown sinkron dari Sheets
    const [pekerjaanList, penyediaList] = await Promise.all([
        fetchAPI('action=list&table=Pekerjaan'),
        fetchAPI('action=list&table=Penyedia')
    ]);
    window.allPekerjaanListKontrak = Array.isArray(pekerjaanList) ? pekerjaanList : [];
    window.allPenyediaListKontrak = Array.isArray(penyediaList) ? penyediaList : [];

    let optPekerjaan = '<option value="">-- Pilih Nama Pekerjaan --</option>';
    window.allPekerjaanListKontrak.forEach(p => {
        const label = (p.nomor_paket ? p.nomor_paket + ' - ' : '') + p.nama_pekerjaan;
        optPekerjaan += `<option value="${p.nama_pekerjaan}">${label}</option>`;
    });

    let optPenyedia = '<option value="">-- Pilih Penyedia --</option>';
    window.allPenyediaListKontrak.forEach(p => {
        const nama = p.nama || p.nama_perusahaan || '-';
        optPenyedia += `<option value="${nama}">${nama}</option>`;
    });

    contentArea.innerHTML = `
        <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-100 mb-6">
            <div class="flex justify-between items-center mb-6">
                <div>
                    <h2 class="text-lg font-semibold text-slate-800">Manajemen Kontrak Pekerjaan</h2>
                    <p class="text-sm text-slate-500">Pencatatan nomor kontrak, nilai kontrak, dan masa pelaksanaan.</p>
                </div>
                <button onclick="showModalKontrak()" class="bg-brand text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-sky-700 transition flex items-center gap-2 shadow-sm">
                    <i data-lucide="plus" class="w-4 h-4"></i> Tambah Kontrak
                </button>
            </div>
            <div id="kontrak-table-container">
                <div class="flex justify-center py-12"><div class="loader"></div></div>
            </div>
        </div>

        <!-- MODAL KONTRAK -->
        <div id="modal-kontrak" class="fixed inset-0 bg-slate-900/50 z-50 hidden flex items-center justify-center backdrop-blur-sm transition-opacity opacity-0">
            <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 transform transition-all scale-95 max-h-[90vh] overflow-y-auto">
                <div class="flex justify-between items-center mb-5 border-b border-slate-100 pb-4">
                    <h3 id="modal-kontrak-title" class="text-lg font-bold text-slate-800">Tambah Kontrak Baru</h3>
                    <button type="button" onclick="closeModalKontrak()" class="text-slate-400 hover:text-slate-700"><i data-lucide="x" class="w-5 h-5"></i></button>
                </div>
                <form onsubmit="saveKontrak(event)">
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">Nomor Kontrak *</label>
                            <input type="text" id="kontrak-nomor" required placeholder="Contoh: 001/KONTRAK/2026" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-brand outline-none">
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-semibold text-slate-700 mb-1">
                                    Nama Pekerjaan
                                    <span class="text-[10px] font-normal text-brand ml-1">← sinkron dari Master</span>
                                </label>
                                <select id="kontrak-pekerjaan" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-brand outline-none bg-white">
                                    ${optPekerjaan}
                                </select>
                                <input type="text" id="kontrak-pekerjaan-manual" placeholder="Atau ketik manual jika tidak ada..." class="w-full mt-1.5 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:border-brand outline-none text-slate-600 bg-slate-50">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-slate-700 mb-1">
                                    Nama Penyedia
                                    <span class="text-[10px] font-normal text-brand ml-1">← sinkron dari Master</span>
                                </label>
                                <select id="kontrak-penyedia" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-brand outline-none bg-white">
                                    ${optPenyedia}
                                </select>
                                <input type="text" id="kontrak-penyedia-manual" placeholder="Atau ketik manual jika tidak ada..." class="w-full mt-1.5 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:border-brand outline-none text-slate-600 bg-slate-50">
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-slate-700 mb-1">Nilai Kontrak (Rp) *</label>
                                <input type="number" id="kontrak-nilai" required placeholder="1460000000" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-brand outline-none">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-slate-700 mb-1">Tanggal Kontrak</label>
                                <input type="date" id="kontrak-tanggal" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-brand outline-none">
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-slate-700 mb-1">Mulai Pelaksanaan</label>
                                <input type="date" id="kontrak-mulai" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-brand outline-none">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-slate-700 mb-1">Selesai Pelaksanaan</label>
                                <input type="date" id="kontrak-selesai" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-brand outline-none">
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">Status</label>
                            <select id="kontrak-status" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-brand outline-none bg-white">
                                <option value="Aktif">Aktif</option>
                                <option value="On Progress">On Progress</option>
                                <option value="Selesai">Selesai</option>
                                <option value="Tunda">Tunda</option>
                                <option value="Batal">Batal</option>
                            </select>
                        </div>
                    </div>
                    <div class="mt-6 flex justify-end gap-3">
                        <button type="button" onclick="closeModalKontrak()" class="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50">Batal</button>
                        <button type="submit" id="btn-save-kontrak" class="px-6 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-sky-700">Simpan Kontrak</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    lucide.createIcons();
    loadKontrakData();
}

async function loadKontrakData() {
    const container = document.getElementById('kontrak-table-container');
    if (!container) return;
    const kontrakList = await fetchAPI('action=list&table=Kontrak') || [];

    let html = `
        <div class="overflow-x-auto rounded-lg border border-slate-200">
            <table class="w-full text-left border-collapse whitespace-nowrap text-xs">
                <thead>
                    <tr class="bg-slate-100 border-b border-slate-200 uppercase text-slate-700 font-semibold">
                        <th class="px-4 py-3 text-center w-12">No</th>
                        <th class="px-4 py-3">Nomor Kontrak</th>
                        <th class="px-4 py-3">Pekerjaan & Penyedia</th>
                        <th class="px-4 py-3 text-right">Nilai Kontrak (Rp)</th>
                        <th class="px-4 py-3">Masa Pelaksanaan</th>
                        <th class="px-4 py-3 text-center w-20">Aksi</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 text-slate-700">
    `;

    if (kontrakList.length === 0) {
        html += '<tr><td colspan="5" class="px-4 py-8 text-center text-slate-400 italic">Belum ada data kontrak tercatat.</td></tr>';
    } else {
        kontrakList.forEach((k, index) => {
            html += `
                <tr class="hover:bg-slate-50 transition-colors">
                    <td class="px-4 py-3 text-center text-slate-500">${index + 1}</td>
                    <td class="px-4 py-3 font-bold text-slate-800">${k.nomor_kontrak}</td>
                    <td class="px-4 py-3 text-slate-700 font-medium">${k.nama_pekerjaan || '-'}<br><span class="text-[10px] text-slate-500">${k.nama_penyedia || '-'}</span></td>
                    <td class="px-4 py-3 text-right font-semibold text-emerald-600">${CONFIG.formatCurrency(k.nilai_kontrak)}</td>
                    <td class="px-4 py-3 text-slate-600">${k.tanggal_mulai || '-'} s.d ${k.tanggal_selesai || '-'}</td>
                    <td class="px-4 py-3 text-center flex justify-center gap-2">
                        <button onclick="editKontrak('${k.id}')" class="text-blue-500 hover:text-blue-700 p-1"><i data-lucide="edit" class="w-4 h-4"></i></button>
                        <button onclick="deleteData('Kontrak', '${k.id}', loadKontrakData)" class="text-red-400 hover:text-red-600 p-1"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                    </td>
                </tr>
            `;
        });
    }

    html += `</tbody></table></div>`;
    container.innerHTML = html;
    lucide.createIcons();
}

function showModalKontrak(isEdit = false) {
    if (!isEdit) {
        state.editId = null;
        document.getElementById('kontrak-nomor').value = '';
        document.getElementById('kontrak-pekerjaan').value = '';
        document.getElementById('kontrak-pekerjaan-manual').value = '';
        document.getElementById('kontrak-penyedia').value = '';
        document.getElementById('kontrak-penyedia-manual').value = '';
        document.getElementById('kontrak-nilai').value = '';
        document.getElementById('kontrak-tanggal').value = '';
        document.getElementById('kontrak-mulai').value = '';
        document.getElementById('kontrak-selesai').value = '';
        const statusEl = document.getElementById('kontrak-status');
        if (statusEl) statusEl.value = 'Aktif';
        const titleEl = document.getElementById('modal-kontrak-title');
        if (titleEl) titleEl.innerText = 'Tambah Kontrak Baru';
        document.getElementById('btn-save-kontrak').innerHTML = 'Simpan Kontrak';
    }
    const modal = document.getElementById('modal-kontrak');
    if (!modal) return;
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        modal.querySelector('div').classList.remove('scale-95');
    }, 10);
}

function closeModalKontrak() {
    const modal = document.getElementById('modal-kontrak');
    if (!modal) return;
    modal.classList.add('opacity-0');
    modal.querySelector('div').classList.add('scale-95');
    setTimeout(() => modal.classList.add('hidden'), 300);
}

async function editKontrak(id) {
    const list = await fetchAPI('action=list&table=Kontrak') || [];
    const item = list.find(k => k.id === id);
    if (!item) return showToast('Data tidak ditemukan', 'error');

    state.editId = id;
    document.getElementById('kontrak-nomor').value = item.nomor_kontrak || '';

    // Coba set dropdown; jika tidak ada, gunakan field manual
    const selPek = document.getElementById('kontrak-pekerjaan');
    const selPen = document.getElementById('kontrak-penyedia');
    if (selPek) {
        const optExists = Array.from(selPek.options).some(o => o.value === item.nama_pekerjaan);
        if (optExists) { selPek.value = item.nama_pekerjaan; document.getElementById('kontrak-pekerjaan-manual').value = ''; }
        else { selPek.value = ''; document.getElementById('kontrak-pekerjaan-manual').value = item.nama_pekerjaan || ''; }
    }
    if (selPen) {
        const optExists = Array.from(selPen.options).some(o => o.value === item.nama_penyedia);
        if (optExists) { selPen.value = item.nama_penyedia; document.getElementById('kontrak-penyedia-manual').value = ''; }
        else { selPen.value = ''; document.getElementById('kontrak-penyedia-manual').value = item.nama_penyedia || ''; }
    }

    document.getElementById('kontrak-nilai').value = item.nilai_kontrak || '';
    document.getElementById('kontrak-tanggal').value = item.tanggal_kontrak || '';
    document.getElementById('kontrak-mulai').value = item.tanggal_mulai || '';
    document.getElementById('kontrak-selesai').value = item.tanggal_selesai || '';
    const statusEl = document.getElementById('kontrak-status');
    if (statusEl) statusEl.value = item.status || 'Aktif';

    const titleEl = document.getElementById('modal-kontrak-title');
    if (titleEl) titleEl.innerText = 'Edit Kontrak';
    document.getElementById('btn-save-kontrak').innerHTML = 'Update Kontrak';
    showModalKontrak(true);
}

async function saveKontrak(event) {
    event.preventDefault();
    const btn = document.getElementById('btn-save-kontrak');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = 'Menyimpan...';
    }

    // Ambil nilai dari dropdown, fallback ke field manual
    const selPekEl = document.getElementById('kontrak-pekerjaan');
    const manualPekEl = document.getElementById('kontrak-pekerjaan-manual');
    const namaPekerjaan = (selPekEl && selPekEl.value) ? selPekEl.value : (manualPekEl ? manualPekEl.value : '');

    const selPenEl = document.getElementById('kontrak-penyedia');
    const manualPenEl = document.getElementById('kontrak-penyedia-manual');
    const namaPenyedia = (selPenEl && selPenEl.value) ? selPenEl.value : (manualPenEl ? manualPenEl.value : '');

    const data = {
        nomor_kontrak: document.getElementById('kontrak-nomor').value,
        nama_pekerjaan: namaPekerjaan,
        nama_penyedia: namaPenyedia,
        nilai_kontrak: document.getElementById('kontrak-nilai').value,
        tanggal_kontrak: document.getElementById('kontrak-tanggal').value,
        tanggal_mulai: document.getElementById('kontrak-mulai').value,
        tanggal_selesai: document.getElementById('kontrak-selesai').value,
        status: document.getElementById('kontrak-status')?.value || 'Aktif'
    };

    const isUpdate = state.editId && !String(state.editId).startsWith('temp_');
    const currentUser = state.currentUser ? state.currentUser.nama : 'Admin';

    console.log('=== SAVE KONTRAK ===');
    console.log('isUpdate:', isUpdate);
    console.log('editId:', state.editId);

    let result = false;

    try {
        if (isUpdate) {
            // DELETE+CREATE strategy for updates
            console.log('Using DELETE+CREATE strategy for kontrak update');
            
            // Step 1: Delete old record
            await fetchAPI(`action=delete&table=Kontrak&id=${encodeURIComponent(state.editId)}&user=${encodeURIComponent(currentUser)}`, 'POST', {});
            console.log('Old kontrak record deleted');
            
            // Step 2: Create new record with updated data
            const createPayload = {
                action: 'create',
                table: 'Kontrak',
                user: currentUser,
                data: data
            };
            console.log('Creating new kontrak record:', createPayload);
            result = await fetchAPI('', 'POST', createPayload);
        } else {
            // Regular create for new records
            const createPayload = {
                action: 'create',
                table: 'Kontrak',
                user: currentUser,
                data: data
            };
            console.log('Creating new kontrak record:', createPayload);
            result = await fetchAPI('', 'POST', createPayload);
        }

        if (result) {
            showToast(isUpdate ? 'Kontrak diperbarui' : 'Kontrak berhasil disimpan');
            closeModalKontrak();
            state.editId = null; // Reset edit mode
            loadKontrakData();
        } else {
            throw new Error('Gagal menyimpan data ke Google Sheets');
        }
    } catch (error) {
        console.error('Error saving kontrak:', error);
        showToast('Gagal menyimpan data kontrak: ' + error.message, 'error');
    }

    if (btn) {
        btn.disabled = false;
        btn.innerHTML = 'Simpan Kontrak';
    }
}

// ==========================================
// 9. MODUL PENGADAAN
// ==========================================

async function renderPengadaan() {
    const contentArea = document.getElementById('app-content');
    contentArea.innerHTML = `
        <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-100 mb-6">
            <div class="flex justify-between items-center mb-6">
                <div>
                    <h2 class="text-lg font-semibold text-slate-800">Master Data Pengadaan</h2>
                    <p class="text-sm text-slate-500">Kelola daftar pengadaan beserta Tahun dan Sumber Anggaran.</p>
                </div>
                <button onclick="showModalPengadaan()" class="bg-brand text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-sky-700 transition flex items-center gap-2">
                    <i data-lucide="plus" class="w-4 h-4"></i> Tambah Pengadaan
                </button>
            </div>
            <div id="pengadaan-table-container"><div class="flex justify-center py-12"><div class="loader"></div></div></div>
        </div>

        <div id="modal-pengadaan" class="fixed inset-0 bg-slate-900/50 z-50 hidden flex items-center justify-center backdrop-blur-sm transition-opacity opacity-0">
            <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 transform scale-95 transition-all">
                <div class="flex justify-between items-center mb-5 border-b border-slate-100 pb-4">
                    <h3 class="text-lg font-bold text-slate-800">Form Data Pengadaan</h3>
                    <button type="button" onclick="closeModalPengadaan()" class="text-slate-400 hover:text-slate-700"><i data-lucide="x" class="w-5 h-5"></i></button>
                </div>
                <form onsubmit="savePengadaan(event)">
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium mb-1">Nomor Pengadaan / PR</label>
                            <input type="text" id="pengadaan-nomor" required class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand">
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-1">Nama Pengadaan</label>
                            <input type="text" id="pengadaan-nama" required placeholder="Contoh: Pengadaan Material JTM" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand">
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium mb-1">Tahun Anggaran</label>
                                <input type="number" id="pengadaan-tahun" required value="${new Date().getFullYear()}" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand">
                            </div>
                            <div>
                                <label class="block text-sm font-medium mb-1">Sumber Anggaran</label>
                                <input type="text" id="pengadaan-sumber" placeholder="Contoh: APLN, APBN, dll" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand">
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-1">Nilai Pagu (Rp)</label>
                            <input type="number" id="pengadaan-pagu" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand">
                        </div>
                    </div>
                    <div class="mt-6 flex justify-end gap-3">
                        <button type="button" onclick="closeModalPengadaan()" class="px-4 py-2 border rounded-lg text-sm">Batal</button>
                        <button type="submit" class="px-6 py-2 bg-brand text-white rounded-lg text-sm">Simpan</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    lucide.createIcons();
    loadPengadaanData();
}

async function loadPengadaanData() {
    const data = await fetchAPI('action=list&table=Pengadaan') || [];
    let html = `<table class="w-full text-left border-collapse text-sm"><thead class="bg-slate-100"><tr><th class="p-3">No</th><th class="p-3">Nomor</th><th class="p-3">Nama Pengadaan</th><th class="p-3">Tahun & Sumber</th><th class="p-3">Aksi</th></tr></thead><tbody class="divide-y">`;
    data.forEach((p, i) => {
        html += `<tr><td class="p-3">${i + 1}</td><td class="p-3 font-semibold">${p.nomor_pengadaan || '-'}</td><td class="p-3">${p.nama_pengadaan}</td><td class="p-3"><span class="font-bold">${p.tahun || '-'}</span> <br><span class="text-xs bg-slate-200 px-2 py-0.5 rounded">${p.sumber_anggaran || 'APLN'}</span></td><td class="p-3 flex gap-2"><button onclick="editPengadaan('${p.id}')" class="text-blue-500 hover:text-blue-700"><i data-lucide="edit" class="w-4 h-4"></i></button><button onclick="deleteData('Pengadaan', '${p.id}', loadPengadaanData)" class="text-red-500 hover:text-red-700"><i data-lucide="trash-2" class="w-4 h-4"></i></button></td></tr>`;
    });
    html += `</tbody></table>`;
    document.getElementById('pengadaan-table-container').innerHTML = html;
    lucide.createIcons();
}

function showModalPengadaan(isEdit = false) { 
    if (!isEdit) {
        state.editId = null;
        document.getElementById('pengadaan-nomor').value = '';
        document.getElementById('pengadaan-nama').value = '';
        document.getElementById('pengadaan-tahun').value = new Date().getFullYear();
        document.getElementById('pengadaan-sumber').value = '';
        document.getElementById('pengadaan-pagu').value = '';
    }
    document.getElementById('modal-pengadaan').classList.remove('hidden', 'opacity-0'); 
}
function closeModalPengadaan() { document.getElementById('modal-pengadaan').classList.add('hidden', 'opacity-0'); }

async function editPengadaan(id) {
    const list = await fetchAPI('action=list&table=Pengadaan') || [];
    const item = list.find(p => p.id === id);
    if (!item) return showToast('Data tidak ditemukan', 'error');

    state.editId = id;
    document.getElementById('pengadaan-nomor').value = item.nomor_pengadaan || '';
    document.getElementById('pengadaan-nama').value = item.nama_pengadaan || '';
    document.getElementById('pengadaan-tahun').value = item.tahun || new Date().getFullYear();
    document.getElementById('pengadaan-sumber').value = item.sumber_anggaran || '';
    document.getElementById('pengadaan-pagu').value = item.nilai_pagu || '';
    
    showModalPengadaan(true);
}

async function savePengadaan(e) {
    e.preventDefault();
    const payload = {
        action: state.editId ? 'update' : 'create', table: 'Pengadaan', user: 'Admin',
        data: {
            nomor_pengadaan: document.getElementById('pengadaan-nomor').value,
            nama_pengadaan: document.getElementById('pengadaan-nama').value,
            tahun: document.getElementById('pengadaan-tahun').value,
            sumber_anggaran: document.getElementById('pengadaan-sumber').value,
            nilai_pagu: document.getElementById('pengadaan-pagu').value
        }
    };
    if (state.editId) payload.id = state.editId;

    await fetchAPI('', 'POST', payload);
    showToast(state.editId ? 'Data Pengadaan diperbarui' : 'Data Pengadaan disimpan');
    closeModalPengadaan();
    loadPengadaanData();
}

// ==========================================
// 10. MODUL PEKERJAAN
// ==========================================

async function renderPekerjaan() {
    const contentArea = document.getElementById('app-content');

    const pengadaanList = await fetchAPI('action=list&table=Pengadaan') || [];
    let optPengadaan = '<option value="">-- Pilih Induk Pengadaan --</option>';
    pengadaanList.forEach(p => optPengadaan += `<option value="${p.id}" data-nama="${p.nama_pengadaan}">${p.nama_pengadaan} (Th. ${p.tahun || '-'})</option>`);

    contentArea.innerHTML = `
        <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-100 mb-6">
            <div class="flex justify-between items-center mb-6">
                <div>
                    <h2 class="text-lg font-semibold text-slate-800">Master Data Pekerjaan</h2>
                    <p class="text-sm text-slate-500">Kelola paket pekerjaan dengan spesifikasi Lokasi, Volume, dan Jenis Kegiatan.</p>
                </div>
                <button onclick="showModalPekerjaan()" class="bg-brand text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-sky-700 transition flex items-center gap-2">
                    <i data-lucide="plus" class="w-4 h-4"></i> Tambah Pekerjaan
                </button>
            </div>
            <div id="pekerjaan-table-container"><div class="flex justify-center py-12"><div class="loader"></div></div></div>
        </div>

        <div id="modal-pekerjaan" class="fixed inset-0 bg-slate-900/50 z-50 hidden flex items-center justify-center backdrop-blur-sm transition-opacity opacity-0">
            <div class="bg-white rounded-2xl shadow-xl w-full max-w-xl p-6 transform scale-95 transition-all max-h-[90vh] overflow-y-auto">
                <div class="flex justify-between items-center mb-5 border-b border-slate-100 pb-4">
                    <h3 class="text-lg font-bold text-slate-800">Form Data Pekerjaan</h3>
                    <button type="button" onclick="closeModalPekerjaan()" class="text-slate-400 hover:text-slate-700"><i data-lucide="x" class="w-5 h-5"></i></button>
                </div>
                <form onsubmit="savePekerjaan(event)">
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium mb-1">Relasi Pengadaan Induk</label>
                            <select id="pek-pengadaan" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand">
                                ${optPengadaan}
                            </select>
                            <p class="text-[10px] text-slate-400 mt-1">*Pilih pengadaan untuk mengikat Tahun & Sumber Anggaran secara otomatis.</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-1">Nomor Paket Pekerjaan</label>
                            <input type="text" id="pek-nomor" required class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand">
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-1">Nama Pekerjaan</label>
                            <input type="text" id="pek-nama" required placeholder="Contoh: Rehab JTM Penyulang Kota" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand">
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium mb-1">Jenis Kegiatan</label>
                                <input type="text" id="pek-jenis" placeholder="Contoh: Rehab JTM" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand">
                            </div>
                            <div>
                                <label class="block text-sm font-medium mb-1">Volume Paket (Opsional)</label>
                                <input type="text" id="pek-volume" placeholder="Misal: 5 Kms" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand">
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-1">Lokasi (ULP / UP3)</label>
                            <input type="text" id="pek-lokasi" required placeholder="Misal: ULP Tabanan" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand">
                        </div>
                    </div>
                    <div class="mt-6 flex justify-end gap-3">
                        <button type="button" onclick="closeModalPekerjaan()" class="px-4 py-2 border rounded-lg text-sm">Batal</button>
                        <button type="submit" class="px-6 py-2 bg-brand text-white rounded-lg text-sm">Simpan</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    lucide.createIcons();
    loadPekerjaanData();
}

async function loadPekerjaanData() {
    const data = await fetchAPI('action=list&table=Pekerjaan') || [];
    let html = `<div class="overflow-x-auto"><table class="w-full text-left border-collapse text-sm"><thead class="bg-slate-100"><tr><th class="p-3">No</th><th class="p-3">Nama Pekerjaan</th><th class="p-3">Jenis & Volume</th><th class="p-3">Lokasi</th><th class="p-3">Aksi</th></tr></thead><tbody class="divide-y">`;
    data.forEach((p, i) => {
        html += `<tr><td class="p-3">${i + 1}</td><td class="p-3 font-semibold">${p.nama_pekerjaan}<br><span class="text-[10px] text-slate-500 font-normal">Pengadaan: ${p.nama_pengadaan || 'Tanpa Pengadaan Induk'}</span></td><td class="p-3">${p.jenis_kegiatan || '-'}<br><b class="text-xs text-brand">${p.volume_paket || '-'}</b></td><td class="p-3">${p.lokasi || '-'}</td><td class="p-3 flex gap-2"><button onclick="editPekerjaan('${p.id}')" class="text-blue-500 hover:text-blue-700"><i data-lucide="edit" class="w-4 h-4"></i></button><button onclick="deleteData('Pekerjaan', '${p.id}', loadPekerjaanData)" class="text-red-500 hover:text-red-700"><i data-lucide="trash-2" class="w-4 h-4"></i></button></td></tr>`;
    });
    html += `</tbody></table></div>`;
    document.getElementById('pekerjaan-table-container').innerHTML = html;
    lucide.createIcons();
}

function showModalPekerjaan(isEdit = false) { 
    if (!isEdit) {
        state.editId = null;
        document.getElementById('pek-pengadaan').value = '';
        document.getElementById('pek-nomor').value = '';
        document.getElementById('pek-nama').value = '';
        document.getElementById('pek-jenis').value = '';
        document.getElementById('pek-volume').value = '';
        document.getElementById('pek-lokasi').value = '';
    }
    document.getElementById('modal-pekerjaan').classList.remove('hidden', 'opacity-0'); 
}
function closeModalPekerjaan() { document.getElementById('modal-pekerjaan').classList.add('hidden', 'opacity-0'); }

async function editPekerjaan(id) {
    const list = await fetchAPI('action=list&table=Pekerjaan') || [];
    const item = list.find(p => p.id === id);
    if (!item) return showToast('Data tidak ditemukan', 'error');

    state.editId = id;
    document.getElementById('pek-pengadaan').value = item.pengadaan_id || '';
    document.getElementById('pek-nomor').value = item.nomor_paket || '';
    document.getElementById('pek-nama').value = item.nama_pekerjaan || '';
    document.getElementById('pek-jenis').value = item.jenis_kegiatan || '';
    document.getElementById('pek-volume').value = item.volume_paket || '';
    document.getElementById('pek-lokasi').value = item.lokasi || '';
    
    showModalPekerjaan(true);
}

async function savePekerjaan(e) {
    e.preventDefault();
    const selPengadaan = document.getElementById('pek-pengadaan');
    const namaPengadaan = selPengadaan.options[selPengadaan.selectedIndex]?.dataset.nama || '';

    const payload = {
        action: state.editId ? 'update' : 'create', table: 'Pekerjaan', user: 'Admin',
        data: {
            pengadaan_id: selPengadaan.value,
            nama_pengadaan: namaPengadaan,
            nomor_paket: document.getElementById('pek-nomor').value,
            nama_pekerjaan: document.getElementById('pek-nama').value,
            jenis_kegiatan: document.getElementById('pek-jenis').value,
            volume_paket: document.getElementById('pek-volume').value,
            lokasi: document.getElementById('pek-lokasi').value
        }
    };
    if (state.editId) payload.id = state.editId;

    await fetchAPI('', 'POST', payload);
    showToast(state.editId ? 'Data Pekerjaan diperbarui' : 'Data Pekerjaan disimpan');
    closeModalPekerjaan();
    loadPekerjaanData();
}

// ==========================================
// 11. MODUL MATERIAL
// ==========================================

async function renderMaterial() {
    const contentArea = document.getElementById('app-content');
    contentArea.innerHTML = `
        <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-100 mb-6">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h2 class="text-lg font-semibold text-slate-800">Master Data Material</h2>
                    <p class="text-sm text-slate-500">Kelola katalog material, satuan, dan harga standar.</p>
                </div>
                <div class="flex items-center gap-3 w-full sm:w-auto">
                    <input type="text" id="search-material" oninput="filterMaterialTable()" placeholder="Cari material atau kategori..." class="border border-slate-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand w-full sm:w-56">
                    <button onclick="showModalMaterial()" class="bg-brand text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-sky-700 transition flex items-center gap-2 whitespace-nowrap shadow-sm">
                        <i data-lucide="plus" class="w-4 h-4"></i> Tambah Material
                    </button>
                </div>
            </div>
            <div id="material-table-container"><div class="flex justify-center py-12"><div class="loader"></div></div></div>
        </div>

        <div id="modal-material" class="fixed inset-0 bg-slate-900/50 z-50 hidden flex items-center justify-center backdrop-blur-sm transition-opacity opacity-0 p-4">
            <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 transform scale-95 transition-all">
                <div class="flex justify-between items-center mb-5 border-b border-slate-100 pb-4">
                    <h3 id="modal-material-title" class="text-lg font-bold text-slate-800">Tambah Material Baru</h3>
                    <button type="button" onclick="closeModalMaterial()" class="text-slate-400 hover:text-slate-700 p-1"><i data-lucide="x" class="w-5 h-5"></i></button>
                </div>
                <form onsubmit="saveMaterial(event)">
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium mb-1 text-slate-700">Kategori Material</label>
                            <input type="text" id="mat-kategori" list="kategori-material-list" placeholder="Pilih atau ketik kategori (JTM, JTR, Gardu, dsb)" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand">
                            <datalist id="kategori-material-list">
                                <option value="JTM (Jaringan Tegangan Menengah)"></option>
                                <option value="JTR (Jaringan Tegangan Rendah)"></option>
                                <option value="Gardu Distribusi"></option>
                                <option value="Trafo Distribusi"></option>
                                <option value="Tiang & Aksesoris"></option>
                                <option value="Kabel & Konduktor"></option>
                                <option value="SKUTR / Sambungan Rumah"></option>
                                <option value="Alat Pengukur & Pembatas (APP)"></option>
                                <option value="Umum"></option>
                            </datalist>
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-1 text-slate-700">Nama Material / Uraian *</label>
                            <input type="text" id="mat-nama" required placeholder="Contoh: Kabel TIC 3 x 70 + 1 x 54.6 mm2, Tiang Beton 9m" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand">
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium mb-1 text-slate-700">Satuan *</label>
                                <input type="text" id="mat-satuan" list="satuan-material-list" required placeholder="meter, btg, set, dsb" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand">
                                <datalist id="satuan-material-list">
                                    <option value="meter"></option>
                                    <option value="btg"></option>
                                    <option value="set"></option>
                                    <option value="buah"></option>
                                    <option value="unit"></option>
                                    <option value="rol"></option>
                                    <option value="lot"></option>
                                    <option value="kg"></option>
                                    <option value="kwh"></option>
                                </datalist>
                            </div>
                            <div>
                                <label class="block text-sm font-medium mb-1 text-slate-700">Harga Satuan Material (Rp) *</label>
                                <input type="number" id="mat-harga" required min="0" value="0" onfocus="if(this.value=='0')this.value=''" onblur="if(this.value=='')this.value='0'" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand">
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-1 text-slate-700">Harga Jasa (Opsional, Rp)</label>
                            <input type="number" id="mat-jasa" min="0" value="0" onfocus="if(this.value=='0')this.value=''" onblur="if(this.value=='')this.value='0'" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand">
                        </div>
                    </div>
                    <div class="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <button type="button" onclick="closeModalMaterial()" class="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Batal</button>
                        <button type="submit" id="btn-save-material" class="px-6 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-sky-700 transition">Simpan Material</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    lucide.createIcons();
    loadMaterialData();
}

window.allMaterialList = [];

async function loadMaterialData() {
    const tableContainer = document.getElementById('material-table-container');
    if (!tableContainer) return;
    tableContainer.innerHTML = '<div class="flex justify-center py-12"><div class="loader"></div></div>';

    const data = await fetchAPI('action=list&table=Material') || [];
    window.allMaterialList = Array.isArray(data) ? data : [];
    renderMaterialRows(window.allMaterialList);
}

function renderMaterialRows(data) {
    const tableContainer = document.getElementById('material-table-container');
    if (!tableContainer) return;

    if (!data || data.length === 0) {
        tableContainer.innerHTML = `
            <div class="text-center py-12 text-slate-400">
                <i data-lucide="package" class="w-12 h-12 mx-auto mb-2 opacity-40"></i>
                <p class="font-medium text-slate-600">Belum ada data material</p>
                <p class="text-xs text-slate-400 mt-1">Klik tombol "+ Tambah Material" untuk menambahkan katalog material baru.</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    let html = `
        <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-sm">
                <thead class="bg-slate-100 text-slate-700 font-semibold">
                    <tr>
                        <th class="p-3 w-12 text-center">No</th>
                        <th class="p-3">Kategori</th>
                        <th class="p-3">Nama Material</th>
                        <th class="p-3">Satuan</th>
                        <th class="p-3 text-right">Harga Material</th>
                        <th class="p-3 text-right">Harga Jasa</th>
                        <th class="p-3 text-center w-24">Aksi</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
    `;

    data.forEach((m, i) => {
        const nama = m.material || m.nama_material || m.uraian || m.nama || m.item || '-';
        const kategori = m.kategori || m.keterangan || m.kelompok || 'Umum';
        const satuan = m.satuan || m.unit || '-';
        const hargaMat = parseFloat(m.harga) || parseFloat(m.harga_material) || parseFloat(m.harga_satuan) || 0;
        const hargaJasa = parseFloat(m.harga_jasa) || parseFloat(m.jasa) || 0;
        const itemId = m.id || `row_${i}`;

        html += `
            <tr class="hover:bg-slate-50/80 transition-colors">
                <td class="p-3 text-center text-slate-500 font-medium">${i + 1}</td>
                <td class="p-3"><span class="bg-blue-50 text-brand px-2.5 py-1 rounded-md text-xs font-semibold">${kategori}</span></td>
                <td class="p-3 font-semibold text-slate-800">${nama}</td>
                <td class="p-3 text-slate-600">${satuan}</td>
                <td class="p-3 text-right font-medium text-emerald-600">${CONFIG.formatCurrency(hargaMat)}</td>
                <td class="p-3 text-right text-slate-500">${CONFIG.formatCurrency(hargaJasa)}</td>
                <td class="p-3 text-center">
                    <div class="flex items-center justify-center gap-2">
                        <button onclick="editMaterial('${itemId}')" title="Edit Material" class="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition">
                            <i data-lucide="edit" class="w-4 h-4"></i>
                        </button>
                        <button onclick="deleteData('Material', '${itemId}', loadMaterialData)" title="Hapus Material" class="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });

    html += `</tbody></table></div>`;
    tableContainer.innerHTML = html;
    lucide.createIcons();
}

function filterMaterialTable() {
    const q = (document.getElementById('search-material')?.value || '').toLowerCase().trim();
    if (!q) {
        renderMaterialRows(window.allMaterialList);
        return;
    }
    const filtered = window.allMaterialList.filter(m => {
        const nama = (m.material || m.nama_material || m.uraian || m.nama || m.item || '').toLowerCase();
        const kategori = (m.kategori || m.keterangan || m.kelompok || '').toLowerCase();
        const satuan = (m.satuan || m.unit || '').toLowerCase();
        return nama.includes(q) || kategori.includes(q) || satuan.includes(q);
    });
    renderMaterialRows(filtered);
}

function showModalMaterial(isEdit = false) { 
    const modal = document.getElementById('modal-material');
    if (!modal) return;

    if (!isEdit) {
        state.editId = null;
        document.getElementById('mat-kategori').value = '';
        document.getElementById('mat-nama').value = '';
        document.getElementById('mat-satuan').value = '';
        document.getElementById('mat-harga').value = '0';
        document.getElementById('mat-jasa').value = '0';
        const titleEl = document.getElementById('modal-material-title');
        if (titleEl) titleEl.innerText = 'Tambah Material Baru';
    } else {
        const titleEl = document.getElementById('modal-material-title');
        if (titleEl) titleEl.innerText = 'Edit Data Material';
    }

    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        modal.querySelector('div')?.classList.remove('scale-95');
    }, 10);
}

function closeModalMaterial() { 
    const modal = document.getElementById('modal-material');
    if (!modal) return;
    modal.classList.add('opacity-0');
    modal.querySelector('div')?.classList.add('scale-95');
    setTimeout(() => modal.classList.add('hidden'), 200);
}

async function editMaterial(id) {
    const list = window.allMaterialList.length > 0 ? window.allMaterialList : (await fetchAPI('action=list&table=Material') || []);
    const item = list.find((m, i) => String(m.id || `row_${i}`) === String(id));
    if (!item) return showToast('Data material tidak ditemukan', 'error');

    state.editId = item.id || id;
    document.getElementById('mat-kategori').value = item.kategori || item.keterangan || item.kelompok || '';
    document.getElementById('mat-nama').value = item.material || item.nama_material || item.uraian || item.nama || item.item || '';
    document.getElementById('mat-satuan').value = item.satuan || item.unit || '';
    document.getElementById('mat-harga').value = item.harga || item.harga_material || item.harga_satuan || '0';
    document.getElementById('mat-jasa').value = item.harga_jasa || item.jasa || '0';
    
    showModalMaterial(true);
}

async function saveMaterial(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-save-material');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="inline-block animate-spin mr-1.5">⏳</span> Menyimpan...';
    }

    const kategoriVal = document.getElementById('mat-kategori').value.trim() || 'Umum';
    const namaVal = document.getElementById('mat-nama').value.trim();
    const satuanVal = document.getElementById('mat-satuan').value.trim() || 'set';
    const hargaVal = parseFloat(document.getElementById('mat-harga').value) || 0;
    const jasaVal = parseFloat(document.getElementById('mat-jasa').value) || 0;

    if (!namaVal) {
        showToast('Nama Material / Uraian wajib diisi', 'error');
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = 'Simpan Material';
        }
        return;
    }

    const payload = {
        action: state.editId ? 'update' : 'create',
        table: 'Material',
        user: 'Admin',
        data: {
            material: namaVal,
            nama_material: namaVal,
            nama: namaVal,
            uraian: namaVal,
            satuan: satuanVal,
            harga: hargaVal,
            harga_material: hargaVal,
            harga_satuan: hargaVal,
            kategori: kategoriVal,
            keterangan: kategoriVal,
            harga_jasa: jasaVal,
            jasa: jasaVal,
            jumlah: 1,
            total: hargaVal
        }
    };
    if (state.editId) {
        payload.id = state.editId;
        payload.data.id = state.editId;
    }

    const res = await fetchAPI('', 'POST', payload);

    if (btn) {
        btn.disabled = false;
        btn.innerHTML = 'Simpan Material';
    }

    if (res) {
        showToast(state.editId ? 'Data Material berhasil diperbarui' : 'Data Material berhasil disimpan');
        closeModalMaterial();
        loadMaterialData();
    }
}

// ==========================================
// 12. MODUL LAPORAN & MONITORING
// ==========================================

async function renderLaporan() {
    const contentArea = document.getElementById('app-content');

    // Fetch semua data yang dibutuhkan secara paralel
    const [pekerjaanList, kontrakList, realisasiList, penyediaList] = await Promise.all([
        fetchAPI('action=list&table=Pekerjaan'),
        fetchAPI('action=list&table=Kontrak'),
        fetchAPI('action=list&table=Realisasi'),
        fetchAPI('action=list&table=Penyedia')
    ]);
    const pekerjaan  = pekerjaanList  || [];
    const kontrak    = kontrakList    || [];
    const realisasi  = realisasiList  || [];
    const penyedia   = penyediaList   || [];

    // === HITUNG KPI ===
    // Total nilai kontrak
    let totalKontrak = 0;
    kontrak.forEach(k => { totalKontrak += parseFloat(k.nilai_kontrak) || 0; });

    // Total realisasi keuangan & fisik rata-rata
    let totalRealisasiNilai = 0;
    realisasi.forEach(r => { totalRealisasiNilai += parseFloat(r.nilai) || 0; });

    // Rata-rata progress fisik per pekerjaan (ambil nilai max per pekerjaan_id)
    const progPerPekerjaan = {};
    realisasi.forEach(r => {
        const pid = r.pekerjaan_id;
        const p   = parseFloat(r.progress) || 0;
        if (!progPerPekerjaan[pid] || p > progPerPekerjaan[pid]) progPerPekerjaan[pid] = p;
    });
    const progValues = Object.values(progPerPekerjaan);
    const avgFisik   = progValues.length ? (progValues.reduce((a,b) => a+b, 0) / progValues.length) : 0;
    const pctKeuangan = totalKontrak > 0 ? ((totalRealisasiNilai / totalKontrak) * 100).toFixed(1) : 0;
    const sisaAnggaran = totalKontrak - totalRealisasiNilai;

    // Format angka ke satuan juta/milyar
    const fmtM = (v) => v >= 1e9 ? `Rp ${(v/1e9).toFixed(2)} M` : `Rp ${(v/1e6).toFixed(0)} Jt`;

    // Build opsi penyedia untuk filter
    let optPenyedia = '<option value="">Semua Penyedia</option>';
    penyedia.forEach(p => {
        optPenyedia += `<option value="${p.id}">${p.nama || p.nama_perusahaan}</option>`;
    });
    const pekerjaanData = pekerjaan;
    
    contentArea.innerHTML = `
        <div class="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <h2 class="text-xl font-bold text-slate-800">Laporan & Monitoring</h2>
                <p class="text-sm text-slate-500">Realisasi fisik, keuangan dan progres pekerjaan</p>
            </div>
            <div class="bg-white p-3 rounded-xl shadow-sm border border-slate-100 flex items-center gap-3 w-full sm:w-auto overflow-x-auto">
                <select id="filter-penyedia-lap" class="border border-slate-200 rounded-lg px-3 py-1.5 text-xs outline-none bg-slate-50 min-w-[140px]">
                    ${optPenyedia}
                </select>
                <select id="filter-status-lap" class="border border-slate-200 rounded-lg px-3 py-1.5 text-xs outline-none bg-slate-50 min-w-[120px]">
                    <option value="">Semua Status</option>
                    <option value="On Progress">On Progress</option>
                    <option value="Selesai">Selesai</option>
                    <option value="Belum Mulai">Belum Mulai</option>
                </select>
                <button onclick="applyLaporanFilter()" class="bg-brand text-white px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-sky-700 whitespace-nowrap">Tampilkan</button>
            </div>
        </div>

        <!-- KPI CARDS — data real dari Sheets -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                <div class="p-3 bg-emerald-100 text-emerald-600 rounded-xl"><i data-lucide="wallet" class="w-6 h-6"></i></div>
                <div>
                    <p class="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Realisasi Keuangan</p>
                    <h3 class="text-lg font-bold text-slate-800">${fmtM(totalRealisasiNilai)}</h3>
                    <p class="text-[10px] text-slate-400 mt-0.5"><span class="text-emerald-500 font-semibold">${pctKeuangan}%</span> dari kontrak</p>
                </div>
            </div>
            <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                <div class="p-3 bg-blue-100 text-blue-600 rounded-xl"><i data-lucide="activity" class="w-6 h-6"></i></div>
                <div>
                    <p class="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Realisasi Fisik</p>
                    <h3 class="text-lg font-bold text-slate-800">${avgFisik.toFixed(1)}%</h3>
                    <p class="text-[10px] text-slate-400 mt-0.5">Rata-rata kumulatif</p>
                </div>
            </div>
            <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                <div class="p-3 bg-amber-100 text-amber-600 rounded-xl"><i data-lucide="briefcase" class="w-6 h-6"></i></div>
                <div>
                    <p class="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Paket Pekerjaan</p>
                    <h3 class="text-lg font-bold text-slate-800">${pekerjaan.length}</h3>
                    <p class="text-[10px] text-slate-400 mt-0.5">Total terdaftar</p>
                </div>
            </div>
            <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                <div class="p-3 bg-rose-100 text-rose-600 rounded-xl"><i data-lucide="trending-down" class="w-6 h-6"></i></div>
                <div>
                    <p class="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Sisa Anggaran</p>
                    <h3 class="text-lg font-bold text-slate-800">${fmtM(sisaAnggaran > 0 ? sisaAnggaran : 0)}</h3>
                    <p class="text-[10px] text-slate-400 mt-0.5">Dari total kontrak ${fmtM(totalKontrak)}</p>
                </div>
            </div>
        </div>

        <!-- CHART -->
        <div class="bg-white p-5 rounded-xl shadow-sm border border-slate-100 mb-6">
            <div class="flex items-center gap-6 border-b border-slate-100 pb-3 mb-4">
                <span class="text-sm font-semibold text-brand border-b-2 border-brand pb-3 -mb-[14px]">Realisasi Bulanan</span>
            </div>
            <div class="h-64 relative w-full">
                <canvas id="chartLaporanBulanan"></canvas>
            </div>
        </div>

        <!-- TABEL PAKET PEKERJAAN -->
        <div class="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div class="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 class="text-sm font-bold text-slate-800">Daftar Paket Pekerjaan</h3>
                <div class="flex items-center gap-2">
                    <input id="search-laporan" type="text" placeholder="Cari pekerjaan..." oninput="filterLaporanSearch()" class="border border-slate-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-brand w-48">
                </div>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse text-xs whitespace-nowrap">
                    <thead class="bg-white border-b border-slate-100 text-slate-500">
                        <tr>
                            <th class="p-4 font-semibold w-12 text-center">No</th>
                            <th class="p-4 font-semibold">Nama Pekerjaan</th>
                            <th class="p-4 font-semibold">Penyedia</th>
                            <th class="p-4 font-semibold text-right">Nilai Kontrak (Rp)</th>
                            <th class="p-4 font-semibold text-right">Realisasi (Rp)</th>
                            <th class="p-4 font-semibold text-center">Progres</th>
                            <th class="p-4 font-semibold text-center">Status</th>
                            <th class="p-4 font-semibold text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-50 text-slate-700" id="laporan-tbody"></tbody>
                </table>
            </div>
        </div>
    `;
    lucide.createIcons();

    // Simpan data di window agar bisa difilter
    window._laporanData = { pekerjaan, kontrak, realisasi };
    renderLaporanTable(pekerjaan, kontrak, realisasi);
    initLaporanChart(realisasi);
}

function renderLaporanTable(pekerjaanList, kontrakList, realisasiList) {
    const tbody = document.getElementById('laporan-tbody');
    if (!tbody) return;

    const kontrak   = kontrakList   || [];
    const realisasi = realisasiList || [];

    if (pekerjaanList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="p-8 text-center text-slate-400 italic">Belum ada data pekerjaan.</td></tr>';
        return;
    }

    let html = '';
    pekerjaanList.forEach((item, i) => {
        // Join ke tabel Kontrak berdasarkan pekerjaan_id
        const k = kontrak.find(k => String(k.pekerjaan_id) === String(item.id)) || {};
        const nilaiKontrak = parseFloat(k.nilai_kontrak) || 0;
        const namaPenyedia = k.nama_penyedia || k.penyedia || item.penyedia || '-';

        // Hitung total realisasi keuangan dari tabel Realisasi
        const realisasiItem = realisasi.filter(r => String(r.pekerjaan_id) === String(item.id));
        let totalRealisasi = 0;
        let maxProgress = 0;
        realisasiItem.forEach(r => {
            totalRealisasi += parseFloat(r.nilai) || 0;
            const p = parseFloat(r.progress) || 0;
            if (p > maxProgress) maxProgress = p;
        });

        // Tentukan status berdasarkan progres
        let status = item.status || (maxProgress >= 100 ? 'Selesai' : (maxProgress > 0 ? 'On Progress' : 'Belum Mulai'));
        let pColor = maxProgress >= 100 ? 'bg-emerald-500' : (maxProgress > 0 ? 'bg-blue-500' : 'bg-slate-300');
        let sColor = status === 'Selesai' ? 'text-emerald-600 bg-emerald-50' :
                     (status === 'On Progress' ? 'text-blue-600 bg-blue-50' : 'text-amber-600 bg-amber-50');

        html += `
            <tr class="hover:bg-slate-50 transition-colors laporan-row" data-penyedia="${namaPenyedia}" data-status="${status}" data-nama="${item.nama_pekerjaan.toLowerCase()}">
                <td class="p-4 text-center text-slate-500">${i+1}</td>
                <td class="p-4 font-semibold text-slate-800">${item.nama_pekerjaan}</td>
                <td class="p-4 text-slate-600">${namaPenyedia}</td>
                <td class="p-4 text-right font-medium text-slate-600">${nilaiKontrak > 0 ? CONFIG.formatCurrency(nilaiKontrak) : '-'}</td>
                <td class="p-4 text-right font-medium ${maxProgress>=100 ? 'text-emerald-600' : 'text-slate-800'}">${totalRealisasi > 0 ? CONFIG.formatCurrency(totalRealisasi) : '-'}</td>
                <td class="p-4">
                    <div class="flex items-center justify-center gap-2">
                        <div class="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div class="${pColor} h-full rounded-full" style="width: ${maxProgress}%"></div>
                        </div>
                        <span class="text-[10px] font-bold ${maxProgress>=100 ? 'text-emerald-600' : 'text-slate-600'} w-8">${maxProgress}%</span>
                    </div>
                </td>
                <td class="p-4 text-center">
                    <span class="px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wide ${sColor}">${status}</span>
                </td>
                <td class="p-4 text-center">
                    <button onclick="renderDetailPekerjaan('${item.id}')" class="bg-white border border-slate-200 text-slate-600 hover:text-brand hover:border-brand px-3 py-1 rounded text-[10px] font-semibold transition-colors">Detail</button>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

function applyLaporanFilter() {
    const d = window._laporanData || {};
    let list = d.pekerjaan || [];
    const penyediaId = document.getElementById('filter-penyedia-lap')?.value || '';
    const statusVal  = document.getElementById('filter-status-lap')?.value || '';
    // Filter berdasarkan penyedia (dari tabel Kontrak)
    if (penyediaId) {
        const kontrakFiltered = (d.kontrak || []).filter(k => String(k.penyedia_id) === String(penyediaId));
        const pidSet = new Set(kontrakFiltered.map(k => String(k.pekerjaan_id)));
        list = list.filter(p => pidSet.has(String(p.id)));
    }
    renderLaporanTable(list, d.kontrak, d.realisasi);
    // Terapkan filter status secara client-side
    if (statusVal) {
        document.querySelectorAll('.laporan-row').forEach(tr => {
            tr.style.display = tr.dataset.status === statusVal ? '' : 'none';
        });
    }
}

function filterLaporanSearch() {
    const q = (document.getElementById('search-laporan')?.value || '').toLowerCase();
    document.querySelectorAll('.laporan-row').forEach(tr => {
        tr.style.display = tr.dataset.nama.includes(q) ? '' : 'none';
    });
}

function initLaporanChart(realisasiList) {
    const ctx = document.getElementById('chartLaporanBulanan');
    if (!ctx) return;

    // Kelompokkan realisasi per bulan dari data real
    const bulanLabels = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
    const dataPerBulan = Array(12).fill(0);
    const progPerBulan = Array(12).fill(0);
    const countPerBulan = Array(12).fill(0);

    (realisasiList || []).forEach(r => {
        if (!r.tanggal) return;
        const d = new Date(r.tanggal);
        if (isNaN(d)) return;
        const m = d.getMonth(); // 0–11
        dataPerBulan[m] += (parseFloat(r.nilai) || 0) / 1e6; // dalam juta
        progPerBulan[m] += parseFloat(r.progress) || 0;
        countPerBulan[m]++;
    });

    // Rata-rata progress per bulan, lalu kumulatif
    let kumulatif = 0;
    const kumulatifData = progPerBulan.map((total, i) => {
        if (countPerBulan[i] > 0) kumulatif += total / countPerBulan[i];
        return parseFloat(kumulatif.toFixed(1));
    });

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: bulanLabels,
            datasets: [
                {
                    type: 'line',
                    label: 'Progress Kumulatif (%)',
                    data: kumulatifData,
                    borderColor: '#8b5cf6',
                    backgroundColor: '#8b5cf620',
                    borderWidth: 2,
                    tension: 0.3,
                    yAxisID: 'y1',
                    pointRadius: 3
                },
                {
                    type: 'bar',
                    label: 'Realisasi (Juta Rp)',
                    data: dataPerBulan.map(v => parseFloat(v.toFixed(1))),
                    backgroundColor: '#10b981',
                    borderRadius: 4,
                    yAxisID: 'y'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 6, font: { size: 10 } } }
            },
            scales: {
                x: { grid: { display: false }, ticks: { font: { size: 10 } } },
                y: {
                    type: 'linear', display: true, position: 'left',
                    title: { display: true, text: 'Nilai (Juta Rp)', font: { size: 9 } },
                    grid: { color: '#f1f5f9' }, ticks: { font: { size: 9 } }
                },
                y1: {
                    type: 'linear', display: true, position: 'right',
                    title: { display: true, text: 'Progress %', font: { size: 9 } },
                    grid: { drawOnChartArea: false }, ticks: { font: { size: 9 } },
                    min: 0, max: 100
                }
            }
        }
    });
}

// ==========================================
// 13. MODUL DETAIL PEKERJAAN (Foto & Peta)
// ==========================================

async function renderDetailPekerjaan(id) {
    const contentArea = document.getElementById('app-content');
    contentArea.innerHTML = '<div class="flex justify-center items-center min-h-[60vh]"><div class="loader"></div></div>';

    // Fetch semua data yang dibutuhkan secara paralel
    const [pekerjaanList, kontrakList, realisasiList, pengadaanList, penyediaList] = await Promise.all([
        fetchAPI('action=list&table=Pekerjaan'),
        fetchAPI('action=list&table=Kontrak'),
        fetchAPI('action=list&table=Realisasi'),
        fetchAPI('action=list&table=Pengadaan'),
        fetchAPI('action=list&table=Penyedia')
    ]);

    const pekerjaan = pekerjaanList  || [];
    const kontrak   = kontrakList    || [];
    const realisasi = realisasiList  || [];
    const pengadaan = pengadaanList  || [];
    const penyedia  = penyediaList   || [];

    // Cari data pekerjaan
    let item = pekerjaan.find(p => String(p.id) === String(id));
    if (!item) { showToast('Data pekerjaan tidak ditemukan', 'error'); navigate('laporan'); return; }

    // Join data Kontrak untuk pekerjaan ini
    const k = kontrak.find(k => String(k.pekerjaan_id) === String(id)) || {};

    // Cari nama penyedia dari tabel Penyedia berdasarkan penyedia_id di Kontrak
    let namaPenyedia = k.nama_penyedia || k.penyedia || '-';
    if (k.penyedia_id) {
        const p = penyedia.find(p => String(p.id) === String(k.penyedia_id));
        if (p) namaPenyedia = p.nama || p.nama_perusahaan || namaPenyedia;
    }

    // Cari tahun dari tabel Pengadaan
    let tahunPekerjaan = item.tahun || '-';
    if (item.pengadaan_id) {
        const pg = pengadaan.find(p => String(p.id) === String(item.pengadaan_id));
        if (pg) tahunPekerjaan = pg.tahun || tahunPekerjaan;
    }

    // Hitung realisasi keuangan & fisik dari tabel Realisasi
    const realisasiItem = realisasi.filter(r => String(r.pekerjaan_id) === String(id));
    let totalRealisasiNilai = 0;
    let maxProgress = 0;
    realisasiItem.forEach(r => {
        totalRealisasiNilai += parseFloat(r.nilai) || 0;
        const p = parseFloat(r.progress) || 0;
        if (p > maxProgress) maxProgress = p;
    });

    const nilaiKontrak = parseFloat(k.nilai_kontrak) || 0;
    const sisaKontrak  = nilaiKontrak - totalRealisasiNilai;

    // Status badge
    const statusLabel = maxProgress >= 100 ? 'Selesai' : (maxProgress > 0 ? 'On Progress' : 'Belum Mulai');
    const statusClass = maxProgress >= 100
        ? 'bg-emerald-100 text-emerald-700'
        : (maxProgress > 0 ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700');

    // Simpan semua konteks untuk digunakan di tab lain
    window.currentDetailPekerjaan = {
        ...item,
        nama_penyedia: namaPenyedia,
        tahun: tahunPekerjaan,
        nilai_kontrak: nilaiKontrak,
        tanggal_mulai: k.tanggal_mulai || k.tgl_mulai || '-',
        tanggal_selesai: k.tanggal_selesai || k.tgl_selesai || '-',
        nomor_kontrak: k.nomor_kontrak || k.no_kontrak || '-',
        realisasi_keuangan: totalRealisasiNilai,
        realisasi_fisik: maxProgress,
        sisa_kontrak: sisaKontrak
    };
    window._realisasiListDetail = realisasiItem;

    contentArea.innerHTML = `
        <div class="mb-4">
            <button onclick="navigate('laporan')" class="text-sm font-medium text-slate-500 hover:text-brand flex items-center gap-2 mb-2 transition-colors">
                <i data-lucide="arrow-left" class="w-4 h-4"></i> Kembali ke Laporan
            </button>
            <div class="flex justify-between items-center bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                <div>
                    <h2 class="text-xl font-bold text-slate-800">${item.nama_pekerjaan}</h2>
                    <p class="text-sm text-slate-500">Informasi lengkap progres pekerjaan dan dokumentasi</p>
                </div>
                <div class="${statusClass} px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-2">
                    <div class="w-2 h-2 rounded-full bg-current animate-pulse"></div> ${statusLabel}
                </div>
            </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-slate-100 mb-6 overflow-hidden">
            <div class="flex gap-4 px-6 pt-4 border-b border-slate-100 overflow-x-auto">
                <button onclick="showDetailTab('ringkasan')" id="tab-detail-ringkasan" class="tab-detail-btn text-sm font-semibold text-brand border-b-2 border-brand pb-3 whitespace-nowrap flex items-center gap-2">
                    <i data-lucide="layout-list" class="w-4 h-4"></i> Ringkasan
                </button>
                <button onclick="showDetailTab('rab')" id="tab-detail-rab" class="tab-detail-btn text-sm font-medium text-slate-500 hover:text-slate-800 pb-3 whitespace-nowrap flex items-center gap-2">
                    <i data-lucide="calculator" class="w-4 h-4"></i> RAB
                </button>
                <button onclick="showDetailTab('realisasi')" id="tab-detail-realisasi" class="tab-detail-btn text-sm font-medium text-slate-500 hover:text-slate-800 pb-3 whitespace-nowrap flex items-center gap-2">
                    <i data-lucide="trending-up" class="w-4 h-4"></i> Realisasi
                </button>
                <button onclick="showDetailTab('dokumentasi')" id="tab-detail-dokumentasi" class="tab-detail-btn text-sm font-medium text-slate-500 hover:text-slate-800 pb-3 whitespace-nowrap flex items-center gap-2">
                    <i data-lucide="image" class="w-4 h-4"></i> Dokumentasi
                </button>
                <button onclick="showDetailTab('peta')" id="tab-detail-peta" class="tab-detail-btn text-sm font-medium text-slate-500 hover:text-slate-800 pb-3 whitespace-nowrap flex items-center gap-2">
                    <i data-lucide="map-pin" class="w-4 h-4"></i> Peta Lokasi
                </button>
            </div>
            <div id="detail-tab-content-container" class="p-6 bg-slate-50/30">
                <div class="flex justify-center py-12"><div class="loader"></div></div>
            </div>
        </div>
    `;
    lucide.createIcons();
    showDetailTab('ringkasan');
}

// Fungsi untuk switch tab di detail pekerjaan
function showDetailTab(tabName) {
    const item = window.currentDetailPekerjaan;
    if (!item) return;

    // Update button state
    document.querySelectorAll('.tab-detail-btn').forEach(btn => {
        btn.classList.remove('text-brand', 'border-b-2', 'border-brand', 'font-semibold');
        btn.classList.add('text-slate-500', 'font-medium');
    });
    const activeBtn = document.getElementById('tab-detail-' + tabName);
    if (activeBtn) {
        activeBtn.classList.remove('text-slate-500', 'font-medium');
        activeBtn.classList.add('text-brand', 'border-b-2', 'border-brand', 'font-semibold');
    }

    const container = document.getElementById('detail-tab-content-container');
    if (!container) return;

    switch(tabName) {
        case 'ringkasan':
            loadDetailTabRingkasan(container, item);
            break;
        case 'rab':
            loadDetailTabRAB(container, item);
            break;
        case 'realisasi':
            loadDetailTabRealisasi(container, item);
            break;
        case 'dokumentasi':
            loadDetailTabDokumentasi(container, item);
            break;
        case 'peta':
            loadDetailTabPeta(container, item);
            break;
    }
}

// Tab Ringkasan
async function loadDetailTabRingkasan(container, item) {
    container.innerHTML = '<div class="flex justify-center py-4"><div class="loader"></div></div>';
    
    // Fetch catatan dari tabel LogAktivitas
    const logList = await fetchAPI(`action=list&table=LogAktivitas`) || [];
    const catatanList = logList.filter(log => String(log.pekerjaan_id) === String(item.id))
                              .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal)); // terbaru dulu

    const sisaKontrak = item.sisa_kontrak || 0;
    
    // Build catatan HTML
    let catatanHTML = '';
    if (catatanList.length > 0) {
        catatanList.slice(0, 3).forEach(c => { // maksimal 3 catatan terbaru
            catatanHTML += `
                <div class="bg-amber-50 p-3 rounded-lg border border-amber-100 mb-2">
                    <p class="text-xs text-amber-800 leading-relaxed">${c.catatan || c.keterangan || '-'}</p>
                    <p class="text-[10px] text-amber-600 mt-1 font-medium">${CONFIG.formatDate(c.tanggal)} - ${c.user || 'System'}</p>
                </div>
            `;
        });
        if (catatanList.length > 3) {
            catatanHTML += `<p class="text-xs text-slate-400 italic text-center">+${catatanList.length - 3} catatan lainnya</p>`;
        }
    } else {
        catatanHTML = '<p class="text-xs text-slate-400 italic text-center py-4">Belum ada catatan untuk pekerjaan ini.</p>';
    }

    container.innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- KIRI: INFORMASI UMUM -->
            <div class="lg:col-span-2 space-y-6">
                <div class="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                    <h3 class="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Informasi Umum</h3>
                    <div class="grid grid-cols-[140px_10px_1fr] gap-y-3 text-sm">
                        <div class="text-slate-500">Nama Pekerjaan</div><div class="text-slate-400">:</div><div class="font-semibold text-slate-800">${item.nama_pekerjaan}</div>
                        <div class="text-slate-500">Nomor Paket</div><div class="text-slate-400">:</div><div class="font-medium text-slate-700">${item.nomor_paket || '-'}</div>
                        <div class="text-slate-500">Nomor Kontrak</div><div class="text-slate-400">:</div><div class="font-medium text-slate-700">${item.nomor_kontrak || '-'}</div>
                        <div class="text-slate-500">Penyedia</div><div class="text-slate-400">:</div><div class="font-medium text-slate-700">${item.nama_penyedia || '-'}</div>
                        <div class="text-slate-500">Lokasi</div><div class="text-slate-400">:</div><div class="font-medium text-slate-700">${item.lokasi || '-'}</div>
                        <div class="text-slate-500">Tahun</div><div class="text-slate-400">:</div><div class="font-medium text-slate-700">${item.tahun || '-'}</div>
                        <div class="text-slate-500">Nilai Kontrak</div><div class="text-slate-400">:</div><div class="font-bold text-emerald-600">${CONFIG.formatCurrency(item.nilai_kontrak || 0)}</div>
                        <div class="text-slate-500">Masa Pelaksanaan</div><div class="text-slate-400">:</div><div class="font-medium text-slate-700">${item.tanggal_mulai || '-'} s/d ${item.tanggal_selesai || '-'}</div>
                    </div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- FOTO LAPANGAN -->
                    <div class="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                        <div class="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
                            <h3 class="text-sm font-bold text-slate-800">Foto Lapangan</h3>
                            <button onclick="showDetailTab('dokumentasi')" class="text-[10px] text-brand hover:underline font-semibold">Lihat Semua</button>
                        </div>
                        <div class="grid grid-cols-2 gap-3">
                            <div class="aspect-square bg-slate-100 rounded-lg overflow-hidden relative">
                                <img src="https://images.unsplash.com/photo-1544256718-3b624d547f3b?auto=format&fit=crop&w=300&q=80" class="w-full h-full object-cover" alt="Tiang PLN">
                            </div>
                            <div class="aspect-square bg-slate-100 rounded-lg overflow-hidden relative">
                                <img src="https://images.unsplash.com/photo-1621505343632-159e4bb50be4?auto=format&fit=crop&w=300&q=80" class="w-full h-full object-cover" alt="Kabel PLN">
                            </div>
                        </div>
                    </div>
                    
                    <!-- CATATAN -->
                    <div class="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                        <h3 class="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Catatan Terbaru</h3>
                        <div id="catatan-container" class="mb-3 max-h-32 overflow-y-auto">
                            ${catatanHTML}
                        </div>
                        <button onclick="showModalCatatan()" class="w-full py-2 border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors">Tambah Catatan</button>
                    </div>
                </div>
            </div>
            
            <!-- KANAN: PROGRES & PETA -->
            <div class="space-y-6">
                <!-- PROGRES -->
                <div class="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                    <h3 class="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 mb-3">Progres Pekerjaan</h3>
                    <div class="flex flex-col items-center py-4">
                        <div class="relative w-32 h-32 mb-4 flex items-center justify-center">
                            <canvas id="chartDetailProgres"></canvas>
                            <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span class="text-2xl font-bold text-slate-800">${item.realisasi_fisik}%</span>
                            </div>
                        </div>
                    </div>
                    <div class="space-y-3 border-t border-slate-100 pt-3 text-xs">
                        <div class="flex justify-between items-center"><span class="text-slate-500">Realisasi Keuangan</span><span class="font-bold text-slate-800">${CONFIG.formatCurrency(item.realisasi_keuangan || 0)}</span></div>
                        <div class="flex justify-between items-center"><span class="text-slate-500">Realisasi Fisik</span><span class="font-bold text-slate-800">${item.realisasi_fisik}%</span></div>
                        <div class="flex justify-between items-center"><span class="text-slate-500">Sisa Kontrak</span><span class="font-bold ${sisaKontrak > 0 ? 'text-rose-500' : 'text-emerald-500'}">${CONFIG.formatCurrency(Math.abs(sisaKontrak))}</span></div>
                    </div>
                </div>
                
                <!-- LOKASI MINI -->
                <div class="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                    <div class="flex justify-between items-center mb-3">
                        <h3 class="text-sm font-bold text-slate-800">Lokasi</h3>
                        <button onclick="showDetailTab('peta')" class="text-[10px] text-brand hover:underline font-semibold">Lihat Peta</button>
                    </div>
                    <div class="bg-slate-200 rounded-lg overflow-hidden h-32 relative cursor-pointer" onclick="showDetailTab('peta')">
                        <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=400&q=80" class="w-full h-full object-cover opacity-80" alt="Peta">
                        <div class="absolute inset-0 flex items-center justify-center">
                            <div class="bg-white px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 text-xs font-bold text-brand">
                                <i data-lucide="map-pin" class="w-3.5 h-3.5"></i> ${item.lokasi || 'Lokasi'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- MODAL TAMBAH CATATAN -->
        <div id="modal-catatan" class="fixed inset-0 bg-slate-900/50 z-50 hidden flex items-center justify-center backdrop-blur-sm transition-opacity opacity-0">
            <div class="bg-white rounded-xl shadow-xl w-full max-w-md p-6 transform transition-all scale-95">
                <div class="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
                    <h3 class="text-lg font-bold text-slate-800">Tambah Catatan</h3>
                    <button type="button" onclick="closeModalCatatan()" class="text-slate-400 hover:text-slate-700">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                </div>
                <form onsubmit="saveCatatan(event)">
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">Catatan</label>
                            <textarea id="catatan-text" rows="4" required placeholder="Masukkan catatan atau update progres pekerjaan..." class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-brand outline-none resize-none"></textarea>
                        </div>
                    </div>
                    <div class="mt-6 flex justify-end gap-3">
                        <button type="button" onclick="closeModalCatatan()" class="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">Batal</button>
                        <button type="submit" id="btn-save-catatan" class="px-6 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-sky-700 transition-colors">Simpan Catatan</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    lucide.createIcons();
    setTimeout(() => initDetailProgresChart(item.realisasi_fisik), 100);
}

// Tab RAB
async function loadDetailTabRAB(container, item) {
    container.innerHTML = '<div class="flex justify-center py-12"><div class="loader"></div></div>';
    
    const rabList = await fetchAPI(`action=list&table=RAB`) || [];
    const rabItems = rabList.filter(r => String(r.pekerjaan_id) === String(item.id));

    let totalRAB = 0;
    let rows = '';
    if (rabItems.length === 0) {
        rows = '<tr><td colspan="9" class="px-4 py-8 text-center text-slate-400 italic">Belum ada data RAB untuk pekerjaan ini.</td></tr>';
    } else {
        rabItems.forEach((r, i) => {
            const vol = parseFloat(r.volume) || 0;
            const hMat = parseFloat(r.harga_material) || 0;
            const hJasa = parseFloat(r.harga_jasa) || 0;
            const total = vol * (hMat + hJasa);
            totalRAB += total;
            rows += `
                <tr class="hover:bg-slate-50">
                    <td class="px-3 py-2.5 text-center text-slate-500">${i + 1}</td>
                    <td class="px-3 py-2.5"><span class="px-2 py-0.5 rounded text-[10px] font-semibold ${r.kategori === 'JTM' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'}">${r.kategori || '-'}</span></td>
                    <td class="px-4 py-2.5 font-medium text-slate-800">${r.uraian}</td>
                    <td class="px-3 py-2.5 text-center text-slate-600">${r.satuan}</td>
                    <td class="px-3 py-2.5 text-center font-medium">${vol}</td>
                    <td class="px-3 py-2.5 text-right text-xs">${CONFIG.formatCurrency(hMat)}</td>
                    <td class="px-3 py-2.5 text-right text-xs">${CONFIG.formatCurrency(hJasa)}</td>
                    <td class="px-4 py-2.5 text-right font-bold text-slate-900">${CONFIG.formatCurrency(total)}</td>
                </tr>
            `;
        });
    }

    container.innerHTML = `
        <div class="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <div class="flex justify-between items-center mb-4">
                <div>
                    <h3 class="text-base font-bold text-slate-800">Rencana Anggaran Biaya (RAB)</h3>
                    <p class="text-xs text-slate-500 mt-0.5">Rincian estimasi biaya pekerjaan dari menu RAB</p>
                </div>
                <button onclick="navigate('rab'); state.selectedPekerjaanRAB='${item.id}'" class="px-3 py-1.5 bg-brand text-white text-xs font-semibold rounded-lg hover:bg-sky-700 flex items-center gap-1.5">
                    <i data-lucide="edit" class="w-3.5 h-3.5"></i> Edit RAB
                </button>
            </div>
            
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse text-xs">
                    <thead class="bg-slate-100 border-b border-slate-200">
                        <tr>
                            <th class="px-3 py-2.5 text-center w-10">No</th>
                            <th class="px-3 py-2.5 w-20">Kategori</th>
                            <th class="px-4 py-2.5">Uraian</th>
                            <th class="px-3 py-2.5 text-center w-16">Sat</th>
                            <th class="px-3 py-2.5 text-center w-16">Vol</th>
                            <th class="px-3 py-2.5 text-right w-24">H. Material</th>
                            <th class="px-3 py-2.5 text-right w-24">H. Jasa</th>
                            <th class="px-4 py-2.5 text-right w-32">Total (Rp)</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        ${rows}
                    </tbody>
                    <tfoot class="bg-slate-50 border-t-2 border-slate-200">
                        <tr>
                            <td colspan="7" class="px-4 py-3 text-right font-bold text-slate-700">TOTAL RAB</td>
                            <td class="px-4 py-3 text-right font-bold text-brand text-base">${CONFIG.formatCurrency(totalRAB)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    `;
    lucide.createIcons();
}

// Tab Realisasi
async function loadDetailTabRealisasi(container, item) {
    container.innerHTML = '<div class="flex justify-center py-12"><div class="loader"></div></div>';
    
    const realisasiList = await fetchAPI(`action=list&table=Realisasi`) || [];
    const realisasiItems = realisasiList.filter(r => String(r.pekerjaan_id) === String(item.id));

    let totalNilai = 0;
    let totalProgress = 0;
    let rows = '';
    
    if (realisasiItems.length === 0) {
        rows = '<tr><td colspan="5" class="px-4 py-8 text-center text-slate-400 italic">Belum ada data realisasi untuk pekerjaan ini.</td></tr>';
    } else {
        realisasiItems.sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal));
        realisasiItems.forEach((r, i) => {
            const nilai = parseFloat(r.nilai) || 0;
            const prog = parseFloat(r.progress) || 0;
            totalNilai += nilai;
            totalProgress += prog;
            rows += `
                <tr class="hover:bg-slate-50">
                    <td class="px-3 py-2.5 text-center text-slate-500">${i + 1}</td>
                    <td class="px-3 py-2.5 font-medium text-slate-700">${CONFIG.formatDate(r.tanggal)}</td>
                    <td class="px-4 py-2.5 text-right font-semibold text-emerald-600">${CONFIG.formatCurrency(nilai)}</td>
                    <td class="px-3 py-2.5 text-center font-bold text-slate-700">+${prog}%</td>
                    <td class="px-4 py-2.5 text-slate-500 text-xs">${r.keterangan || '-'}</td>
                </tr>
            `;
        });
    }

    container.innerHTML = `
        <div class="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <div class="flex justify-between items-center mb-4">
                <div>
                    <h3 class="text-base font-bold text-slate-800">Riwayat Realisasi</h3>
                    <p class="text-xs text-slate-500 mt-0.5">Data pencapaian fisik dan keuangan dari menu Realisasi</p>
                </div>
                <button onclick="navigate('realisasi'); state.selectedPekerjaanRealisasi='${item.id}'" class="px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 flex items-center gap-1.5">
                    <i data-lucide="plus" class="w-3.5 h-3.5"></i> Input Realisasi
                </button>
            </div>
            
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse text-sm">
                    <thead class="bg-emerald-50 border-b border-emerald-100">
                        <tr class="text-xs uppercase text-emerald-800 font-semibold">
                            <th class="px-3 py-2.5 text-center w-12">No</th>
                            <th class="px-3 py-2.5">Tanggal</th>
                            <th class="px-4 py-2.5 text-right">Nilai Serapan (Rp)</th>
                            <th class="px-3 py-2.5 text-center">Progress Fisik</th>
                            <th class="px-4 py-2.5">Keterangan</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        ${rows}
                    </tbody>
                    <tfoot class="bg-emerald-50 border-t-2 border-emerald-200">
                        <tr class="font-bold text-slate-800">
                            <td colspan="2" class="px-4 py-3 text-right">TOTAL KUMULATIF</td>
                            <td class="px-4 py-3 text-right text-emerald-600 text-base">${CONFIG.formatCurrency(totalNilai)}</td>
                            <td class="px-3 py-3 text-center text-brand text-base">${totalProgress.toFixed(1)}%</td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    `;
    lucide.createIcons();
}

// Tab Dokumentasi
function loadDetailTabDokumentasi(container, item) {
    container.innerHTML = `
        <div class="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <div class="flex justify-between items-center mb-4">
                <div>
                    <h3 class="text-base font-bold text-slate-800">Dokumentasi Foto Lapangan</h3>
                    <p class="text-xs text-slate-500 mt-0.5">Upload dan kelola foto progres pekerjaan</p>
                </div>
                <button onclick="uploadFotoLapangan()" class="px-3 py-1.5 bg-brand text-white text-xs font-semibold rounded-lg hover:bg-sky-700 flex items-center gap-1.5">
                    <i data-lucide="upload" class="w-3.5 h-3.5"></i> Upload Foto
                </button>
            </div>

            <!-- Input file tersembunyi -->
            <input type="file" id="input-foto-lapangan" accept="image/*" multiple class="hidden" onchange="handleFotoUpload(event)">
            
            <!-- Grid Foto -->
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4" id="grid-foto-dokumentasi">
                <!-- Sample images -->
                <div class="aspect-square bg-slate-100 rounded-lg overflow-hidden relative group">
                    <img src="https://images.unsplash.com/photo-1544256718-3b624d547f3b?auto=format&fit=crop&w=300&q=80" class="w-full h-full object-cover" alt="Tiang PLN">
                    <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button class="p-2 bg-white rounded-lg text-slate-700 hover:bg-slate-100"><i data-lucide="eye" class="w-4 h-4"></i></button>
                        <button class="p-2 bg-red-500 rounded-lg text-white hover:bg-red-600"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                    </div>
                </div>
                <div class="aspect-square bg-slate-100 rounded-lg overflow-hidden relative group">
                    <img src="https://images.unsplash.com/photo-1621505343632-159e4bb50be4?auto=format&fit=crop&w=300&q=80" class="w-full h-full object-cover" alt="Kabel">
                    <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button class="p-2 bg-white rounded-lg text-slate-700 hover:bg-slate-100"><i data-lucide="eye" class="w-4 h-4"></i></button>
                        <button class="p-2 bg-red-500 rounded-lg text-white hover:bg-red-600"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                    </div>
                </div>
                <div class="aspect-square bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center border-2 border-dashed border-slate-300 text-slate-400 hover:text-brand hover:border-brand hover:bg-slate-50 cursor-pointer transition-colors" onclick="uploadFotoLapangan()">
                    <div class="text-center">
                        <i data-lucide="plus" class="w-8 h-8 mx-auto mb-1"></i>
                        <p class="text-[10px] font-medium">Upload Foto</p>
                    </div>
                </div>
            </div>

            <div class="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <p class="text-xs text-blue-700 leading-relaxed">
                    <strong>💡 Tips:</strong> Untuk menyimpan foto ke Google Sheets, Anda dapat upload ke Google Drive terlebih dahulu, lalu masukkan link Google Drive ke kolom keterangan realisasi. 
                    Atau gunakan layanan image hosting seperti Imgur dan simpan URL-nya.
                </p>
            </div>
        </div>
    `;
    lucide.createIcons();
}

function uploadFotoLapangan() {
    document.getElementById('input-foto-lapangan')?.click();
}

function handleFotoUpload(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    // Preview foto yang diupload (client-side only untuk demo)
    const grid = document.getElementById('grid-foto-dokumentasi');
    if (!grid) return;

    Array.from(files).forEach(file => {
        if (!file.type.startsWith('image/')) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const newItem = document.createElement('div');
            newItem.className = 'aspect-square bg-slate-100 rounded-lg overflow-hidden relative group';
            newItem.innerHTML = `
                <img src="${e.target.result}" class="w-full h-full object-cover" alt="Foto">
                <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button class="p-2 bg-white rounded-lg text-slate-700 hover:bg-slate-100"><i data-lucide="eye" class="w-4 h-4"></i></button>
                    <button onclick="this.closest('.aspect-square').remove()" class="p-2 bg-red-500 rounded-lg text-white hover:bg-red-600"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                </div>
            `;
            grid.insertBefore(newItem, grid.lastElementChild);
            lucide.createIcons({ root: newItem });
        };
        reader.readAsDataURL(file);
    });
    
    showToast('Foto berhasil ditambahkan (preview only). Untuk menyimpan permanen, upload ke Google Drive lalu simpan link-nya di keterangan realisasi.');
    event.target.value = ''; // Reset input
}

// Tab Peta Lokasi
function loadDetailTabPeta(container, item) {
    const searchQuery = encodeURIComponent((item.lokasi || 'Tabanan Bali') + ' PLN');
    const mapsEmbedUrl = `https://www.google.com/maps/embed/v1/place?key=YOUR_GOOGLE_MAPS_API_KEY&q=${searchQuery}`;
    const mapsDirectUrl = `https://www.google.com/maps/search/?api=1&query=${searchQuery}`;

    container.innerHTML = `
        <div class="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <div class="flex justify-between items-center mb-4">
                <div>
                    <h3 class="text-base font-bold text-slate-800">Peta Lokasi Pekerjaan</h3>
                    <p class="text-xs text-slate-500 mt-0.5">${item.lokasi || 'Lokasi pekerjaan'}</p>
                </div>
                <a href="${mapsDirectUrl}" target="_blank" class="px-3 py-1.5 bg-brand text-white text-xs font-semibold rounded-lg hover:bg-sky-700 flex items-center gap-1.5">
                    <i data-lucide="external-link" class="w-3.5 h-3.5"></i> Buka di Google Maps
                </a>
            </div>

            <!-- Map Preview (image fallback karena Maps API perlu key) -->
            <div class="aspect-video bg-slate-200 rounded-lg overflow-hidden relative mb-4">
                <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=800&q=80" 
                    class="w-full h-full object-cover" alt="Peta">
                <div class="absolute inset-0 flex items-center justify-center bg-black/20">
                    <div class="bg-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
                        <i data-lucide="map-pin" class="w-5 h-5 text-brand"></i>
                        <span class="font-bold text-slate-800">${item.lokasi || 'Lokasi Pekerjaan'}</span>
                    </div>
                </div>
            </div>

            <!-- Koordinat (jika ada) -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div class="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <p class="text-xs text-slate-500 mb-1">Latitude</p>
                    <p class="font-mono text-sm font-semibold text-slate-800">-8.542589 <span class="text-xs text-slate-400">(contoh)</span></p>
                </div>
                <div class="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <p class="text-xs text-slate-500 mb-1">Longitude</p>
                    <p class="font-mono text-sm font-semibold text-slate-800">115.200914 <span class="text-xs text-slate-400">(contoh)</span></p>
                </div>
            </div>

            <div class="p-4 bg-amber-50 rounded-lg border border-amber-100">
                <p class="text-xs text-amber-700 leading-relaxed">
                    <strong>📍 Info:</strong> Untuk menampilkan peta interaktif Google Maps, diperlukan Google Maps API Key. 
                    Anda dapat mengaktifkannya di <a href="https://console.cloud.google.com/" target="_blank" class="underline">Google Cloud Console</a>.
                    Untuk sementara, gunakan tombol "Buka di Google Maps" untuk navigasi.
                </p>
            </div>
        </div>
    `;
    lucide.createIcons();
}

// ==========================================
// 14. MODUL USER & LOG AKTIVITAS
// ==========================================

async function renderUser() {
    const contentArea = document.getElementById('app-content');
    contentArea.innerHTML = '<div class="flex justify-center py-24"><div class="loader"></div></div>';

    const users = await getUsers();

    const roleColors = {
        'Administrator': 'bg-purple-100 text-purple-700',
        'Perencanaan': 'bg-blue-100 text-blue-700',
        'Pengawas Lapangan': 'bg-amber-100 text-amber-700',
        'Viewer': 'bg-slate-100 text-slate-600'
    };

    let userRows = '';
    users.forEach((u, i) => {
        const rClass = roleColors[u.role] || 'bg-slate-100 text-slate-600';
        const sClass = u.status === 'Aktif' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600';
        const isCurrent = state.currentUser && state.currentUser.id === u.id;
        userRows += `
            <tr class="hover:bg-slate-50 transition-colors ${isCurrent ? 'bg-blue-50/30' : ''}">
                <td class="p-3 text-center text-slate-500">${i + 1}</td>
                <td class="p-3">
                    <div class="flex items-center gap-2.5">
                        <div class="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-white font-bold text-sm shrink-0">${u.nama.charAt(0)}</div>
                        <div>
                            <p class="font-semibold text-slate-800 text-sm">${u.nama} ${isCurrent ? '<span class="text-[10px] text-brand">(Anda)</span>' : ''}</p>
                            <p class="text-xs text-slate-400">${u.email || '-'}</p>
                        </div>
                    </div>
                </td>
                <td class="p-3 text-sm text-slate-600 font-mono">${u.username}</td>
                <td class="p-3"><span class="px-2.5 py-1 rounded-md text-xs font-semibold ${rClass}">${u.role}</span></td>
                <td class="p-3 text-center"><span class="px-2.5 py-1 rounded-md text-xs font-semibold ${sClass}">${u.status}</span></td>
                <td class="p-3 text-center">
                    <div class="flex justify-center gap-2">
                        <button onclick="editUser('${u.id}')" class="text-blue-500 hover:text-blue-700 p-1" title="Edit"><i data-lucide="edit" class="w-4 h-4"></i></button>
                        ${!isCurrent ? `<button onclick="deleteUser('${u.id}')" class="text-red-400 hover:text-red-600 p-1" title="Hapus"><i data-lucide="trash-2" class="w-4 h-4"></i></button>` : ''}
                    </div>
                </td>
            </tr>
        `;
    });

    contentArea.innerHTML = `
        <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-100 mb-6">
            <div class="flex justify-between items-center mb-6">
                <div>
                    <h2 class="text-lg font-semibold text-slate-800">Manajemen Pengguna</h2>
                    <p class="text-sm text-slate-500">Kelola akses dan peran pengguna aplikasi.</p>
                </div>
                <button onclick="showModalUser()" class="bg-brand text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-sky-700 transition flex items-center gap-2 shadow-sm">
                    <i data-lucide="user-plus" class="w-4 h-4"></i> Tambah Pengguna
                </button>
            </div>
            <div class="overflow-x-auto rounded-lg border border-slate-200">
                <table class="w-full text-left border-collapse text-sm">
                    <thead class="bg-slate-100">
                        <tr>
                            <th class="p-3 w-12 text-center text-slate-600 font-semibold">No</th>
                            <th class="p-3 text-slate-600 font-semibold">Nama Pengguna</th>
                            <th class="p-3 text-slate-600 font-semibold">Username</th>
                            <th class="p-3 text-slate-600 font-semibold">Peran (Role)</th>
                            <th class="p-3 text-center text-slate-600 font-semibold">Status</th>
                            <th class="p-3 text-center text-slate-600 font-semibold">Aksi</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        ${userRows}
                    </tbody>
                </table>
            </div>
        </div>

        <!-- MODAL USER -->
        <div id="modal-user" class="fixed inset-0 bg-slate-900/50 z-50 hidden flex items-center justify-center backdrop-blur-sm transition-opacity opacity-0">
            <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 transform transition-all scale-95">
                <div class="flex justify-between items-center mb-5 border-b border-slate-100 pb-4">
                    <h3 id="modal-user-title" class="text-lg font-bold text-slate-800">Tambah Pengguna Baru</h3>
                    <button type="button" onclick="closeModalUser()" class="text-slate-400 hover:text-slate-700"><i data-lucide="x" class="w-5 h-5"></i></button>
                </div>
                <form onsubmit="saveUserForm(event)">
                    <input type="hidden" id="user-edit-id" value="">
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap *</label>
                            <input type="text" id="user-nama" required placeholder="Contoh: Budi Santoso" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-brand outline-none">
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-slate-700 mb-1">Username *</label>
                                <input type="text" id="user-username" required placeholder="budi.santoso" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-brand outline-none">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-slate-700 mb-1">Password *</label>
                                <input type="text" id="user-password" placeholder="Kosongkan jika tidak diubah" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-brand outline-none">
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">Email</label>
                            <input type="email" id="user-email" placeholder="budi@pln.co.id" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-brand outline-none">
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-slate-700 mb-1">Peran (Role)</label>
                                <select id="user-role" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-brand outline-none bg-white">
                                    <option value="Administrator">Administrator</option>
                                    <option value="Perencanaan">Perencanaan</option>
                                    <option value="Pengawas Lapangan">Pengawas Lapangan</option>
                                    <option value="Viewer">Viewer</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-slate-700 mb-1">Status</label>
                                <select id="user-status" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-brand outline-none bg-white">
                                    <option value="Aktif">Aktif</option>
                                    <option value="Nonaktif">Nonaktif</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div class="mt-6 flex justify-end gap-3">
                        <button type="button" onclick="closeModalUser()" class="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50">Batal</button>
                        <button type="submit" id="btn-save-user" class="px-6 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-sky-700">Simpan Pengguna</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    lucide.createIcons();
}

function showModalUser(isEdit = false) {
    if (!isEdit) {
        document.getElementById('user-edit-id').value = '';
        document.getElementById('user-nama').value = '';
        document.getElementById('user-username').value = '';
        document.getElementById('user-password').value = '';
        document.getElementById('user-email').value = '';
        document.getElementById('user-role').value = 'Perencanaan';
        document.getElementById('user-status').value = 'Aktif';
        document.getElementById('modal-user-title').innerText = 'Tambah Pengguna Baru';
        document.getElementById('btn-save-user').innerText = 'Simpan Pengguna';
        document.getElementById('user-password').required = true;
        document.getElementById('user-password').placeholder = 'Password wajib diisi';
    }
    const modal = document.getElementById('modal-user');
    if (!modal) return;
    modal.classList.remove('hidden');
    setTimeout(() => { modal.classList.remove('opacity-0'); modal.querySelector('div').classList.remove('scale-95'); }, 10);
}

function closeModalUser() {
    const modal = document.getElementById('modal-user');
    if (!modal) return;
    modal.classList.add('opacity-0'); modal.querySelector('div').classList.add('scale-95');
    setTimeout(() => modal.classList.add('hidden'), 300);
}

async function editUser(id) {
    const users = await getUsers();
    const user = users.find(u => u.id === id);
    if (!user) return;

    document.getElementById('user-edit-id').value = user.id;
    document.getElementById('user-nama').value = user.nama;
    document.getElementById('user-username').value = user.username;
    document.getElementById('user-password').value = '';
    document.getElementById('user-password').required = false;
    document.getElementById('user-password').placeholder = 'Kosongkan jika tidak diubah';
    document.getElementById('user-email').value = user.email || '';
    document.getElementById('user-role').value = user.role;
    document.getElementById('user-status').value = user.status;
    document.getElementById('modal-user-title').innerText = 'Edit Pengguna';
    document.getElementById('btn-save-user').innerText = 'Update Pengguna';
    showModalUser(true);
}

function saveUserForm(event) {
    event.preventDefault();
    const btn = document.getElementById('btn-save-user');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = 'Menyimpan...';
    }

    const editId = document.getElementById('user-edit-id').value;
    const username = document.getElementById('user-username').value.trim();

    // Validasi duplikat username
    getUsers().then(async users => {
        const duplicate = users.find(u => u.username === username && u.id !== editId);
        if (duplicate) {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = editId ? 'Update Pengguna' : 'Simpan Pengguna';
            }
            return showToast('Username sudah digunakan pengguna lain.', 'error');
        }

        const userData = {
            nama: document.getElementById('user-nama').value,
            username: username,
            email: document.getElementById('user-email').value,
            role: document.getElementById('user-role').value,
            status: document.getElementById('user-status').value,
            password: '' // akan diset di bawah
        };

        if (editId) {
            // Update
            userData.id = editId;
            const oldUser = users.find(u => u.id === editId);
            const newPw = document.getElementById('user-password').value;
            userData.password = newPw ? newPw : (oldUser ? oldUser.password : 'default123');

            const result = await saveUser(userData, true);
            if (result) {
                // Update session jika mengedit user yang sedang login
                if (state.currentUser && state.currentUser.id === editId) {
                    state.currentUser = { ...userData };
                    localStorage.setItem('pln_session', JSON.stringify(state.currentUser));
                    sessionStorage.setItem('pln_session', JSON.stringify(state.currentUser));
                    updateUserUI();
                }
                showToast('Data pengguna berhasil diperbarui');
                closeModalUser();
                renderUser();
            } else {
                showToast('Gagal menyimpan ke Google Sheets', 'error');
            }
        } else {
            // Create
            userData.password = document.getElementById('user-password').value || 'default123';
            const result = await saveUser(userData, false);
            if (result) {
                showToast('Pengguna baru berhasil ditambahkan');
                closeModalUser();
                renderUser();
            } else {
                showToast('Gagal menyimpan ke Google Sheets', 'error');
            }
        }

        if (btn) {
            btn.disabled = false;
            btn.innerHTML = editId ? 'Update Pengguna' : 'Simpan Pengguna';
        }
    }).catch(err => {
        console.error('Save user error:', err);
        showToast('Error saat menyimpan user', 'error');
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = editId ? 'Update Pengguna' : 'Simpan Pengguna';
        }
    });
}

async function deleteUser(id) {
    if (!confirm('Hapus pengguna ini dari sistem?')) return;
    const result = await deleteUserFromSheets(id);
    if (result) {
        renderUser();
        showToast('Pengguna berhasil dihapus');
    } else {
        showToast('Gagal menghapus user dari Google Sheets', 'error');
    }
}

// ==========================================
// 15. MODUL PENGATURAN SISTEM
// ==========================================

function renderPengaturan() {
    const contentArea = document.getElementById('app-content');
    if (!contentArea) return;

    const apiUrl = CONFIG.API_URL || '';
    const currentUser = state.currentUser || {};

    contentArea.innerHTML = `
        <div class="mb-6">
            <h2 class="text-xl font-bold text-slate-800">Pengaturan Sistem</h2>
            <p class="text-sm text-slate-500">Konfigurasi koneksi Google Sheets, profil pengguna, dan preferensi aplikasi.</p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- KOLOM KIRI: Navigasi tab -->
            <div class="lg:col-span-1">
                <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div class="p-4 bg-slate-50 border-b border-slate-200">
                        <p class="text-xs font-bold text-slate-500 uppercase tracking-wider">Menu Pengaturan</p>
                    </div>
                    <nav class="p-2 space-y-1">
                        <button onclick="showSettingTab('koneksi')" id="tab-btn-koneksi" class="setting-tab-btn w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium flex items-center gap-3 bg-brand text-white transition-colors">
                            <i data-lucide="link" class="w-4 h-4"></i> Koneksi Google Sheets
                        </button>
                        <button onclick="showSettingTab('profil')" id="tab-btn-profil" class="setting-tab-btn w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium flex items-center gap-3 text-slate-600 hover:bg-slate-100 transition-colors">
                            <i data-lucide="user-circle" class="w-4 h-4"></i> Profil & Password
                        </button>
                        <button onclick="showSettingTab('tampilan')" id="tab-btn-tampilan" class="setting-tab-btn w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium flex items-center gap-3 text-slate-600 hover:bg-slate-100 transition-colors">
                            <i data-lucide="palette" class="w-4 h-4"></i> Tampilan Aplikasi
                        </button>
                        <button onclick="showSettingTab('tentang')" id="tab-btn-tentang" class="setting-tab-btn w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium flex items-center gap-3 text-slate-600 hover:bg-slate-100 transition-colors">
                            <i data-lucide="info" class="w-4 h-4"></i> Tentang Aplikasi
                        </button>
                    </nav>
                    <div class="p-4 border-t border-slate-100">
                        <button onclick="doLogout()" class="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <i data-lucide="log-out" class="w-4 h-4"></i> Keluar dari Sistem
                        </button>
                    </div>
                </div>
            </div>

            <!-- KOLOM KANAN: Konten tab -->
            <div class="lg:col-span-2 space-y-4" id="setting-content">

                <!-- TAB: KONEKSI GOOGLE SHEETS -->
                <div id="tab-koneksi" class="setting-tab-content">
                    <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <div class="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
                            <div class="p-2.5 bg-blue-50 text-brand rounded-xl"><i data-lucide="link" class="w-5 h-5"></i></div>
                            <div>
                                <h3 class="text-base font-bold text-slate-800">Koneksi Google Sheets API</h3>
                                <p class="text-xs text-slate-500">URL Web App Apps Script yang menghubungkan aplikasi ke spreadsheet</p>
                            </div>
                        </div>

                        <div id="koneksi-status-box" class="mb-4 p-3.5 rounded-xl border flex items-center gap-3 bg-slate-50 border-slate-200">
                            <div class="loader w-4 h-4"></div>
                            <span class="text-sm text-slate-500">Mengecek koneksi...</span>
                        </div>

                        <div class="space-y-4">
                            <div>
                                <label class="block text-sm font-semibold text-slate-700 mb-1.5">URL Web App (Apps Script)</label>
                                <div class="flex gap-2">
                                    <input type="url" id="setting-api-url" value="${apiUrl}"
                                        class="flex-1 border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:border-brand outline-none font-mono text-xs"
                                        placeholder="https://script.google.com/macros/s/...">
                                    <button onclick="testKoneksi()" class="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition whitespace-nowrap flex items-center gap-1.5">
                                        <i data-lucide="wifi" class="w-4 h-4"></i> Test
                                    </button>
                                </div>
                                <p class="text-xs text-slate-400 mt-1.5">* Salin URL dari menu Deployment > Manage Deployments di Google Apps Script</p>
                            </div>

                            <div>
                                <label class="block text-sm font-semibold text-slate-700 mb-1.5">Link Google Spreadsheet</label>
                                <div class="flex gap-2">
                                    <input type="url" id="setting-sheet-url" value="${localStorage.getItem('pln_sheet_url') || ''}"
                                        class="flex-1 border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:border-brand outline-none font-mono text-xs"
                                        placeholder="https://docs.google.com/spreadsheets/d/...">
                                    <a id="btn-open-sheet" href="${localStorage.getItem('pln_sheet_url') || '#'}" target="_blank"
                                        class="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition flex items-center gap-1.5">
                                        <i data-lucide="external-link" class="w-4 h-4"></i> Buka
                                    </a>
                                </div>
                            </div>
                        </div>

                        <div class="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
                            <button onclick="saveSettingKoneksi()" class="px-6 py-2.5 bg-brand text-white rounded-xl text-sm font-semibold hover:bg-sky-700 shadow-sm flex items-center gap-2">
                                <i data-lucide="save" class="w-4 h-4"></i> Simpan Pengaturan
                            </button>
                        </div>
                    </div>

                    <!-- Status tabel sheets -->
                    <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <h3 class="text-sm font-bold text-slate-800 mb-4">Status Sheet & Tabel</h3>
                        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3" id="sheets-status-grid">
                            <div class="flex justify-center py-8 col-span-3"><div class="loader"></div></div>
                        </div>
                    </div>
                </div>

                <!-- TAB: PROFIL -->
                <div id="tab-profil" class="setting-tab-content hidden">
                    <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <div class="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
                            <div class="p-2.5 bg-purple-50 text-purple-600 rounded-xl"><i data-lucide="user-circle" class="w-5 h-5"></i></div>
                            <div>
                                <h3 class="text-base font-bold text-slate-800">Profil Pengguna</h3>
                                <p class="text-xs text-slate-500">Perbarui informasi profil dan keamanan akun Anda</p>
                            </div>
                        </div>

                        <div class="flex items-center gap-4 mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
                            <div class="w-16 h-16 rounded-full bg-brand flex items-center justify-center text-white font-bold text-2xl shrink-0">
                                ${currentUser.nama ? currentUser.nama.charAt(0) : 'A'}
                            </div>
                            <div>
                                <p class="text-base font-bold text-slate-800">${currentUser.nama || 'Admin'}</p>
                                <p class="text-sm text-slate-500">${currentUser.role || 'Administrator'}</p>
                                <p class="text-xs text-brand mt-0.5">${currentUser.email || 'admin@pln.co.id'}</p>
                            </div>
                        </div>

                        <form onsubmit="saveProfil(event)" class="space-y-4">
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap</label>
                                    <input type="text" id="profil-nama" value="${currentUser.nama || ''}" required class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-brand outline-none">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                    <input type="email" id="profil-email" value="${currentUser.email || ''}" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-brand outline-none">
                                </div>
                            </div>
                            <div class="pt-4 border-t border-slate-100">
                                <p class="text-sm font-semibold text-slate-700 mb-3">Ubah Password</p>
                                <div class="grid grid-cols-2 gap-4">
                                    <div>
                                        <label class="block text-sm font-medium text-slate-700 mb-1">Password Baru</label>
                                        <input type="password" id="profil-pw-baru" placeholder="Kosongkan jika tidak diubah" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-brand outline-none">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-slate-700 mb-1">Konfirmasi Password</label>
                                        <input type="password" id="profil-pw-konfirm" placeholder="Ulangi password baru" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-brand outline-none">
                                    </div>
                                </div>
                            </div>
                            <div class="flex justify-end pt-2">
                                <button type="submit" class="px-6 py-2.5 bg-brand text-white rounded-xl text-sm font-semibold hover:bg-sky-700 shadow-sm">Simpan Profil</button>
                            </div>
                        </form>
                    </div>
                </div>

                <!-- TAB: TAMPILAN -->
                <div id="tab-tampilan" class="setting-tab-content hidden">
                    <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <div class="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
                            <div class="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><i data-lucide="palette" class="w-5 h-5"></i></div>
                            <div>
                                <h3 class="text-base font-bold text-slate-800">Preferensi Tampilan</h3>
                                <p class="text-xs text-slate-500">Atur format tampilan dan preferensi antarmuka</p>
                            </div>
                        </div>
                        <div class="space-y-5">
                            <div class="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                                <div>
                                    <p class="text-sm font-semibold text-slate-700">Format Mata Uang</p>
                                    <p class="text-xs text-slate-500 mt-0.5">Format tampilan nominal angka</p>
                                </div>
                                <select id="pref-currency" class="border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none bg-white">
                                    <option value="IDR">Rupiah (Rp)</option>
                                </select>
                            </div>
                            <div class="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                                <div>
                                    <p class="text-sm font-semibold text-slate-700">Nama Unit / Instansi</p>
                                    <p class="text-xs text-slate-500 mt-0.5">Tampil di header dan laporan</p>
                                </div>
                                <input type="text" id="pref-unit" value="${localStorage.getItem('pln_unit_name') || 'PLN ULP Tabanan'}"
                                    class="border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand w-48">
                            </div>
                            <div class="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                                <div>
                                    <p class="text-sm font-semibold text-slate-700">Auto Refresh Dashboard</p>
                                    <p class="text-xs text-slate-500 mt-0.5">Refresh data otomatis setiap interval</p>
                                </div>
                                <select id="pref-refresh" class="border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none bg-white">
                                    <option value="0">Nonaktif</option>
                                    <option value="30">Setiap 30 detik</option>
                                    <option value="60">Setiap 1 menit</option>
                                    <option value="300">Setiap 5 menit</option>
                                </select>
                            </div>
                        </div>
                        <div class="flex justify-end mt-6 pt-4 border-t border-slate-100">
                            <button onclick="saveTampilan()" class="px-6 py-2.5 bg-brand text-white rounded-xl text-sm font-semibold hover:bg-sky-700 shadow-sm">Simpan Preferensi</button>
                        </div>
                    </div>
                </div>

                <!-- TAB: TENTANG -->
                <div id="tab-tentang" class="setting-tab-content hidden">
                    <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <div class="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
                            <div class="p-2.5 bg-sky-50 text-sky-600 rounded-xl"><i data-lucide="info" class="w-5 h-5"></i></div>
                            <div>
                                <h3 class="text-base font-bold text-slate-800">Tentang Aplikasi</h3>
                                <p class="text-xs text-slate-500">Informasi versi dan lisensi</p>
                            </div>
                        </div>
                        <div class="space-y-4 text-sm">
                            <div class="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-900 to-sky-800 rounded-xl text-white">
                                <div class="w-12 h-12 bg-brand rounded-xl flex items-center justify-center shrink-0">
                                    <i data-lucide="zap" class="w-7 h-7"></i>
                                </div>
                                <div>
                                    <p class="font-bold text-lg">RAB & Monitoring PLN</p>
                                    <p class="text-sky-200 text-xs">Sistem Perencanaan & Monitoring Pekerjaan</p>
                                </div>
                            </div>
                            <div class="grid grid-cols-2 gap-3">
                                <div class="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                                    <p class="text-xs text-slate-500 mb-1">Versi Aplikasi</p>
                                    <p class="font-bold text-slate-800">v3.0.0</p>
                                </div>
                                <div class="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                                    <p class="text-xs text-slate-500 mb-1">Tahun Pengembangan</p>
                                    <p class="font-bold text-slate-800">2026</p>
                                </div>
                                <div class="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                                    <p class="text-xs text-slate-500 mb-1">Platform</p>
                                    <p class="font-bold text-slate-800">Web App + Google Sheets</p>
                                </div>
                                <div class="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                                    <p class="text-xs text-slate-500 mb-1">Unit Pengelola</p>
                                    <p class="font-bold text-slate-800">${localStorage.getItem('pln_unit_name') || 'PLN ULP Tabanan'}</p>
                                </div>
                            </div>
                            <div class="bg-amber-50 border border-amber-200 p-4 rounded-xl">
                                <p class="text-xs text-amber-700 leading-relaxed">
                                    Aplikasi ini dikembangkan untuk kebutuhan internal PLN dalam rangka perencanaan dan monitoring pelaksanaan pekerjaan konstruksi jaringan distribusi.
                                    Data tersinkronisasi secara langsung dengan Google Sheets sebagai backend penyimpanan.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    lucide.createIcons();
    checkKoneksiStatus();
    loadSheetsStatusGrid();
}

function showSettingTab(tab) {
    document.querySelectorAll('.setting-tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.setting-tab-btn').forEach(el => {
        el.classList.remove('bg-brand', 'text-white');
        el.classList.add('text-slate-600', 'hover:bg-slate-100');
    });
    const content = document.getElementById('tab-' + tab);
    const btn = document.getElementById('tab-btn-' + tab);
    if (content) content.classList.remove('hidden');
    if (btn) {
        btn.classList.add('bg-brand', 'text-white');
        btn.classList.remove('text-slate-600', 'hover:bg-slate-100');
    }
}

async function checkKoneksiStatus() {
    const box = document.getElementById('koneksi-status-box');
    if (!box) return;
    try {
        const res = await fetchAPI('action=ping');
        if (res !== null) {
            box.className = 'mb-4 p-3.5 rounded-xl border flex items-center gap-3 bg-emerald-50 border-emerald-200';
            box.innerHTML = `<span class="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shrink-0"></span><span class="text-sm text-emerald-700 font-medium">Koneksi aktif — Google Sheets terhubung dengan baik</span>`;
        } else {
            box.className = 'mb-4 p-3.5 rounded-xl border flex items-center gap-3 bg-red-50 border-red-200';
            box.innerHTML = `<span class="w-3 h-3 rounded-full bg-red-500 shrink-0"></span><span class="text-sm text-red-600 font-medium">Koneksi gagal — Periksa URL Apps Script atau deploy ulang</span>`;
        }
    } catch {
        box.className = 'mb-4 p-3.5 rounded-xl border flex items-center gap-3 bg-red-50 border-red-200';
        box.innerHTML = `<span class="w-3 h-3 rounded-full bg-red-500 shrink-0"></span><span class="text-sm text-red-600 font-medium">Koneksi gagal — Tidak dapat terhubung ke server</span>`;
    }
}

async function loadSheetsStatusGrid() {
    const grid = document.getElementById('sheets-status-grid');
    if (!grid) return;
    const tables = ['Pekerjaan', 'Pengadaan', 'Kontrak', 'RAB', 'Realisasi', 'Material', 'Penyedia'];
    const results = await Promise.all(tables.map(t => fetchAPI(`action=list&table=${t}`).then(d => ({ table: t, count: Array.isArray(d) ? d.length : 0, ok: d !== null })).catch(() => ({ table: t, count: 0, ok: false }))));
    grid.innerHTML = results.map(r => `
        <div class="p-3.5 rounded-xl border ${r.ok ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'} text-center">
            <div class="flex items-center justify-center gap-1.5 mb-1">
                <span class="w-2 h-2 rounded-full ${r.ok ? 'bg-emerald-500' : 'bg-red-500'}"></span>
                <span class="text-xs font-bold ${r.ok ? 'text-emerald-700' : 'text-red-600'}">${r.table}</span>
            </div>
            <p class="text-lg font-bold ${r.ok ? 'text-slate-800' : 'text-red-500'}">${r.count}</p>
            <p class="text-[10px] ${r.ok ? 'text-slate-500' : 'text-red-400'}">baris data</p>
        </div>
    `).join('');
}

async function testKoneksi() {
    const urlInput = document.getElementById('setting-api-url');
    const box = document.getElementById('koneksi-status-box');
    if (!urlInput || !box) return;
    box.className = 'mb-4 p-3.5 rounded-xl border flex items-center gap-3 bg-slate-50 border-slate-200';
    box.innerHTML = `<div class="loader w-4 h-4"></div><span class="text-sm text-slate-500">Menguji koneksi ke URL baru...</span>`;
    try {
        const testUrl = urlInput.value.trim() + '?action=ping&_t=' + Date.now();
        const resp = await fetch(testUrl, { method: 'GET', cache: 'no-store' });
        const json = await resp.json();
        if (json.success !== false) {
            box.className = 'mb-4 p-3.5 rounded-xl border flex items-center gap-3 bg-emerald-50 border-emerald-200';
            box.innerHTML = `<span class="w-3 h-3 rounded-full bg-emerald-500 shrink-0"></span><span class="text-sm text-emerald-700 font-medium">Test berhasil! URL valid dan dapat dijangkau.</span>`;
        } else {
            throw new Error('Response gagal');
        }
    } catch {
        box.className = 'mb-4 p-3.5 rounded-xl border flex items-center gap-3 bg-red-50 border-red-200';
        box.innerHTML = `<span class="w-3 h-3 rounded-full bg-red-500 shrink-0"></span><span class="text-sm text-red-600 font-medium">Test gagal — URL tidak valid atau tidak dapat dijangkau.</span>`;
    }
}

function saveSettingKoneksi() {
    const newUrl = document.getElementById('setting-api-url').value.trim();
    const sheetUrl = document.getElementById('setting-sheet-url').value.trim();
    if (newUrl) {
        CONFIG.API_URL = newUrl;
        localStorage.setItem('pln_api_url', newUrl);
    }
    if (sheetUrl) {
        localStorage.setItem('pln_sheet_url', sheetUrl);
        const openBtn = document.getElementById('btn-open-sheet');
        if (openBtn) openBtn.href = sheetUrl;
    }
    showToast('Pengaturan koneksi berhasil disimpan');
    loadSheetsStatusGrid();
}

async function saveProfil(event) {
    event.preventDefault();
    if (!state.currentUser) return;
    const pwBaru = document.getElementById('profil-pw-baru').value;
    const pwKonfirm = document.getElementById('profil-pw-konfirm').value;
    if (pwBaru && pwBaru !== pwKonfirm) return showToast('Konfirmasi password tidak cocok', 'error');

    const users = await getUsers();
    const oldUser = users.find(u => u.id === state.currentUser.id);
    if (!oldUser) return showToast('User tidak ditemukan', 'error');

    const updatedUser = {
        id: state.currentUser.id,
        nama: document.getElementById('profil-nama').value,
        email: document.getElementById('profil-email').value,
        username: oldUser.username,
        role: oldUser.role,
        status: oldUser.status,
        password: pwBaru ? pwBaru : oldUser.password
    };

    const result = await saveUser(updatedUser, true);
    if (result) {
        state.currentUser = { ...updatedUser };
        localStorage.setItem('pln_session', JSON.stringify(state.currentUser));
        sessionStorage.setItem('pln_session', JSON.stringify(state.currentUser));
        updateUserUI();
        showToast('Profil berhasil diperbarui');
        renderPengaturan();
    } else {
        showToast('Gagal menyimpan profil ke Google Sheets', 'error');
    }
}

function saveTampilan() {
    const unitName = document.getElementById('pref-unit')?.value || 'PLN ULP Tabanan';
    localStorage.setItem('pln_unit_name', unitName);
    showToast('Preferensi tampilan tersimpan');
}

async function renderLog() {
    const contentArea = document.getElementById('app-content');
    contentArea.innerHTML = `
        <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-100 mb-6">
            <div class="flex justify-between items-center mb-6">
                <div>
                    <h2 class="text-lg font-semibold text-slate-800">Log Aktivitas Sistem</h2>
                    <p class="text-sm text-slate-500">Riwayat perubahan data oleh pengguna.</p>
                </div>
                <button class="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 flex items-center gap-2">
                    <i data-lucide="download" class="w-4 h-4"></i> Export CSV
                </button>
            </div>
            
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse text-sm">
                    <thead class="bg-slate-100">
                        <tr>
                            <th class="p-3 w-12 text-center">No</th>
                            <th class="p-3">Waktu</th>
                            <th class="p-3">Pengguna</th>
                            <th class="p-3">Aktivitas</th>
                            <th class="p-3">Modul</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100 text-slate-600">
                        <tr class="hover:bg-slate-50">
                            <td class="p-3 text-center">1</td>
                            <td class="p-3 text-xs">20 Sep 2026 14:30</td>
                            <td class="p-3 font-medium text-slate-800"><span class="flex items-center gap-2"><div class="w-6 h-6 rounded-full bg-brand text-white flex items-center justify-center text-[10px]">A</div> Admin Utama</span></td>
                            <td class="p-3">Menambahkan RAB baru untuk paket <span class="font-semibold text-brand">RAB-2026-001</span></td>
                            <td class="p-3"><span class="bg-slate-100 px-2 py-0.5 rounded text-xs">RAB</span></td>
                        </tr>
                        <tr class="hover:bg-slate-50">
                            <td class="p-3 text-center">2</td>
                            <td class="p-3 text-xs">20 Sep 2026 13:15</td>
                            <td class="p-3 font-medium text-slate-800"><span class="flex items-center gap-2"><div class="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px]">T</div> Tim Perencanaan</span></td>
                            <td class="p-3">Mengubah status pekerjaan menjadi <span class="font-semibold text-emerald-600">Selesai</span></td>
                            <td class="p-3"><span class="bg-slate-100 px-2 py-0.5 rounded text-xs">Pekerjaan</span></td>
                        </tr>
                        <tr class="hover:bg-slate-50">
                            <td class="p-3 text-center">3</td>
                            <td class="p-3 text-xs">19 Sep 2026 09:45</td>
                            <td class="p-3 font-medium text-slate-800"><span class="flex items-center gap-2"><div class="w-6 h-6 rounded-full bg-brand text-white flex items-center justify-center text-[10px]">A</div> Admin Utama</span></td>
                            <td class="p-3">Menghapus data Penyedia <span class="text-rose-500 line-through">PT. Maju Mundur</span></td>
                            <td class="p-3"><span class="bg-slate-100 px-2 py-0.5 rounded text-xs">Penyedia</span></td>
                        </tr>
                        <tr class="hover:bg-slate-50">
                            <td class="p-3 text-center">4</td>
                            <td class="p-3 text-xs">19 Sep 2026 08:20</td>
                            <td class="p-3 font-medium text-slate-800"><span class="flex items-center gap-2"><div class="w-6 h-6 rounded-full bg-brand text-white flex items-center justify-center text-[10px]">A</div> Admin Utama</span></td>
                            <td class="p-3">Login ke dalam sistem</td>
                            <td class="p-3"><span class="bg-slate-100 px-2 py-0.5 rounded text-xs">Auth</span></td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <div class="mt-4 flex justify-center">
                <button class="text-sm font-medium text-brand hover:underline">Muat lebih banyak...</button>
            </div>
        </div>
    `;
    lucide.createIcons();
}

// ==========================================
// REKAP RAB MODULE
// ==========================================

async function renderRekap() {
    const contentArea = document.getElementById('app-content');
    
    // Fetch data yang diperlukan
    const [pekerjaanListData, rabListData] = await Promise.all([
        fetchAPI('action=list&table=Pekerjaan'),
        fetchAPI('action=list&table=RAB')
    ]);

    const allPekerjaan = pekerjaanListData || [];
    const allRAB = rabListData || [];

    // Kelompokkan RAB per pekerjaan
    const rabByPekerjaan = {};
    allRAB.forEach(r => {
        const pid = String(r.pekerjaan_id);
        if (!rabByPekerjaan[pid]) rabByPekerjaan[pid] = [];
        rabByPekerjaan[pid].push(r);
    });

    // Bangun data per pekerjaan dengan total JTM & JTR
    const pekerjaanWithRAB = allPekerjaan.map(p => {
        const rabItems = rabByPekerjaan[String(p.id)] || [];
        const jtmItems = rabItems.filter(item => {
            const kat = (item.kategori || '').toLowerCase();
            return kat.includes('jtm') || kat.includes('tegangan menengah');
        });
        const jtrItems = rabItems.filter(item => {
            const kat = (item.kategori || '').toLowerCase();
            return kat.includes('jtr') || kat.includes('tegangan rendah');
        });
        const calcTotal = (items) => items.reduce((t, i) => {
            const v = parseFloat(i.volume) || 0;
            const m = parseFloat(i.harga_material) || 0;
            const j = parseFloat(i.harga_jasa) || 0;
            return t + v * (m + j);
        }, 0);
        return {
            ...p,
            rabItems,
            jtmItems,
            jtrItems,
            totalJTM: calcTotal(jtmItems),
            totalJTR: calcTotal(jtrItems),
            totalRAB: calcTotal(rabItems),
            hasJTM: jtmItems.length > 0,
            hasJTR: jtrItems.length > 0
        };
    }).filter(p => p.rabItems.length > 0); // Hanya tampilkan yang ada RAB-nya

    // Hitung grand totals
    let grandTotalJTM = 0, grandTotalJTR = 0, grandTotalAll = 0;
    pekerjaanWithRAB.forEach(p => {
        grandTotalJTM += p.totalJTM;
        grandTotalJTR += p.totalJTR;
        grandTotalAll += p.totalRAB;
    });

    const countJTM = pekerjaanWithRAB.filter(p => p.hasJTM).length;
    const countJTR = pekerjaanWithRAB.filter(p => p.hasJTR).length;

    const fmtCur = (v) => CONFIG.formatCurrency(v);

    // Build HTML
    contentArea.innerHTML = `
        <div class="mb-6">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h2 class="text-xl font-bold text-slate-800">Rekap RAB — Semua Pekerjaan</h2>
                    <p class="text-sm text-slate-500">Rekapitulasi Rencana Anggaran Biaya dikelompokkan berdasarkan kategori jaringan (JTM / JTR)</p>
                </div>
                <button onclick="exportRekapPDF()" class="bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition flex items-center gap-2 shadow-sm">
                    <i data-lucide="download" class="w-4 h-4"></i> Export PDF
                </button>
            </div>

            <!-- KPI Cards -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center"><i data-lucide="briefcase" class="w-5 h-5 text-blue-600"></i></div>
                        <div>
                            <p class="text-xs text-slate-500 font-medium">Total Pekerjaan</p>
                            <p class="text-xl font-bold text-slate-800">${pekerjaanWithRAB.length}</p>
                        </div>
                    </div>
                </div>
                <div class="bg-white rounded-xl border border-purple-200 shadow-sm p-5">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center"><i data-lucide="zap" class="w-5 h-5 text-purple-600"></i></div>
                        <div>
                            <p class="text-xs text-slate-500 font-medium">Total JTM</p>
                            <p class="text-lg font-bold text-purple-700">${fmtCur(grandTotalJTM)}</p>
                            <p class="text-[10px] text-slate-400">${countJTM} pekerjaan</p>
                        </div>
                    </div>
                </div>
                <div class="bg-white rounded-xl border border-orange-200 shadow-sm p-5">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center"><i data-lucide="home" class="w-5 h-5 text-orange-600"></i></div>
                        <div>
                            <p class="text-xs text-slate-500 font-medium">Total JTR</p>
                            <p class="text-lg font-bold text-orange-700">${fmtCur(grandTotalJTR)}</p>
                            <p class="text-[10px] text-slate-400">${countJTR} pekerjaan</p>
                        </div>
                    </div>
                </div>
                <div class="bg-white rounded-xl border border-emerald-200 shadow-sm p-5">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center"><i data-lucide="wallet" class="w-5 h-5 text-emerald-600"></i></div>
                        <div>
                            <p class="text-xs text-slate-500 font-medium">Grand Total RAB</p>
                            <p class="text-lg font-bold text-emerald-700">${fmtCur(grandTotalAll)}</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Tab Navigation -->
            <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div class="flex border-b border-slate-200 bg-slate-50">
                    <button onclick="switchRekapTab('semua')" id="tab-semua" class="rekap-tab-btn flex-1 px-4 py-3 text-sm font-semibold text-center transition-colors border-b-2 border-brand text-brand bg-white">
                        <i data-lucide="layers" class="w-4 h-4 inline-block mr-1"></i> Semua Pekerjaan (${pekerjaanWithRAB.length})
                    </button>
                    <button onclick="switchRekapTab('jtm')" id="tab-jtm" class="rekap-tab-btn flex-1 px-4 py-3 text-sm font-semibold text-center transition-colors border-b-2 border-transparent text-slate-500 hover:text-purple-700 hover:bg-purple-50/50">
                        <i data-lucide="zap" class="w-4 h-4 inline-block mr-1"></i> JTM (${countJTM})
                    </button>
                    <button onclick="switchRekapTab('jtr')" id="tab-jtr" class="rekap-tab-btn flex-1 px-4 py-3 text-sm font-semibold text-center transition-colors border-b-2 border-transparent text-slate-500 hover:text-orange-700 hover:bg-orange-50/50">
                        <i data-lucide="home" class="w-4 h-4 inline-block mr-1"></i> JTR (${countJTR})
                    </button>
                </div>

                <!-- Tab Content: SEMUA -->
                <div id="tab-content-semua" class="rekap-tab-content p-4 space-y-4">
                    ${pekerjaanWithRAB.length === 0 ? '<div class="text-center py-12 text-slate-400 italic">Belum ada data RAB untuk ditampilkan</div>' :
                    pekerjaanWithRAB.map((p, idx) => buildRekapPekerjaanCard(p, idx, 'semua')).join('')}
                    
                    ${pekerjaanWithRAB.length > 0 ? `
                    <!-- Grand Total Semua -->
                    <div class="bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl p-6 text-white mt-6">
                        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                            <div class="md:col-span-2">
                                <h4 class="text-lg font-bold">GRAND TOTAL SEMUA PEKERJAAN</h4>
                                <p class="text-slate-300 text-xs mt-1">Terbilang: <em>${numberToWords(Math.round(grandTotalAll))} Rupiah</em></p>
                            </div>
                            <div class="text-center">
                                <p class="text-xs text-slate-400">JTM + JTR</p>
                                <p class="text-sm">${fmtCur(grandTotalJTM)} + ${fmtCur(grandTotalJTR)}</p>
                            </div>
                            <div class="text-right">
                                <p class="text-xs text-slate-400">Grand Total</p>
                                <p class="text-2xl font-bold text-emerald-400">${fmtCur(grandTotalAll)}</p>
                            </div>
                        </div>
                    </div>
                    ` : ''}
                </div>

                <!-- Tab Content: JTM -->
                <div id="tab-content-jtm" class="rekap-tab-content p-4 space-y-4 hidden">
                    ${countJTM === 0 ? '<div class="text-center py-12 text-slate-400 italic">Tidak ada pekerjaan dengan item JTM</div>' :
                    pekerjaanWithRAB.filter(p => p.hasJTM).map((p, idx) => buildRekapPekerjaanCard(p, idx, 'jtm')).join('')}
                    
                    ${countJTM > 0 ? `
                    <div class="bg-gradient-to-r from-purple-700 to-purple-600 rounded-xl p-6 text-white mt-6">
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                            <div class="md:col-span-2">
                                <h4 class="text-lg font-bold flex items-center gap-2"><i data-lucide="zap" class="w-5 h-5"></i> TOTAL SEMUA JTM</h4>
                                <p class="text-purple-200 text-xs mt-1">Terbilang: <em>${numberToWords(Math.round(grandTotalJTM))} Rupiah</em></p>
                            </div>
                            <div class="text-right">
                                <p class="text-xs text-purple-200">${countJTM} Pekerjaan</p>
                                <p class="text-2xl font-bold text-white">${fmtCur(grandTotalJTM)}</p>
                            </div>
                        </div>
                    </div>
                    ` : ''}
                </div>

                <!-- Tab Content: JTR -->
                <div id="tab-content-jtr" class="rekap-tab-content p-4 space-y-4 hidden">
                    ${countJTR === 0 ? '<div class="text-center py-12 text-slate-400 italic">Tidak ada pekerjaan dengan item JTR</div>' :
                    pekerjaanWithRAB.filter(p => p.hasJTR).map((p, idx) => buildRekapPekerjaanCard(p, idx, 'jtr')).join('')}
                    
                    ${countJTR > 0 ? `
                    <div class="bg-gradient-to-r from-orange-600 to-orange-500 rounded-xl p-6 text-white mt-6">
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                            <div class="md:col-span-2">
                                <h4 class="text-lg font-bold flex items-center gap-2"><i data-lucide="home" class="w-5 h-5"></i> TOTAL SEMUA JTR</h4>
                                <p class="text-orange-200 text-xs mt-1">Terbilang: <em>${numberToWords(Math.round(grandTotalJTR))} Rupiah</em></p>
                            </div>
                            <div class="text-right">
                                <p class="text-xs text-orange-200">${countJTR} Pekerjaan</p>
                                <p class="text-2xl font-bold text-white">${fmtCur(grandTotalJTR)}</p>
                            </div>
                        </div>
                    </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
    
    lucide.createIcons();
}

// Build card HTML untuk satu pekerjaan dalam rekap
function buildRekapPekerjaanCard(p, idx, tabType) {
    const fmtCur = (v) => CONFIG.formatCurrency(v);
    const cardId = `rekap-card-${tabType}-${idx}`;
    const tableId = `rekap-table-${tabType}-${idx}`;
    
    // Pilih items berdasarkan tab
    let items, totalValue, colorScheme;
    if (tabType === 'jtm') {
        items = p.jtmItems;
        totalValue = p.totalJTM;
        colorScheme = { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-700', header: 'bg-purple-600' };
    } else if (tabType === 'jtr') {
        items = p.jtrItems;
        totalValue = p.totalJTR;
        colorScheme = { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-700', header: 'bg-orange-600' };
    } else {
        items = p.rabItems;
        totalValue = p.totalRAB;
        colorScheme = { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700', header: 'bg-blue-600' };
    }

    if (items.length === 0) return '';

    // Build rows
    let rowsHtml = '';
    let runningTotal = 0;
    items.forEach((item, i) => {
        const volume = parseFloat(item.volume) || 0;
        const hargaMaterial = parseFloat(item.harga_material) || 0;
        const hargaJasa = parseFloat(item.harga_jasa) || 0;
        const totalHarga = volume * (hargaMaterial + hargaJasa);
        runningTotal += totalHarga;
        const katBadge = (item.kategori || '').toUpperCase() === 'JTM' 
            ? 'bg-purple-100 text-purple-700' 
            : ((item.kategori || '').toUpperCase() === 'JTR' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600');

        rowsHtml += `
            <tr class="hover:bg-slate-50 transition-colors">
                <td class="p-2.5 text-center text-slate-500 border-r border-slate-100 text-xs">${i + 1}</td>
                ${tabType === 'semua' ? `<td class="p-2.5 text-center border-r border-slate-100"><span class="px-1.5 py-0.5 rounded text-[10px] font-bold ${katBadge}">${item.kategori || '-'}</span></td>` : ''}
                <td class="p-2.5 border-r border-slate-100 text-xs">
                    <div class="font-medium text-slate-800">${item.uraian || '-'}</div>
                </td>
                <td class="p-2.5 text-center border-r border-slate-100 text-xs font-medium">${volume}</td>
                <td class="p-2.5 text-center border-r border-slate-100 text-xs text-slate-600">${item.satuan || '-'}</td>
                <td class="p-2.5 text-right border-r border-slate-100 text-xs font-mono">${fmtCur(hargaMaterial)}</td>
                <td class="p-2.5 text-right border-r border-slate-100 text-xs font-mono">${fmtCur(hargaJasa)}</td>
                <td class="p-2.5 text-right font-bold text-slate-900 text-xs font-mono">${fmtCur(totalHarga)}</td>
            </tr>
        `;
    });

    // Jumlah row
    const colSpan = tabType === 'semua' ? 7 : 6;
    rowsHtml += `
        <tr class="bg-slate-100 font-bold border-t-2 border-slate-300">
            <td class="p-2.5 text-center border-r border-slate-200 text-xs" colspan="${colSpan}">SUB TOTAL</td>
            <td class="p-2.5 text-right text-slate-900 font-mono text-xs">${fmtCur(runningTotal)}</td>
        </tr>
    `;

    // Kategori header untuk tab Semua
    const kategoriInfo = tabType === 'semua' ? `
        <div class="flex gap-2 ml-auto">
            ${p.hasJTM ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700">JTM: ${fmtCur(p.totalJTM)}</span>` : ''}
            ${p.hasJTR ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-700">JTR: ${fmtCur(p.totalJTR)}</span>` : ''}
        </div>
    ` : '';

    return `
        <div id="${cardId}" class="border ${colorScheme.border} rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <!-- Header Pekerjaan (collapsible) -->
            <button onclick="toggleRekapCard('${tableId}')" class="w-full flex items-center gap-3 p-4 ${colorScheme.bg} hover:brightness-95 transition text-left">
                <div class="w-8 h-8 rounded-lg ${colorScheme.header} text-white flex items-center justify-center font-bold text-sm flex-shrink-0">${idx + 1}</div>
                <div class="flex-1 min-w-0">
                    <h4 class="text-sm font-bold text-slate-800 truncate">${p.nama_pekerjaan || '-'}</h4>
                    <div class="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-[11px] text-slate-500">
                        <span><b>No. Paket:</b> ${p.nomor_paket || '-'}</span>
                        <span><b>Lokasi:</b> ${p.lokasi || '-'}</span>
                        <span><b>Jenis:</b> ${p.jenis_kegiatan || '-'}</span>
                        <span><b>Item RAB:</b> ${items.length}</span>
                    </div>
                </div>
                ${kategoriInfo}
                <div class="flex items-center gap-2 flex-shrink-0">
                    <span class="text-sm font-bold ${colorScheme.text}">${fmtCur(totalValue)}</span>
                    <i data-lucide="chevron-down" class="w-4 h-4 text-slate-400 transition-transform rekap-chevron" id="chevron-${tableId}"></i>
                </div>
            </button>
            <!-- Detail Table (hidden by default) -->
            <div id="${tableId}" class="hidden">
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead class="bg-slate-100">
                            <tr>
                                <th class="p-2.5 w-10 text-center border-r border-slate-200 text-xs font-semibold">NO</th>
                                ${tabType === 'semua' ? '<th class="p-2.5 w-20 text-center border-r border-slate-200 text-xs font-semibold">KAT</th>' : ''}
                                <th class="p-2.5 border-r border-slate-200 text-xs font-semibold">URAIAN</th>
                                <th class="p-2.5 w-14 text-center border-r border-slate-200 text-xs font-semibold">VOL</th>
                                <th class="p-2.5 w-14 text-center border-r border-slate-200 text-xs font-semibold">SAT</th>
                                <th class="p-2.5 w-24 text-right border-r border-slate-200 text-xs font-semibold">H. MATERIAL</th>
                                <th class="p-2.5 w-24 text-right border-r border-slate-200 text-xs font-semibold">H. JASA</th>
                                <th class="p-2.5 w-28 text-right text-xs font-semibold">TOTAL (Rp)</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                            ${rowsHtml}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

// Toggle expand/collapse card di rekap
function toggleRekapCard(tableId) {
    const el = document.getElementById(tableId);
    const chevron = document.getElementById('chevron-' + tableId);
    if (!el) return;
    el.classList.toggle('hidden');
    if (chevron) {
        chevron.style.transform = el.classList.contains('hidden') ? '' : 'rotate(180deg)';
    }
}

// Switch tab di rekap
function switchRekapTab(tab) {
    // Hide all contents
    document.querySelectorAll('.rekap-tab-content').forEach(el => el.classList.add('hidden'));
    // Deactivate all buttons
    document.querySelectorAll('.rekap-tab-btn').forEach(btn => {
        btn.classList.remove('border-brand', 'text-brand', 'bg-white', 'border-purple-600', 'text-purple-700', 'border-orange-600', 'text-orange-700');
        btn.classList.add('border-transparent', 'text-slate-500');
    });

    // Show selected
    const contentEl = document.getElementById('tab-content-' + tab);
    if (contentEl) contentEl.classList.remove('hidden');

    const tabBtn = document.getElementById('tab-' + tab);
    if (tabBtn) {
        tabBtn.classList.remove('border-transparent', 'text-slate-500');
        if (tab === 'jtm') {
            tabBtn.classList.add('border-purple-600', 'text-purple-700', 'bg-white');
        } else if (tab === 'jtr') {
            tabBtn.classList.add('border-orange-600', 'text-orange-700', 'bg-white');
        } else {
            tabBtn.classList.add('border-brand', 'text-brand', 'bg-white');
        }
    }
}

// Legacy function - still needed for backward compat
async function handleSelectPekerjaanRekap(id) {
    // No longer used in the new grouped view, kept for compatibility
}

function renderRekapTable(bodyId, items) {
    const tbody = document.getElementById(bodyId);
    if (!tbody) return;

    if (items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="p-8 text-center text-slate-400 italic">Belum ada data RAB untuk kategori ini</td></tr>';
        return;
    }

    let html = '';
    let categoryTotal = 0;

    items.forEach((item, index) => {
        const volume = parseFloat(item.volume) || 0;
        const hargaMaterial = parseFloat(item.harga_material) || 0;
        const hargaJasa = parseFloat(item.harga_jasa) || 0;
        const totalHarga = volume * (hargaMaterial + hargaJasa);
        categoryTotal += totalHarga;

        html += `
            <tr class="hover:bg-slate-50">
                <td class="p-3 text-center text-slate-500 border-r border-slate-100">${index + 1}</td>
                <td class="p-3 border-r border-slate-100">
                    <div class="font-medium text-slate-800">${item.uraian || '-'}</div>
                    ${item.kategori ? `<div class="text-[10px] text-slate-500 mt-0.5">${item.kategori}</div>` : ''}
                </td>
                <td class="p-3 text-center border-r border-slate-100 font-medium">${volume}</td>
                <td class="p-3 text-center border-r border-slate-100 text-slate-600">${item.satuan || '-'}</td>
                <td class="p-3 text-right border-r border-slate-100 text-xs font-mono">${CONFIG.formatCurrency(hargaMaterial)}</td>
                <td class="p-3 text-right border-r border-slate-100 text-xs font-mono">${CONFIG.formatCurrency(hargaJasa)}</td>
                <td class="p-3 text-right font-bold text-slate-900 font-mono">${CONFIG.formatCurrency(totalHarga)}</td>
            </tr>
        `;
    });

    // Add total row
    html += `
        <tr class="bg-slate-100 font-bold border-t-2 border-slate-300">
            <td class="p-3 text-center border-r border-slate-200" colspan="6">JUMLAH</td>
            <td class="p-3 text-right text-slate-900 font-mono">${CONFIG.formatCurrency(categoryTotal)}</td>
        </tr>
    `;

    tbody.innerHTML = html;
}

function calculateCategoryTotal(items) {
    return items.reduce((total, item) => {
        const volume = parseFloat(item.volume) || 0;
        const hargaMaterial = parseFloat(item.harga_material) || 0;
        const hargaJasa = parseFloat(item.harga_jasa) || 0;
        return total + (volume * (hargaMaterial + hargaJasa));
    }, 0);
}

function numberToWords(number) {
    if (number === 0) return 'Nol';
    
    const units = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan'];
    const teens = ['Sepuluh', 'Sebelas', 'Dua Belas', 'Tiga Belas', 'Empat Belas', 'Lima Belas', 'Enam Belas', 'Tujuh Belas', 'Delapan Belas', 'Sembilan Belas'];
    const tens = ['', '', 'Dua Puluh', 'Tiga Puluh', 'Empat Puluh', 'Lima Puluh', 'Enam Puluh', 'Tujuh Puluh', 'Delapan Puluh', 'Sembilan Puluh'];
    const scales = ['', 'Ribu', 'Juta', 'Miliar', 'Triliun'];

    function convertHundreds(num) {
        let result = '';
        
        if (num >= 100) {
            if (Math.floor(num / 100) === 1) {
                result += 'Seratus ';
            } else {
                result += units[Math.floor(num / 100)] + ' Ratus ';
            }
            num %= 100;
        }
        
        if (num >= 20) {
            result += tens[Math.floor(num / 10)] + ' ';
            num %= 10;
        } else if (num >= 10) {
            result += teens[num - 10] + ' ';
            num = 0;
        }
        
        if (num > 0) {
            result += units[num] + ' ';
        }
        
        return result.trim();
    }

    let result = '';
    let scaleIndex = 0;
    
    while (number > 0) {
        let chunk = number % 1000;
        if (chunk !== 0) {
            let chunkWords = convertHundreds(chunk);
            if (scaleIndex === 1 && chunk === 1) {
                chunkWords = 'Se';
            }
            if (scaleIndex > 0) {
                chunkWords += ' ' + scales[scaleIndex];
            }
            result = chunkWords + ' ' + result;
        }
        number = Math.floor(number / 1000);
        scaleIndex++;
    }
    
    return result.trim();
}

function exportRekapPDF() {
    showToast('Fitur export PDF akan segera tersedia', 'info');
}