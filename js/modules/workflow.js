// ==========================================
// js/modules/workflow.js
// Edit HPS, Hasil Tender, dan Koreksi RAB
// ==========================================

window.renderWorkflow = async function renderWorkflow() {
    const contentArea = document.getElementById('app-content');
    const [pekerjaan, rab, penyedia, tender] = await Promise.all([
        fetchWithCache('Pekerjaan'),
        fetchWithCache('RAB'),
        fetchWithCache('Penyedia'),
        fetchWithCache('Tender')
    ]);

    window.workflowData = {
        pekerjaan: pekerjaan || [],
        rab: rab || [],
        penyedia: penyedia || [],
        tender: tender || []
    };

    const pekerjaanOptions = window.workflowData.pekerjaan.map(p =>
        `<option value="${p.id}">${p.nomor_paket || '-'} - ${p.nama_pekerjaan || p.nama_komponen || '-'}</option>`
    ).join('');

    contentArea.innerHTML = `
        <div class="mb-4">
            <h2 class="text-xl font-bold text-slate-800">Tender & Koreksi RAB</h2>
            <p class="text-sm text-slate-500">Kelola HPS, hasil tender, dan RAB kontrak secara berurutan.</p>
        </div>
        <div class="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div class="flex flex-wrap gap-2 p-4 border-b border-slate-100 bg-slate-50">
                <button type="button" onclick="switchWorkflowTab('hps')" data-workflow-tab="hps" class="workflow-tab px-4 py-2 rounded-lg bg-brand text-white text-sm font-semibold">Edit RAB HPS</button>
                <button type="button" onclick="switchWorkflowTab('tender')" data-workflow-tab="tender" class="workflow-tab px-4 py-2 rounded-lg text-slate-600 hover:bg-white text-sm font-semibold">Hasil Tender</button>
                <button type="button" onclick="switchWorkflowTab('koreksi')" data-workflow-tab="koreksi" class="workflow-tab px-4 py-2 rounded-lg text-slate-600 hover:bg-white text-sm font-semibold">Koreksi RAB</button>
            </div>
            <div id="workflow-hps" class="workflow-panel p-6">
                <div class="max-w-xl">
                    <label class="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Pilih Pekerjaan</label>
                    <select id="workflow-hps-pekerjaan" onchange="loadWorkflowHPS(this.value)" class="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:border-brand outline-none">
                        <option value="">-- Pilih Pekerjaan --</option>${pekerjaanOptions}
                    </select>
                </div>
                <div id="workflow-hps-table" class="mt-6"></div>
            </div>
            <div id="workflow-tender" class="workflow-panel hidden p-6">
                <form onsubmit="saveWorkflowTender(event)" class="max-w-3xl space-y-5">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Pekerjaan</label>
                            <select id="workflow-tender-pekerjaan" required class="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:border-brand outline-none">
                                <option value="">-- Pilih Pekerjaan --</option>${pekerjaanOptions}
                            </select>
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Penyedia / Pemenang</label>
                            <select id="workflow-tender-penyedia" required class="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:border-brand outline-none">
                                <option value="">-- Pilih Penyedia --</option>
                                ${window.workflowData.penyedia.map(p => `<option value="${p.id}">${p.nama_penyedia || p.nama || '-'}${p.npwp ? ` - ${p.npwp}` : ''}</option>`).join('')}
                            </select>
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Nilai Penawaran (Rp)</label>
                            <input id="workflow-tender-nilai" type="number" min="0" step="any" required class="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:border-brand outline-none">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Tanggal Tender</label>
                            <input id="workflow-tender-tanggal" type="date" required value="${new Date().toISOString().slice(0, 10)}" class="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:border-brand outline-none">
                        </div>
                    </div>
                    <button type="submit" class="bg-brand text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-sky-700 flex items-center gap-2"><i data-lucide="save" class="w-4 h-4"></i> Simpan Hasil Tender</button>
                </form>
                <div id="workflow-tender-table" class="mt-8"></div>
            </div>
            <div id="workflow-koreksi" class="workflow-panel hidden p-6">
                <form onsubmit="previewWorkflowKoreksi(event)" class="max-w-3xl space-y-5">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Pekerjaan</label>
                            <select id="workflow-koreksi-pekerjaan" onchange="loadWorkflowTenderSummary(this.value)" required class="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:border-brand outline-none">
                                <option value="">-- Pilih Pekerjaan --</option>${pekerjaanOptions}
                            </select>
                        </div>
                        <div class="bg-slate-50 rounded-lg border border-slate-200 p-3 text-sm">
                            <div class="flex justify-between"><span class="text-slate-500">Total HPS</span><strong id="workflow-koreksi-hps">Rp 0</strong></div>
                            <div class="flex justify-between mt-1"><span class="text-slate-500">Nilai Penawaran</span><strong id="workflow-koreksi-tender" class="text-brand">Rp 0</strong></div>
                            <div class="flex justify-between mt-1"><span class="text-slate-500">Faktor Koreksi</span><strong id="workflow-koreksi-faktor">-</strong></div>
                        </div>
                    </div>
                    <button type="submit" class="bg-amber-500 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-amber-600 flex items-center gap-2"><i data-lucide="calculator" class="w-4 h-4"></i> Hitung Koreksi</button>
                </form>
                <div id="workflow-koreksi-table" class="mt-6"></div>
            </div>
        </div>
    `;
    lucide.createIcons();
    renderWorkflowTenderTable();
};

