// ==========================================
// js/modules/program.js
// Modul Jenis Program (SAR/DAL/EFI) per PRK
// Hierarki: PRK → Jenis Program → Pengadaan → Komponen → Material
// ==========================================

// State breadcrumb navigasi hierarki
window._selectedPRK      = null; // { id, no_prk, nama }
window._selectedProgram  = null; // { id, id_prk, kode_jenis, nama }
window._selectedPengadaanH = null; // { id, id_jenis, jenis_konstruksi }
window._selectedKomponen = null; // { id, id_pengadaan, nama_komponen }

// ==========================================
// LEVEL 2: JENIS PROGRAM (SAR / DAL / EFI)
// ==========================================

window.renderProgram = async function renderProgram() {
    const prk = window._selectedPRK;
    if (!prk) { navigate('prk'); return; }

    const contentArea = document.getElementById('app-content');
    contentArea.innerHTML = '<div class="flex justify-center py-24"><div class="loader"></div></div>';

    const allProgram = await fetchWithCache('jenis_program') || [];
    const programList = allProgram.filter(p => String(p.id_prk) === String(prk.id));

    const kodeMap = {
        'SAR': { label: 'SAR – Pemasaran', color: 'bg-blue-100 text-blue-700', icon: 'trending-up' },
        'DAL': { label: 'DAL – Andalan',   color: 'bg-purple-100 text-purple-700', icon: 'shield-check' },
        'EFI': { label: 'EFI – Efisiensi', color: 'bg-amber-100 text-amber-700',  icon: 'zap' }
    };

    contentArea.innerHTML = `
        <!-- BREADCRUMB -->
        ${_buildBreadcrumb([
            { label: 'PRK', onclick: "navigate('prk')" },
            { label: prk.no_prk + ' — ' + prk.nama, active: true }
        ])}

        <div class="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <h2 class="text-xl font-bold text-slate-800">Jenis Program PRK</h2>
                <p class="text-sm text-slate-500">Klasifikasi program: SAR (Pemasaran), DAL (Andalan), EFI (Efisiensi)</p>
            </div>
            <button onclick="showModalProgram()" class="bg-brand text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-sky-700 transition flex items-center gap-2 shadow-sm">
                <i data-lucide="plus" class="w-4 h-4"></i> Tambah Jenis Program
            </button>
        </div>

        <!-- INFO PRK -->
        <div class="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-center gap-4">
            <div class="p-2.5 bg-blue-600 text-white rounded-lg shrink-0"><i data-lucide="folder-open" class="w-5 h-5"></i></div>
            <div>
                <p class="text-xs text-blue-500 font-medium">PRK Induk</p>
                <p class="font-bold text-blue-800">${prk.no_prk} — ${prk.nama}</p>
            </div>
        </div>

        <!-- CARDS JENIS PROGRAM -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
            ${['SAR','DAL','EFI'].map(kode => {
                const items = programList.filter(p => (p.kode_jenis||'').toUpperCase() === kode);
                const info  = kodeMap[kode];
                return `<div class="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col gap-4">
                    <div class="flex items-center gap-3">
                        <div class="p-2 ${info.color} rounded-lg"><i data-lucide="${info.icon}" class="w-5 h-5"></i></div>
                        <div>
                            <p class="text-xs text-slate-500">Kode Program</p>
                            <p class="font-bold text-slate-800">${info.label}</p>
                        </div>
                        <span class="ml-auto text-2xl font-bold text-slate-700">${items.length}</span>
                    </div>
                    ${items.length > 0 ? items.map(item => `
                        <div class="bg-slate-50 rounded-lg p-3 flex justify-between items-center border border-slate-100">
                            <div>
                                <p class="text-xs font-semibold text-slate-700">${item.kode_jenis || kode}</p>
                                <p class="text-[11px] text-slate-500 mt-0.5">${item.nama_program || item.keterangan || '—'}</p>
                            </div>
                            <div class="flex gap-1">
                                <button onclick="selectProgramAndNavigate('${item.id}', '${kode}', '${(item.nama_program||item.keterangan||kode).replace(/'/g,"\\'")}', '${prk.id}')"
                                    class="p-1.5 bg-brand text-white rounded hover:bg-sky-700 transition" title="Lihat Pengadaan">
                                    <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
                                </button>
                                <button onclick="editProgram('${item.id}')" class="p-1.5 text-blue-500 hover:bg-blue-50 rounded" title="Edit"><i data-lucide="edit" class="w-3.5 h-3.5"></i></button>
                                <button onclick="deleteData('jenis_program', '${item.id}', renderProgram)" class="p-1.5 text-red-400 hover:bg-red-50 rounded" title="Hapus"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
                            </div>
                        </div>`) .join('') : '<p class="text-xs text-slate-400 italic text-center py-3">Belum ada program ' + kode + '</p>'}
                    <button onclick="showModalProgram(); document.getElementById('program-kode').value='${kode}';"
                        class="mt-auto text-xs text-brand hover:underline font-semibold flex items-center gap-1">
                        <i data-lucide="plus" class="w-3 h-3"></i> Tambah ${kode}
                    </button>
                </div>`;
            }).join('')}
        </div>

        <!-- MODAL JENIS PROGRAM -->
        <div id="modal-program" class="fixed inset-0 bg-slate-900/50 z-50 hidden flex items-center justify-center backdrop-blur-sm transition-opacity opacity-0">
            <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 transform transition-all scale-95">
                <div class="flex justify-between items-center mb-5 border-b border-slate-100 pb-4">
                    <h3 id="modal-program-title" class="text-lg font-bold text-slate-800">Tambah Jenis Program</h3>
                    <button type="button" onclick="closeModalProgram()" class="text-slate-400 hover:text-slate-700"><i data-lucide="x" class="w-5 h-5"></i></button>
                </div>
                <form onsubmit="saveProgram(event)">
                    <input type="hidden" id="program-edit-id">
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">Kode Jenis Program <span class="text-red-500">*</span></label>
                            <select id="program-kode" required class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-brand outline-none bg-white">
                                <option value="SAR">SAR — Pemasaran / Sambungan Rumah</option>
                                <option value="DAL">DAL — Andalan / Keandalan</option>
                                <option value="EFI">EFI — Efisiensi / Losses</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">Keterangan / Nama Program (Opsional)</label>
                            <input type="text" id="program-nama" placeholder="Contoh: SAR Perumahan Tahap 1"
                                class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-brand outline-none">
                        </div>
                    </div>
                    <div class="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <button type="button" onclick="closeModalProgram()" class="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50">Batal</button>
                        <button type="submit" id="btn-save-program" class="px-6 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-sky-700">Simpan</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    lucide.createIcons();
}

function selectProgramAndNavigate(programId, kodeJenis, namaProgram, prkId) {
    window._selectedProgram = { id: programId, id_prk: prkId, kode_jenis: kodeJenis, nama: namaProgram };
    renderPengadaanHierarki();
}

function showModalProgram(isEdit = false) {
    if (!isEdit) {
        document.getElementById('program-edit-id').value = '';
        document.getElementById('program-kode').value    = 'SAR';
        document.getElementById('program-nama').value    = '';
        document.getElementById('modal-program-title').innerText = 'Tambah Jenis Program';
        document.getElementById('btn-save-program').innerText    = 'Simpan';
    }
    const modal = document.getElementById('modal-program');
    modal.classList.remove('hidden');
    setTimeout(() => { modal.classList.remove('opacity-0'); modal.querySelector('div').classList.remove('scale-95'); }, 10);
}

function closeModalProgram() {
    const modal = document.getElementById('modal-program');
    modal.classList.add('opacity-0'); modal.querySelector('div').classList.add('scale-95');
    setTimeout(() => modal.classList.add('hidden'), 300);
}

async function editProgram(id) {
    const list = await fetchAPI('action=list&table=jenis_program') || [];
    const item = list.find(p => p.id === id);
    if (!item) return showToast('Data tidak ditemukan', 'error');
    document.getElementById('program-edit-id').value = item.id;
    document.getElementById('program-kode').value    = item.kode_jenis || 'SAR';
    document.getElementById('program-nama').value    = item.nama_program || item.keterangan || '';
    document.getElementById('modal-program-title').innerText = 'Edit Jenis Program';
    document.getElementById('btn-save-program').innerText    = 'Update';
    showModalProgram(true);
}

async function saveProgram(event) {
    event.preventDefault();
    const btn    = document.getElementById('btn-save-program');
    const editId = document.getElementById('program-edit-id').value;
    const prk    = window._selectedPRK;
    if (!prk) return showToast('PRK induk tidak ditemukan', 'error');
    if (btn) { btn.disabled = true; btn.innerHTML = 'Menyimpan...'; }

    const data = {
        id_prk:       prk.id,
        kode_jenis:   document.getElementById('program-kode').value,
        nama_program: document.getElementById('program-nama').value.trim()
    };
    const currentUser = state.currentUser ? state.currentUser.nama : 'Admin';
    const payload = { action: editId ? 'update' : 'create', table: 'jenis_program', user: currentUser, data };
    if (editId) { payload.id = editId; payload.data.id = editId; }

    const result = await fetchAPI('', 'POST', payload);
    if (btn) { btn.disabled = false; btn.innerHTML = editId ? 'Update' : 'Simpan'; }
    if (result) {
        showToast(editId ? 'Jenis Program diperbarui' : 'Jenis Program disimpan');
        closeModalProgram();
        renderProgram();
    }
}

// ==========================================
// LEVEL 3: PENGADAAN (JTR / JTM) per Jenis Program
// ==========================================

async function renderPengadaanHierarki() {
    const program = window._selectedProgram;
    const prk     = window._selectedPRK;
    if (!program || !prk) { renderProgram(); return; }

    const contentArea = document.getElementById('app-content');
    contentArea.innerHTML = '<div class="flex justify-center py-24"><div class="loader"></div></div>';

    const allPengadaan = await fetchAPI('action=list&table=Pengadaan') || [];
    // Filter: hanya pengadaan yang terikat ke jenis_program ini (id_jenis terisi)
    const pengadaanList= allPengadaan.filter(p => String(p.id_jenis) === String(program.id));

    contentArea.innerHTML = `
        ${_buildBreadcrumb([
            { label: 'PRK', onclick: "navigate('prk')" },
            { label: prk.no_prk, onclick: "renderProgram()" },
            { label: program.kode_jenis + ' — ' + program.nama, active: true }
        ])}

        <div class="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <h2 class="text-xl font-bold text-slate-800">Pengadaan — ${program.kode_jenis}</h2>
                <p class="text-sm text-slate-500">Jenis konstruksi jaringan pada program <b>${program.kode_jenis}</b></p>
            </div>
            <button onclick="showModalPengadaanH()" class="bg-brand text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-sky-700 transition flex items-center gap-2 shadow-sm">
                <i data-lucide="plus" class="w-4 h-4"></i> Tambah Pengadaan
            </button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            ${['JTR','JTM'].map(konstruksi => {
                const items = pengadaanList.filter(p => (p.jenis_konstruksi||'').toUpperCase() === konstruksi);
                const clr   = konstruksi === 'JTM' ? 'border-purple-200 bg-purple-50' : 'border-orange-200 bg-orange-50';
                const badge = konstruksi === 'JTM' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700';
                const desc  = konstruksi === 'JTM' ? 'Jaringan Tegangan Menengah' : 'Jaringan Tegangan Rendah';
                return `<div class="bg-white rounded-xl border ${clr} shadow-sm overflow-hidden">
                    <div class="p-4 border-b ${clr} flex justify-between items-center">
                        <div class="flex items-center gap-2">
                            <span class="px-2.5 py-1 ${badge} rounded-lg font-bold text-sm">${konstruksi}</span>
                            <p class="text-xs text-slate-500">${desc}</p>
                        </div>
                        <span class="text-2xl font-bold text-slate-700">${items.length}</span>
                    </div>
                    <div class="p-4 space-y-2">
                        ${items.length === 0
                            ? `<p class="text-xs text-slate-400 italic text-center py-4">Belum ada pengadaan ${konstruksi}</p>`
                            : items.map(item => `
                                <div class="bg-white rounded-lg p-3 border border-slate-100 flex justify-between items-center hover:bg-slate-50 transition">
                                    <div>
                                        <p class="text-xs font-semibold text-slate-700">${item.nama_pengadaan || item.keterangan || konstruksi + ' Pengadaan'}</p>
                                        <p class="text-[11px] text-slate-400 mt-0.5">ID: ${item.id}</p>
                                    </div>
                                    <div class="flex gap-1">
                                        <button onclick="selectPengadaanAndNavigate('${item.id}', '${konstruksi}', '${(item.nama_pengadaan||konstruksi).replace(/'/g,"\\'")}', '${program.id}')"
                                            class="p-1.5 bg-brand text-white rounded hover:bg-sky-700 transition" title="Lihat Komponen">
                                            <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
                                        </button>
                                        <button onclick="editPengadaanH('${item.id}')" class="p-1.5 text-blue-500 hover:bg-blue-50 rounded" title="Edit"><i data-lucide="edit" class="w-3.5 h-3.5"></i></button>
                                        <button onclick="deleteData('Pengadaan', '${item.id}', renderPengadaanHierarki)" class="p-1.5 text-red-400 hover:bg-red-50 rounded" title="Hapus"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
                                    </div>
                                </div>`).join('')}
                        <button onclick="showModalPengadaanH(); document.getElementById('pengadaan-h-konstruksi').value='${konstruksi}';"
                            class="mt-2 text-xs text-brand hover:underline font-semibold flex items-center gap-1">
                            <i data-lucide="plus" class="w-3 h-3"></i> Tambah ${konstruksi}
                        </button>
                    </div>
                </div>`;
            }).join('')}
        </div>

        <!-- MODAL PENGADAAN HIERARKI -->
        <div id="modal-pengadaan-h" class="fixed inset-0 bg-slate-900/50 z-50 hidden flex items-center justify-center backdrop-blur-sm transition-opacity opacity-0">
            <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 transform transition-all scale-95">
                <div class="flex justify-between items-center mb-5 border-b border-slate-100 pb-4">
                    <h3 id="modal-pengadaan-h-title" class="text-lg font-bold text-slate-800">Tambah Pengadaan</h3>
                    <button type="button" onclick="closeModalPengadaanH()" class="text-slate-400 hover:text-slate-700"><i data-lucide="x" class="w-5 h-5"></i></button>
                </div>
                <form onsubmit="savePengadaanH(event)">
                    <input type="hidden" id="pengadaan-h-edit-id">
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">Jenis Konstruksi <span class="text-red-500">*</span></label>
                            <select id="pengadaan-h-konstruksi" required class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-brand outline-none bg-white">
                                <option value="JTR">JTR — Jaringan Tegangan Rendah</option>
                                <option value="JTM">JTM — Jaringan Tegangan Menengah</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">Nama Pengadaan (Opsional)</label>
                            <input type="text" id="pengadaan-h-nama" placeholder="Contoh: Pengadaan JTR Paket A"
                                class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-brand outline-none">
                        </div>
                    </div>
                    <div class="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <button type="button" onclick="closeModalPengadaanH()" class="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50">Batal</button>
                        <button type="submit" id="btn-save-pengadaan-h" class="px-6 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-sky-700">Simpan</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    lucide.createIcons();
}

