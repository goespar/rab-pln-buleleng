// ==========================================
// js/modules/disburse.js
// Input dan update nilai Disburse per PRK
// ==========================================

window.renderDisburse = async function renderDisburse() {
    const contentArea = document.getElementById('app-content');
    if (!contentArea) return;
    contentArea.innerHTML = '<div class="flex justify-center py-24"><div class="loader"></div></div>';

    const [prk, program, pengadaan] = await Promise.all([
        fetchWithCache('prk'),
        fetchWithCache('jenis_program'),
        fetchWithCache('Pengadaan')
    ]);
    window.disburseData = {
        prk: prk || [],
        program: program || [],
        pengadaan: pengadaan || []
    };

    const prkOptions = window.disburseData.prk.map(item =>
        `<option value="${item.id}">${item.no_prk || '-'} - ${item.prk || item.nama || '-'}</option>`
    ).join('');

    contentArea.innerHTML = `
        <div class="mb-6">
            <h2 class="text-xl font-bold text-slate-800">Input Disburse</h2>
            <p class="text-sm text-slate-500">Perbarui nilai Disburse berdasarkan Pengadaan dalam PRK terpilih.</p>
        </div>
        <div class="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <div class="max-w-2xl">
                <label class="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Pilih PRK</label>
                <select id="disburse-prk" onchange="loadDisbursePengadaan(this.value)" class="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:border-brand outline-none">
                    <option value="">-- Pilih PRK --</option>${prkOptions}
                </select>
            </div>
            <div id="disburse-table" class="mt-6"></div>
        </div>
    `;
    lucide.createIcons();
};

window.loadDisbursePengadaan = function loadDisbursePengadaan(prkId) {
    const target = document.getElementById('disburse-table');
    if (!target) return;
    if (!prkId) {
        target.innerHTML = '';
        return;
    }

    const selectedPRK = window.disburseData.prk.find(item => String(item.id) === String(prkId));
    const paguPRK = Number(selectedPRK?.pagu_dana) || Number(selectedPRK?.pagu) || 0;
    const programIds = new Set(window.disburseData.program
        .filter(item => String(item.id_prk) === String(prkId))
        .map(item => String(item.id)));
    const rows = window.disburseData.pengadaan.filter(item =>
        String(item.id_prk || item.prk_id || item.id_prk_program || '') === String(prkId) ||
        programIds.has(String(item.id_jenis || item.jenis_id))
    );

    if (rows.length === 0) {
        target.innerHTML = '<div class="p-6 text-center text-slate-400 border border-dashed rounded-lg">Belum ada Pengadaan pada PRK ini.</div>';
        return;
    }

    target.innerHTML = `
        <div class="overflow-x-auto rounded-lg border border-slate-200">
            <table class="w-full text-sm text-left">
                <thead class="bg-slate-100 text-slate-600"><tr>
                    <th class="p-3 text-center">No</th><th class="p-3">Pengadaan</th><th class="p-3">Jenis</th>
                    <th class="p-3 text-right">Pagu</th><th class="p-3 text-right">Nilai Disburse</th><th class="p-3 text-center">Aksi</th>
                </tr></thead>
                <tbody class="divide-y divide-slate-100">${rows.map((item, index) => `
                    <tr>
                        <td class="p-3 text-center text-slate-500">${index + 1}</td>
                        <td class="p-3 font-medium text-slate-800">${item.nomor_pengadaan || item.nama_pengadaan || '-'}${item.nomor_pengadaan && item.nama_pengadaan ? `<br><span class="text-xs text-slate-400">${item.nama_pengadaan}</span>` : ''}</td>
                        <td class="p-3 text-slate-600">${item.jenis_konstruksi || item.keterangan || '-'}</td>
                        <td class="p-3 text-right">${CONFIG.formatCurrency(Number(item.nilai_pagu) || paguPRK)}</td>
                        <td class="p-3 text-right"><input id="disburse-value-${item.id}" type="number" min="0" step="any" value="${Number(item.nilai_disburse) || 0}" class="w-40 border border-slate-300 rounded-lg px-3 py-2 text-sm text-right focus:border-brand outline-none"></td>
                        <td class="p-3 text-center"><button type="button" onclick="saveDisburse('${item.id}', '${prkId}')" class="bg-brand text-white px-3 py-2 rounded-lg text-xs font-semibold hover:bg-sky-700">Simpan</button></td>
                    </tr>`).join('')}</tbody>
            </table>
        </div>`;
    lucide.createIcons();
};

window.saveDisburse = async function saveDisburse(pengadaanId, prkId) {
    const input = document.getElementById(`disburse-value-${pengadaanId}`);
    const nilaiDisburse = Number(input?.value) || 0;
    const result = await fetchAPI('', 'POST', {
        action: 'update',
        table: 'Pengadaan',
        data: { id: pengadaanId, nilai_disburse: nilaiDisburse }
    });
    if (!result) return;
    invalidateCache('Pengadaan');
    showToast('Nilai Disburse berhasil diperbarui');
    const pengadaan = window.disburseData.pengadaan.find(item => String(item.id) === String(pengadaanId));
    if (pengadaan) pengadaan.nilai_disburse = nilaiDisburse;
    loadDisbursePengadaan(prkId);
};