window.switchWorkflowTab = function switchWorkflowTab(tab) {
    document.querySelectorAll('.workflow-panel').forEach(panel => panel.classList.add('hidden'));
    document.getElementById(`workflow-${tab}`)?.classList.remove('hidden');
    document.querySelectorAll('[data-workflow-tab]').forEach(button => {
        const active = button.dataset.workflowTab === tab;
        button.className = `workflow-tab px-4 py-2 rounded-lg text-sm font-semibold ${active ? 'bg-brand text-white' : 'text-slate-600 hover:bg-white'}`;
    });
};

window.loadWorkflowHPS = function loadWorkflowHPS(pekerjaanId) {
    const target = document.getElementById('workflow-hps-table');
    if (!target) return;
    if (!pekerjaanId) {
        target.innerHTML = '';
        return;
    }

    const rows = getWorkflowHPSItems(pekerjaanId);
    target.innerHTML = rows.length ? `
        <div class="overflow-x-auto rounded-lg border border-slate-200">
            <table class="w-full text-sm text-left">
                <thead class="bg-slate-100 text-slate-600"><tr><th class="p-3">Uraian</th><th class="p-3">Volume</th><th class="p-3">Satuan</th><th class="p-3">Harga Satuan Material</th><th class="p-3">Harga Satuan Jasa</th><th class="p-3">Bagian Material</th><th class="p-3">Bagian Jasa</th><th class="p-3">Total Jumlah</th><th class="p-3">Aksi</th></tr></thead>
                <tbody class="divide-y divide-slate-100">${rows.map(item => `
                    <tr data-hps-row="${item.id}">
                        <td class="p-3"><input data-hps-field="uraian" data-id="${item.id}" value="${escapeWorkflowHtml(item.uraian)}" class="w-full min-w-48 border border-slate-200 rounded px-2 py-1"></td>
                        <td class="p-3"><input data-hps-field="volume" data-id="${item.id}" type="number" step="any" value="${item.volume || 0}" oninput="updateWorkflowHPSTotals()" class="w-24 border border-slate-200 rounded px-2 py-1"></td>
                        <td class="p-3"><input data-hps-field="satuan" data-id="${item.id}" value="${escapeWorkflowHtml(item.satuan)}" class="w-20 border border-slate-200 rounded px-2 py-1"></td>
                        <td class="p-3"><input data-hps-field="harga_material" data-id="${item.id}" type="number" step="any" value="${item.harga_material || 0}" oninput="updateWorkflowHPSTotals()" class="w-32 border border-slate-200 rounded px-2 py-1"></td>
                        <td class="p-3"><input data-hps-field="harga_jasa" data-id="${item.id}" type="number" step="any" value="${item.harga_jasa || 0}" oninput="updateWorkflowHPSTotals()" class="w-32 border border-slate-200 rounded px-2 py-1"></td>
                        <td class="p-3 text-right font-medium" data-hps-result="bagian-material" data-id="${item.id}">Rp 0</td>
                        <td class="p-3 text-right font-medium" data-hps-result="bagian-jasa" data-id="${item.id}">Rp 0</td>
                        <td class="p-3 text-right font-bold text-brand" data-hps-result="jumlah" data-id="${item.id}">Rp 0</td>
                        <td class="p-3"><button type="button" onclick="saveWorkflowHPS('${item.id}', '${pekerjaanId}')" class="text-brand hover:text-sky-700 font-semibold">Simpan</button></td>
                    </tr>`).join('')}</tbody>
                <tfoot class="bg-slate-50 border-t-2 border-slate-200 font-bold">
                    <tr><td colspan="3" class="p-3 text-right">TOTAL</td><td id="workflow-hps-total-harga-material" class="p-3 text-right">Rp 0</td><td id="workflow-hps-total-harga-jasa" class="p-3 text-right">Rp 0</td><td id="workflow-hps-total-bagian-material" class="p-3 text-right">Rp 0</td><td id="workflow-hps-total-bagian-jasa" class="p-3 text-right">Rp 0</td><td id="workflow-hps-total-jumlah" class="p-3 text-right text-brand">Rp 0</td><td></td></tr>
                </tfoot>
            </table>
        </div>` : '<div class="p-6 text-center text-slate-400 border border-dashed rounded-lg">Belum ada item HPS untuk pekerjaan ini.</div>';
    updateWorkflowHPSTotals();
};