function selectPengadaanAndNavigate(pengadaanId, jenisKonstruksi, namaPengadaan, programId) {
    window._selectedPengadaanH = { id: pengadaanId, id_jenis: programId, jenis_konstruksi: jenisKonstruksi, nama: namaPengadaan };
    renderKomponen();
}

function showModalPengadaanH(isEdit = false) {
    if (!isEdit) {
        document.getElementById('pengadaan-h-edit-id').value = '';
        document.getElementById('pengadaan-h-konstruksi').value = 'JTR';
        document.getElementById('pengadaan-h-nama').value    = '';
        document.getElementById('modal-pengadaan-h-title').innerText = 'Tambah Pengadaan';
        document.getElementById('btn-save-pengadaan-h').innerText    = 'Simpan';
    }
    const modal = document.getElementById('modal-pengadaan-h');
    modal.classList.remove('hidden');
    setTimeout(() => { modal.classList.remove('opacity-0'); modal.querySelector('div').classList.remove('scale-95'); }, 10);
}

function closeModalPengadaanH() {
    const modal = document.getElementById('modal-pengadaan-h');
    modal.classList.add('opacity-0'); modal.querySelector('div').classList.add('scale-95');
    setTimeout(() => modal.classList.add('hidden'), 300);
}

async function editPengadaanH(id) {
    const list = await fetchAPI('action=list&table=Pengadaan') || [];
    const item = list.find(p => p.id === id);
    if (!item) return showToast('Data tidak ditemukan', 'error');
    document.getElementById('pengadaan-h-edit-id').value       = item.id;
    document.getElementById('pengadaan-h-konstruksi').value    = item.jenis_konstruksi || 'JTR';
    document.getElementById('pengadaan-h-nama').value          = item.nama_pengadaan || item.keterangan || '';
    document.getElementById('modal-pengadaan-h-title').innerText = 'Edit Pengadaan';
    document.getElementById('btn-save-pengadaan-h').innerText    = 'Update';
    showModalPengadaanH(true);
}

