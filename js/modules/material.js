// ==========================================
// js/modules/material.js
// Modul Master Data Material (Harga Standar)
// Catatan: untuk material per komponen PRK → gunakan renderMaterialKomponen() di program.js
// ==========================================

window.allMaterialList = [];
window.materialInputData = { prk: [], program: [], pengadaan: [], pekerjaan: [] };
window.materialBasket = [];

window.renderMaterial = async function renderMaterial() {
    const [prk, program, pengadaan, pekerjaans] = await Promise.all([
        fetchWithCache('prk'),
        fetchWithCache('jenis_program'),
        fetchWithCache('Pengadaan'),
        fetchWithCache('Pekerjaan')
    ]);
    window.materialInputData = {
        prk: prk || [],
        program: program || [],
        pengadaan: pengadaan || [],
        pekerjaan: pekerjaans || []
    };

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

        <div id="modal-material" class="bg-slate-50 rounded-xl border border-slate-200 p-4 mb-4">
            <div class="w-full">
                <div class="flex justify-between items-center mb-3 border-b border-slate-200 pb-2">
                    <h3 id="modal-material-title" class="text-base font-bold text-slate-800">Tambah Material Baru</h3>
                    <button type="button" onclick="closeModalMaterial()" class="text-slate-400 hover:text-slate-700 p-1"><i data-lucide="x" class="w-5 h-5"></i></button>
                </div>
                <form onsubmit="saveMaterial(event)">
                    <div class="space-y-3">
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
                            <div><label class="block text-xs font-semibold mb-1 text-slate-700">Nama Material / Uraian *</label>
                            <input type="text" id="mat-nama" required placeholder="Contoh: Kabel TIC 3 x 70 + 1 x 54.6 mm2" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand">
                            </div>
                            <div><label class="block text-xs font-semibold mb-1 text-slate-700">Spesifikasi Teknis</label>
                                <input type="text" id="mat-spek" placeholder="Contoh: SNI, XLPE, 20kV" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand">
                            </div>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div><label class="block text-xs font-semibold mb-1 text-slate-700">PRK *</label>
                                <select id="mat-prk" onchange="filterMaterialPengadaan(this.value)" required class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand bg-white"><option value="">-- Pilih PRK --</option>${window.materialInputData.prk.map(item => `<option value="${item.id}">${item.no_prk || '-'} - ${item.prk || item.nama || '-'}</option>`).join('')}</select>
                            </div>
                            <div><label class="block text-xs font-semibold mb-1 text-slate-700">Pengadaan *</label>
                                <select id="mat-pengadaan" onchange="filterMaterialKomponen(this.value)" required disabled class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand bg-white"><option value="">-- Pilih PRK Dahulu --</option></select>
                            </div>
                            <div><label class="block text-xs font-semibold mb-1 text-slate-700">Komponen Pekerjaan *</label>
                                <select id="mat-komponen" required disabled class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand bg-white"><option value="">-- Pilih Pengadaan Dahulu --</option></select>
                            </div>
                        </div>
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div><label class="block text-xs font-semibold mb-1 text-slate-700">Volume</label>
                                <input type="number" step="any" id="mat-volume" placeholder="Isi jika sudah diketahui" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand">
                            </div>
                            <div><label class="block text-xs font-semibold mb-1 text-slate-700">Satuan *</label>
                                <input type="text" id="mat-satuan" list="satuan-material-list" required placeholder="meter, btg, set" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand">
                                <datalist id="satuan-material-list">
                                    <option value="meter"></option><option value="btg"></option>
                                    <option value="set"></option><option value="buah"></option>
                                    <option value="unit"></option><option value="rol"></option>
                                    <option value="lot"></option><option value="kg"></option>
                                </datalist>
                            </div>
                            <div><label class="block text-xs font-semibold mb-1 text-slate-700">Harga Material (Rp) *</label>
                                <input type="number" id="mat-harga" required min="0" value="0"
                                    onfocus="if(this.value=='0')this.value=''" onblur="if(this.value=='')this.value='0'"
                                    class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand">
                            </div>
                            <div><label class="block text-xs font-semibold mb-1 text-slate-700">Harga Jasa (Rp)</label>
                            <input type="number" id="mat-jasa" min="0" value="0"
                                onfocus="if(this.value=='0')this.value=''" onblur="if(this.value=='')this.value='0'"
                                class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand">
                            </div>
                        </div>
                    </div>
                    <div class="mt-3 flex justify-end gap-2 pt-3 border-t border-slate-200">
                        <button type="button" onclick="closeModalMaterial()" class="px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-600 hover:bg-slate-50">Bersihkan</button>
                        <button type="submit" id="btn-save-material" class="px-6 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-sky-700 transition">Tambah ke Basket</button>
                    </div>
                </form>
                <div id="material-basket" class="mt-5"></div>
            </div>
        </div>
    `;
    const materialForm = document.getElementById('modal-material');
    const materialTable = document.getElementById('material-table-container');
    if (materialForm && materialTable) materialTable.parentNode.insertBefore(materialForm, materialTable);
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
                        <th class="p-3">Komponen Pekerjaan</th>
                        <th class="p-3">Nama Material</th>
                        <th class="p-3 text-right">Volume</th>
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
        const volume   = parseFloat(m.volume) || 0;
        const satuan   = m.satuan || m.unit || '-';
        const hargaMat = parseFloat(m.harga) || parseFloat(m.harga_material) || parseFloat(m.harga_satuan) || 0;
        const hargaJasa= parseFloat(m.harga_jasa) || parseFloat(m.jasa) || 0;
        const itemId   = m.id || `row_${i}`;
        html += `
            <tr class="hover:bg-slate-50/80 transition-colors">
                <td class="p-3 text-center text-slate-500 font-medium">${i + 1}</td>
                <td class="p-3"><span class="bg-blue-50 text-brand px-2.5 py-1 rounded-md text-xs font-semibold">${kategori}</span></td>
                <td class="p-3 font-semibold text-slate-800">${nama}</td>
                <td class="p-3 text-right">${volume}</td>
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

window.filterMaterialPengadaan = function filterMaterialPengadaan(prkId) {
    const select = document.getElementById('mat-pengadaan');
    const componentSelect = document.getElementById('mat-komponen');
    if (!select || !componentSelect) return;

    const programIds = new Set(window.materialInputData.program
        .filter(item => String(item.id_prk) === String(prkId))
        .map(item => String(item.id)));
    const rows = window.materialInputData.pengadaan.filter(item =>
        String(item.id_prk || item.prk_id || item.id_prk_program || '') === String(prkId) ||
        programIds.has(String(item.id_jenis || item.jenis_id))
    );
    select.innerHTML = `<option value="">-- Pilih Pengadaan --</option>${rows.map(item => `<option value="${item.id}">${item.nomor_pengadaan || item.nama_pengadaan || '-'}${item.nomor_pengadaan && item.nama_pengadaan ? ` - ${item.nama_pengadaan}` : ''}</option>`).join('')}`;
    select.disabled = !prkId;
    componentSelect.innerHTML = '<option value="">-- Pilih Pengadaan Dahulu --</option>';
    componentSelect.disabled = true;
};

window.filterMaterialKomponen = function filterMaterialKomponen(pengadaanId) {
    const select = document.getElementById('mat-komponen');
    if (!select) return;
    const rows = window.materialInputData.pekerjaan.filter(item =>
        String(item.pengadaan_id || item.id_pengadaan_prk) === String(pengadaanId)
    );
    select.innerHTML = `<option value="">-- Pilih Komponen Pekerjaan --</option>${rows.map(item => `<option value="${item.id}">${item.nama_komponen || item.nama_pekerjaan || '-'}</option>`).join('')}`;
    select.disabled = !pengadaanId;
};

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
        window.materialBasket = [];
        document.getElementById('mat-prk').value = '';
        document.getElementById('mat-pengadaan').innerHTML = '<option value="">-- Pilih PRK Dahulu --</option>';
        document.getElementById('mat-pengadaan').disabled = true;
        document.getElementById('mat-komponen').innerHTML = '<option value="">-- Pilih Pengadaan Dahulu --</option>';
        document.getElementById('mat-komponen').disabled = true;
        document.getElementById('mat-nama').value     = '';
        document.getElementById('mat-spek').value     = '';
        document.getElementById('mat-volume').value   = '';
        document.getElementById('mat-satuan').value   = '';
        document.getElementById('mat-harga').value    = '0';
        document.getElementById('mat-jasa').value     = '0';
        const titleEl = document.getElementById('modal-material-title');
        if (titleEl) titleEl.innerText = 'Tambah Material Baru';
        renderMaterialBasket();
    } else {
        const titleEl = document.getElementById('modal-material-title');
        if (titleEl) titleEl.innerText = 'Edit Data Material';
        const buttonEl = document.getElementById('btn-save-material');
        if (buttonEl) buttonEl.innerText = 'Update Material';
        renderMaterialBasket();
    }
    modal.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeModalMaterial() {
    const modal = document.getElementById('modal-material');
    if (!modal) return;
    if (!state.editId) {
        window.materialBasket = [];
        renderMaterialBasket();
        document.getElementById('mat-nama').value = '';
    }
    modal.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function editMaterial(id) {
    const list = window.allMaterialList.length > 0 ? window.allMaterialList : (await fetchAPI('action=list&table=Material') || []);
    const item = list.find((m, i) => String(m.id || `row_${i}`) === String(id));
    if (!item) return showToast('Data material tidak ditemukan', 'error');

    state.editId = item.id || id;
    window.materialBasket = [];
    document.getElementById('mat-nama').value     = item.material || item.nama_material || item.uraian || item.nama || item.item || '';
    document.getElementById('mat-spek').value     = item.spesifikasi || '';
    document.getElementById('mat-volume').value   = item.volume || '';
    document.getElementById('mat-satuan').value   = item.satuan || item.unit || '';
    document.getElementById('mat-harga').value    = item.harga || item.harga_material || item.harga_satuan || '0';
    document.getElementById('mat-jasa').value     = item.harga_jasa || item.jasa || '0';
    showModalMaterial(true);
    const component = window.materialInputData.pekerjaan.find(row => String(row.id) === String(item.id_komponen));
    const pengadaanId = component ? (component.pengadaan_id || component.id_pengadaan_prk) : '';
    const pengadaan = window.materialInputData.pengadaan.find(row => String(row.id) === String(pengadaanId));
    const program = window.materialInputData.program.find(row => String(row.id) === String(pengadaan?.id_jenis || pengadaan?.jenis_id));
    const prkId = program?.id_prk || pengadaan?.id_prk || pengadaan?.prk_id || '';
    const prkSelect = document.getElementById('mat-prk');
    if (prkSelect && prkId) {
        prkSelect.value = prkId;
        filterMaterialPengadaan(prkId);
        document.getElementById('mat-pengadaan').value = pengadaanId;
        filterMaterialKomponen(pengadaanId);
        document.getElementById('mat-komponen').value = item.id_komponen || '';
    }
}

async function saveMaterial(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-save-material');
    if (btn) { btn.disabled = true; btn.innerHTML = '⏳ Menyimpan...'; }

    const komponenId = document.getElementById('mat-komponen').value;
    const komponen = window.materialInputData.pekerjaan.find(item => String(item.id) === String(komponenId));
    const namaVal     = document.getElementById('mat-nama').value.trim();
    const spekVal     = document.getElementById('mat-spek').value.trim();
    const volumeVal   = parseFloat(document.getElementById('mat-volume').value) || 0;
    const satuanVal   = document.getElementById('mat-satuan').value.trim() || 'set';
    const hargaVal    = parseFloat(document.getElementById('mat-harga').value) || 0;
    const jasaVal     = parseFloat(document.getElementById('mat-jasa').value) || 0;

    if (!komponenId || !komponen || !namaVal) {
        showToast('Pilih PRK, Pengadaan, Komponen, dan isi nama material.', 'error');
        if (btn) { btn.disabled = false; btn.innerHTML = state.editId ? 'Update Material' : 'Tambah ke Basket'; }
        return;
    }

    const data = {
            material: namaVal, nama_material: namaVal, nama: namaVal, uraian: namaVal,
            satuan: satuanVal,
            harga: hargaVal, harga_material: hargaVal, harga_satuan: hargaVal,
            kategori: komponen.nama_komponen || komponen.nama_pekerjaan || 'PRK',
            keterangan: komponen.nama_komponen || komponen.nama_pekerjaan || 'PRK',
            id_komponen: komponenId,
            pengadaan_id: document.getElementById('mat-pengadaan').value,
            id_pengadaan_prk: document.getElementById('mat-pengadaan').value,
            spesifikasi: spekVal,
            volume: volumeVal,
            harga_jasa: jasaVal, jasa: jasaVal,
            jumlah: volumeVal,
            total_harga: volumeVal * (hargaVal + jasaVal),
            total: volumeVal > 0 ? volumeVal * (hargaVal + jasaVal) : hargaVal
    };

    if (!state.editId) {
        window.materialBasket.push({ ...data, id: `temp_${Date.now()}_${window.materialBasket.length}` });
        renderMaterialBasket();
        document.getElementById('mat-nama').value = '';
        document.getElementById('mat-spek').value = '';
        document.getElementById('mat-volume').value = '';
        showToast('Material ditambahkan ke basket');
        if (btn) { btn.disabled = false; btn.innerHTML = 'Tambah ke Basket'; }
        return;
    }

    const payload = { action: 'update', table: 'Material', user: state.currentUser ? state.currentUser.nama : 'Admin', data: { id: state.editId, ...data } };

    const res = await fetchAPI('', 'POST', payload);
    if (btn) { btn.disabled = false; btn.innerHTML = 'Update Material'; }
    if (res) {
        showToast('Data Material berhasil diperbarui');
        closeModalMaterial();
        loadMaterialData();
    }
}

function renderMaterialBasket() {
    const target = document.getElementById('material-basket');
    if (!target) return;
    if (!window.materialBasket.length) {
        target.innerHTML = '<div class="p-4 text-center text-slate-400 border border-dashed rounded-lg text-sm">Basket masih kosong.</div>';
        return;
    }
    target.innerHTML = `<div class="border border-slate-200 rounded-lg overflow-hidden"><div class="p-3 bg-slate-50 flex justify-between items-center"><strong class="text-sm text-slate-700">Basket Material (${window.materialBasket.length})</strong><button type="button" onclick="saveMaterialBasket()" class="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold">Simpan Semua ke Sheet</button></div><div class="overflow-x-auto"><table class="w-full text-xs"><thead class="bg-slate-100"><tr><th class="p-2 text-left">Komponen</th><th class="p-2 text-left">Material / Spesifikasi</th><th class="p-2 text-right">Volume</th><th class="p-2 text-left">Satuan</th><th class="p-2 text-right">Harga Material</th><th class="p-2 text-right">Harga Jasa</th><th class="p-2 text-right">Total</th><th class="p-2 text-center">Aksi</th></tr></thead><tbody class="divide-y divide-slate-100">${window.materialBasket.map((item, index) => { const volume = Number(item.volume) || 0; const hargaMaterial = Number(item.harga) || 0; const hargaJasa = Number(item.harga_jasa) || 0; const total = volume * (hargaMaterial + hargaJasa); return `<tr><td class="p-2">${item.kategori}</td><td class="p-2 font-medium">${item.material}${item.spesifikasi ? `<br><span class="text-slate-400">${item.spesifikasi}</span>` : ''}</td><td class="p-2 text-right">${volume || 0}</td><td class="p-2">${item.satuan || '-'}</td><td class="p-2 text-right">${CONFIG.formatCurrency(hargaMaterial)}</td><td class="p-2 text-right text-amber-700">${CONFIG.formatCurrency(hargaJasa)}</td><td class="p-2 text-right font-semibold text-emerald-700">${CONFIG.formatCurrency(total)}</td><td class="p-2 text-center"><button type="button" onclick="removeMaterialBasket(${index})" class="text-red-500">Hapus</button></td></tr>`; }).join('')}</tbody></table></div></div>`;
}

window.removeMaterialBasket = function removeMaterialBasket(index) {
    window.materialBasket.splice(index, 1);
    renderMaterialBasket();
};

window.saveMaterialBasket = async function saveMaterialBasket() {
    if (!window.materialBasket.length) return showToast('Basket material masih kosong.', 'error');
    const currentUser = state.currentUser ? state.currentUser.nama : 'Admin';
    const items = window.materialBasket.map(item => ({ ...item, id: undefined }));
    const result = await fetchAPI('', 'POST', {
        action: 'simpanMaterialBatch',
        table: 'Material',
        user: currentUser,
        dataMaterial: items
    });
    if (result) {
        showToast(`${items.length} material berhasil disimpan ke Sheet`);
        window.materialBasket = [];
        closeModalMaterial();
        loadMaterialData();
    } else {
        showToast('Material gagal disimpan ke Sheet.', 'error');
    }
};

