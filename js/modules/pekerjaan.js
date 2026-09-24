// ==========================================
// js/modules/pekerjaan.js
// Modul Master Data Pekerjaan
// ==========================================

window.renderPekerjaan = async function renderPekerjaan() {
    const contentArea = document.getElementById('app-content');

    const pengadaanList = await fetchWithCache('Pengadaan') || [];
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
                                <label class="block text-sm font-medium mb-1">Volume Paket</label>
                                <input type="text" id="pek-volume" placeholder="Contoh: 500 meter" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand">
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium mb-1">Jenis Tegangan</label>
                                <select id="pek-tegangan" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand bg-white">
                                    <option value="">-- Pilih --</option>
                                    <option value="JTM">JTM (Jaringan Tegangan Menengah)</option>
                                    <option value="JTR">JTR (Jaringan Tegangan Rendah)</option>
                                    <option value="Gardu">Gardu Distribusi</option>
                                    <option value="SR/APP">Sambungan Rumah / APP</option>
                                    <option value="Umum">Umum / Lainnya</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium mb-1">Lokasi / ULP</label>
                                <input type="text" id="pek-lokasi" placeholder="Contoh: ULP Tabanan" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand">
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium mb-1">Tahun Anggaran</label>
                                <input type="number" id="pek-tahun" value="${new Date().getFullYear()}" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand">
                            </div>
                            <div>
                                <label class="block text-sm font-medium mb-1">Sumber Anggaran</label>
                                <input type="text" id="pek-sumber" placeholder="APLN / APBN / dll" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand">
                            </div>
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
    const container = document.getElementById('pekerjaan-table-container');
    if (!container) return;
    container.innerHTML = '<div class="flex justify-center py-12"><div class="loader"></div></div>';

    const data = await fetchAPI('action=list&table=Pekerjaan') || [];
    let html = `
        <div class="overflow-x-auto rounded-lg border border-slate-200">
            <table class="w-full text-left border-collapse text-xs whitespace-nowrap">
                <thead class="bg-slate-100 text-slate-700 font-semibold">
                    <tr>
                        <th class="p-3 text-center w-10">No</th>
                        <th class="p-3">Nomor Paket</th>
                        <th class="p-3">Nama Pekerjaan</th>
                        <th class="p-3">Jenis</th>
                        <th class="p-3">Lokasi</th>
                        <th class="p-3">Tahun</th>
                        <th class="p-3 text-center w-20">Aksi</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
    `;

    if (data.length === 0) {
        html += '<tr><td colspan="7" class="p-8 text-center text-slate-400 italic">Belum ada data pekerjaan.</td></tr>';
    } else {
        data.forEach((p, i) => {
            const teganganBadge = p.jenis_tegangan
                ? `<span class="px-1.5 py-0.5 rounded text-[10px] font-bold ${p.jenis_tegangan === 'JTM' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'}">${p.jenis_tegangan}</span>`
                : '';
            const statusPekerjaan = String(p.status || '').trim().toLowerCase();
            let tombolWorkflow = '';

            if (statusPekerjaan === 'draft') {
                tombolWorkflow = `<button onclick="handlePekerjaanAction('tender', '${p.id}')" class="text-emerald-600 hover:text-emerald-800 text-[10px] font-semibold">Tender</button>`;
            } else if (statusPekerjaan === 'tender selesai') {
                tombolWorkflow = `<button onclick="handlePekerjaanAction('koreksi-rab', '${p.id}')" class="text-amber-600 hover:text-amber-800 text-[10px] font-semibold">Koreksi RAB</button>`;
            } else if (statusPekerjaan === 'menunggu pa' || statusPekerjaan === 'rab terkoreksi') {
                const actionLabel = statusPekerjaan === 'rab terkoreksi' ? 'Kirim ke PA' : 'Review PA';
                tombolWorkflow = `<button onclick="handlePekerjaanAction('review-pa', '${p.id}')" class="text-amber-600 hover:text-amber-800 text-[10px] font-semibold">${actionLabel}</button>`;
            } else if (statusPekerjaan === 'disetujui pa') {
                tombolWorkflow = `<button onclick="handlePekerjaanAction('buat-kontrak', '${p.id}')" class="text-brand hover:text-sky-700 text-[10px] font-semibold">Buat Kontrak</button>`;
            }

            html += `
                <tr class="hover:bg-slate-50 transition-colors">
                    <td class="p-3 text-center text-slate-500">${i + 1}</td>
                    <td class="p-3 font-semibold text-brand">${p.nomor_paket || '-'}</td>
                    <td class="p-3 font-medium text-slate-800">${p.nama_pekerjaan}</td>
                    <td class="p-3">${p.jenis_kegiatan || '-'} ${teganganBadge}</td>
                    <td class="p-3 text-slate-600">${p.lokasi || '-'}</td>
                    <td class="p-3 text-center font-semibold">${p.tahun_anggaran || '-'}</td>
                    <td class="p-3 text-center flex justify-center gap-2">
                        ${tombolWorkflow}
                        <button onclick="editPekerjaan('${p.id}')" class="text-blue-500 hover:text-blue-700 p-1"><i data-lucide="edit" class="w-4 h-4"></i></button>
                        <button onclick="deleteData('Pekerjaan', '${p.id}', loadPekerjaanData)" class="text-red-400 hover:text-red-600 p-1"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                    </td>
                </tr>`;
        });
    }

    html += `</tbody></table></div>`;
    container.innerHTML = html;
    lucide.createIcons();
}

