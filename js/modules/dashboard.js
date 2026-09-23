// ==========================================
// js/modules/dashboard.js
// Modul Dashboard utama dengan grafik & filter
// ==========================================

window.renderDashboard = async function renderDashboard(filters = {}) {
    const contentArea = document.getElementById('app-content');
    if (!contentArea) return;
    contentArea.innerHTML = '<div class="flex justify-center items-center py-24"><div class="loader"></div></div>';

    const [data, pekerjaanList, kontrakList, realisasiList, pengadaanList, rabList, prkList, jenisProgramList] = await Promise.all([
        fetchAPI('action=dashboard'),
        fetchWithCache('Pekerjaan'),
        fetchWithCache('Kontrak'),
        fetchWithCache('Realisasi'),
        fetchWithCache('Pengadaan'),
        fetchWithCache('RAB'),
        fetchWithCache('prk'),
        fetchWithCache('jenis_program')
    ]);

    let pekerjaanArr   = Array.isArray(pekerjaanList)  ? pekerjaanList  : [];
    let kontrakArr     = Array.isArray(kontrakList)    ? kontrakList    : [];
    let realisasiArr   = Array.isArray(realisasiList)  ? realisasiList  : [];
    const pengadaanArr = Array.isArray(pengadaanList)  ? pengadaanList  : [];
    const rabArr       = Array.isArray(rabList)        ? rabList        : [];
    const prkArr       = Array.isArray(prkList)        ? prkList        : [];
    const jenisProgramArr = Array.isArray(jenisProgramList) ? jenisProgramList : [];

    // Lokasi unik untuk dropdown
    const lokasiUnique = [...new Set(pekerjaanArr.map(p => p.lokasi).filter(l => l))].sort();
    window.dashboardLokasiOptions = lokasiUnique;

    // Apply filters
    const filterTahun  = filters.tahun  || '';
    const filterLokasi = filters.lokasi || '';
    const filterStatus = filters.status || '';

    if (filterTahun)  pekerjaanArr = pekerjaanArr.filter(p => String(p.tahun_anggaran) === String(filterTahun));
    if (filterLokasi) pekerjaanArr = pekerjaanArr.filter(p => (p.lokasi || '') === filterLokasi);

    const pekerjaanIds = pekerjaanArr.map(p => String(p.id));
    kontrakArr  = kontrakArr.filter(k => pekerjaanIds.includes(String(k.pekerjaan_id)));

    if (filterStatus) {
        kontrakArr = kontrakArr.filter(k => {
            const st = (k.status || 'On Progress').toLowerCase();
            const fs = filterStatus.toLowerCase();
            if (fs === 'on progress') return !st.includes('selesai') && !st.includes('batal') && !st.includes('tunda') && !st.includes('belum');
            return st.includes(fs);
        });
    }
    realisasiArr = realisasiArr.filter(r => pekerjaanIds.includes(String(r.pekerjaan_id)));

    // KPI
    let totalNilaiKontrak = 0;
    kontrakArr.forEach(k => { totalNilaiKontrak += parseFloat(k.nilai_kontrak) || 0; });
    const pengadaanIdsTerpilih = new Set(
        pekerjaanArr
            .map(p => p.pengadaan_id || p.id_pengadaan_prk)
            .filter(Boolean)
            .map(id => String(id))
    );
    let totalPaguPengadaan = 0;
    pengadaanArr.forEach(p => {
        if (pengadaanIdsTerpilih.size === 0 || pengadaanIdsTerpilih.has(String(p.id))) {
            const prk = prkArr.find(item => String(item.id) === String(p.id_prk || p.prk_id || p.id_prk_program));
            totalPaguPengadaan += parseFloat(p.nilai_pagu) || parseFloat(prk?.pagu_dana) || 0;
        }
    });
    let totalRealisasi = data && data.realisasi ? parseFloat(data.realisasi) : 0;
    if (totalRealisasi === 0) realisasiArr.forEach(r => { totalRealisasi += parseFloat(r.nilai) || parseFloat(r.nilai_realisasi) || 0; });

    const totalAnggaran      = totalPaguPengadaan > 0 ? totalPaguPengadaan : totalNilaiKontrak;
    const sisaAnggaran       = totalAnggaran > totalRealisasi ? totalAnggaran - totalRealisasi : 0;
    const persentaseRealisasi= totalAnggaran > 0 ? ((totalRealisasi / totalAnggaran) * 100).toFixed(1) : '0';
    const nilaiEfisiensi     = totalAnggaran - totalNilaiKontrak;
    const persentaseEfisiensi= totalAnggaran > 0 ? ((nilaiEfisiensi / totalAnggaran) * 100).toFixed(1) : '0';
    const persentaseSerapan  = totalNilaiKontrak > 0 ? ((totalRealisasi / totalNilaiKontrak) * 100).toFixed(1) : '0';
    const totalPaket         = pekerjaanArr.length;

    // Realisasi kumulatif bulanan
    let realisasiPerBulan = new Array(12).fill(0);
    realisasiArr.forEach(r => {
        if (r.tanggal && (r.nilai || r.nilai_realisasi)) {
            const d = new Date(r.tanggal);
            if (!isNaN(d.getTime())) realisasiPerBulan[d.getMonth()] += parseFloat(r.nilai) || parseFloat(r.nilai_realisasi) || 0;
        }
    });
    let realisasiKumulatif = [], rencanaKumulatif = [], akumulasiR = 0, akumulasiP = 0;
    const targetBulan = totalAnggaran > 0 ? (totalAnggaran / 12) / 1e9 : 0;
    for (let i = 0; i < 12; i++) {
        akumulasiR += realisasiPerBulan[i];
        realisasiKumulatif.push(Number((akumulasiR / 1e9).toFixed(3)));
        akumulasiP += targetBulan;
        rencanaKumulatif.push(Number(akumulasiP.toFixed(3)));
    }

    // Top 5 Vendor
    const vendorMap = {};
    kontrakArr.forEach(k => {
        const vName = (k.nama_penyedia || 'Mitra Penyedia').trim();
        vendorMap[vName] = (vendorMap[vName] || 0) + (parseFloat(k.nilai_kontrak) || 0);
    });
    const sortedVendors = Object.entries(vendorMap).map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total).slice(0, 5);
    const colors = ['bg-blue-600', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500', 'bg-sky-400'];
    let topVendorsHTML = sortedVendors.length === 0
        ? '<p class="text-xs text-slate-400 italic py-6 text-center">Belum ada kontrak tercatat.</p>'
        : sortedVendors.map((v, idx) => {
            const pct    = totalNilaiKontrak > 0 ? ((v.total / totalNilaiKontrak) * 100).toFixed(0) : 0;
            const barPct = Math.max(5, Math.round((v.total / (sortedVendors[0].total || 1)) * 100));
            return `<div>
                <div class="flex justify-between mb-1 font-medium">
                    <span class="text-slate-700 truncate max-w-[180px]">${v.name}</span>
                    <span class="font-bold text-slate-800">${formatShortCurrency(v.total)} (${pct}%)</span>
                </div>
                <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div class="${colors[idx % colors.length]} h-full rounded-full" style="width:${barPct}%"></div>
                </div>
            </div>`;
        }).join('');

    // Komposisi jenis kegiatan
    const jenisMap = {};
    pekerjaanArr.forEach(p => {
        const jenis = (p.jenis_kegiatan || 'Lainnya').trim();
        jenisMap[jenis] = (jenisMap[jenis] || 0) + 1;
    });
    const jenisEntries   = Object.entries(jenisMap);
    const komposisiLabels= jenisEntries.length ? jenisEntries.map(e => e[0]) : ['Umum'];
    const komposisiValues= jenisEntries.length ? jenisEntries.map(e => e[1]) : [totalPaket || 1];
    const compColors     = ['bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500', 'bg-slate-400', 'bg-sky-500'];
    let komposisiHTML = jenisEntries.length === 0
        ? '<p class="text-xs text-slate-400 italic py-3 text-center">Belum ada data paket pekerjaan.</p>'
        : komposisiLabels.slice(0, 5).map((label, idx) => {
            const cnt = komposisiValues[idx];
            const pct = totalPaket > 0 ? Math.round((cnt / totalPaket) * 100) : 0;
            return `<div class="flex justify-between items-center">
                <span class="flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-full ${compColors[idx % compColors.length]}"></span>${label}</span>
                <span class="font-bold text-slate-700">${pct}% (${cnt})</span>
            </div>`;
        }).join('');

    // Status pekerjaan
    let statusCounts = { 'Selesai': 0, 'On Progress': 0, 'Belum Mulai': 0, 'Tunda': 0, 'Batal': 0 };
    kontrakArr.forEach(k => {
        const st = (k.status || 'On Progress').toLowerCase();
        if (st.includes('selesai')) statusCounts['Selesai']++;
        else if (st.includes('batal')) statusCounts['Batal']++;
        else if (st.includes('tunda')) statusCounts['Tunda']++;
        else if (st.includes('belum')) statusCounts['Belum Mulai']++;
        else statusCounts['On Progress']++;
    });
    if (kontrakArr.length === 0 && totalPaket > 0) statusCounts['Belum Mulai'] = totalPaket;

    const dashboardProgramMap = {};
    jenisProgramArr.forEach(program => {
        const code = String(program.kode_jenis || program.kode || program.jenis || 'LAINNYA').trim().toUpperCase();
        if (!dashboardProgramMap[code]) dashboardProgramMap[code] = { id: code, no: code, name: program.nama_program || program.nama || code, pagu: 0, rab: 0, kontrak: 0, bayar: 0, programs: [] };
        const card = dashboardProgramMap[code];
        const programPengadaanIds = new Set(pengadaanArr.filter(item => String(item.id_jenis) === String(program.id)).map(item => String(item.id)));
        const programJobs = pekerjaanArr.filter(item => programPengadaanIds.has(String(item.pengadaan_id || item.id_pengadaan_prk)));
        const jobIds = new Set(programJobs.map(item => String(item.id)));
        card.pagu += pengadaanArr.filter(item => programPengadaanIds.has(String(item.id))).reduce((sum, item) => sum + (Number(item.nilai_pagu) || Number(prkArr.find(prkItem => String(prkItem.id) === String(program.id_prk))?.pagu_dana) || 0), 0);
        card.rab += rabArr.filter(item => jobIds.has(String(item.pekerjaan_id)) && String(item.versi_rab || '').toLowerCase() !== 'terkoreksi').reduce((sum, item) => sum + (Number(item.jumlah) || ((Number(item.volume) || 0) * ((Number(item.harga_material) || 0) + (Number(item.harga_jasa) || 0)))), 0);
        card.kontrak += kontrakArr.filter(item => jobIds.has(String(item.pekerjaan_id))).reduce((sum, item) => sum + (Number(item.nilai_kontrak) || 0), 0);
        card.bayar += realisasiArr.filter(item => jobIds.has(String(item.pekerjaan_id)) && String(item.status_pembayaran || '').trim().toLowerCase() === 'dibayar').reduce((sum, item) => sum + (Number(item.nilai) || 0), 0);
    });
    const dashboardPrkCards = Object.values(dashboardProgramMap).map(card => ({ ...card, sisa: card.pagu - card.kontrak, belumBayar: card.kontrak - card.bayar })).filter(card => card.pagu || card.rab || card.kontrak || card.bayar);

    const totalDashboardPagu = dashboardPrkCards.reduce((sum, card) => sum + card.pagu, 0);
    const totalDashboardKontrak = dashboardPrkCards.reduce((sum, card) => sum + card.kontrak, 0);
    const totalDashboardBayar = dashboardPrkCards.reduce((sum, card) => sum + card.bayar, 0);
    const totalDashboardSisa = totalDashboardPagu - totalDashboardKontrak;
    const tahunDashboard = Number(filterTahun) || new Date().getFullYear();
    const dashboardSifatSummary = { Murni: 0, Lanjutan: 0 };
    prkArr.forEach(prkItem => {
        const sifat = String(prkItem.sifat_prk || prkItem.sifat || '').trim();
        if (!Object.prototype.hasOwnProperty.call(dashboardSifatSummary, sifat)) return;
        const tahunPRK = Number(prkItem.tahun) || 0;
        const tahunSesuai = sifat === 'Murni' ? tahunPRK === tahunDashboard : tahunPRK === tahunDashboard - 1;
        if (tahunSesuai) dashboardSifatSummary[sifat] += Number(prkItem.pagu_dana) || 0;
    });
    const dashboardSifatMarkup = ['Murni', 'Lanjutan'].map(sifat => {
        const totalDana = dashboardSifatSummary[sifat];
        const tahunLabel = sifat === 'Murni' ? tahunDashboard : tahunDashboard - 1;
        return `<div class="border border-slate-300 rounded-lg p-3 ${sifat === 'Murni' ? 'bg-emerald-50' : 'bg-amber-50'}"><div class="font-bold text-center uppercase text-xs mb-2">${sifat}</div><div class="text-center"><span class="text-slate-500 text-[10px]">TOTAL DANA TAHUN ${tahunLabel}</span><strong class="block mt-1 text-lg">${formatShortCurrency(totalDana)}</strong></div></div>`;
    }).join('');
    const dashboardPrkMarkup = dashboardPrkCards.length ? dashboardPrkCards.map((card, index) => `
        <div class="bg-white border border-slate-300 rounded-lg overflow-hidden">
            <div class="bg-cyan-400 text-slate-900 text-center font-bold text-xs p-2 uppercase">KODE PROGRAM: ${escapeDashboardText(card.no)} - ${escapeDashboardText(card.name)}</div>
            <div class="p-3 grid grid-cols-[100px_1fr] gap-3 items-center">
                <div class="relative h-24"><canvas id="dashboard-prk-chart-${index}"></canvas></div>
                <div class="grid grid-cols-2 gap-2 text-[10px]">
                    <div><span class="text-slate-500">RAB</span><strong class="block">${formatShortCurrency(card.rab)}</strong></div>
                    <div><span class="text-slate-500">KONTRAK</span><strong class="block">${formatShortCurrency(card.kontrak)}</strong></div>
                    <div><span class="text-slate-500">SISA PRK</span><strong class="block text-amber-700">${formatShortCurrency(card.sisa)}</strong></div>
                    <div><span class="text-slate-500">TERBAYAR</span><strong class="block text-emerald-700">${formatShortCurrency(card.bayar)}</strong></div>
                    <div class="col-span-2"><span class="text-slate-500">BELUM TERBAYAR</span><strong class="block text-rose-700">${formatShortCurrency(card.belumBayar)}</strong></div>
                </div>
            </div>
        </div>`).join('') : '<div class="p-6 text-center text-slate-400">Belum ada data PRK.</div>';

    const rekapDisburseRows = pengadaanArr.map(pengadaan => {
        const pengadaanId = String(pengadaan.id);
        const pekerjaanUntukPengadaan = pekerjaanArr.filter(item =>
            String(item.pengadaan_id || item.id_pengadaan_prk) === pengadaanId
        );
        const pekerjaanIdsUntukPengadaan = new Set(pekerjaanUntukPengadaan.map(item => String(item.id)));
        const totalRAB = rabArr
            .filter(item => pekerjaanIdsUntukPengadaan.has(String(item.pekerjaan_id)) && String(item.versi_rab || '').toLowerCase() !== 'terkoreksi')
            .reduce((sum, item) => sum + (Number(item.jumlah) || ((Number(item.volume) || 0) * ((Number(item.harga_material) || 0) + (Number(item.harga_jasa) || 0)))), 0);
        const totalPA = pekerjaanUntukPengadaan.reduce((sum, item) => sum + (Number(item.nilai_pa) || 0), 0);
        const totalKontrakPengadaan = kontrakArr
            .filter(item => pekerjaanIdsUntukPengadaan.has(String(item.pekerjaan_id)))
            .reduce((sum, item) => sum + (Number(item.nilai_kontrak) || 0), 0);
        const totalTagihan = realisasiArr
            .filter(item => pekerjaanIdsUntukPengadaan.has(String(item.pekerjaan_id)))
            .reduce((sum, item) => sum + (Number(item.nilai) || 0), 0);
        const totalBayar = realisasiArr
            .filter(item => pekerjaanIdsUntukPengadaan.has(String(item.pekerjaan_id)) &&
                String(item.status_pembayaran || '').trim().toLowerCase() === 'dibayar')
            .reduce((sum, item) => sum + (Number(item.nilai) || 0), 0);
        const disburse = Number(pengadaan.nilai_disburse) || 0;
        const jenisProgram = jenisProgramArr.find(item => String(item.id) === String(pengadaan.id_jenis || pengadaan.jenis_id));
        const prkId = pengadaan.id_prk || pengadaan.prk_id || pengadaan.id_prk_program || jenisProgram?.id_prk;
        const prk = prkArr.find(item => String(item.id) === String(prkId));
        const anggaranInvestasi = Number(pengadaan.nilai_pagu) || Number(prk?.pagu_dana) || 0;
        return {
            nomor: prk?.no_prk || '-',
            nama: prk?.prk || prk?.nama || prk?.uraian || '-',
            pagu: anggaranInvestasi,
            disburse,
            rab: totalRAB,
            pa: totalPA,
            kontrak: totalKontrakPengadaan,
            tagihan: totalTagihan,
            bayar: totalBayar,
            sisa: anggaranInvestasi - totalBayar
        };
    }).filter(row => row.pagu || row.disburse || row.rab || row.pa || row.kontrak || row.tagihan);

    const rekapDisburseHTML = rekapDisburseRows.length === 0
        ? '<tr><td colspan="11" class="p-8 text-center text-slate-400 italic">Belum ada data pengadaan untuk direkap.</td></tr>'
        : rekapDisburseRows.map((row, index) => `<tr class="border-b border-slate-100 hover:bg-slate-50 align-top">
            <td class="p-3 text-center">${index + 1}</td><td class="p-3 font-semibold whitespace-normal break-words min-w-36">${row.nomor}</td><td class="p-3 min-w-64 whitespace-normal break-words">${row.nama}</td>
            <td class="p-3 text-right">${CONFIG.formatCurrency(row.pagu)}</td><td class="p-3 text-right text-blue-700">${CONFIG.formatCurrency(row.disburse)}</td>
            <td class="p-3 text-right">${CONFIG.formatCurrency(row.rab)}</td><td class="p-3 text-right text-amber-700">${CONFIG.formatCurrency(row.pa)}</td>
            <td class="p-3 text-right text-brand">${CONFIG.formatCurrency(row.kontrak)}</td><td class="p-3 text-right text-slate-600">${CONFIG.formatCurrency(row.tagihan)}</td><td class="p-3 text-right text-emerald-700">${CONFIG.formatCurrency(row.bayar)}</td>
            <td class="p-3 text-right font-bold ${row.sisa >= 0 ? 'text-emerald-700' : 'text-red-600'}">${CONFIG.formatCurrency(row.sisa)}</td>
        </tr>`).join('');

    contentArea.innerHTML = `
        <div class="bg-white border border-slate-200 rounded-xl p-5 mb-6 shadow-sm">
            <div class="flex justify-between items-center mb-4"><div><h2 class="text-lg font-bold text-slate-800">DASHBOARD AI ${new Date().getFullYear()}</h2><p class="text-xs text-slate-500">Rekap Anggaran Investasi per Kode Program</p></div><i data-lucide="bar-chart-3" class="w-6 h-6 text-brand"></i></div>
            <div class="border border-slate-300 rounded-lg overflow-hidden mb-5">
                <div class="bg-cyan-400 text-center text-slate-900 font-bold text-sm p-2 uppercase">KESELURUHAN DANA INVESTASI</div>
                <div class="p-4 grid grid-cols-1 md:grid-cols-[130px_1fr] gap-4 items-center">
                    <div class="relative h-28"><canvas id="dashboard-total-chart"></canvas></div>
                    <div class="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                        <div><span class="text-slate-500">ANGGARAN INVESTASI</span><strong class="block mt-1">${formatShortCurrency(totalDashboardPagu)}</strong></div>
                        <div><span class="text-slate-500">TOTAL KONTRAK</span><strong class="block mt-1">${formatShortCurrency(totalDashboardKontrak)}</strong><small class="text-slate-400">${totalDashboardPagu > 0 ? ((totalDashboardKontrak / totalDashboardPagu) * 100).toFixed(1) : '0'}%</small></div>
                        <div><span class="text-slate-500">SISA PRK</span><strong class="block mt-1 text-amber-700">${formatShortCurrency(totalDashboardSisa)}</strong></div>
                        <div><span class="text-slate-500">TERBAYAR</span><strong class="block mt-1 text-emerald-700">${formatShortCurrency(totalDashboardBayar)}</strong><small class="text-slate-400">${totalDashboardKontrak > 0 ? ((totalDashboardBayar / totalDashboardKontrak) * 100).toFixed(1) : '0'}%</small></div>
                        <div><span class="text-slate-500">BELUM TERBAYAR</span><strong class="block mt-1 text-rose-700">${formatShortCurrency(totalDashboardKontrak - totalDashboardBayar)}</strong></div>
                    </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">${dashboardSifatMarkup}</div>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5 text-xs">
                <div class="bg-slate-50 border rounded-lg p-3"><span class="text-slate-500">ANGGARAN INVESTASI</span><strong class="block mt-1">${formatShortCurrency(totalDashboardPagu)}</strong></div>
                <div class="bg-slate-50 border rounded-lg p-3"><span class="text-slate-500">TOTAL RAB</span><strong class="block mt-1">${formatShortCurrency(dashboardPrkCards.reduce((sum, card) => sum + card.rab, 0))}</strong></div>
                <div class="bg-slate-50 border rounded-lg p-3"><span class="text-slate-500">KONTRAK</span><strong class="block mt-1">${formatShortCurrency(totalDashboardKontrak)}</strong></div>
                <div class="bg-slate-50 border rounded-lg p-3"><span class="text-slate-500">TERBAYAR</span><strong class="block mt-1 text-emerald-700">${formatShortCurrency(totalDashboardBayar)}</strong></div>
                <div class="bg-slate-50 border rounded-lg p-3"><span class="text-slate-500">SISA PRK</span><strong class="block mt-1 text-amber-700">${formatShortCurrency(totalDashboardSisa)}</strong></div>
            </div>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">${dashboardPrkMarkup}</div>
        </div>
        <!-- FILTER -->
        <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-6">
            <div class="flex flex-col md:flex-row gap-3 items-end">
                <div class="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                        <label class="block text-xs font-medium text-slate-600 mb-1.5">Tahun Anggaran</label>
                        <select id="dash-filter-tahun" onchange="applyDashboardFilter()" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-brand outline-none bg-white">
                            <option value="">Semua Tahun</option>
                            ${[2024,2025,2026,2027,2028].map(y => `<option value="${y}" ${y===2026?'selected':''}>${y}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-slate-600 mb-1.5">Lokasi / ULP</label>
                        <select id="dash-filter-lokasi" onchange="applyDashboardFilter()" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-brand outline-none bg-white">
                            <option value="">Semua Lokasi</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-slate-600 mb-1.5">Status Pekerjaan</label>
                        <select id="dash-filter-status" onchange="applyDashboardFilter()" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-brand outline-none bg-white">
                            <option value="">Semua Status</option>
                            <option value="Selesai">Selesai</option>
                            <option value="On Progress">On Progress</option>
                            <option value="Belum Mulai">Belum Mulai</option>
                            <option value="Tunda">Tunda</option>
                        </select>
                    </div>
                </div>
                <button onclick="resetDashboardFilter()" class="border border-slate-300 hover:bg-slate-50 text-slate-600 rounded-lg px-4 py-2 text-sm font-medium flex items-center gap-2 transition whitespace-nowrap">
                    <i data-lucide="x-circle" class="w-4 h-4"></i> Reset Filter
                </button>
            </div>
        </div>

        <!-- KARTU STATISTIK + BANNER -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div class="lg:col-span-2 bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between">
                <div class="flex justify-between items-center mb-4 flex-wrap gap-3">
                    <div>
                        <h3 class="text-base font-bold text-slate-800">Ringkasan Pelaksanaan Pekerjaan</h3>
                        <p class="text-xs text-slate-500">Monitoring realisasi fisik, keuangan, dan pengadaan PLN.</p>
                    </div>
                    <button onclick="renderDashboard()" class="border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 text-xs transition">
                        <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i> Sinkron
                    </button>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div class="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60 border-l-4 border-l-blue-500">
                        <div class="flex items-center gap-2 text-blue-600 mb-1"><i data-lucide="wallet" class="w-4 h-4"></i><span class="text-xs font-semibold">Total Pagu</span></div>
                        <h4 class="text-lg font-bold text-slate-800">${formatShortCurrency(totalAnggaran)}</h4>
                        <span class="text-[10px] text-slate-500">${totalPaguPengadaan > 0 ? 'Pagu Pengadaan' : 'Nilai Kontrak'}</span>
                    </div>
                    <div class="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60 border-l-4 border-l-emerald-500">
                        <div class="flex items-center gap-2 text-emerald-600 mb-1"><i data-lucide="file-check-2" class="w-4 h-4"></i><span class="text-xs font-semibold">Total Kontrak</span></div>
                        <h4 class="text-lg font-bold text-slate-800">${formatShortCurrency(totalNilaiKontrak)}</h4>
                        <span class="text-[10px] text-emerald-600 font-medium">${kontrakArr.length} Kontrak Aktif</span>
                    </div>
                    <div class="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60 border-l-4 border-l-amber-500">
                        <div class="flex items-center gap-2 text-amber-600 mb-1"><i data-lucide="bar-chart-3" class="w-4 h-4"></i><span class="text-xs font-semibold">Realisasi</span></div>
                        <h4 class="text-lg font-bold text-slate-800">${formatShortCurrency(totalRealisasi)}</h4>
                        <span class="text-[10px] text-amber-600 font-medium">${persentaseRealisasi}% terserap</span>
                    </div>
                    <div class="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60 border-l-4 border-l-rose-500">
                        <div class="flex items-center gap-2 text-rose-600 mb-1"><i data-lucide="pie-chart" class="w-4 h-4"></i><span class="text-xs font-semibold">Sisa Anggaran</span></div>
                        <h4 class="text-lg font-bold text-slate-800">${formatShortCurrency(sisaAnggaran)}</h4>
                        <span class="text-[10px] text-rose-600 font-medium">Belum terealisasi</span>
                    </div>
                </div>
            </div>
            <div class="bg-gradient-to-br from-blue-900 to-sky-800 rounded-xl p-5 text-white flex flex-col justify-between shadow-sm relative overflow-hidden">
                <div class="absolute -right-6 -bottom-6 opacity-10"><i data-lucide="zap" class="w-48 h-48"></i></div>
                <div>
                    <div class="flex items-center justify-between mb-2">
                        <span class="bg-yellow-400 text-blue-900 text-[10px] font-bold px-2 py-0.5 rounded">PLN</span>
                        <span class="text-xs text-sky-200 font-medium">Monitoring Real-Time</span>
                    </div>
                    <h3 class="text-xl font-bold leading-tight mt-3">Energi untuk Kehidupan yang Lebih Baik</h3>
                </div>
                <div class="mt-4 pt-3 border-t border-blue-700/50 flex justify-between items-center text-xs text-sky-200">
                    <span>${totalPaket} Paket Pekerjaan Terdata</span>
                    <span class="font-semibold text-white flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Google Sheets Aktif</span>
                </div>
            </div>
        </div>

        <!-- GRAFIK REALISASI vs RENCANA + KOMPOSISI -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div class="lg:col-span-2 bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                <div class="flex justify-between items-center mb-4">
                    <div>
                        <h3 class="text-sm font-bold text-slate-800">Realisasi vs Target Kumulatif</h3>
                        <p class="text-xs text-slate-500">Berdasarkan serapan di sheet Realisasi</p>
                    </div>
                    <div class="flex items-center gap-4 text-xs font-semibold">
                        <span class="flex items-center gap-1.5"><span class="w-3 h-1 bg-blue-500 rounded"></span> Target</span>
                        <span class="flex items-center gap-1.5"><span class="w-3 h-1 bg-emerald-500 rounded"></span> Realisasi</span>
                    </div>
                </div>
                <div class="h-64 relative"><canvas id="chartRealisasiRencana"></canvas></div>
            </div>
            <div class="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between">
                <div class="flex justify-between items-center mb-2">
                    <h3 class="text-sm font-bold text-slate-800">Komposisi Paket</h3>
                    <span class="text-[10px] text-slate-400">Total ${totalPaket} Paket</span>
                </div>
                <div class="relative h-44 flex items-center justify-center my-2">
                    <canvas id="chartKomposisi"></canvas>
                    <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span class="text-base font-bold text-slate-800">${totalPaket}</span>
                        <span class="text-[10px] text-slate-400">Total Paket</span>
                    </div>
                </div>
                <div class="space-y-1.5 text-xs pt-2 border-t border-slate-100">${komposisiHTML}</div>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div class="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                <div class="flex items-center justify-between mb-3"><h3 class="text-sm font-bold text-slate-800">Rekap Efisiensi Anggaran</h3><i data-lucide="badge-percent" class="w-5 h-5 text-blue-500"></i></div>
                <div class="grid grid-cols-3 gap-3 text-xs"><div><p class="text-slate-500">Pagu</p><p class="font-bold text-slate-800 mt-1">${formatShortCurrency(totalAnggaran)}</p></div><div><p class="text-slate-500">Kontrak</p><p class="font-bold text-brand mt-1">${formatShortCurrency(totalNilaiKontrak)}</p></div><div><p class="text-slate-500">Efisiensi</p><p class="font-bold ${nilaiEfisiensi >= 0 ? 'text-emerald-600' : 'text-red-600'} mt-1">${formatShortCurrency(nilaiEfisiensi)} (${persentaseEfisiensi}%)</p></div></div>
            </div>
            <div class="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                <div class="flex items-center justify-between mb-3"><h3 class="text-sm font-bold text-slate-800">Rekap Serapan Anggaran</h3><i data-lucide="pie-chart" class="w-5 h-5 text-emerald-500"></i></div>
                <div class="grid grid-cols-3 gap-3 text-xs"><div><p class="text-slate-500">Kontrak</p><p class="font-bold text-slate-800 mt-1">${formatShortCurrency(totalNilaiKontrak)}</p></div><div><p class="text-slate-500">Realisasi</p><p class="font-bold text-emerald-600 mt-1">${formatShortCurrency(totalRealisasi)}</p></div><div><p class="text-slate-500">Serapan</p><p class="font-bold text-brand mt-1">${persentaseSerapan}%</p></div></div>
            </div>
        </div>

        <!-- REALISASI BULANAN + TOP VENDOR + STATUS -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div class="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                <h3 class="text-sm font-bold text-slate-800 mb-3">Realisasi per Bulan</h3>
                <div class="h-56 relative"><canvas id="chartRealisasiBulan"></canvas></div>
            </div>
            <div class="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                <h3 class="text-sm font-bold text-slate-800 mb-3">Top Mitra Penyedia</h3>
                <div class="space-y-3 text-xs pt-1">${topVendorsHTML}</div>
            </div>
            <div class="space-y-6">
                <div class="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                    <h3 class="text-sm font-bold text-slate-800 mb-2">Status Pekerjaan / Kontrak</h3>
                    <div class="flex items-center gap-4">
                        <div class="relative w-32 h-32 flex items-center justify-center">
                            <canvas id="chartStatus"></canvas>
                            <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span class="text-base font-bold text-slate-800">${kontrakArr.length > 0 ? kontrakArr.length : totalPaket}</span>
                                <span class="text-[9px] text-slate-400">Total</span>
                            </div>
                        </div>
                        <div class="flex-1 space-y-1 text-[11px]">
                            ${Object.entries(statusCounts).map(([k, v]) => {
                                const c = k==='Selesai'?'bg-emerald-500':k==='On Progress'?'bg-blue-500':k==='Belum Mulai'?'bg-amber-500':k==='Tunda'?'bg-orange-500':'bg-rose-500';
                                return `<div class="flex justify-between items-center"><span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full ${c}"></span>${k}</span><span class="font-bold">${v}</span></div>`;
                            }).join('')}
                        </div>
                    </div>
                </div>
                <div class="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                    <h3 class="text-sm font-bold text-slate-800 mb-3">Status Sinkronisasi</h3>
                    <div class="space-y-2 text-xs">
                        ${[['Master Pengadaan', pengadaanArr.length],['Master Pekerjaan', pekerjaanArr.length],['Data Kontrak', kontrakArr.length],['Riwayat Realisasi', realisasiArr.length]]
                          .map(([label, count]) => `<div class="flex justify-between text-slate-600 pb-1.5 border-b border-slate-100 last:border-0"><span>${label}</span><span class="font-bold text-slate-800">${count} Data</span></div>`).join('')}
                    </div>
                </div>
            </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden mb-6">
            <div class="p-5 border-b border-slate-100 bg-slate-50/50"><h3 class="text-sm font-bold text-slate-800">Rekap Disburse Pengadaan</h3><p class="text-xs text-slate-500 mt-1">Nilai Disburse diisi manual pada Master Pengadaan.</p></div>
            <div class="overflow-x-auto"><table class="w-full text-left text-xs table-fixed"><thead class="bg-slate-100 text-slate-700 font-semibold"><tr>
                <th class="p-3 text-center">No</th><th class="p-3">No. PRK/Pengadaan</th><th class="p-3">Uraian Pengadaan</th><th class="p-3 text-right">ANGGARAN INVESTASI</th><th class="p-3 text-right">Disburse</th><th class="p-3 text-right">Total RAB</th><th class="p-3 text-right">Total PA</th><th class="p-3 text-right">Total Kontrak</th><th class="p-3 text-right">Tagihan/Realisasi</th><th class="p-3 text-right">Total Bayar</th><th class="p-3 text-right">SISA PRK</th>
            </tr></thead><tbody>${rekapDisburseHTML}</tbody></table></div>
        </div>

        <!-- QUICK ACCESS -->
        <div class="bg-white p-5 rounded-xl shadow-sm border border-slate-100 mb-6">
            <h3 class="text-sm font-bold text-slate-700 mb-3">Quick Access</h3>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <button onclick="navigate('pekerjaan')" class="p-3.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl flex items-center gap-3 transition font-semibold text-xs text-left shadow-sm">
                    <div class="p-2 bg-blue-600 text-white rounded-lg"><i data-lucide="briefcase" class="w-4 h-4"></i></div><span>Master Pekerjaan</span>
                </button>
                <button onclick="navigate('rab')" class="p-3.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl flex items-center gap-3 transition font-semibold text-xs text-left shadow-sm">
                    <div class="p-2 bg-emerald-600 text-white rounded-lg"><i data-lucide="calculator" class="w-4 h-4"></i></div><span>Buat RAB Baru</span>
                </button>
                <button onclick="navigate('realisasi')" class="p-3.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl flex items-center gap-3 transition font-semibold text-xs text-left shadow-sm">
                    <div class="p-2 bg-amber-600 text-white rounded-lg"><i data-lucide="trending-up" class="w-4 h-4"></i></div><span>Input Realisasi</span>
                </button>
                <button onclick="navigate('penyedia')" class="p-3.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl flex items-center gap-3 transition font-semibold text-xs text-left shadow-sm">
                    <div class="p-2 bg-purple-600 text-white rounded-lg"><i data-lucide="building" class="w-4 h-4"></i></div><span>Data Penyedia</span>
                </button>
            </div>
        </div>
    `;

    lucide.createIcons();

    // Populate lokasi dropdown
    const lokasiDD = document.getElementById('dash-filter-lokasi');
    if (lokasiDD && window.dashboardLokasiOptions) {
        lokasiDD.innerHTML = '<option value="">Semua Lokasi</option>' +
            window.dashboardLokasiOptions.map(lok => `<option value="${lok}" ${lok===filterLokasi?'selected':''}>${lok}</option>`).join('');
    }
    if (document.getElementById('dash-filter-tahun'))  document.getElementById('dash-filter-tahun').value  = filterTahun;
    if (document.getElementById('dash-filter-status')) document.getElementById('dash-filter-status').value = filterStatus;

    initDashboardCharts(realisasiKumulatif, rencanaKumulatif, realisasiPerBulan, komposisiLabels, komposisiValues, statusCounts);
    dashboardPrkCards.forEach((card, index) => {
        const chart = document.getElementById(`dashboard-prk-chart-${index}`);
        if (chart) new Chart(chart, { type: 'doughnut', data: { labels: ['Kontrak', 'Sisa PRK'], datasets: [{ data: [Math.max(card.kontrak, 0), Math.max(card.pagu - card.kontrak, 0)], backgroundColor: ['#3b82f6', '#d1d5db'], borderWidth: 0 }] }, options: { responsive: true, maintainAspectRatio: false, cutout: '62%', plugins: { legend: { display: false } } } });
    });
    const totalChart = document.getElementById('dashboard-total-chart');
    if (totalChart) new Chart(totalChart, { type: 'doughnut', data: { labels: ['Kontrak', 'Sisa PRK'], datasets: [{ data: [Math.max(totalDashboardKontrak, 0), Math.max(totalDashboardSisa, 0)], backgroundColor: ['#3b82f6', '#d1d5db'], borderWidth: 0 }] }, options: { responsive: true, maintainAspectRatio: false, cutout: '64%', plugins: { legend: { display: false } } } });
}

function escapeDashboardText(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
}

function applyDashboardFilter() {
    const tahun  = document.getElementById('dash-filter-tahun')?.value  || '';
    const lokasi = document.getElementById('dash-filter-lokasi')?.value || '';
    const status = document.getElementById('dash-filter-status')?.value || '';
    renderDashboard({ tahun, lokasi, status });
}

function resetDashboardFilter() { renderDashboard({}); }

function initDashboardCharts(realisasiKumulatif = [], rencanaKumulatif = [], realisasiPerBulan = [], komposisiLabels = [], komposisiValues = [], statusCounts = {}) {
    const bulanLabels = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

    const ctxRR = document.getElementById('chartRealisasiRencana');
    if (ctxRR) new Chart(ctxRR, {
        type: 'line',
        data: {
            labels: bulanLabels,
            datasets: [
                { label: 'Target Rencana (Miliar)', data: rencanaKumulatif, borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.1)', borderWidth: 2.5, fill: true, tension: 0.3 },
                { label: 'Realisasi Kumulatif (Miliar)', data: realisasiKumulatif, borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', borderWidth: 2.5, fill: true, tension: 0.3 }
            ]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true, position: 'bottom' } }, scales: { y: { grid: { color: '#f1f5f9' }, ticks: { font: { size: 10 } } }, x: { grid: { display: false }, ticks: { font: { size: 10 } } } } }
    });

    const ctxK = document.getElementById('chartKomposisi');
    if (ctxK) new Chart(ctxK, {
        type: 'doughnut',
        data: { labels: komposisiLabels, datasets: [{ data: komposisiValues, backgroundColor: ['#3b82f6','#10b981','#f59e0b','#8b5cf6','#94a3b8','#0ea5e9'], borderWidth: 0 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, cutout: '75%' }
    });

    const ctxB = document.getElementById('chartRealisasiBulan');
    if (ctxB) new Chart(ctxB, {
        type: 'bar',
        data: { labels: bulanLabels, datasets: [{ label: 'Realisasi (Miliar)', data: realisasiPerBulan.map(v => Number((v/1e9).toFixed(3))), backgroundColor: '#10b981', borderRadius: 4 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { grid: { color: '#f1f5f9' }, ticks: { font: { size: 9 } } }, x: { grid: { display: false }, ticks: { font: { size: 9 } } } } }
    });

    const ctxSt = document.getElementById('chartStatus');
    if (ctxSt) new Chart(ctxSt, {
        type: 'doughnut',
        data: { labels: ['Selesai','On Progress','Belum Mulai','Tunda','Batal'], datasets: [{ data: [statusCounts['Selesai']||0,statusCounts['On Progress']||0,statusCounts['Belum Mulai']||0,statusCounts['Tunda']||0,statusCounts['Batal']||0], backgroundColor: ['#10b981','#3b82f6','#f59e0b','#f97316','#ef4444'], borderWidth: 0 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, cutout: '70%' }
    });
}
