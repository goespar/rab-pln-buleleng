// ==========================================
// js/modules/laporanrealisasi.js
// Laporan Realisasi Anggaran Investasi
// ==========================================

window.renderLaporanRealisasi = async function renderLaporanRealisasi() {
    const contentArea = document.getElementById('app-content');
    contentArea.innerHTML = '<div class="flex justify-center py-24"><div class="loader"></div></div>';

    const [pekerjaanList, kontrakList, realisasiList, pengadaanList, rabList, prkList, jenisProgramList] = await Promise.all([
        fetchWithCache('Pekerjaan'),
        fetchWithCache('Kontrak'),
        fetchWithCache('Realisasi'),
        fetchWithCache('Pengadaan'),
        fetchWithCache('RAB'),
        fetchWithCache('prk'),
        fetchWithCache('jenis_program')
    ]);

    const pekerjaan = pekerjaanList || [];
    const kontrak = kontrakList || [];
    const realisasi = realisasiList || [];
    const pengadaan = pengadaanList || [];
    const rab = rabList || [];
    const prk = prkList || [];
    const jenisProgram = jenisProgramList || [];

    const rows = pengadaan.map(item => {
        const program = jenisProgram.find(row => String(row.id) === String(item.id_jenis || item.jenis_id));
        const prkId = item.id_prk || item.prk_id || item.id_prk_program || program?.id_prk;
        const prkItem = prk.find(row => String(row.id) === String(prkId));
        const pekerjaanItems = pekerjaan.filter(row => String(row.pengadaan_id || row.id_pengadaan_prk) === String(item.id));
        const pekerjaanIds = new Set(pekerjaanItems.map(row => String(row.id)));
        const totalRAB = Array.from(pekerjaanIds).reduce((sum, pekerjaanId) => sum + getActiveRABItems(rab.filter(row => String(row.pekerjaan_id) === pekerjaanId)).reduce((itemSum, row) => itemSum + (Number(row.jumlah) || ((Number(row.volume) || 0) * ((Number(row.harga_material) || 0) + (Number(row.harga_jasa) || 0)))), 0), 0);
        const totalPA = pekerjaanItems.reduce((sum, row) => sum + (Number(row.nilai_pa) || 0), 0);
        const totalKontrak = kontrak.filter(row => pekerjaanIds.has(String(row.pekerjaan_id)))
            .reduce((sum, row) => sum + (Number(row.nilai_kontrak) || 0), 0);
        const totalTagihan = realisasi.filter(row => pekerjaanIds.has(String(row.pekerjaan_id)))
            .reduce((sum, row) => sum + (Number(row.nilai) || 0), 0);
        const totalBayar = realisasi.filter(row => pekerjaanIds.has(String(row.pekerjaan_id)) && String(row.status_pembayaran || '').trim().toLowerCase() === 'dibayar')
            .reduce((sum, row) => sum + (Number(row.nilai) || 0), 0);
        const anggaran = Number(item.nilai_pagu) || Number(prkItem?.pagu_dana) || 0;
        const disburse = Number(item.nilai_disburse) || 0;

        return {
            noPrk: prkItem?.no_prk || '-',
            uraianPrk: prkItem?.prk || prkItem?.nama || prkItem?.uraian || '-',
            anggaran,
            disburse,
            totalRAB,
            totalPA,
            totalKontrak,
            totalTagihan,
            totalBayar,
            sisaPRK: anggaran - totalBayar
        };
    }).filter(row => row.anggaran || row.disburse || row.totalRAB || row.totalPA || row.totalKontrak || row.totalTagihan);

    const body = rows.length ? rows.map((row, index) => `
        <tr class="border-b border-slate-100 align-top">
            <td class="p-3 text-center">${index + 1}</td>
            <td class="p-3 break-words whitespace-normal min-w-36">${escapeReport(row.noPrk)}</td>
            <td class="p-3 break-words whitespace-normal min-w-64">${escapeReport(row.uraianPrk)}</td>
            <td class="p-3 text-right">${CONFIG.formatCurrency(row.anggaran)}</td>
            <td class="p-3 text-right">${CONFIG.formatCurrency(row.disburse)}</td>
            <td class="p-3 text-right">${CONFIG.formatCurrency(row.totalRAB)}</td>
            <td class="p-3 text-right">${CONFIG.formatCurrency(row.totalPA)}</td>
            <td class="p-3 text-right">${CONFIG.formatCurrency(row.totalKontrak)}</td>
            <td class="p-3 text-right">${CONFIG.formatCurrency(row.totalTagihan)}</td>
            <td class="p-3 text-right text-emerald-700">${CONFIG.formatCurrency(row.totalBayar)}</td>
            <td class="p-3 text-right font-bold ${row.sisaPRK >= 0 ? 'text-emerald-700' : 'text-red-600'}">${CONFIG.formatCurrency(row.sisaPRK)}</td>
        </tr>`).join('') : '<tr><td colspan="11" class="p-8 text-center text-slate-400 italic">Belum ada data realisasi untuk dilaporkan.</td></tr>';

    contentArea.innerHTML = `
        <div class="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div class="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between gap-3 items-start sm:items-center">
                <div><h2 class="text-lg font-bold text-slate-800">Laporan Realisasi</h2><p class="text-xs text-slate-500 mt-1">Rekap realisasi Anggaran Investasi dan Disburse per PRK.</p></div>
                <button type="button" onclick="printLaporanRealisasi()" class="bg-brand text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-sky-700"><i data-lucide="printer" class="w-4 h-4"></i> Print</button>
            </div>
            <div class="overflow-x-auto">
                <table id="laporan-realisasi-table" class="w-full text-left text-xs table-fixed">
                    <thead class="bg-slate-100 text-slate-700 font-semibold"><tr>
                        <th class="p-3 w-10 text-center">No</th><th class="p-3 w-36">No. PRK</th><th class="p-3 w-64">Uraian PRK</th><th class="p-3 text-right">ANGGARAN INVESTASI</th><th class="p-3 text-right">DISBURSE</th><th class="p-3 text-right">TOTAL RAB</th><th class="p-3 text-right">TOTAL PA</th><th class="p-3 text-right">TOTAL KONTRAK</th><th class="p-3 text-right">TAGIHAN</th><th class="p-3 text-right">TOTAL BAYAR</th><th class="p-3 text-right">SISA PRK</th>
                    </tr></thead>
                    <tbody class="divide-y divide-slate-100">${body}</tbody>
                </table>
            </div>
        </div>`;
    lucide.createIcons();
};

