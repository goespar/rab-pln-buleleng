// ==========================================
// js/modules/pengadaan.js
// Modul Master Data Pengadaan
// ==========================================

window.renderPengadaan = async function renderPengadaan() {
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
    const data = await fetchWithCache('Pengadaan') || [];
    let html = `<table class="w-full text-left border-collapse text-sm"><thead class="bg-slate-100"><tr>
        <th class="p-3">No</th><th class="p-3">Nomor</th><th class="p-3">Nama Pengadaan</th>
        <th class="p-3">Tahun & Sumber</th><th class="p-3">Aksi</th>
    </tr></thead><tbody class="divide-y">`;
    data.forEach((p, i) => {
        html += `<tr>
            <td class="p-3">${i + 1}</td>
            <td class="p-3 font-semibold">${p.nomor_pengadaan || '-'}</td>
            <td class="p-3">${p.nama_pengadaan}</td>
            <td class="p-3"><span class="font-bold">${p.tahun || '-'}</span><br>
                <span class="text-xs bg-slate-200 px-2 py-0.5 rounded">${p.sumber_anggaran || 'APLN'}</span></td>
            <td class="p-3 flex gap-2">
                <button onclick="editPengadaan('${p.id}')" class="text-blue-500 hover:text-blue-700"><i data-lucide="edit" class="w-4 h-4"></i></button>
                <button onclick="deleteData('Pengadaan', '${p.id}', loadPengadaanData)" class="text-red-500 hover:text-red-700"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
            </td>
        </tr>`;
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

function closeModalPengadaan() {
    document.getElementById('modal-pengadaan').classList.add('hidden', 'opacity-0');
}

async function editPengadaan(id) {
    const list = await fetchAPI('action=list&table=Pengadaan') || [];
    const item = list.find(p => p.id === id);
    if (!item) return showToast('Data tidak ditemukan', 'error');

    state.editId = id;
    document.getElementById('pengadaan-nomor').value = item.nomor_pengadaan || '';
    document.getElementById('pengadaan-nama').value   = item.nama_pengadaan || '';
    document.getElementById('pengadaan-tahun').value  = item.tahun || new Date().getFullYear();
    document.getElementById('pengadaan-sumber').value = item.sumber_anggaran || '';
    document.getElementById('pengadaan-pagu').value   = item.nilai_pagu || '';
    showModalPengadaan(true);
}

async function savePengadaan(e) {
    e.preventDefault();
    const currentUser = state.currentUser ? state.currentUser.nama : 'Admin';
    const payload = {
        action: state.editId ? 'update' : 'create',
        table: 'Pengadaan',
        user: currentUser,
        data: {
            nomor_pengadaan: document.getElementById('pengadaan-nomor').value,
            nama_pengadaan:  document.getElementById('pengadaan-nama').value,
            tahun:           document.getElementById('pengadaan-tahun').value,
            sumber_anggaran: document.getElementById('pengadaan-sumber').value,
            nilai_pagu:      document.getElementById('pengadaan-pagu').value
        }
    };
    if (state.editId) payload.id = state.editId;

    await fetchAPI('', 'POST', payload);
    showToast(state.editId ? 'Data Pengadaan diperbarui' : 'Data Pengadaan disimpan');
    closeModalPengadaan();
    loadPengadaanData();
}

