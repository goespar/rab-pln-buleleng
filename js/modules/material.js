// ==========================================
// js/modules/material.js
// Modul Master Data Material (Harga Standar)
// Catatan: untuk material per komponen PRK → gunakan renderMaterialKomponen() di program.js
// ==========================================

window.allMaterialList = [];

window.renderMaterial = async function renderMaterial() {
    // Ambil data Pekerjaan/Komponen untuk dropdown kategori
    const pekerjaans = await fetchWithCache('Pekerjaan') || [];
    let optKomponen = '<option value="">-- Tidak ada kategori / Standalone --</option>';
    pekerjaans.forEach(p => {
        if (p.id_pengadaan_prk && (p.nama_komponen || p.nama_pekerjaan)) {
            optKomponen += '<option value="' + (p.id || '') + '" data-nama="' + (p.nama_komponen || p.nama_pekerjaan || '') + '">'
                + (p.nama_komponen || p.nama_pekerjaan) + ' (ID: ' + p.id + ')</option>';
        }
    });
    optKomponen += '<option value="manual">-- Isi Manual --</option>';

    const contentArea = document.getElementById('app-content');
    contentArea.innerHTML = `
        <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-100 mb-6">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h2 class="text-lg font-semibold text-slate-800">Master Data Material</h2>
                    <p class="text-sm text-slate-500">Kelola katalog material, satuan, dan harga standar.</p>
                </div>
                <div class="flex items-center gap-3 w-full sm:w-auto">
                    <input type="text" id="search-material" oninput="filterMaterialTable()" placeholder="Cari material atau kategori..."
                        class="border border-slate-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand w-full sm:w-56">
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
                            <label class="block text-sm font-medium mb-1 text-slate-700">Nama Material / Uraian *</label>
                            <input type="text" id="mat-nama" required placeholder="Contoh: Kabel TIC 3 x 70 + 1 x 54.6 mm2" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand">
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-1 text-slate-700">Komponen Pekerjaan (Opsional)</label>
                            <select id="mat-kategori" onchange="handleKategoriChange()"
                                class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand bg-white">
                                ${optKomponen}
                            </select>
                            <input type="text" id="mat-kategori-manual" placeholder="Ketik kategori custom..."
                                class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand mt-2 hidden">
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium mb-1 text-slate-700">Satuan *</label>
                                <input type="text" id="mat-satuan" list="satuan-material-list" required placeholder="meter, btg, set" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand">
                                <datalist id="satuan-material-list">
                                    <option value="meter"></option><option value="btg"></option>
                                    <option value="set"></option><option value="buah"></option>
                                    <option value="unit"></option><option value="rol"></option>
                                    <option value="lot"></option><option value="kg"></option>
                                </datalist>
                            </div>
                            <div>
                                <label class="block text-sm font-medium mb-1 text-slate-700">Harga Material (Rp) *</label>
                                <input type="number" id="mat-harga" required min="0" value="0"
                                    onfocus="if(this.value=='0')this.value=''" onblur="if(this.value=='')this.value='0'"
                                    class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand">
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-1 text-slate-700">Harga Jasa (Opsional, Rp)</label>
                            <input type="number" id="mat-jasa" min="0" value="0"
                                onfocus="if(this.value=='0')this.value=''" onblur="if(this.value=='')this.value='0'"
                                class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand">
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
                <p class="text-xs text-slate-400 mt-1">Klik tombol "+ Tambah Material" untuk menambahkan.</p>
            </div>`;
        lucide.createIcons(); return;
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
        const nama     = m.material || m.nama_material || m.uraian || m.nama || m.item || '-';
        const kategori = m.kategori || m.keterangan || m.kelompok || 'Umum';
        const satuan   = m.satuan || m.unit || '-';
        const hargaMat = parseFloat(m.harga) || parseFloat(m.harga_material) || parseFloat(m.harga_satuan) || 0;
        const hargaJasa= parseFloat(m.harga_jasa) || parseFloat(m.jasa) || 0;
        const itemId   = m.id || `row_${i}`;
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
                        <button onclick="editMaterial('${itemId}')" class="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"><i data-lucide="edit" class="w-4 h-4"></i></button>
                        <button onclick="deleteData('Material', '${itemId}', loadMaterialData)" class="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                    </div>
                </td>
            </tr>`;
    });
    html += `</tbody></table></div>`;
    tableContainer.innerHTML = html;
    lucide.createIcons();
}

function handleKategoriChange() {
    const select = document.getElementById('mat-kategori');
    const manual = document.getElementById('mat-kategori-manual');
    if (select.value === 'manual') {
        manual.classList.remove('hidden');
        manual.focus();
    } else {
        manual.classList.add('hidden');
        manual.value = '';
    }
}

function filterMaterialTable() {
    const q = (document.getElementById('search-material')?.value || '').toLowerCase().trim();
    if (!q) { renderMaterialRows(window.allMaterialList); return; }
    const filtered = window.allMaterialList.filter(m => {
        const nama     = (m.material || m.nama_material || m.uraian || m.nama || m.item || '').toLowerCase();
        const kategori = (m.kategori || m.keterangan || m.kelompok || '').toLowerCase();
        const satuan   = (m.satuan || m.unit || '').toLowerCase();
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
        document.getElementById('mat-kategori-manual').value = '';
        document.getElementById('mat-kategori-manual').classList.add('hidden');
        document.getElementById('mat-nama').value     = '';
        document.getElementById('mat-satuan').value   = '';
        document.getElementById('mat-harga').value    = '0';
        document.getElementById('mat-jasa').value     = '0';
        const titleEl = document.getElementById('modal-material-title');
        if (titleEl) titleEl.innerText = 'Tambah Material Baru';
    } else {
        const titleEl = document.getElementById('modal-material-title');
        if (titleEl) titleEl.innerText = 'Edit Data Material';
    }
    modal.classList.remove('hidden');
    setTimeout(() => { modal.classList.remove('opacity-0'); modal.querySelector('div')?.classList.remove('scale-95'); }, 10);
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
    document.getElementById('mat-kategori').value = item.kategori || item.keterangan || item.kelompok || item.id_komponen || '';
    const manualField = document.getElementById('mat-kategori-manual');
    // Jika data lama berisi text custom (bukan ID), tampilkan di manual field
    const kategoriVal = item.kategori || item.keterangan || item.kelompok || '';
    if (kategoriVal && !kategoriVal.match(/^[0-9a-zA-Z\-]+$/) || (kategoriVal && !pekerjaans?.some(p => String(p.id) === kategoriVal))) {
        document.getElementById('mat-kategori').value = 'manual';
        manualField.value = kategoriVal;
        manualField.classList.remove('hidden');
    } else {
        manualField.classList.add('hidden');
    }
    document.getElementById('mat-nama').value     = item.material || item.nama_material || item.uraian || item.nama || item.item || '';
    document.getElementById('mat-satuan').value   = item.satuan || item.unit || '';
    document.getElementById('mat-harga').value    = item.harga || item.harga_material || item.harga_satuan || '0';
    document.getElementById('mat-jasa').value     = item.harga_jasa || item.jasa || '0';
    showModalMaterial(true);
}

async function saveMaterial(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-save-material');
    if (btn) { btn.disabled = true; btn.innerHTML = '⏳ Menyimpan...'; }

    const kategoriVal = document.getElementById('mat-kategori').value.trim();
    const kategoriManualVal = document.getElementById('mat-kategori-manual').value.trim();
    const kategoriFinał = kategoriVal === 'manual' ? kategoriManualVal : kategoriVal || 'Umum';
    const namaVal     = document.getElementById('mat-nama').value.trim();
    const satuanVal   = document.getElementById('mat-satuan').value.trim() || 'set';
    const hargaVal    = parseFloat(document.getElementById('mat-harga').value) || 0;
    const jasaVal     = parseFloat(document.getElementById('mat-jasa').value) || 0;

    if (!namaVal) {
        showToast('Nama Material / Uraian wajib diisi', 'error');
        if (btn) { btn.disabled = false; btn.innerHTML = 'Simpan Material'; }
        return;
    }

    const payload = {
        action: state.editId ? 'update' : 'create',
        table: 'Material',
        user: state.currentUser ? state.currentUser.nama : 'Admin',
        data: {
            material: namaVal, nama_material: namaVal, nama: namaVal, uraian: namaVal,
            satuan: satuanVal,
            harga: hargaVal, harga_material: hargaVal, harga_satuan: hargaVal,
            kategori: kategoriFinał, keterangan: kategoriFinał,
            id_komponen: kategoriVal !== 'manual' && kategoriVal ? kategoriVal : '',
            harga_jasa: jasaVal, jasa: jasaVal,
            jumlah: 1, total: hargaVal
        }
    };
    if (state.editId) { payload.id = state.editId; payload.data.id = state.editId; }

    const res = await fetchAPI('', 'POST', payload);
    if (btn) { btn.disabled = false; btn.innerHTML = 'Simpan Material'; }
    if (res) {
        showToast(state.editId ? 'Data Material berhasil diperbarui' : 'Data Material berhasil disimpan');
        closeModalMaterial();
        loadMaterialData();
    }
}