window.printLaporanRealisasi = function printLaporanRealisasi() {
    const table = document.getElementById('laporan-realisasi-table');
    if (!table) return;
    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    if (!printWindow) return showToast('Izinkan pop-up browser untuk mencetak laporan.', 'error');
    printWindow.document.write(`<!doctype html><html lang="id"><head><meta charset="UTF-8"><title>Laporan Realisasi Anggaran Investasi</title><style>
        @page{size:A4 landscape;margin:12mm}*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#111;font-size:9px}header{text-align:center;border-bottom:2px solid #111;padding-bottom:10px;margin-bottom:12px}header img{height:48px;display:block;margin:0 auto 5px}h1{font-size:16px;margin:3px 0;text-transform:uppercase}h2{font-size:13px;margin:3px 0}p{margin:3px 0;color:#555}table{width:100%;border-collapse:collapse;table-layout:fixed}th,td{border:1px solid #555;padding:5px;vertical-align:top;word-wrap:break-word;white-space:normal}th{background:#e5e7eb;text-align:center;font-size:8px}td{text-align:right}td:nth-child(1),td:nth-child(2),td:nth-child(3){text-align:left}footer{margin-top:12px;text-align:right;font-size:8px;color:#555}</style></head><body><header><img src="https://upload.wikimedia.org/wikipedia/commons/9/97/Logo_PLN.png" alt="Logo PLN"><h1>PT PLN (PERSERO)</h1><h2>LAPORAN REALISASI ANGGARAN INVESTASI</h2><p>Dicetak: ${new Date().toLocaleString('id-ID')}</p></header>${table.outerHTML}<footer>Dokumen laporan monitoring realisasi anggaran investasi</footer></body></html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 300);
};

function escapeReport(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
}