async function savePengadaanH(event) {
    event.preventDefault();
    const btn    = document.getElementById('btn-save-pengadaan-h');
    const editId = document.getElementById('pengadaan-h-edit-id').value;
    const program = window._selectedProgram;
    if (!program) return showToast('Jenis program tidak ditemukan', 'error');
    if (btn) { btn.disabled = true; btn.innerHTML = 'Menyimpan...'; }

    const data = {
        // Field lama Pengadaan (agar kompatibel dengan modul pengadaan standalone)
        nomor_pengadaan: document.getElementById('pengadaan-h-nama').value.trim() || document.getElementById('pengadaan-h-konstruksi').value,
        nama_pengadaan:  document.getElementById('pengadaan-h-nama').value.trim() || document.getElementById('pengadaan-h-konstruksi').value,
        tahun:           window._selectedPRK?.tahun || new Date().getFullYear(),
        sumber_anggaran: '',
        nilai_pagu:      0,
        // Field baru relasi PRK
        id_jenis:         program.id,
        jenis_konstruksi: document.getElementById('pengadaan-h-konstruksi').value
    };
    const currentUser = state.currentUser ? state.currentUser.nama : 'Admin';
    // Simpan ke sheet Pengadaan yang sudah ada (bukan PengadaanPRK)
    const payload = { action: editId ? 'update' : 'create', table: 'Pengadaan', user: currentUser, data };
    if (editId) { payload.id = editId; payload.data.id = editId; }

    const result = await fetchAPI('', 'POST', payload);
    if (btn) { btn.disabled = false; btn.innerHTML = editId ? 'Update' : 'Simpan'; }
    if (result) {
        showToast(editId ? 'Pengadaan diperbarui' : 'Pengadaan disimpan');
        closeModalPengadaanH();
        renderPengadaanHierarki();
    }
}