window.updateWorkflowHPSTotals = function updateWorkflowHPSTotals() {
    let totalHargaMaterial = 0;
    let totalHargaJasa = 0;
    let totalBagianMaterial = 0;
    let totalBagianJasa = 0;
    let totalJumlah = 0;

    document.querySelectorAll('[data-hps-row]').forEach(row => {
        const id = row.dataset.hpsRow;
        const volume = Number(row.querySelector('[data-hps-field="volume"]')?.value) || 0;
        const hargaMaterial = Number(row.querySelector('[data-hps-field="harga_material"]')?.value) || 0;
        const hargaJasa = Number(row.querySelector('[data-hps-field="harga_jasa"]')?.value) || 0;
        const bagianMaterial = volume * hargaMaterial;
        const bagianJasa = volume * hargaJasa;
        const jumlah = bagianMaterial + bagianJasa;

        totalHargaMaterial += hargaMaterial;
        totalHargaJasa += hargaJasa;
        totalBagianMaterial += bagianMaterial;
        totalBagianJasa += bagianJasa;
        totalJumlah += jumlah;

        const setResult = (name, value) => {
            const element = document.querySelector(`[data-hps-result="${name}"][data-id="${id}"]`);
            if (element) element.textContent = CONFIG.formatCurrency(value);
        };
        setResult('bagian-material', bagianMaterial);
        setResult('bagian-jasa', bagianJasa);
        setResult('jumlah', jumlah);
    });

    const totals = {
        'workflow-hps-total-harga-material': totalHargaMaterial,
        'workflow-hps-total-harga-jasa': totalHargaJasa,
        'workflow-hps-total-bagian-material': totalBagianMaterial,
        'workflow-hps-total-bagian-jasa': totalBagianJasa,
        'workflow-hps-total-jumlah': totalJumlah
    };
    Object.entries(totals).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = CONFIG.formatCurrency(value);
    });
};

window.saveWorkflowHPS = async function saveWorkflowHPS(itemId, pekerjaanId) {
    const values = {};
    document.querySelectorAll(`[data-hps-field][data-id="${itemId}"]`).forEach(input => {
        values[input.dataset.hpsField] = input.type === 'number' ? Number(input.value) || 0 : input.value.trim();
    });
    const result = await fetchAPI('', 'POST', {
        action: 'update',
        table: 'RAB',
        data: { id: itemId, ...values }
    });
    if (result) {
        invalidateCache('RAB');
        showToast('Item HPS berhasil diperbarui');
        const rab = await fetchWithCache('RAB');
        window.workflowData.rab = rab || [];
        loadWorkflowHPS(pekerjaanId);
    }
};

