// ==========================================
// js/modules/realisasi.js
// Modul Input Data Realisasi
// ==========================================

window.renderRealisasi = async function renderRealisasi() {
    const contentArea = document.getElementById('app-content');
    const [pekerjaanList, kontrakList] = await Promise.all([
        fetchWithCache('Pekerjaan'),
        fetchWithCache('Kontrak')
    ]);
    window.allPekerjaanList = pekerjaanList;
    window.allKontrakListRealisasi = kontrakList || [];

    let dropdownOptions = '<option value="">-- Pilih Paket Pekerjaan --</option>';
    pekerjaanList.forEach(p => {
        const nomor = p.nomor_paket || '-';
        dropdownOptions += `<option value="${p.id}">${nomor} : ${p.nama_pekerjaan}</option>`;
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
                <select id="select-pekerjaan-realisasi" onchange="handleSelectPekerjaanRealisasi(this.value)"
                    class="w-full md:w-1/2 border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 shadow-sm">
                    ${dropdownOptions}
                </select>
            </div>

            <div id="realisasi-ringkasan-kontrak" class="hidden grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6"></div>

            <div id="realisasi-table-container">
                <div class="text-center py-12 text-slate-400 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                    <i data-lucide="trending-up" class="w-12 h-12 mx-auto mb-3 text-slate-300"></i>
                    <p>Silakan pilih paket pekerjaan terlebih dahulu.</p>
                </div>
            </div>
        </div>

        <!-- MODAL REALISASI -->
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
                                <label class="block text-sm font-medium text-slate-700 mb-1">Nomor Termin</label>
                                <input type="number" min="1" id="realisasi-termin-ke" required class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 outline-none">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-slate-700 mb-1">Nilai Terserap (Rp)</label>
                                <input type="number" id="realisasi-nilai" required class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 outline-none">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-slate-700 mb-1">Progress Fisik (%)</label>
                                <input type="number" step="0.01" max="100" id="realisasi-progress" required class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 outline-none">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-slate-700 mb-1">Status Pembayaran</label>
                                <select id="realisasi-status-pembayaran" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 outline-none bg-white">
                                    <option value="Belum Dibayar">Belum Dibayar</option>
                                    <option value="Diproses">Diproses</option>
                                    <option value="Dibayar">Dibayar</option>
                                </select>
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
        state.selectedPekerjaanNamaRealisasi   = selectedObj ? selectedObj.nama_pekerjaan : '';
        state.selectedPengadaanIdRealisasi     = selectedObj ? (selectedObj.pengadaan_id || '') : '';
        state.selectedPengadaanNamaRealisasi   = selectedObj ? (selectedObj.nama_pengadaan || '') : '';
    }
    const btnAdd = document.getElementById('btn-add-realisasi');
    const ringkasan = document.getElementById('realisasi-ringkasan-kontrak');
    if (id) {
        if (btnAdd) btnAdd.classList.remove('hidden');
        renderRingkasanKontrakRealisasi(id);
        loadRealisasiData(id);
    } else {
        if (btnAdd) btnAdd.classList.add('hidden');
        if (ringkasan) ringkasan.classList.add('hidden');
        const container = document.getElementById('realisasi-table-container');
        if (container) container.innerHTML = '<div class="text-center py-12 text-slate-400 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200"><p>Silakan pilih paket pekerjaan terlebih dahulu.</p></div>';
    }
}

async function renderRingkasanKontrakRealisasi(pekerjaanId) {
    const ringkasan = document.getElementById('realisasi-ringkasan-kontrak');
    if (!ringkasan) return;
    const kontrak = (window.allKontrakListRealisasi || []).find(item => String(item.pekerjaan_id) === String(pekerjaanId));
    const realisasi = await fetchAPI('action=list&table=Realisasi') || [];
    const totalRealisasi = realisasi
        .filter(item => String(item.pekerjaan_id) === String(pekerjaanId))
        .reduce((sum, item) => sum + (Number(item.nilai) || 0), 0);
    const nilaiKontrak = Number(kontrak?.nilai_kontrak) || 0;
    const sisa = nilaiKontrak - totalRealisasi;
    const jumlahTermin = realisasi.filter(item => String(item.pekerjaan_id) === String(pekerjaanId)).length;

    ringkasan.classList.remove('hidden');
    ringkasan.innerHTML = `
        <div class="bg-blue-50 border border-blue-100 rounded-lg p-3"><p class="text-xs text-slate-500">Nilai Kontrak</p><p class="font-bold text-brand mt-1">${CONFIG.formatCurrency(nilaiKontrak)}</p></div>
        <div class="bg-emerald-50 border border-emerald-100 rounded-lg p-3"><p class="text-xs text-slate-500">Total Realisasi</p><p class="font-bold text-emerald-600 mt-1">${CONFIG.formatCurrency(totalRealisasi)}</p></div>
        <div class="bg-amber-50 border border-amber-100 rounded-lg p-3"><p class="text-xs text-slate-500">Sisa Kontrak</p><p class="font-bold text-amber-600 mt-1">${CONFIG.formatCurrency(sisa > 0 ? sisa : 0)}</p></div>`;
    window.realisasiTerminBerikutnya = jumlahTermin + 1;
}

async function loadRealisasiData(pekerjaanId) {
    const container = document.getElementById('realisasi-table-container');
    if (!container) return;
    container.innerHTML = '<div class="flex justify-center py-12"><div class="loader"></div></div>';

    const allRealisasi  = await fetchAPI('action=list&table=Realisasi');
    const realisasiList = (allRealisasi || []).filter(item => String(item.pekerjaan_id) === String(pekerjaanId));

    if (realisasiList.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12 text-slate-400 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                <i data-lucide="inbox" class="w-12 h-12 mx-auto mb-3 text-slate-300"></i>
                <p class="font-medium">Belum ada data realisasi untuk pekerjaan ini.</p>
                <p class="text-xs mt-1">Klik tombol "Input Realisasi" untuk menambahkan.</p>
            </div>`;
        lucide.createIcons(); return;
    }

    let totalNilai    = 0;
    let totalProgress = 0;
    let rows = '';
    realisasiList.forEach((r, i) => {
        const nilai    = parseFloat(r.nilai) || 0;
        const progress = parseFloat(r.progress) || 0;
        totalNilai    += nilai;
        totalProgress += progress;
        rows += `
            <tr class="hover:bg-slate-50 transition-colors">
                <td class="px-4 py-3 text-center text-slate-500">${i + 1}</td>
                <td class="px-4 py-3 text-center font-semibold text-brand">${r.termin_ke || r.termin || i + 1}</td>
                <td class="px-4 py-3 font-medium">${CONFIG.formatDate(r.tanggal)}</td>
                <td class="px-4 py-3 text-right font-semibold text-emerald-600">${CONFIG.formatCurrency(nilai)}</td>
                <td class="px-4 py-3 text-center">
                    <div class="flex items-center gap-2 justify-center">
                        <div class="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div class="bg-emerald-500 h-full rounded-full" style="width:${Math.min(progress,100)}%"></div>
                        </div>
                        <span class="text-xs font-bold text-slate-700">${progress}%</span>
                    </div>
                </td>
                <td class="px-4 py-3 text-slate-500 text-xs">${r.keterangan || '-'}</td>
                <td class="px-4 py-3 text-center text-xs">${r.status_pembayaran || 'Belum Dibayar'}</td>
                <td class="px-4 py-3 text-center flex justify-center gap-2">
                    <button onclick="editRealisasi('${r.id}')" class="text-blue-500 hover:text-blue-700 p-1"><i data-lucide="edit" class="w-4 h-4"></i></button>
                    <button onclick="deleteRealisasi('${r.id}')" class="text-red-400 hover:text-red-600 p-1"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                </td>
            </tr>`;
    });

    container.innerHTML = `
        <div class="overflow-x-auto rounded-lg border border-slate-200">
            <table class="w-full text-left border-collapse whitespace-nowrap text-sm">
                <thead>
                    <tr class="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold">
                        <th class="px-4 py-3 text-center w-12">No</th>
                        <th class="px-4 py-3 text-center">Termin</th>
                        <th class="px-4 py-3">Tanggal</th>
                        <th class="px-4 py-3 text-right">Nilai Terserap (Rp)</th>
                        <th class="px-4 py-3 text-center">Progress Fisik</th>
                        <th class="px-4 py-3">Keterangan</th>
                        <th class="px-4 py-3 text-center">Status Pembayaran</th>
                        <th class="px-4 py-3 text-center w-20">Aksi</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">${rows}</tbody>
                <tfoot class="bg-emerald-50 border-t-2 border-emerald-200">
                    <tr class="font-bold text-slate-800">
                        <td colspan="3" class="px-4 py-3 text-right">TOTAL KUMULATIF</td>
                        <td class="px-4 py-3 text-right text-emerald-600">${CONFIG.formatCurrency(totalNilai)}</td>
                        <td class="px-4 py-3 text-center text-brand">${totalProgress.toFixed(1)}%</td>
                        <td colspan="3"></td>
                    </tr>
                </tfoot>
            </table>
        </div>`;
    lucide.createIcons();
}

function showModalRealisasi() {
    const modal = document.getElementById('modal-realisasi');
    if (!modal) return;
    state.editingRealisasiId = null;
    document.getElementById('realisasi-termin-ke').value = window.realisasiTerminBerikutnya || 1;
    document.getElementById('realisasi-tanggal').value  = new Date().toISOString().split('T')[0];
    document.getElementById('realisasi-nilai').value    = '';
    document.getElementById('realisasi-progress').value = '';
    document.getElementById('realisasi-status-pembayaran').value = 'Belum Dibayar';
    document.getElementById('realisasi-ket').value      = '';
    const modalTitle = document.querySelector('#modal-realisasi h3');
    if (modalTitle) modalTitle.innerText = 'Tambah Riwayat Realisasi';
    const saveBtn = document.getElementById('btn-save-realisasi');
    if (saveBtn) saveBtn.innerText = 'Simpan Realisasi';
    modal.classList.remove('hidden');
    setTimeout(() => { modal.classList.remove('opacity-0'); modal.querySelector('div').classList.remove('scale-95'); }, 10);
}

async function editRealisasi(id) {
    const allRealisasi = await fetchAPI('action=list&table=Realisasi');
    const realisasi    = (allRealisasi || []).find(item => String(item.id) === String(id));
    if (!realisasi) { showToast('Data realisasi tidak ditemukan', 'error'); return; }

    state.editingRealisasiId = id;
    document.getElementById('realisasi-tanggal').value  = realisasi.tanggal;
    document.getElementById('realisasi-termin-ke').value = realisasi.termin_ke || realisasi.termin || '';
    document.getElementById('realisasi-nilai').value    = realisasi.nilai;
    document.getElementById('realisasi-progress').value = realisasi.progress;
    document.getElementById('realisasi-status-pembayaran').value = realisasi.status_pembayaran || 'Belum Dibayar';
    document.getElementById('realisasi-ket').value      = realisasi.keterangan || '';

    const modalTitle = document.querySelector('#modal-realisasi h3');
    if (modalTitle) modalTitle.innerText = 'Edit Riwayat Realisasi';
    const saveBtn = document.getElementById('btn-save-realisasi');
    if (saveBtn) saveBtn.innerText = 'Update Realisasi';

    const modal = document.getElementById('modal-realisasi');
    if (!modal) return;
    modal.classList.remove('hidden');
    setTimeout(() => { modal.classList.remove('opacity-0'); modal.querySelector('div').classList.remove('scale-95'); }, 10);
}

function closeModalRealisasi() {
    const modal = document.getElementById('modal-realisasi');
    if (!modal) return;
    modal.classList.add('opacity-0');
    modal.querySelector('div').classList.add('scale-95');
    setTimeout(() => modal.classList.add('hidden'), 300);
    state.editingRealisasiId = null;
}

async function saveRealisasi(event) {
    event.preventDefault();
    if (!state.selectedPekerjaanRealisasi) return;

    const btn = document.getElementById('btn-save-realisasi');
    if (btn) { btn.disabled = true; btn.innerHTML = 'Menyimpan...'; }

    const data = {
        pengadaan_id:          state.selectedPengadaanIdRealisasi,
        nama_pengadaan:        state.selectedPengadaanNamaRealisasi,
        pekerjaan_id:          state.selectedPekerjaanRealisasi,
        nama_pekerjaan:        state.selectedPekerjaanNamaRealisasi,
        tanggal:               document.getElementById('realisasi-tanggal').value,
        termin_ke:             document.getElementById('realisasi-termin-ke').value,
        nilai:                 document.getElementById('realisasi-nilai').value,
        progress:              document.getElementById('realisasi-progress').value,
        status_pembayaran:     document.getElementById('realisasi-status-pembayaran').value,
        keterangan:            document.getElementById('realisasi-ket').value
    };

    const isUpdate    = state.editingRealisasiId && !String(state.editingRealisasiId).startsWith('temp_');
    const currentUser = state.currentUser ? state.currentUser.nama : 'Admin';

    try {
        const nilaiTerminBaru = Number(data.nilai) || 0;
        const limitResult = await fetchAPI('', 'POST', {
            action: 'cekLimitRealisasi',
            table: 'Realisasi',
            pekerjaan_id: state.selectedPekerjaanRealisasi,
            nilai_termin_baru: nilaiTerminBaru,
            realisasi_id: isUpdate ? state.editingRealisasiId : ''
        });

        if (!limitResult) throw new Error('Validasi batas kontrak gagal.');
        if (limitResult.error || limitResult.success === false) {
            throw new Error(limitResult.message || 'Nilai termin melebihi nilai kontrak.');
        }

        let result = false;
        if (isUpdate) {
            await fetchAPI(`action=delete&table=Realisasi&id=${encodeURIComponent(state.editingRealisasiId)}&user=${encodeURIComponent(currentUser)}`, 'POST', {});
            result = await fetchAPI('', 'POST', { action: 'create', table: 'Realisasi', user: currentUser, data });
        } else {
            result = await fetchAPI('', 'POST', { action: 'create', table: 'Realisasi', user: currentUser, data });
        }
        if (result) {
            showToast(isUpdate ? 'Data realisasi berhasil diperbarui' : 'Data realisasi berhasil ditambahkan');
            closeModalRealisasi();
            state.editingRealisasiId = null;
            loadRealisasiData(state.selectedPekerjaanRealisasi);
        } else {
            throw new Error('Gagal menyimpan data ke Google Sheets');
        }
    } catch (error) {
        showToast('Gagal menyimpan data realisasi: ' + error.message, 'error');
    }

    if (btn) { btn.disabled = false; btn.innerHTML = 'Simpan Realisasi'; }
}

async function deleteRealisasi(id) {
    if (!confirm('Hapus riwayat realisasi ini?')) return;
    const result = await fetchAPI('', 'POST', {
        action: 'delete', table: 'Realisasi', id: id,
        user: state.currentUser ? state.currentUser.nama : 'Admin'
    });
    if (result) {
        showToast('Realisasi dihapus');
        loadRealisasiData(state.selectedPekerjaanRealisasi);
    }
}