// ==========================================
// LEVEL 4: KOMPONEN PEKERJAAN per Pengadaan
// ==========================================

async function renderKomponen() {
    const pengadaan = window._selectedPengadaanH;
    const program   = window._selectedProgram;
    const prk       = window._selectedPRK;
    if (!pengadaan || !program || !prk) { renderPengadaanHierarki(); return; }

    const contentArea = document.getElementById('app-content');
    contentArea.innerHTML = '<div class="flex justify-center py-24"><div class="loader"></div></div>';

    const allKomponen = await fetchAPI('action=list&table=Pekerjaan') || [];
    // Filter: hanya pekerjaan yang terikat ke pengadaan PRK ini (id_pengadaan_prk terisi)
    const komponenList = allKomponen.filter(k => String(k.id_pengadaan_prk) === String(pengadaan.id));

    const konstruksiBadge = pengadaan.jenis_konstruksi === 'JTM'
        ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700';

    contentArea.innerHTML = `
        ${_buildBreadcrumb([
            { label: 'PRK', onclick: "navigate('prk')" },
            { label: prk.no_prk, onclick: "renderProgram()" },
            { label: program.kode_jenis, onclick: "renderPengadaanHierarki()" },
            { label: pengadaan.jenis_konstruksi + ' — ' + (pengadaan.nama || 'Pengadaan'), active: true }
        ])}

        <div class="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <h2 class="text-xl font-bold text-slate-800">Komponen Pekerjaan</h2>
                <p class="text-sm text-slate-500">Rincian kelompok komponen pada pengadaan
                    <span class="font-semibold px-2 py-0.5 rounded ${konstruksiBadge}">${pengadaan.jenis_konstruksi}</span>
                </p>
            </div>
            <button onclick="showModalKomponen()" class="bg-brand text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-sky-700 transition flex items-center gap-2 shadow-sm">
                <i data-lucide="plus" class="w-4 h-4"></i> Tambah Komponen
            </button>
        </div>

        <!-- LIST KOMPONEN -->
        <div class="space-y-4 mb-6">
            ${komponenList.length === 0
                ? `<div class="bg-white rounded-xl border-2 border-dashed border-slate-200 p-12 text-center">
                    <i data-lucide="package" class="w-12 h-12 mx-auto mb-3 text-slate-300"></i>
                    <p class="text-slate-500 font-medium">Belum ada komponen pekerjaan.</p>
                    <p class="text-xs text-slate-400 mt-1">Klik "+ Tambah Komponen" untuk mulai menambahkan.</p>
                   </div>`
                : komponenList.map((k, i) => `
                    <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div class="p-4 flex items-center justify-between bg-slate-50/50 border-b border-slate-100">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded-lg bg-brand text-white flex items-center justify-center font-bold text-sm">${i+1}</div>
                                <div>
                                    <p class="font-semibold text-slate-800">${k.nama_komponen || k.nama_pekerjaan || '-'}</p>
                                    <p class="text-[11px] text-slate-400">ID: ${k.id}</p>
                                </div>
                            </div>
                            <div class="flex gap-2">
                                <button onclick="selectKomponenAndNavigate('${k.id}', '${(k.nama_komponen||k.nama_pekerjaan||'').replace(/'/g,"\\'")}', '${pengadaan.id}')"
                                    class="px-3 py-1.5 bg-brand text-white text-xs font-semibold rounded-lg hover:bg-sky-700 flex items-center gap-1">
                                    <i data-lucide="list" class="w-3.5 h-3.5"></i> Material
                                </button>
                                <button onclick="editKomponen('${k.id}')" class="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"><i data-lucide="edit" class="w-4 h-4"></i></button>
                                <button onclick="deleteData('Pekerjaan', '${k.id}', renderKomponen)" class="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                            </div>
                        </div>
                    </div>`).join('')}
        </div>

        <!-- MODAL KOMPONEN -->
        <div id="modal-komponen" class="fixed inset-0 bg-slate-900/50 z-50 hidden flex items-center justify-center backdrop-blur-sm transition-opacity opacity-0">
            <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 transform transition-all scale-95">
                <div class="flex justify-between items-center mb-5 border-b border-slate-100 pb-4">
                    <h3 id="modal-komponen-title" class="text-lg font-bold text-slate-800">Tambah Komponen Pekerjaan</h3>
                    <button type="button" onclick="closeModalKomponen()" class="text-slate-400 hover:text-slate-700"><i data-lucide="x" class="w-5 h-5"></i></button>
                </div>
                <form onsubmit="saveKomponen(event)">
                    <input type="hidden" id="komponen-edit-id">
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">Nama Komponen Pekerjaan <span class="text-red-500">*</span></label>
                        <input type="text" id="komponen-nama" required placeholder="Contoh: Pemasangan Tiang, Penarikan Kabel"
                            class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-brand outline-none">
                    </div>
                    <div class="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <button type="button" onclick="closeModalKomponen()" class="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50">Batal</button>
                        <button type="submit" id="btn-save-komponen" class="px-6 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-sky-700">Simpan</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    lucide.createIcons();
}

function selectKomponenAndNavigate(komponenId, namaKomponen, pengadaanId) {
    window._selectedKomponen = { id: komponenId, id_pengadaan: pengadaanId, nama_komponen: namaKomponen };
    renderMaterialKomponen();
}

function showModalKomponen(isEdit = false) {
    if (!isEdit) {
        document.getElementById('komponen-edit-id').value = '';
        document.getElementById('komponen-nama').value    = '';
        document.getElementById('modal-komponen-title').innerText = 'Tambah Komponen Pekerjaan';
        document.getElementById('btn-save-komponen').innerText    = 'Simpan';
    }
    const modal = document.getElementById('modal-komponen');
    modal.classList.remove('hidden');
    setTimeout(() => { modal.classList.remove('opacity-0'); modal.querySelector('div').classList.remove('scale-95'); }, 10);
}

function closeModalKomponen() {
    const modal = document.getElementById('modal-komponen');
    modal.classList.add('opacity-0'); modal.querySelector('div').classList.add('scale-95');
    setTimeout(() => modal.classList.add('hidden'), 300);
}

async function editKomponen(id) {
    const list = await fetchAPI('action=list&table=Pekerjaan') || [];
    const item = list.find(k => k.id === id);
    if (!item) return showToast('Data tidak ditemukan', 'error');
    document.getElementById('komponen-edit-id').value = item.id;
    // nama_komponen → dipetakan dari nama_pekerjaan di sheet Pekerjaan
    document.getElementById('komponen-nama').value    = item.nama_komponen || item.nama_pekerjaan || '';
    document.getElementById('modal-komponen-title').innerText = 'Edit Komponen';
    document.getElementById('btn-save-komponen').innerText    = 'Update';
    showModalKomponen(true);
}

async function saveKomponen(event) {
    event.preventDefault();
    const btn    = document.getElementById('btn-save-komponen');
    const editId = document.getElementById('komponen-edit-id').value;
    const pengadaan = window._selectedPengadaanH;
    if (!pengadaan) return showToast('Pengadaan tidak ditemukan', 'error');
    if (btn) { btn.disabled = true; btn.innerHTML = 'Menyimpan...'; }

    const namaKomponen = document.getElementById('komponen-nama').value.trim();
    const data = {
        // Field lama Pekerjaan (agar kompatibel dengan modul pekerjaan standalone)
        pengadaan_id:    pengadaan.id,        // relasi ke pengadaan (field lama)
        nama_pengadaan:  pengadaan.nama || '',
        nomor_paket:     '',
        nama_pekerjaan:  namaKomponen,        // nama pekerjaan = nama komponen
        jenis_kegiatan:  window._selectedProgram?.kode_jenis || '',
        jenis_tegangan:  pengadaan.jenis_konstruksi || '',
        lokasi:          window._selectedPRK?.no_prk || '',
        tahun_anggaran:  window._selectedPRK?.tahun || new Date().getFullYear(),
        sumber_anggaran: '',
        // Field baru relasi PRK
        id_pengadaan_prk: pengadaan.id,       // foreign key khusus hierarki PRK
        nama_komponen:    namaKomponen        // kolom baru
    };
    const currentUser = state.currentUser ? state.currentUser.nama : 'Admin';
    // Simpan ke sheet Pekerjaan yang sudah ada (bukan komponen_pekerjaan)
    const payload = { action: editId ? 'update' : 'create', table: 'Pekerjaan', user: currentUser, data };
    if (editId) { payload.id = editId; payload.data.id = editId; }

    const result = await fetchAPI('', 'POST', payload);
    if (btn) { btn.disabled = false; btn.innerHTML = editId ? 'Update' : 'Simpan'; }
    if (result) {
        showToast(editId ? 'Komponen diperbarui' : 'Komponen disimpan');
        closeModalKomponen();
        renderKomponen();
    }
}

// ==========================================
// LEVEL 5: MATERIAL per Komponen Pekerjaan
// ==========================================

async function renderMaterialKomponen() {
    const komponen  = window._selectedKomponen;
    const pengadaan = window._selectedPengadaanH;
    const program   = window._selectedProgram;
    const prk       = window._selectedPRK;
    if (!komponen || !pengadaan || !program || !prk) { renderKomponen(); return; }

    const contentArea = document.getElementById('app-content');
    contentArea.innerHTML = '<div class="flex justify-center py-24"><div class="loader"></div></div>';

    // Ambil dari sheet Material, filter yang id_komponen-nya = id pekerjaan/komponen ini
    const allMaterial = await fetchAPI('action=list&table=Material') || [];
    const materialList = allMaterial.filter(m => String(m.id_komponen) === String(komponen.id));

    let totalHarga = 0;
    materialList.forEach(m => {
        const vol = parseFloat(m.volume) || 0;
        const hargaMat = parseFloat(m.harga_satuan || m.harga_material || m.harga) || 0;
        const hargaJasa = parseFloat(m.harga_jasa || m.jasa) || 0;
        totalHarga += parseFloat(m.total_harga) || (vol * (hargaMat + hargaJasa));
    });

    contentArea.innerHTML = `
        ${_buildBreadcrumb([
            { label: 'PRK', onclick: "navigate('prk')" },
            { label: prk.no_prk, onclick: "renderProgram()" },
            { label: program.kode_jenis, onclick: "renderPengadaanHierarki()" },
            { label: pengadaan.jenis_konstruksi, onclick: "renderKomponen()" },
            { label: komponen.nama_komponen, active: true }
        ])}

        <div class="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <h2 class="text-xl font-bold text-slate-800">Jenis Material</h2>
                <p class="text-sm text-slate-500">Rincian material untuk komponen <b>${komponen.nama_komponen}</b></p>
            </div>
            <button onclick="showModalMaterialKomponen()" class="bg-brand text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-sky-700 transition flex items-center gap-2 shadow-sm">
                <i data-lucide="plus" class="w-4 h-4"></i> Tambah Material
            </button>
        </div>

        <!-- SUMMARY -->
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
            <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
                <div class="p-2 bg-blue-100 text-blue-600 rounded-lg"><i data-lucide="package" class="w-5 h-5"></i></div>
                <div><p class="text-xs text-slate-500">Total Item</p><p class="text-xl font-bold text-slate-800">${materialList.length}</p></div>
            </div>
            <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3 sm:col-span-2">
                <div class="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><i data-lucide="wallet" class="w-5 h-5"></i></div>
                <div><p class="text-xs text-slate-500">Total Harga</p><p class="text-xl font-bold text-emerald-700">${CONFIG.formatCurrency(totalHarga)}</p></div>
            </div>
        </div>

        <!-- TABEL MATERIAL -->
        <div class="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse text-sm">
                    <thead class="bg-slate-100 text-slate-700 font-semibold">
                        <tr>
                            <th class="p-3 text-center w-10">No</th>
                            <th class="p-3">Nama Material</th>
                            <th class="p-3">Spesifikasi</th>
                            <th class="p-3 text-center">Volume</th>
                            <th class="p-3 text-center">Satuan</th>
                            <th class="p-3 text-right">Harga Material</th>
                            <th class="p-3 text-right">Harga Jasa</th>
                            <th class="p-3 text-right">Total Harga</th>
                            <th class="p-3 text-center w-24">Aksi</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        ${materialList.length === 0
                            ? '<tr><td colspan="8" class="p-10 text-center text-slate-400 italic">Belum ada material. Klik "+ Tambah Material".</td></tr>'
                            : materialList.map((m, i) => {
                                const vol    = parseFloat(m.volume) || 0;
                                const hargaMat = parseFloat(m.harga_satuan || m.harga_material || m.harga) || 0;
                                const hargaJasa = parseFloat(m.harga_jasa || m.jasa) || 0;
                                const total  = parseFloat(m.total_harga) || (vol * (hargaMat + hargaJasa));
                                return `<tr class="hover:bg-slate-50 transition-colors">
                                    <td class="p-3 text-center text-slate-500">${i+1}</td>
                                    <td class="p-3 font-semibold text-slate-800">${m.nama_material || m.material || '-'}</td>
                                    <td class="p-3 text-slate-500 text-xs">${m.spesifikasi || '-'}</td>
                                    <td class="p-3 text-center font-medium">${vol > 0 ? vol : '<span class="text-slate-300 text-xs italic">—</span>'}</td>
                                    <td class="p-3 text-center text-slate-600">${m.satuan || m.unit || '-'}</td>
                                    <td class="p-3 text-right font-medium text-slate-700">${CONFIG.formatCurrency(hargaMat)}</td>
                                    <td class="p-3 text-right font-medium text-amber-600">${CONFIG.formatCurrency(hargaJasa)}</td>
                                    <td class="p-3 text-right font-bold text-emerald-600">${CONFIG.formatCurrency(total)}</td>
                                    <td class="p-3 text-center">
                                        <div class="flex justify-center gap-1">
                                            <button onclick="editMaterialKomponen('${m.id}')" class="text-blue-500 hover:text-blue-700 p-1"><i data-lucide="edit" class="w-4 h-4"></i></button>
                                            <button onclick="deleteData('Material', '${m.id}', renderMaterialKomponen)" class="text-red-400 hover:text-red-600 p-1"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                                        </div>
                                    </td>
                                </tr>`;
                            }).join('')}
                    </tbody>
                    ${materialList.length > 0 ? `
                    <tfoot class="bg-emerald-50 border-t-2 border-emerald-200">
                        <tr class="font-bold text-slate-800">
                            <td colspan="6" class="p-3 text-right">TOTAL</td>
                            <td class="p-3 text-right text-emerald-700 text-base">${CONFIG.formatCurrency(totalHarga)}</td>
                            <td></td>
                        </tr>
                    </tfoot>` : ''}
                </table>
            </div>
        </div>

        <!-- MODAL MATERIAL -->
        <div id="modal-material-komponen" class="fixed inset-0 bg-slate-900/50 z-50 hidden flex items-center justify-center backdrop-blur-sm transition-opacity opacity-0 p-4">
            <div class="bg-white rounded-2xl shadow-xl w-full max-w-xl p-6 transform transition-all scale-95 max-h-[90vh] overflow-y-auto">
                <div class="flex justify-between items-center mb-5 border-b border-slate-100 pb-4">
                    <h3 id="modal-material-k-title" class="text-lg font-bold text-slate-800">Tambah Material</h3>
                    <button type="button" onclick="closeModalMaterialKomponen()" class="text-slate-400 hover:text-slate-700"><i data-lucide="x" class="w-5 h-5"></i></button>
                </div>
                <form onsubmit="saveMaterialKomponen(event)">
                    <input type="hidden" id="material-k-edit-id">
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">Nama Material <span class="text-red-500">*</span></label>
                            <input type="text" id="material-k-nama" required placeholder="Contoh: Kabel TIC 3x70+54.6mm"
                                class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-brand outline-none">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">Spesifikasi Teknis <span class="text-xs text-slate-400">(opsional)</span></label>
                            <input type="text" id="material-k-spek" placeholder="Contoh: SNI, XLPE, 20kV"
                                class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-brand outline-none">
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-slate-700 mb-1">
                                    Volume <span class="text-xs text-slate-400">(opsional)</span>
                                </label>
                                <input type="number" step="any" id="material-k-volume" value="" placeholder="Isi jika sudah diketahui"
                                    oninput="calcTotalMaterialK()"
                                    class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-brand outline-none">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-slate-700 mb-1">
                                    Satuan <span class="text-xs text-slate-400">(opsional)</span>
                                </label>
                                <input type="text" id="material-k-satuan" list="satuan-k-list" placeholder="meter, btg, set"
                                    class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-brand outline-none">
                                <datalist id="satuan-k-list">
                                    <option value="meter"><option value="btg"><option value="set">
                                    <option value="buah"><option value="unit"><option value="rol">
                                    <option value="kg"><option value="lot"><option value="pcs">
                                </datalist>
                            </div>
                        </div>
                        <!-- HARGA MATERIAL & HARGA JASA -->
                        <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                            <p class="text-xs font-bold text-slate-500 uppercase tracking-wider">Harga Satuan (Rp) <span class="text-xs text-slate-400">(opsional)</span></p>
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-slate-700 mb-1">
                                        Harga Material <span class="text-xs text-slate-400">(opsional)</span>
                                    </label>
                                    <input type="number" step="any" id="material-k-harga" value="0"
                                        oninput="calcTotalMaterialK()"
                                        onfocus="if(this.value=='0')this.value=''"
                                        onblur="if(this.value=='')this.value='0'"
                                        class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-brand outline-none">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-slate-700 mb-1">
                                        Harga Jasa <span class="text-xs text-slate-400">(opsional)</span>
                                    </label>
                                    <input type="number" step="any" id="material-k-jasa" value="0"
                                        oninput="calcTotalMaterialK()"
                                        onfocus="if(this.value=='0')this.value=''"
                                        onblur="if(this.value=='')this.value='0'"
                                        class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-brand outline-none">
                                </div>
                            </div>
                        </div>
                        <!-- PREVIEW TOTAL -->
                        <div class="bg-emerald-50 p-3.5 rounded-xl border border-emerald-100 space-y-1.5">
                            <div class="flex justify-between text-xs text-slate-600">
                                <span>Harga Satuan Material:</span>
                                <span id="preview-harga-mat" class="font-semibold">Rp 0</span>
                            </div>
                            <div class="flex justify-between text-xs text-slate-600">
                                <span>Harga Satuan Jasa:</span>
                                <span id="preview-harga-jasa" class="font-semibold">Rp 0</span>
                            </div>
                            <div class="flex justify-between items-center pt-1.5 border-t border-emerald-200">
                                <span class="text-sm font-semibold text-slate-700">Total Harga (Vol × (Mat+Jasa)):</span>
                                <span id="material-k-total-preview" class="text-lg font-bold text-emerald-700">Rp 0</span>
                            </div>
                        </div>
                    </div>
                    <div class="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <button type="button" onclick="closeModalMaterialKomponen()" class="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50">Batal</button>
                        <button type="submit" id="btn-save-material-k" class="px-6 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-sky-700">Simpan Material</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    lucide.createIcons();
}