window.saveWorkflowTender = async function saveWorkflowTender(event) {
    event.preventDefault();
    const pekerjaanId = document.getElementById('workflow-tender-pekerjaan').value;
    const penyediaId = document.getElementById('workflow-tender-penyedia').value;
    const nilai = Number(document.getElementById('workflow-tender-nilai').value) || 0;
    if (!pekerjaanId || !penyediaId || nilai <= 0) return showToast('Lengkapi data tender dengan benar', 'error');

    const result = await fetchAPI('', 'POST', {
        action: 'create', table: 'Tender',
        data: {
            pekerjaan_id: pekerjaanId,
            penyedia_id: penyediaId,
            nilai_penawaran: nilai,
            tanggal_tender: document.getElementById('workflow-tender-tanggal').value,
            status_tender: 'Selesai'
        }
    });
    if (!result) return;

    const pekerjaan = window.workflowData.pekerjaan.find(item => String(item.id) === String(pekerjaanId));
    if (pekerjaan) {
        await fetchAPI('', 'POST', { action: 'update', table: 'Pekerjaan', data: { id: pekerjaanId, status: 'Tender Selesai' } });
    }
    invalidateCache('Tender');
    invalidateCache('Pekerjaan');
    showToast('Hasil tender berhasil disimpan');
    renderWorkflow();
};

window.loadWorkflowTenderSummary = function loadWorkflowTenderSummary(pekerjaanId) {
    const hps = getWorkflowHPSItems(pekerjaanId).reduce((sum, item) => sum + workflowItemTotal(item), 0);
    const tender = getWorkflowTender(pekerjaanId);
    const nilaiTender = tender ? Number(tender.nilai_penawaran) || 0 : 0;
    const factor = hps > 0 && nilaiTender > 0 ? nilaiTender / hps : 0;
    document.getElementById('workflow-koreksi-hps').textContent = CONFIG.formatCurrency(hps);
    document.getElementById('workflow-koreksi-tender').textContent = CONFIG.formatCurrency(nilaiTender);
    document.getElementById('workflow-koreksi-faktor').textContent = factor ? `${(factor * 100).toFixed(2)}%` : '-';
};

window.previewWorkflowKoreksi = function previewWorkflowKoreksi(event) {
    event.preventDefault();
    const pekerjaanId = document.getElementById('workflow-koreksi-pekerjaan').value;
    const items = getWorkflowHPSItems(pekerjaanId);
    const tender = getWorkflowTender(pekerjaanId);
    const hps = items.reduce((sum, item) => sum + workflowItemTotal(item), 0);
    const nilaiTender = tender ? Number(tender.nilai_penawaran) || 0 : 0;
    if (!items.length || !tender || hps <= 0 || nilaiTender <= 0) return showToast('HPS dan hasil tender harus tersedia', 'error');

    const factor = nilaiTender / hps;
    document.getElementById('workflow-koreksi-table').innerHTML = `
        <div class="overflow-x-auto rounded-lg border border-slate-200">
            <table class="w-full text-sm text-left"><thead class="bg-slate-100 text-slate-600"><tr><th class="p-3">Uraian</th><th class="p-3">Harga HPS</th><th class="p-3">Harga Koreksi</th><th class="p-3">Jumlah Koreksi</th></tr></thead>
            <tbody class="divide-y divide-slate-100">${items.map(item => {
                const hargaHps = Number(item.harga_material || 0) + Number(item.harga_jasa || 0);
                const hargaKoreksi = hargaHps * factor;
                return `<tr><td class="p-3">${escapeWorkflowHtml(item.uraian)}</td><td class="p-3">${CONFIG.formatCurrency(hargaHps)}</td><td class="p-3 font-semibold text-brand">${CONFIG.formatCurrency(hargaKoreksi)}</td><td class="p-3 font-bold">${CONFIG.formatCurrency((Number(item.volume) || 0) * hargaKoreksi)}</td></tr>`;
            }).join('')}</tbody></table>
        </div>
        <button type="button" onclick="saveWorkflowKoreksi('${pekerjaanId}', ${factor})" class="mt-4 bg-brand text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-sky-700 flex items-center gap-2"><i data-lucide="save" class="w-4 h-4"></i> Simpan RAB Terkoreksi</button>`;
    lucide.createIcons();
};

