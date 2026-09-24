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
        const nilaiFinal = pekerjaanItems.reduce((sum, row) => sum + (Number(row.nilai_final) || Number(row.nilai_pa) || 0), 0);
        const totalKontrak = kontrak.filter(row => pekerjaanIds.has(String(row.pekerjaan_id)))
            .reduce((sum, row) => sum + (Number(row.nilai_kontrak) || 0), 0);
        const totalTagihan = realisasi.filter(row => pekerjaanIds.has(String(row.pekerjaan_id)))
            .reduce((sum, row) => sum + (Number(row.nilai) || 0), 0);
        const totalBayar = realisasi.filter(row => pekerjaanIds.has(String(row.pekerjaan_id)) && String(row.status_pembayaran || '').trim().toLowerCase() === 'dibayar')
            .reduce((sum, row) => sum + (Number(row.nilai) || 0), 0);
        const anggaran = Number(item.nilai_pagu) || Number(prkItem?.pagu_dana) || 0;
        const disburse = Number(item.nilai_disburse) || 0;
        const totalRAB = anggaran - nilaiFinal;

        return {
            noPrk: prkItem?.no_prk || '-',
            uraianPrk: prkItem?.prk || prkItem?.nama || prkItem?.uraian || '-',
            kodeProgram: String(program?.kode_jenis || program?.kode || program?.jenis || 'LAINNYA').trim().toUpperCase(),
            anggaran,
            disburse,
            totalRAB,
            nilaiFinal,
            totalKontrak,
            totalTagihan,
            totalBayar,
            sisaPRK: anggaran - nilaiFinal
        };
    }).filter(row => row.anggaran || row.disburse || row.totalRAB || row.nilaiFinal || row.totalKontrak || row.totalTagihan);
    const reportProgramMap = {};
    rows.forEach(row => {
        if (!reportProgramMap[row.kodeProgram]) reportProgramMap[row.kodeProgram] = { code: row.kodeProgram, anggaran: 0, rab: 0, final: 0, kontrak: 0, bayar: 0, sisa: 0 };
        const card = reportProgramMap[row.kodeProgram];
        card.anggaran += row.anggaran;
        card.rab += row.totalRAB;
        card.final += row.nilaiFinal;
        card.kontrak += row.totalKontrak;
        card.bayar += row.totalBayar;
        card.sisa += row.sisaPRK;
    });
    const reportDashboardCards = Object.values(reportProgramMap);
    const reportDashboardTotals = reportDashboardCards.reduce((total, card) => ({
        anggaran: total.anggaran + card.anggaran,
        rab: total.rab + card.rab,
        final: total.final + card.final,
        kontrak: total.kontrak + card.kontrak,
        bayar: total.bayar + card.bayar,
        sisa: total.sisa + card.sisa
    }), { anggaran: 0, rab: 0, final: 0, kontrak: 0, bayar: 0, sisa: 0 });
    const reportYear = new Date().getFullYear();
    const reportSifatTotals = { Murni: 0, Lanjutan: 0 };
    const reportPrkSeen = new Set();
    prk.forEach(item => {
        const sifat = String(item.sifat_prk || item.sifat || '').trim();
        const tahun = Number(item.tahun) || 0;
        const key = `${item.id}-${tahun}`;
        if (reportPrkSeen.has(key)) return;
        reportPrkSeen.add(key);
        if (sifat === 'Murni' && tahun === reportYear) reportSifatTotals.Murni += Number(item.pagu_dana) || 0;
        if (sifat === 'Lanjutan' && tahun === reportYear - 1) reportSifatTotals.Lanjutan += Number(item.pagu_dana) || 0;
    });
    const reportDashboardMarkup = reportDashboardCards.length ? reportDashboardCards.map((card, index) => `
        <div class="border border-slate-300 rounded-lg overflow-hidden bg-white">
            <div class="bg-cyan-400 text-slate-900 text-center font-bold text-xs p-2 uppercase">AI ${card.code}</div>
            <div class="p-3 grid grid-cols-[92px_1fr] gap-3 items-center">
                <div class="relative h-20"><canvas id="laporan-dashboard-chart-${index}"></canvas></div>
                <div class="grid grid-cols-2 gap-2 text-[10px]">
                    <div><span class="text-slate-500">T.R@B</span><strong class="block">${formatShortCurrency(card.rab)}</strong></div>
                    <div><span class="text-slate-500">NILAI FINAL</span><strong class="block text-amber-700">${formatShortCurrency(card.final)}</strong></div>
                    <div><span class="text-slate-500">KONTRAK</span><strong class="block text-brand">${formatShortCurrency(card.kontrak)}</strong></div>
                    <div><span class="text-slate-500">SISA PRK</span><strong class="block text-emerald-700">${formatShortCurrency(card.sisa)}</strong></div>
                </div>
            </div>
        </div>`).join('') : '<div class="p-5 text-center text-slate-400">Belum ada data Dashboard AI.</div>';

    const body = rows.length ? rows.map((row, index) => `
        <tr class="border-b border-slate-100 align-top">
            <td class="p-3 text-center whitespace-nowrap">${index + 1}</td>
            <td class="p-3 break-words whitespace-normal min-w-36">${escapeReport(row.noPrk)}</td>
            <td class="p-3 break-words whitespace-normal min-w-64">${escapeReport(row.uraianPrk)}</td>
            <td class="p-3 text-right whitespace-nowrap">${CONFIG.formatCurrency(row.anggaran)}</td>
            <td class="p-3 text-right whitespace-nowrap">${CONFIG.formatCurrency(row.disburse)}</td>
            <td class="p-3 text-right whitespace-nowrap">${CONFIG.formatCurrency(row.totalRAB)}</td>
            <td class="p-3 text-right text-amber-700 whitespace-nowrap">${CONFIG.formatCurrency(row.nilaiFinal)}</td>
            <td class="p-3 text-right whitespace-nowrap">${CONFIG.formatCurrency(row.totalKontrak)}</td>
            <td class="p-3 text-right whitespace-nowrap">${CONFIG.formatCurrency(row.totalTagihan)}</td>
            <td class="p-3 text-right text-emerald-700 whitespace-nowrap">${CONFIG.formatCurrency(row.totalBayar)}</td>
            <td class="p-3 text-right font-bold whitespace-nowrap ${row.sisaPRK >= 0 ? 'text-emerald-700' : 'text-red-600'}">${CONFIG.formatCurrency(row.sisaPRK)}</td>
        </tr>`).join('') : '<tr><td colspan="11" class="p-8 text-center text-slate-400 italic">Belum ada data realisasi untuk dilaporkan.</td></tr>';

    contentArea.innerHTML = `
        <div class="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden mb-6">
            <div class="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center"><div><h2 class="text-lg font-bold text-slate-800">DASHBOARD AI ${reportYear}</h2><p class="text-xs text-slate-500 mt-1">Rekap Anggaran Investasi per Kode Program</p></div><i data-lucide="bar-chart-3" class="w-6 h-6 text-brand"></i></div>
            <div class="m-4 border border-slate-300 rounded-lg overflow-hidden">
                <div class="bg-cyan-400 text-center text-slate-900 font-bold text-sm p-2 uppercase">KESELURUHAN DANA INVESTASI</div>
                <div class="p-4 grid grid-cols-1 md:grid-cols-[130px_1fr] gap-4 items-center">
                    <div class="relative h-28"><canvas id="laporan-dashboard-total-chart"></canvas></div>
                    <div class="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                        <div><span class="text-slate-500">ANGGARAN INVESTASI</span><strong class="block mt-1">${formatShortCurrency(reportDashboardTotals.anggaran)}</strong></div>
                        <div><span class="text-slate-500">TOTAL KONTRAK</span><strong class="block mt-1">${formatShortCurrency(reportDashboardTotals.kontrak)}</strong></div>
                        <div><span class="text-slate-500">SISA PRK</span><strong class="block mt-1 text-amber-700">${formatShortCurrency(reportDashboardTotals.sisa)}</strong></div>
                        <div><span class="text-slate-500">TERBAYAR</span><strong class="block mt-1 text-emerald-700">${formatShortCurrency(reportDashboardTotals.bayar)}</strong></div>
                        <div><span class="text-slate-500">BELUM TERBAYAR</span><strong class="block mt-1 text-rose-700">${formatShortCurrency(Math.max(reportDashboardTotals.kontrak - reportDashboardTotals.bayar, 0))}</strong></div>
                    </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 pt-0"><div class="border border-emerald-200 bg-emerald-50 rounded-lg p-3 text-center"><strong class="block text-xs">MURNI</strong><span class="text-[10px] text-slate-500">TOTAL DANA TAHUN ${reportYear}</span><strong class="block mt-1 text-lg">${formatShortCurrency(reportSifatTotals.Murni)}</strong></div><div class="border border-amber-200 bg-amber-50 rounded-lg p-3 text-center"><strong class="block text-xs">LANJUTAN</strong><span class="text-[10px] text-slate-500">TOTAL DANA TAHUN ${reportYear - 1}</span><strong class="block mt-1 text-lg">${formatShortCurrency(reportSifatTotals.Lanjutan)}</strong></div></div>
            </div>
            <div class="mx-4 mb-4 grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
                <div class="bg-slate-50 border rounded-lg p-3"><span class="text-slate-500">ANGGARAN INVESTASI</span><strong class="block mt-1">${formatShortCurrency(reportDashboardTotals.anggaran)}</strong></div><div class="bg-slate-50 border rounded-lg p-3"><span class="text-slate-500">T.R@B</span><strong class="block mt-1">${formatShortCurrency(reportDashboardTotals.rab)}</strong></div><div class="bg-slate-50 border rounded-lg p-3"><span class="text-slate-500">KONTRAK</span><strong class="block mt-1">${formatShortCurrency(reportDashboardTotals.kontrak)}</strong></div><div class="bg-slate-50 border rounded-lg p-3"><span class="text-slate-500">TERBAYAR</span><strong class="block mt-1 text-emerald-700">${formatShortCurrency(reportDashboardTotals.bayar)}</strong></div><div class="bg-slate-50 border rounded-lg p-3"><span class="text-slate-500">SISA PRK</span><strong class="block mt-1 text-amber-700">${formatShortCurrency(reportDashboardTotals.sisa)}</strong></div>
            </div>
            <div class="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-3">${reportDashboardMarkup}</div>
        </div>
        <div class="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div class="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between gap-3 items-start sm:items-center">
                <div><h2 class="text-lg font-bold text-slate-800">Laporan Realisasi</h2><p class="text-xs text-slate-500 mt-1">Rekap Pagu, Disburse, RAB, Nilai Final, Kontrak, dan Realisasi per PRK.</p></div>
                <div class="flex items-center gap-2">
                    <button type="button" onclick="exportLaporanRealisasiExcel()" class="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-emerald-700"><i data-lucide="file-spreadsheet" class="w-4 h-4"></i> Export Excel</button>
                    <button type="button" onclick="printLaporanRealisasi()" class="bg-brand text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-sky-700"><i data-lucide="printer" class="w-4 h-4"></i> Print</button>
                </div>
            </div>
            <div class="overflow-x-auto">
                <table id="laporan-realisasi-table" class="min-w-[1450px] w-full text-left text-xs">
                    <thead class="bg-slate-100 text-slate-700 font-semibold"><tr>
                        <th class="p-3 w-12 text-center whitespace-nowrap">No</th><th class="p-3 w-40 whitespace-normal leading-tight">No. PRK</th><th class="p-3 w-72 whitespace-normal leading-tight">Uraian PRK</th><th class="p-3 w-36 text-right whitespace-normal leading-tight">ANGGARAN INVESTASI</th><th class="p-3 w-32 text-right whitespace-nowrap">DISBURSE</th><th class="p-3 w-32 text-right whitespace-nowrap">T.R@B</th><th class="p-3 w-32 text-right whitespace-normal leading-tight">NILAI FINAL</th><th class="p-3 w-36 text-right whitespace-normal leading-tight">TOTAL KONTRAK</th><th class="p-3 w-32 text-right whitespace-nowrap">TAGIHAN</th><th class="p-3 w-32 text-right whitespace-normal leading-tight">TOTAL BAYAR</th><th class="p-3 w-36 text-right whitespace-nowrap">SISA PRK</th>
                    </tr></thead>
                    <tbody class="divide-y divide-slate-100">${body}</tbody>
                </table>
            </div>
        </div>`;
    lucide.createIcons();
    reportDashboardCards.forEach((card, index) => {
        const chart = document.getElementById(`laporan-dashboard-chart-${index}`);
        if (chart) new Chart(chart, { type: 'doughnut', data: { labels: ['Kontrak', 'Sisa PRK'], datasets: [{ data: [Math.max(card.kontrak, 0), Math.max(card.sisa, 0)], backgroundColor: ['#3b82f6', '#d1d5db'], borderWidth: 0 }] }, options: { responsive: true, maintainAspectRatio: false, cutout: '62%', plugins: { legend: { display: false } } } });
    });
    const reportTotalChart = document.getElementById('laporan-dashboard-total-chart');
    if (reportTotalChart) new Chart(reportTotalChart, { type: 'doughnut', data: { labels: ['Nilai Final', 'Sisa PRK'], datasets: [{ data: [Math.max(reportDashboardTotals.final, 0), Math.max(reportDashboardTotals.sisa, 0)], backgroundColor: ['#3b82f6', '#d1d5db'], borderWidth: 0 }] }, options: { responsive: true, maintainAspectRatio: false, cutout: '64%', plugins: { legend: { display: false } } } });

    window.exportLaporanRealisasiExcel = function exportLaporanRealisasiExcel() {
        const table = document.getElementById('laporan-realisasi-table');
        if (!table) return showToast('Tabel Laporan Realisasi belum tersedia.', 'error');
        if (typeof XLSX === 'undefined') return showToast('Library Excel belum termuat. Periksa koneksi internet.', 'error');

        const values = Array.from(table.rows).map(row => Array.from(row.cells).map(cell => {
            const text = cell.textContent.trim();
            if (!/^Rp\s*/i.test(text)) return text;
            const numericText = text.replace(/^Rp\s*/i, '').replace(/\./g, '').replace(',', '.');
            const numericValue = Number(numericText);
            return Number.isFinite(numericValue) ? numericValue : 0;
        }));
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.aoa_to_sheet(values);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Realisasi');
        const exportWorksheet = workbook.Sheets['Laporan Realisasi'];
        exportWorksheet['!cols'] = [
            { wch: 6 }, { wch: 18 }, { wch: 42 }, { wch: 18 }, { wch: 16 },
            { wch: 16 }, { wch: 16 }, { wch: 17 }, { wch: 16 }, { wch: 16 }, { wch: 16 }
        ];
        XLSX.writeFile(workbook, `Laporan_Realisasi_${new Date().getFullYear()}.xlsx`);
    };
};
window.printLaporanRealisasi = function printLaporanRealisasi() {
    const table = document.getElementById('laporan-realisasi-table');
    if (!table) return;
    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    if (!printWindow) return showToast('Izinkan pop-up browser untuk mencetak laporan.', 'error');
    printWindow.document.write(`<!doctype html><html lang="id"><head><meta charset="UTF-8"><title>Laporan Realisasi Anggaran Investasi</title><style>
        @page{size:A4 landscape;margin:10mm}*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#111;font-size:8px}header{text-align:center;border-bottom:2px solid #111;padding-bottom:8px;margin-bottom:10px}header img{height:42px;display:block;margin:0 auto 4px}h1{font-size:15px;margin:3px 0;text-transform:uppercase}h2{font-size:12px;margin:3px 0}p{margin:3px 0;color:#555}table{width:100%;border-collapse:collapse;table-layout:fixed}th,td{border:1px solid #555;padding:4px;vertical-align:top;word-wrap:break-word;white-space:normal;line-height:1.25}table th:nth-child(1),table td:nth-child(1){width:3%;text-align:center}table th:nth-child(2),table td:nth-child(2){width:8%;text-align:left}table th:nth-child(3),table td:nth-child(3){width:22%;text-align:left}table th:nth-child(4),table td:nth-child(4){width:10%}table th:nth-child(5),table td:nth-child(5){width:8%}table th:nth-child(6),table td:nth-child(6){width:8%}table th:nth-child(7),table td:nth-child(7){width:8%}table th:nth-child(8),table td:nth-child(8){width:9%}table th:nth-child(9),table td:nth-child(9){width:8%}table th:nth-child(10),table td:nth-child(10){width:8%}table th:nth-child(11),table td:nth-child(11){width:8%}th{background:#e5e7eb;text-align:center;font-size:7.5px}td:nth-child(n+4){white-space:nowrap;text-align:right}footer{margin-top:10px;text-align:right;font-size:7.5px;color:#555}</style></head><body><header><img src="https://upload.wikimedia.org/wikipedia/commons/9/97/Logo_PLN.png" alt="Logo PLN"><h1>PT PLN (PERSERO)</h1><h2>LAPORAN REALISASI ANGGARAN INVESTASI</h2><p>Dicetak: ${new Date().toLocaleString('id-ID')}</p></header>${table.outerHTML}<footer>Dokumen laporan monitoring realisasi anggaran investasi</footer></body></html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 300);
};

function escapeReport(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
}