window.handlePekerjaanAction = async function handlePekerjaanAction(action, pekerjaanId) {
    if (action === 'tender') {
        showToast(`Pekerjaan ${pekerjaanId} siap diproses ke Tender`, 'info');
    } else if (action === 'koreksi-rab') {
        showToast(`Pekerjaan ${pekerjaanId} siap diproses ke Koreksi RAB`, 'info');
    } else if (action === 'review-pa') {
        const pekerjaanList = await fetchWithCache('Pekerjaan');
        const pekerjaan = (pekerjaanList || []).find(item => String(item.id) === String(pekerjaanId));
        if (String(pekerjaan?.status || '').toLowerCase() === 'rab terkoreksi') {
            const result = await fetchAPI('', 'POST', { action: 'update', table: 'Pekerjaan', data: { id: pekerjaanId, status: 'Menunggu PA' } });
            if (!result) return;
            invalidateCache('Pekerjaan');
        }
        navigate('workflow');
        setTimeout(() => {
            switchWorkflowTab('pa');
            const select = document.getElementById('workflow-pa-pekerjaan');
            if (select) {
                select.value = pekerjaanId;
                loadWorkflowPASummary(pekerjaanId);
            }
        }, 150);
    } else if (action === 'buat-kontrak') {
        showToast(`Pekerjaan ${pekerjaanId} siap diproses ke Kontrak`, 'info');
    }
};

function showModalPekerjaan(isEdit = false) {
    if (!isEdit) {
        state.editId = null;
        ['pek-pengadaan','pek-nomor','pek-nama','pek-jenis','pek-volume','pek-tegangan','pek-lokasi','pek-sumber'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        const tahunEl = document.getElementById('pek-tahun');
        if (tahunEl) tahunEl.value = new Date().getFullYear();
    }
    const modal = document.getElementById('modal-pekerjaan');
    if (!modal) return;
    modal.classList.remove('hidden');
    setTimeout(() => { modal.classList.remove('opacity-0'); modal.querySelector('div').classList.remove('scale-95'); }, 10);
}

function closeModalPekerjaan() {
    document.getElementById('modal-pekerjaan').classList.add('hidden', 'opacity-0');
}

async function editPekerjaan(id) {
    const list = await fetchAPI('action=list&table=Pekerjaan') || [];
    const item = list.find(p => p.id === id);
    if (!item) return showToast('Data tidak ditemukan', 'error');

    state.editId = id;
    document.getElementById('pek-pengadaan').value = item.pengadaan_id || '';
    document.getElementById('pek-nomor').value     = item.nomor_paket || '';
    document.getElementById('pek-nama').value      = item.nama_pekerjaan || '';
    document.getElementById('pek-jenis').value     = item.jenis_kegiatan || '';
    document.getElementById('pek-volume').value    = item.volume_paket || '';
    document.getElementById('pek-tegangan').value  = item.jenis_tegangan || '';
    document.getElementById('pek-lokasi').value    = item.lokasi || '';
    document.getElementById('pek-tahun').value     = item.tahun_anggaran || new Date().getFullYear();
    document.getElementById('pek-sumber').value    = item.sumber_anggaran || '';
    showModalPekerjaan(true);
}

async function savePekerjaan(e) {
    e.preventDefault();
    const selPengadaan  = document.getElementById('pek-pengadaan');
    const namaPengadaan = selPengadaan.options[selPengadaan.selectedIndex]?.dataset.nama || '';
    const currentUser   = state.currentUser ? state.currentUser.nama : 'Admin';

    const payload = {
        action: state.editId ? 'update' : 'create',
        table: 'Pekerjaan',
        user: currentUser,
        data: {
            pengadaan_id:    selPengadaan.value,
            nama_pengadaan:  namaPengadaan,
            nomor_paket:     document.getElementById('pek-nomor').value,
            nama_pekerjaan:  document.getElementById('pek-nama').value,
            jenis_kegiatan:  document.getElementById('pek-jenis').value,
            volume_paket:    document.getElementById('pek-volume').value,
            jenis_tegangan:  document.getElementById('pek-tegangan').value,
            lokasi:          document.getElementById('pek-lokasi').value,
            tahun_anggaran:  document.getElementById('pek-tahun').value,
            sumber_anggaran: document.getElementById('pek-sumber').value
        }
    };
    if (state.editId) payload.id = state.editId;

    const result = await fetchAPI('', 'POST', payload);
    if (result) {
        const jenisAktivitas = state.editId ? 'Update Pekerjaan' : 'Tambah Pekerjaan';
        const catatan = `${jenisAktivitas} "${payload.data.nama_pekerjaan}" - Tahun: ${payload.data.tahun_anggaran}`;
        await logAktivitas(result.id || state.editId, jenisAktivitas, catatan, currentUser);
        showToast(state.editId ? 'Data Pekerjaan diperbarui' : 'Data Pekerjaan disimpan');
        closeModalPekerjaan();
        loadPekerjaanData();
    }
}