function calcTotalMaterialK() {
    const vol   = parseFloat(document.getElementById('material-k-volume')?.value)  || 0;
    const harga = parseFloat(document.getElementById('material-k-harga')?.value)   || 0;
    const jasa  = parseFloat(document.getElementById('material-k-jasa')?.value)    || 0;
    const total = vol > 0 ? vol * (harga + jasa) : 0;

    const elMat  = document.getElementById('preview-harga-mat');
    const elJasa = document.getElementById('preview-harga-jasa');
    const elTot  = document.getElementById('material-k-total-preview');

    if (elMat)  elMat.innerText  = CONFIG.formatCurrency(harga);
    if (elJasa) elJasa.innerText = CONFIG.formatCurrency(jasa);
    if (elTot)  elTot.innerText  = vol > 0 ? CONFIG.formatCurrency(total) : '(volume belum diisi)';
}

function showModalMaterialKomponen(isEdit = false) {
    if (!isEdit) {
        document.getElementById('material-k-edit-id').value = '';
        document.getElementById('material-k-nama').value    = '';
        document.getElementById('material-k-spek').value    = '';
        document.getElementById('material-k-volume').value  = '';
        document.getElementById('material-k-satuan').value  = '';
        document.getElementById('material-k-harga').value   = '0';
        document.getElementById('material-k-jasa').value    = '0';
        const elTot  = document.getElementById('material-k-total-preview');
        const elMat  = document.getElementById('preview-harga-mat');
        const elJasa = document.getElementById('preview-harga-jasa');
        if (elTot)  elTot.innerText  = 'Rp 0';
        if (elMat)  elMat.innerText  = 'Rp 0';
        if (elJasa) elJasa.innerText = 'Rp 0';
        document.getElementById('modal-material-k-title').innerText = 'Tambah Material';
        document.getElementById('btn-save-material-k').innerText    = 'Simpan Material';
    }
    const modal = document.getElementById('modal-material-komponen');
    modal.classList.remove('hidden');
    setTimeout(() => { modal.classList.remove('opacity-0'); modal.querySelector('div').classList.remove('scale-95'); }, 10);
}

