// ==========================================
// js/modules/kontrak.js
// Modul Data Kontrak Pekerjaan
// ==========================================

window.renderKontrak = async function renderKontrak() {
    const contentArea = document.getElementById('app-content');
    if (!contentArea) return;

    const [pekerjaanList, penyediaList] = await Promise.all([
        fetchWithCache('Pekerjaan'),
        fetchWithCache('Penyedia')
    ]);
    window.allPekerjaanListKontrak = Array.isArray(pekerjaanList) ? pekerjaanList : [];
    window.allPenyediaListKontrak  = Array.isArray(penyediaList)  ? penyediaList  : [];

    let optPekerjaan = '<option value="">-- Pilih Nama Pekerjaan --</option>';
    window.allPekerjaanListKontrak.forEach(p => {
        const label = (p.nomor_paket ? p.nomor_paket + ' - ' : '') + p.nama_pekerjaan;
        optPekerjaan += `<option value="${p.nama_pekerjaan}" data-id="${p.id}">${label}</option>`;
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
                                <label class="block text-sm font-semibold text-slate-700 mb-1">Nama Pekerjaan <span class="text-[10px] font-normal text-brand ml-1">← sinkron</span></label>
                                <select id="kontrak-pekerjaan" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-brand outline-none bg-white">${optPekerjaan}</select>
                                <input type="text" id="kontrak-pekerjaan-manual" placeholder="Atau ketik manual..." class="w-full mt-1.5 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:border-brand outline-none text-slate-600 bg-slate-50">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-slate-700 mb-1">Nama Penyedia <span class="text-[10px] font-normal text-brand ml-1">← sinkron</span></label>
                                <select id="kontrak-penyedia" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-brand outline-none bg-white">${optPenyedia}</select>
                                <input type="text" id="kontrak-penyedia-manual" placeholder="Atau ketik manual..." class="w-full mt-1.5 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:border-brand outline-none text-slate-600 bg-slate-50">
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

    const statusBadgeMap = {
        'Aktif':       'bg-green-100 text-green-700',
        'On Progress': 'bg-blue-100 text-blue-700',
        'Selesai':     'bg-gray-100 text-gray-700',
        'Tunda':       'bg-yellow-100 text-yellow-700',
        'Batal':       'bg-red-100 text-red-700'
    };

    let html = `
        <div class="overflow-x-auto rounded-lg border border-slate-200">
            <table class="w-full text-left border-collapse whitespace-nowrap text-xs">
                <thead>
                    <tr class="bg-slate-100 border-b border-slate-200 uppercase text-slate-700 font-semibold">
                        <th class="px-4 py-3 text-center w-12">No</th>
                        <th class="px-4 py-3">Pekerjaan & Penyedia</th>
                        <th class="px-4 py-3">Nomor Kontrak</th>
                        <th class="px-4 py-3 text-right">Nilai Kontrak (Rp)</th>
                        <th class="px-4 py-3">Masa Pelaksanaan</th>
                        <th class="px-4 py-3 text-center">Status</th>
                        <th class="px-4 py-3 text-center w-20">Aksi</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 text-slate-700">
    `;

    if (kontrakList.length === 0) {
        html += '<tr><td colspan="7" class="px-4 py-8 text-center text-slate-400 italic">Belum ada data kontrak tercatat.</td></tr>';
    } else {
        kontrakList.forEach((k, index) => {
            const status      = k.status || 'Aktif';
            const badgeClass  = statusBadgeMap[status] || 'bg-slate-100 text-slate-700';
            const statusBadge = `<span class="px-2 py-1 ${badgeClass} rounded text-[10px] font-semibold">${status}</span>`;
            html += `
                <tr class="hover:bg-slate-50 transition-colors">
                    <td class="px-4 py-3 text-center text-slate-500">${index + 1}</td>
                    <td class="px-4 py-3 font-medium text-slate-700">${k.nama_pekerjaan || '-'}<br><span class="text-[10px] text-slate-500">${k.nama_penyedia || '-'}</span></td>
                    <td class="px-4 py-3 font-bold text-slate-800">${k.nomor_kontrak}</td>
                    <td class="px-4 py-3 text-right font-semibold text-emerald-600">${CONFIG.formatCurrency(k.nilai_kontrak)}</td>
                    <td class="px-4 py-3 text-slate-600">${k.tanggal_mulai || '-'} s.d ${k.tanggal_selesai || '-'}</td>
                    <td class="px-4 py-3 text-center">${statusBadge}</td>
                    <td class="px-4 py-3 text-center flex justify-center gap-2">
                        <button onclick="editKontrak('${k.id}')" class="text-blue-500 hover:text-blue-700 p-1"><i data-lucide="edit" class="w-4 h-4"></i></button>
                        <button onclick="deleteData('Kontrak', '${k.id}', loadKontrakData)" class="text-red-400 hover:text-red-600 p-1"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                    </td>
                </tr>`;
        });
    }
    html += `</tbody></table></div>`;
    container.innerHTML = html;
    lucide.createIcons();
}

function showModalKontrak(isEdit = false) {
    if (!isEdit) {
        state.editId = null;
        ['kontrak-nomor','kontrak-pekerjaan','kontrak-pekerjaan-manual','kontrak-penyedia','kontrak-penyedia-manual','kontrak-nilai','kontrak-tanggal','kontrak-mulai','kontrak-selesai'].forEach(id => {
            const el = document.getElementById(id); if (el) el.value = '';
        });
        const statusEl = document.getElementById('kontrak-status');
        if (statusEl) statusEl.value = 'Aktif';
        const titleEl = document.getElementById('modal-kontrak-title');
        if (titleEl) titleEl.innerText = 'Tambah Kontrak Baru';
        document.getElementById('btn-save-kontrak').innerHTML = 'Simpan Kontrak';
    }
    const modal = document.getElementById('modal-kontrak');
    if (!modal) return;
    modal.classList.remove('hidden');
    setTimeout(() => { modal.classList.remove('opacity-0'); modal.querySelector('div').classList.remove('scale-95'); }, 10);
}

function closeModalKontrak() {
    const modal = document.getElementById('modal-kontrak');
    if (!modal) return;
    modal.classList.add('opacity-0'); modal.querySelector('div').classList.add('scale-95');
    setTimeout(() => modal.classList.add('hidden'), 300);
}

async function editKontrak(id) {
    const list = await fetchAPI('action=list&table=Kontrak') || [];
    const item = list.find(k => k.id === id);
    if (!item) return showToast('Data tidak ditemukan', 'error');

    state.editId = id;
    document.getElementById('kontrak-nomor').value  = item.nomor_kontrak || '';
    document.getElementById('kontrak-nilai').value  = item.nilai_kontrak || '';
    document.getElementById('kontrak-tanggal').value = item.tanggal_kontrak || '';
    document.getElementById('kontrak-mulai').value  = item.tanggal_mulai || '';
    document.getElementById('kontrak-selesai').value = item.tanggal_selesai || '';
    const statusEl = document.getElementById('kontrak-status');
    if (statusEl) statusEl.value = item.status || 'Aktif';

    const selPek = document.getElementById('kontrak-pekerjaan');
    const selPen = document.getElementById('kontrak-penyedia');
    if (selPek) {
        const optExists = Array.from(selPek.options).some(o => o.value === item.nama_pekerjaan);
        selPek.value = optExists ? item.nama_pekerjaan : '';
        document.getElementById('kontrak-pekerjaan-manual').value = optExists ? '' : (item.nama_pekerjaan || '');
    }
    if (selPen) {
        const optExists = Array.from(selPen.options).some(o => o.value === item.nama_penyedia);
        selPen.value = optExists ? item.nama_penyedia : '';
        document.getElementById('kontrak-penyedia-manual').value = optExists ? '' : (item.nama_penyedia || '');
    }

    const titleEl = document.getElementById('modal-kontrak-title');
    if (titleEl) titleEl.innerText = 'Edit Kontrak';
    document.getElementById('btn-save-kontrak').innerHTML = 'Update Kontrak';
    showModalKontrak(true);
}

async function saveKontrak(event) {
    event.preventDefault();
    const btn = document.getElementById('btn-save-kontrak');
    if (btn) { btn.disabled = true; btn.innerHTML = 'Menyimpan...'; }

    const selPekEl    = document.getElementById('kontrak-pekerjaan');
    const manualPekEl = document.getElementById('kontrak-pekerjaan-manual');
    const namaPekerjaan = (selPekEl && selPekEl.value) ? selPekEl.value : (manualPekEl ? manualPekEl.value : '');
    let pekerjaanId = '';
    if (selPekEl && selPekEl.value) {
        const selectedOption = selPekEl.options[selPekEl.selectedIndex];
        pekerjaanId = selectedOption ? selectedOption.dataset.id || '' : '';
    }

    const selPenEl    = document.getElementById('kontrak-penyedia');
    const manualPenEl = document.getElementById('kontrak-penyedia-manual');
    const namaPenyedia = (selPenEl && selPenEl.value) ? selPenEl.value : (manualPenEl ? manualPenEl.value : '');

    const data = {
        pekerjaan_id:   pekerjaanId,
        nomor_kontrak:  document.getElementById('kontrak-nomor').value,
        nama_pekerjaan: namaPekerjaan,
        nama_penyedia:  namaPenyedia,
        nilai_kontrak:  document.getElementById('kontrak-nilai').value,
        tanggal_kontrak: document.getElementById('kontrak-tanggal').value,
        tanggal_mulai:  document.getElementById('kontrak-mulai').value,
        tanggal_selesai: document.getElementById('kontrak-selesai').value,
        status:         document.getElementById('kontrak-status')?.value || 'Aktif'
    };

    const isUpdate    = state.editId && !String(state.editId).startsWith('temp_');
    const currentUser = state.currentUser ? state.currentUser.nama : 'Admin';

    try {
        let result = false;
        if (isUpdate) {
            await fetchAPI(`action=delete&table=Kontrak&id=${encodeURIComponent(state.editId)}&user=${encodeURIComponent(currentUser)}`, 'POST', {});
            result = await fetchAPI('', 'POST', { action: 'create', table: 'Kontrak', user: currentUser, data });
        } else {
            result = await fetchAPI('', 'POST', { action: 'create', table: 'Kontrak', user: currentUser, data });
        }
        if (result) {
            if (pekerjaanId && pekerjaanId !== 'UNKNOWN') {
                const jenisAktivitas = isUpdate ? 'Update Kontrak' : 'Tambah Kontrak';
                const catatan = `${jenisAktivitas} "${data.nomor_kontrak}" - Penyedia: ${data.nama_penyedia}, Nilai: ${CONFIG.formatCurrency(data.nilai_kontrak)}`;
                await logAktivitas(pekerjaanId, jenisAktivitas, catatan, currentUser);
            }
            showToast(isUpdate ? 'Kontrak diperbarui' : 'Kontrak berhasil disimpan');
            closeModalKontrak();
            state.editId = null;
            loadKontrakData();
        } else {
            throw new Error('Gagal menyimpan data ke Google Sheets');
        }
    } catch (error) {
        showToast('Gagal menyimpan data kontrak: ' + error.message, 'error');
    }

    if (btn) { btn.disabled = false; btn.innerHTML = 'Simpan Kontrak'; }
}

