// ==========================================
// js/modules/pengaturan.js
// Modul Pengaturan Sistem
// ==========================================

function renderPengaturan() {
    const contentArea = document.getElementById('app-content');
    if (!contentArea) return;

    const apiUrl      = CONFIG.API_URL || '';
    const currentUser = state.currentUser || {};

    contentArea.innerHTML = `
        <div class="mb-6">
            <h2 class="text-xl font-bold text-slate-800">Pengaturan Sistem</h2>
            <p class="text-sm text-slate-500">Konfigurasi koneksi Google Sheets, profil pengguna, dan preferensi aplikasi.</p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- NAV KIRI -->
            <div class="lg:col-span-1">
                <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div class="p-4 bg-slate-50 border-b border-slate-200">
                        <p class="text-xs font-bold text-slate-500 uppercase tracking-wider">Menu Pengaturan</p>
                    </div>
                    <nav class="p-2 space-y-1">
                        <button onclick="showSettingTab('koneksi')" id="tab-btn-koneksi"
                            class="setting-tab-btn w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium flex items-center gap-3 bg-brand text-white transition-colors">
                            <i data-lucide="link" class="w-4 h-4"></i> Koneksi Google Sheets
                        </button>
                        <button onclick="showSettingTab('profil')" id="tab-btn-profil"
                            class="setting-tab-btn w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium flex items-center gap-3 text-slate-600 hover:bg-slate-100 transition-colors">
                            <i data-lucide="user-circle" class="w-4 h-4"></i> Profil & Password
                        </button>
                        <button onclick="showSettingTab('tampilan')" id="tab-btn-tampilan"
                            class="setting-tab-btn w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium flex items-center gap-3 text-slate-600 hover:bg-slate-100 transition-colors">
                            <i data-lucide="palette" class="w-4 h-4"></i> Tampilan Aplikasi
                        </button>
                        <button onclick="showSettingTab('tentang')" id="tab-btn-tentang"
                            class="setting-tab-btn w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium flex items-center gap-3 text-slate-600 hover:bg-slate-100 transition-colors">
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

            <!-- KONTEN KANAN -->
            <div class="lg:col-span-2 space-y-4" id="setting-content">

                <!-- TAB KONEKSI -->
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
                                        class="flex-1 border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:border-brand outline-none font-mono text-xs">
                                    <button onclick="testKoneksi()" class="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-sm font-medium transition whitespace-nowrap">Test</button>
                                </div>
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-slate-700 mb-1.5">URL Google Spreadsheet (Opsional)</label>
                                <div class="flex gap-2">
                                    <input type="url" id="setting-sheet-url" value="${localStorage.getItem('pln_sheet_url') || ''}"
                                        placeholder="https://docs.google.com/spreadsheets/d/..."
                                        class="flex-1 border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:border-brand outline-none font-mono text-xs">
                                    <a id="btn-open-sheet" href="${localStorage.getItem('pln_sheet_url') || '#'}" target="_blank"
                                        class="px-3 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg text-sm font-medium transition whitespace-nowrap flex items-center gap-1">
                                        <i data-lucide="external-link" class="w-4 h-4"></i> Buka
                                    </a>
                                </div>
                            </div>
                        </div>
                        <div id="sheets-status-grid" class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-100">
                            <div class="p-3 bg-slate-50 rounded-lg text-center text-xs text-slate-400">Memuat...</div>
                        </div>
                        <div class="mt-4">
                            <button onclick="saveSettingKoneksi()" class="px-6 py-2.5 bg-brand text-white rounded-xl text-sm font-semibold hover:bg-sky-700 shadow-sm">Simpan Pengaturan</button>
                        </div>
                    </div>
                </div>

                <!-- TAB PROFIL -->
                <div id="tab-profil" class="setting-tab-content hidden">
                    <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <div class="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
                            <div class="p-2.5 bg-purple-50 text-purple-600 rounded-xl"><i data-lucide="user-circle" class="w-5 h-5"></i></div>
                            <div>
                                <h3 class="text-base font-bold text-slate-800">Profil & Keamanan</h3>
                                <p class="text-xs text-slate-500">Perbarui informasi profil dan password akun Anda</p>
                            </div>
                        </div>
                        <form onsubmit="saveProfil(event)" class="space-y-4">
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap</label>
                                    <input type="text" id="profil-nama" value="${currentUser.nama || ''}"
                                        class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-brand outline-none">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                    <input type="email" id="profil-email" value="${currentUser.email || ''}"
                                        class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-brand outline-none">
                                </div>
                            </div>
                            <div class="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                                <div>
                                    <label class="block text-sm font-medium text-slate-700 mb-1">Password Baru</label>
                                    <input type="password" id="profil-pw-baru" placeholder="Kosongkan jika tidak diubah"
                                        class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-brand outline-none">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-slate-700 mb-1">Konfirmasi Password</label>
                                    <input type="password" id="profil-pw-konfirm" placeholder="Ulangi password baru"
                                        class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-brand outline-none">
                                </div>
                            </div>
                            <div class="flex justify-end pt-2">
                                <button type="submit" class="px-6 py-2.5 bg-brand text-white rounded-xl text-sm font-semibold hover:bg-sky-700 shadow-sm">Simpan Profil</button>
                            </div>
                        </form>
                    </div>
                </div>

                <!-- TAB TAMPILAN -->
                <div id="tab-tampilan" class="setting-tab-content hidden">
                    <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <div class="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
                            <div class="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><i data-lucide="palette" class="w-5 h-5"></i></div>
                            <h3 class="text-base font-bold text-slate-800">Preferensi Tampilan</h3>
                        </div>
                        <div class="space-y-5">
                            <div class="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                                <div>
                                    <p class="text-sm font-semibold text-slate-700">Nama Unit / Instansi</p>
                                    <p class="text-xs text-slate-500 mt-0.5">Tampil di header dan laporan</p>
                                </div>
                                <input type="text" id="pref-unit" value="${localStorage.getItem('pln_unit_name') || 'PLN ULP Tabanan'}"
                                    class="border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand w-48">
                            </div>
                        </div>
                        <div class="flex justify-end mt-6 pt-4 border-t border-slate-100">
                            <button onclick="saveTampilan()" class="px-6 py-2.5 bg-brand text-white rounded-xl text-sm font-semibold hover:bg-sky-700 shadow-sm">Simpan Preferensi</button>
                        </div>
                    </div>
                </div>

                <!-- TAB TENTANG -->
                <div id="tab-tentang" class="setting-tab-content hidden">
                    <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <div class="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
                            <div class="p-2.5 bg-sky-50 text-sky-600 rounded-xl"><i data-lucide="info" class="w-5 h-5"></i></div>
                            <h3 class="text-base font-bold text-slate-800">Tentang Aplikasi</h3>
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
                                    <p class="text-xs text-slate-500 mb-1">Platform</p>
                                    <p class="font-bold text-slate-800">Web App + Google Sheets</p>
                                </div>
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
    const btn     = document.getElementById('tab-btn-' + tab);
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
            box.innerHTML = `<span class="w-3 h-3 rounded-full bg-red-500 shrink-0"></span><span class="text-sm text-red-600 font-medium">Koneksi gagal — Periksa URL Apps Script</span>`;
        }
    } catch {
        box.className = 'mb-4 p-3.5 rounded-xl border flex items-center gap-3 bg-red-50 border-red-200';
        box.innerHTML = `<span class="w-3 h-3 rounded-full bg-red-500 shrink-0"></span><span class="text-sm text-red-600 font-medium">Koneksi gagal — Tidak dapat terhubung ke server</span>`;
    }
}

async function loadSheetsStatusGrid() {
    const grid = document.getElementById('sheets-status-grid');
    if (!grid) return;
    const tables  = ['Pekerjaan', 'Pengadaan', 'Kontrak', 'RAB', 'Realisasi', 'Material', 'Penyedia'];
    const results = await Promise.all(tables.map(t =>
        fetchAPI(`action=list&table=${t}`)
            .then(d => ({ table: t, count: Array.isArray(d) ? d.length : 0, ok: d !== null }))
            .catch(() => ({ table: t, count: 0, ok: false }))
    ));
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
    const box      = document.getElementById('koneksi-status-box');
    if (!urlInput || !box) return;
    box.className  = 'mb-4 p-3.5 rounded-xl border flex items-center gap-3 bg-slate-50 border-slate-200';
    box.innerHTML  = `<div class="loader w-4 h-4"></div><span class="text-sm text-slate-500">Menguji koneksi ke URL baru...</span>`;
    try {
        const testUrl = urlInput.value.trim() + '?action=ping&_t=' + Date.now();
        const resp    = await fetch(testUrl, { method: 'GET', cache: 'no-store' });
        const json    = await resp.json();
        if (json.success !== false) {
            box.className = 'mb-4 p-3.5 rounded-xl border flex items-center gap-3 bg-emerald-50 border-emerald-200';
            box.innerHTML = `<span class="w-3 h-3 rounded-full bg-emerald-500 shrink-0"></span><span class="text-sm text-emerald-700 font-medium">Test berhasil! URL valid dan dapat dijangkau.</span>`;
        } else { throw new Error('Response gagal'); }
    } catch {
        box.className = 'mb-4 p-3.5 rounded-xl border flex items-center gap-3 bg-red-50 border-red-200';
        box.innerHTML = `<span class="w-3 h-3 rounded-full bg-red-500 shrink-0"></span><span class="text-sm text-red-600 font-medium">Test gagal — URL tidak valid atau tidak dapat dijangkau.</span>`;
    }
}

function saveSettingKoneksi() {
    const newUrl    = document.getElementById('setting-api-url').value.trim();
    const sheetUrl  = document.getElementById('setting-sheet-url').value.trim();
    if (newUrl) { CONFIG.API_URL = newUrl; localStorage.setItem('pln_api_url', newUrl); }
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
    const pwBaru   = document.getElementById('profil-pw-baru').value;
    const pwKonfirm= document.getElementById('profil-pw-konfirm').value;
    if (pwBaru && pwBaru !== pwKonfirm) return showToast('Konfirmasi password tidak cocok', 'error');

    const users   = await getUsers();
    const oldUser = users.find(u => u.id === state.currentUser.id);
    if (!oldUser) return showToast('User tidak ditemukan', 'error');

    const updatedUser = {
        id:       state.currentUser.id,
        nama:     document.getElementById('profil-nama').value,
        email:    document.getElementById('profil-email').value,
        username: oldUser.username,
        role:     oldUser.role,
        status:   oldUser.status,
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