window.saveWorkflowKoreksi = async function saveWorkflowKoreksi(pekerjaanId, factor) {
    const items = getWorkflowHPSItems(pekerjaanId);
    const dataKoreksi = items.map(item => ({
        ...item,
        id: undefined,
        versi_rab: 'Terkoreksi',
        harga_material: (Number(item.harga_material) || 0) * factor,
        harga_jasa: (Number(item.harga_jasa) || 0) * factor,
        bagian_material: (Number(item.volume) || 0) * (Number(item.harga_material) || 0) * factor,
        bagian_jasa: (Number(item.volume) || 0) * (Number(item.harga_jasa) || 0) * factor,
        jumlah: workflowItemTotal(item) * factor
    }));

    const result = await fetchAPI('', 'POST', {
        action: 'simpanRABTerkoreksi',
        table: 'RAB',
        pekerjaan_id: pekerjaanId,
        dataKoreksi
    });
    if (result) {
        invalidateCache('RAB');
        invalidateCache('Pekerjaan');
        showToast('RAB terkoreksi berhasil disimpan');
        document.getElementById('workflow-koreksi-table').innerHTML = '';
    }
};

function getWorkflowHPSItems(pekerjaanId) {
    return (window.workflowData?.rab || []).filter(item => String(item.pekerjaan_id) === String(pekerjaanId) && String(item.versi_rab || '').toLowerCase() !== 'terkoreksi');
}

function getWorkflowTender(pekerjaanId) {
    return (window.workflowData?.tender || []).filter(item => String(item.pekerjaan_id) === String(pekerjaanId)).sort((a, b) => String(b.tanggal_tender || '').localeCompare(String(a.tanggal_tender || '')))[0];
}

function workflowItemTotal(item) {
    return (Number(item.volume) || 0) * ((Number(item.harga_material) || 0) + (Number(item.harga_jasa) || 0));
}

function renderWorkflowTenderTable() {
    const target = document.getElementById('workflow-tender-table');
    if (!target) return;
    const rows = window.workflowData?.tender || [];
    target.innerHTML = rows.length ? `<div class="overflow-x-auto rounded-lg border border-slate-200"><table class="w-full text-sm text-left"><thead class="bg-slate-100"><tr><th class="p-3">Pekerjaan</th><th class="p-3">Penyedia</th><th class="p-3">Nilai Penawaran</th><th class="p-3">Status</th></tr></thead><tbody class="divide-y divide-slate-100">${rows.map(row => `<tr><td class="p-3">${workflowPekerjaanName(row.pekerjaan_id)}</td><td class="p-3">${workflowPenyediaName(row.penyedia_id)}</td><td class="p-3 font-semibold">${CONFIG.formatCurrency(Number(row.nilai_penawaran) || 0)}</td><td class="p-3"><span class="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs">${row.status_tender || 'Selesai'}</span></td></tr>`).join('')}</tbody></table></div>` : '<div class="mt-4 p-5 text-center text-slate-400 border border-dashed rounded-lg">Belum ada hasil tender.</div>';
}

function workflowPekerjaanName(id) {
    const item = (window.workflowData?.pekerjaan || []).find(row => String(row.id) === String(id));
    return item ? (item.nama_pekerjaan || item.nama_komponen || '-') : '-';
}

function workflowPenyediaName(id) {
    const item = (window.workflowData?.penyedia || []).find(row => String(row.id) === String(id));
    return item ? (item.nama_penyedia || item.nama || '-') : '-';
}

function escapeWorkflowHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}
