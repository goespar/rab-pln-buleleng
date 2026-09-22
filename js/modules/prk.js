// ==========================================
// js/modules/prk.js
// Modul Program Rencana Kerja (PRK)
// ==========================================

window.renderPRK = async function renderPRK() {
    const contentArea = document.getElementById('app-content');
    if (!contentArea) return;

    contentArea.innerHTML = '<div class="flex justify-center py-24"><div class="loader"></div></div>';

    const prkList = await fetchWithCache('prk') || [];

    const totalMurni    = prkList.filter(p => (p.sifat_prk || p.sifat) === 'Murni').length;
    const totalLanjutan = prkList.filter(p => (p.sifat_prk || p.sifat) === 'Lanjutan').length;

    let rowsHtml = '';
    if (prkList.length === 0) {
        rowsHtml = '<tr><td colspan="8" class="p-10 text-center text-slate-400 italic">Belum ada data PRK. Klik "+ Tambah PRK".</td></tr>';
    } else {
        prkList.forEach((p, i) => {
            const sifat = p.sifat_prk || p.sifat || '-';
            const badge = sifat === 'Murni'
                ? '<span class="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[11px] font-semibold">Murni</span>'
                : '<span class="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-[11px] font-semibold">Lanjutan</span>';
            const noSafe   = (p.no_prk  || '').replace(/'/g, "\\'");
            const namaSafe = (p.prk     || '').replace(/'/g, "\\'");
            rowsHtml += '<tr class="hover:bg-slate-50 transition-colors prk-row" data-search="' + (p.no_prk||'').toLowerCase() + ' ' + (p.prk||'').toLowerCase() + '">'
                + '<td class="p-3 text-center text-slate-500">' + (i + 1) + '</td>'
                + '<td class="p-3 font-semibold text-brand">' + (p.no_prk || '-') + '</td>'
                + '<td class="p-3 font-medium text-slate-800">' + (p.prk || '-') + '</td>'
                + '<td class="p-3 text-center font-semibold text-slate-700">' + (p.tahun || '-') + '</td>'
                + '<td class="p-3 text-center">' + badge + '</td>'
                + '<td class="p-3 text-right font-semibold text-emerald-600">' + (p.pagu_dana ? CONFIG.formatCurrency(parseFloat(p.pagu_dana)) : '<span class="text-slate-300 text-xs italic">—</span>') + '</td>'
                + '<td class="p-3 text-center">'
                + '<button onclick="window._selectedPRK={id:\'' + p.id + '\',no_prk:\'' + noSafe + '\',nama:\'' + namaSafe + '\',tahun:\'' + (p.tahun||'') + '\'}; renderProgram();"'
                + ' class="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold transition flex items-center gap-1 mx-auto">'
                + '<i data-lucide="layers" class="w-3 h-3"></i> Lihat Program</button>'
                + '</td>'
                + '<td class="p-3 text-center"><div class="flex justify-center gap-2">'
                + '<button onclick="editPRK(\'' + p.id + '\')" class="text-blue-500 hover:text-blue-700 p-1" title="Edit"><i data-lucide="edit" class="w-4 h-4"></i></button>'
                + '<button onclick="deleteData(\'prk\', \'' + p.id + '\', renderPRK)" class="text-red-400 hover:text-red-600 p-1" title="Hapus"><i data-lucide="trash-2" class="w-4 h-4"></i></button>'
                + '</div></td>'
                + '</tr>';
        });
    }

    contentArea.innerHTML = '<div class="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">'
        + '<div><h2 class="text-xl font-bold text-slate-800">Program Rencana Kerja (PRK)</h2>'
        + '<p class="text-sm text-slate-500">Kelola PRK beserta hierarki jenis program dan pengadaannya.</p></div>'
        + '<button onclick="showModalPRK()" class="bg-brand text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-sky-700 transition flex items-center gap-2 shadow-sm">'
        + '<i data-lucide="plus" class="w-4 h-4"></i> Tambah PRK</button>'
        + '</div>'

        + '<div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">'
        + '<div class="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">'
        + '<div class="p-3 bg-blue-100 text-blue-600 rounded-xl"><i data-lucide="folder-open" class="w-6 h-6"></i></div>'
        + '<div><p class="text-xs text-slate-500 font-medium uppercase tracking-wide">Total PRK</p>'
        + '<p class="text-2xl font-bold text-slate-800">' + prkList.length + '</p></div></div>'

        + '<div class="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">'
        + '<div class="p-3 bg-emerald-100 text-emerald-600 rounded-xl"><i data-lucide="check-circle" class="w-6 h-6"></i></div>'
        + '<div><p class="text-xs text-slate-500 font-medium uppercase tracking-wide">PRK Murni</p>'
        + '<p class="text-2xl font-bold text-slate-800">' + totalMurni + '</p></div></div>'

        + '<div class="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">'
        + '<div class="p-3 bg-amber-100 text-amber-600 rounded-xl"><i data-lucide="refresh-cw" class="w-6 h-6"></i></div>'
        + '<div><p class="text-xs text-slate-500 font-medium uppercase tracking-wide">PRK Lanjutan</p>'
        + '<p class="text-2xl font-bold text-slate-800">' + totalLanjutan + '</p></div></div>'
        + '</div>'

        + '<div class="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">'
        + '<div class="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">'
        + '<h3 class="text-sm font-bold text-slate-800">Daftar PRK</h3>'
        + '<input type="text" id="search-prk" placeholder="Cari nomor atau nama PRK..." oninput="filterPRKTable()"'
        + ' class="border border-slate-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-brand w-52"></div>'
        + '<div class="overflow-x-auto"><table class="w-full text-left border-collapse text-sm">'
        + '<thead class="bg-slate-100 text-slate-700 font-semibold"><tr>'
        + '<th class="p-3 text-center w-10">No</th>'
        + '<th class="p-3">No. PRK</th>'
        + '<th class="p-3">Nama / Deskripsi PRK</th>'
        + '<th class="p-3 text-center">Tahun</th>'
        + '<th class="p-3 text-center">Sifat</th>'
        + '<th class="p-3 text-right">Pagu Dana</th>'
        + '<th class="p-3 text-center">Jenis Program</th>'
        + '<th class="p-3 text-center w-28">Aksi</th>'
        + '</tr></thead>'
        + '<tbody class="divide-y divide-slate-100" id="prk-tbody">' + rowsHtml + '</tbody>'
        + '</table></div></div>'

        // MODAL
        + '<div id="modal-prk" class="fixed inset-0 bg-slate-900/50 z-50 hidden flex items-center justify-center backdrop-blur-sm transition-opacity opacity-0">'
        + '<div class="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 transform transition-all scale-95">'
        + '<div class="flex justify-between items-center mb-5 border-b border-slate-100 pb-4">'
        + '<h3 id="modal-prk-title" class="text-lg font-bold text-slate-800">Tambah PRK Baru</h3>'
        + '<button type="button" onclick="closeModalPRK()" class="text-slate-400 hover:text-slate-700"><i data-lucide="x" class="w-5 h-5"></i></button>'
        + '</div>'
        + '<form onsubmit="savePRK(event)">'
        + '<input type="hidden" id="prk-edit-id">'
        + '<div class="space-y-4">'
        + '<div class="grid grid-cols-2 gap-4">'
        + '<div><label class="block text-sm font-medium text-slate-700 mb-1">No. PRK <span class="text-red-500">*</span></label>'
        + '<input type="text" id="prk-nomor" required placeholder="Contoh: PRK-2026-001" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-brand outline-none"></div>'
        + '<div><label class="block text-sm font-medium text-slate-700 mb-1">Tahun Anggaran <span class="text-red-500">*</span></label>'
        + '<input type="number" id="prk-tahun" required value="' + new Date().getFullYear() + '" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-brand outline-none"></div>'
        + '</div>'
        + '<div><label class="block text-sm font-medium text-slate-700 mb-1">Nama / Deskripsi PRK <span class="text-red-500">*</span></label>'
        + '<input type="text" id="prk-nama" required placeholder="Contoh: Program Pemasangan SR 2026" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-brand outline-none"></div>'
        + '<div><label class="block text-sm font-medium text-slate-700 mb-1">Sifat PRK <span class="text-red-500">*</span></label>'
        + '<select id="prk-sifat" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-brand outline-none bg-white">'
        + '<option value="Murni">Murni</option><option value="Lanjutan">Lanjutan</option></select></div>'
        + '<div><label class="block text-sm font-medium text-slate-700 mb-1">Pagu Dana (Rp)</label>'
        + '<input type="number" id="prk-pagu" min="0" value="0"'
        + ' onfocus="if(this.value==\'0\')this.value=\'\'" onblur="if(this.value==\'\')this.value=\'0\'"'
        + ' placeholder="Contoh: 500000000"'
        + ' class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-brand outline-none"></div>'
        + '</div>'
        + '<div class="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">'
        + '<button type="button" onclick="closeModalPRK()" class="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50">Batal</button>'
        + '<button type="submit" id="btn-save-prk" class="px-6 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-sky-700">Simpan PRK</button>'
        + '</div></form></div></div>';

    lucide.createIcons();
}

function filterPRKTable() {
    const q = (document.getElementById('search-prk')?.value || '').toLowerCase();
    document.querySelectorAll('.prk-row').forEach(function(tr) {
        tr.style.display = tr.dataset.search.includes(q) ? '' : 'none';
    });
}

function showModalPRK(isEdit) {
    if (!isEdit) {
        document.getElementById('prk-edit-id').value = '';
        document.getElementById('prk-nomor').value   = '';
        document.getElementById('prk-nama').value    = '';
        document.getElementById('prk-tahun').value   = new Date().getFullYear();
        document.getElementById('prk-sifat').value   = 'Murni';
        document.getElementById('prk-pagu').value    = '0';
        document.getElementById('modal-prk-title').innerText = 'Tambah PRK Baru';
        document.getElementById('btn-save-prk').innerText    = 'Simpan PRK';
    }
    var modal = document.getElementById('modal-prk');
    modal.classList.remove('hidden');
    setTimeout(function() {
        modal.classList.remove('opacity-0');
        modal.querySelector('div').classList.remove('scale-95');
    }, 10);
}

function closeModalPRK() {
    var modal = document.getElementById('modal-prk');
    modal.classList.add('opacity-0');
    modal.querySelector('div').classList.add('scale-95');
    setTimeout(function() { modal.classList.add('hidden'); }, 300);
}

async function editPRK(id) {
    const list = await fetchAPI('action=list&table=prk') || [];
    const item = list.find(function(p) { return p.id === id; });
    if (!item) return showToast('Data tidak ditemukan', 'error');

    document.getElementById('prk-edit-id').value = item.id;
    document.getElementById('prk-nomor').value   = item.no_prk  || '';
    document.getElementById('prk-nama').value    = item.prk     || '';
    document.getElementById('prk-tahun').value   = item.tahun   || new Date().getFullYear();
    document.getElementById('prk-sifat').value   = item.sifat_prk || item.sifat || 'Murni';
    document.getElementById('prk-pagu').value    = item.pagu_dana || '0';
    document.getElementById('modal-prk-title').innerText = 'Edit Data PRK';
    document.getElementById('btn-save-prk').innerText    = 'Update PRK';
    showModalPRK(true);
}

async function savePRK(event) {
    event.preventDefault();
    const btn    = document.getElementById('btn-save-prk');
    const editId = document.getElementById('prk-edit-id').value;
    if (btn) { btn.disabled = true; btn.innerHTML = 'Menyimpan...'; }

    const data = {
        no_prk:    document.getElementById('prk-nomor').value.trim(),
        prk:       document.getElementById('prk-nama').value.trim(),
        tahun:     document.getElementById('prk-tahun').value,
        sifat_prk: document.getElementById('prk-sifat').value,
        pagu_dana: parseFloat(document.getElementById('prk-pagu').value) || 0
    };

    const currentUser = state.currentUser ? state.currentUser.nama : 'Admin';
    const payload = { action: editId ? 'update' : 'create', table: 'prk', user: currentUser, data: data };
    if (editId) { payload.id = editId; payload.data.id = editId; }

    const result = await fetchAPI('', 'POST', payload);
    if (btn) { btn.disabled = false; btn.innerHTML = editId ? 'Update PRK' : 'Simpan PRK'; }

    if (result) {
        showToast(editId ? 'PRK berhasil diperbarui' : 'PRK berhasil disimpan');
        closeModalPRK();
        renderPRK();
    }
}