function closeModalMaterialKomponen() {
    const modal = document.getElementById('modal-material-komponen');
    modal.classList.add('opacity-0'); modal.querySelector('div').classList.add('scale-95');
    setTimeout(() => modal.classList.add('hidden'), 300);
}

async function editMaterialKomponen(id) {
    // Ambil dari sheet Material (sama dengan yang dipakai RAB)
    const list = await fetchAPI('action=list&table=Material') || [];
    const item = list.find(m => String(m.id) === String(id));
    if (!item) return showToast('Data tidak ditemukan', 'error');
    document.getElementById('material-k-edit-id').value = item.id;
    // nama material — pakai field yang konsisten
    document.getElementById('material-k-nama').value   = item.material || item.nama_material || item.uraian || item.nama || '';
    document.getElementById('material-k-spek').value   = item.spesifikasi || '';
    document.getElementById('material-k-volume').value = item.volume      || '';
    document.getElementById('material-k-satuan').value = item.satuan || item.unit || '';
    document.getElementById('material-k-harga').value  = item.harga_satuan || item.harga || item.harga_material || '0';
    document.getElementById('material-k-jasa').value   = item.harga_jasa || item.jasa || '0';
    calcTotalMaterialK();
    document.getElementById('modal-material-k-title').innerText = 'Edit Material';
    document.getElementById('btn-save-material-k').innerText    = 'Update Material';
    showModalMaterialKomponen(true);
}

