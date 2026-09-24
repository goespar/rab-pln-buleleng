// ==========================================
// js/modules/penyedia.js
// Modul Data Penyedia / Vendor
// ==========================================

window.renderPenyedia = async function renderPenyedia() {
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
                                <input type="text" id="penyedia-kategori" placeholder="Konstruksi" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-brand outline-none">
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
            const namaVendor = p.nama || p.nama_perusahaan || '-';
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
        document.getElementById('penyedia-nama').value     = '';
        document.getElementById('penyedia-kategori').value = '';
        document.getElementById('penyedia-npwp').value     = '';
        document.getElementById('penyedia-kontak').value   = '';
        document.getElementById('penyedia-alamat').value   = '';
        document.getElementById('btn-save-penyedia').innerHTML = 'Simpan Penyedia';
    }
    const titleEl = document.querySelector('#modal-penyedia h3');
    if (titleEl) titleEl.innerText = isEdit ? 'Edit Data Penyedia' : 'Tambah Penyedia Baru';
    const modal = document.getElementById('modal-penyedia');
    if (!modal) return;
    modal.classList.remove('hidden');
    setTimeout(() => { modal.classList.remove('opacity-0'); modal.querySelector('div').classList.remove('scale-95'); }, 10);
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
    document.getElementById('penyedia-nama').value     = item.nama || item.nama_perusahaan || '';
    document.getElementById('penyedia-kategori').value = item.kategori || '';
    document.getElementById('penyedia-npwp').value     = item.npwp || '';
    document.getElementById('penyedia-kontak').value   = item.kontak || '';
    document.getElementById('penyedia-alamat').value   = item.alamat || '';
    document.getElementById('btn-save-penyedia').innerHTML = 'Update Penyedia';
    showModalPenyedia(true);
}

async function savePenyedia(event) {
    event.preventDefault();
    const btn = document.getElementById('btn-save-penyedia');
    if (btn) { btn.disabled = true; btn.innerHTML = 'Menyimpan...'; }

    const data = {
        nama:     document.getElementById('penyedia-nama').value,
        npwp:     document.getElementById('penyedia-npwp').value,
        kontak:   document.getElementById('penyedia-kontak').value,
        alamat:   document.getElementById('penyedia-alamat').value,
        kategori: document.getElementById('penyedia-kategori').value,
        status:   'Aktif'
    };

    const isUpdate    = state.editId && !String(state.editId).startsWith('temp_');
    const currentUser = state.currentUser ? state.currentUser.nama : 'Admin';

    try {
        let result = false;
        if (isUpdate) {
            await fetchAPI(`action=delete&table=Penyedia&id=${encodeURIComponent(state.editId)}&user=${encodeURIComponent(currentUser)}`, 'POST', {});
            result = await fetchAPI('', 'POST', { action: 'create', table: 'Penyedia', user: currentUser, data });
        } else {
            result = await fetchAPI('', 'POST', { action: 'create', table: 'Penyedia', user: currentUser, data });
        }
        if (result) {
            showToast(isUpdate ? 'Penyedia berhasil diperbarui' : 'Penyedia berhasil ditambahkan');
            closeModalPenyedia();
            state.editId = null;
            loadPenyediaData();
        } else {
            throw new Error('Gagal menyimpan data ke Google Sheets');
        }
    } catch (error) {
        showToast('Gagal menyimpan data penyedia: ' + error.message, 'error');
    }

    if (btn) { btn.disabled = false; btn.innerHTML = 'Simpan Penyedia'; }
}