async function saveMaterialKomponen(event) {
    event.preventDefault();
    const btn    = document.getElementById('btn-save-material-k');
    const editId = document.getElementById('material-k-edit-id').value;
    const komponen = window._selectedKomponen;
    if (!komponen) return showToast('Komponen tidak ditemukan', 'error');
    if (btn) { btn.disabled = true; btn.innerHTML = 'Menyimpan...'; }

    const namaVal = document.getElementById('material-k-nama').value.trim();
    const spekVal = document.getElementById('material-k-spek').value.trim();
    const satuan  = document.getElementById('material-k-satuan').value.trim();
    const vol     = parseFloat(document.getElementById('material-k-volume').value) || 0;  // opsional
    const harga   = parseFloat(document.getElementById('material-k-harga').value)  || 0;
    const jasa    = parseFloat(document.getElementById('material-k-jasa').value)   || 0;  // opsional
    const total   = vol > 0 ? vol * (harga + jasa) : 0;

    // Simpan ke sheet Material (sama dengan yang dipakai RAB picker)
    // Field lengkap agar kompatibel dengan loadMaterialData() di material.js
    const data = {
        // Field lama (dipakai RAB)
        material:      namaVal,
        nama_material: namaVal,
        nama:          namaVal,
        uraian:        namaVal,
        satuan:        satuan,
        unit:          satuan,
        harga:         harga,
        harga_material:harga,
        harga_satuan:  harga,
        harga_jasa:    jasa,
        jasa:          jasa,
        kategori:      window._selectedKomponen?.nama_komponen || 'PRK',
        keterangan:    window._selectedKomponen?.nama_komponen || 'PRK',
        // Field baru (relasi PRK)
        id_komponen:   komponen.id,
        spesifikasi:   spekVal,
        volume:        vol,
        total_harga:   total,
        jumlah:        vol,
        total:         vol > 0 ? (harga + jasa) : harga
    };

    const currentUser = state.currentUser ? state.currentUser.nama : 'Admin';
    // Selalu simpan ke sheet Material — satu sumber data untuk PRK dan RAB
    const payload = { action: editId ? 'update' : 'create', table: 'Material', user: currentUser, data };
    if (editId) { payload.id = editId; payload.data.id = editId; }

    const result = await fetchAPI('', 'POST', payload);
    if (btn) { btn.disabled = false; btn.innerHTML = editId ? 'Update Material' : 'Simpan Material'; }
    if (result) {
        showToast(editId ? 'Material diperbarui' : 'Material disimpan — tersinkron dengan katalog RAB');
        closeModalMaterialKomponen();
        // Refresh cache material global agar RAB picker langsung up to date
        window.allMaterialList = [];
        renderMaterialKomponen();
    }
}

// ==========================================
// HELPER: Breadcrumb navigasi hierarki
// ==========================================
function _buildBreadcrumb(items) {
    const parts = items.map((item, i) => {
        if (item.active) {
            return `<span class="text-slate-800 font-semibold text-sm">${item.label}</span>`;
        }
        return `<button onclick="${item.onclick}" class="text-brand hover:underline text-sm font-medium">${item.label}</button>`;
    });
    return `
        <div class="flex items-center gap-2 mb-6 text-slate-400 flex-wrap">
            ${parts.join('<i data-lucide="chevron-right" class="w-4 h-4 text-slate-300 shrink-0"></i>')}
        </div>`;
}

