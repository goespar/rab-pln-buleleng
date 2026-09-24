// ==========================================
// js/modules/rekap.js
// Modul Rekap RAB semua pekerjaan
// ==========================================

window.renderRekap = async function renderRekap() {
    const contentArea = document.getElementById('app-content');

    // Show loading indicator
    contentArea.innerHTML = `
        <div class="flex items-center justify-center h-screen">
            <div class="text-center">
                <div class="inline-block animate-spin mb-4">
                    <i data-lucide="loader" class="w-8 h-8 text-blue-600"></i>
                </div>
                <p class="text-slate-600 font-medium">Memuat data Rekap RAB...</p>
            </div>
        </div>
    `;
    lucide.createIcons();

    // Fetch data with caching
    const [pekerjaanListData, rabListData, pengadaanListData, prkListData] = await Promise.all([
        fetchWithCache('Pekerjaan'),
        fetchWithCache('RAB'),
        fetchWithCache('Pengadaan'),
        fetchWithCache('prk')
    ]);

    const allPekerjaan = pekerjaanListData || [];
    const allRAB       = rabListData       || [];
    const allPengadaan  = pengadaanListData || [];
    
    // Populate global lists for use in print template
    window.allPengadaanList = allPengadaan;
    window.allPRKList       = prkListData || [];

    // Kelompokkan RAB per pekerjaan
    const rabByPekerjaan = {};
    allRAB.forEach(r => {
        const pid = String(r.pekerjaan_id);
        if (!rabByPekerjaan[pid]) rabByPekerjaan[pid] = [];
        rabByPekerjaan[pid].push(r);
    });

    const calcTotals = (items) => items.reduce((acc, i) => {
        const v = parseFloat(i.volume) || 0;
        const m = parseFloat(i.harga_material) || 0;
        const j = parseFloat(i.harga_jasa) || 0;
        return { totalMaterial: acc.totalMaterial + v*m, totalJasa: acc.totalJasa + v*j, totalAll: acc.totalAll + v*(m+j) };
    }, { totalMaterial: 0, totalJasa: 0, totalAll: 0 });

    // Build pekerjaan list dengan RAB items
    const pekerjaanWithData = allPekerjaan
        .map(p => {
                const rabItems = getActiveRABItems(rabByPekerjaan[String(p.id)] || []);
            if (rabItems.length === 0) return null;
            
            const totals = calcTotals(rabItems);
            const isJTM = (p.jenis_tegangan || '').toUpperCase() === 'JTM';
            const isJTR = (p.jenis_tegangan || '').toUpperCase() === 'JTR';
            return { 
                ...p, 
                rabItems, 
                totalMaterial: totals.totalMaterial, 
                totalJasa: totals.totalJasa, 
                totalRAB: totals.totalAll, 
                isJTM, 
                isJTR 
            };
        })
        .filter(p => p !== null);

    // Filter pekerjaan berdasarkan tegangan yang dipilih
    const filteredPekerjaan = pekerjaanWithData.filter(p => {
        if (state.rekapTeganganFilter === 'semua') return true;
        if (state.rekapTeganganFilter === 'jtm') return p.isJTM;
        if (state.rekapTeganganFilter === 'jtr') return p.isJTR;
        return true;
    });

    let grandTotalAll = 0, grandMaterialAll = 0, grandJasaAll = 0;
    let grandTotalJTM = 0, grandMaterialJTM = 0, grandJasaJTM = 0;
    let grandTotalJTR = 0, grandMaterialJTR = 0, grandJasaJTR = 0;

    pekerjaanWithData.forEach(p => {
        grandTotalAll    += p.totalRAB;
        grandMaterialAll += p.totalMaterial;
        grandJasaAll     += p.totalJasa;
        if (p.isJTM) { grandTotalJTM += p.totalRAB; grandMaterialJTM += p.totalMaterial; grandJasaJTM += p.totalJasa; }
        else if (p.isJTR) { grandTotalJTR += p.totalRAB; grandMaterialJTR += p.totalMaterial; grandJasaJTR += p.totalJasa; }
    });

    const countJTM = pekerjaanWithData.filter(p => p.isJTM).length;
    const countJTR = pekerjaanWithData.filter(p => p.isJTR).length;
    const fmtCur   = (v) => CONFIG.formatCurrency(v);

    const grandTotalRow = (label, total, material, jasa) => `
        <div class="bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl p-6 text-white mt-6">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                <div class="md:col-span-2">
                    <h4 class="text-lg font-bold">${label}</h4>
                    <p class="text-slate-300 text-xs mt-1">Terbilang: <em>${numberToWords(Math.round(total))} Rupiah</em></p>
                </div>
                <div class="text-center">
                    <p class="text-xs text-slate-400">Material / Jasa</p>
                    <p class="text-sm">${fmtCur(material)} / ${fmtCur(jasa)}</p>
                </div>
                <div class="text-right">
                    <p class="text-xs text-slate-400">Grand Total</p>
                    <p class="text-2xl font-bold text-emerald-400">${fmtCur(total)}</p>
                </div>
            </div>
        </div>`;

    contentArea.innerHTML = `
        <div class="mb-6">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h2 class="text-xl font-bold text-slate-800">Rekap RAB Komponen — Per Pekerjaan</h2>
                    <p class="text-sm text-slate-500">Rekapitulasi Rencana Anggaran Biaya dikelompokkan berdasarkan Pekerjaan dan Komponen RAB</p>
                </div>
                <div class="flex flex-col sm:flex-row gap-2">
                    <button onclick="printRekapRAB()" class="bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition flex items-center gap-2 shadow-sm">
                        <i data-lucide="printer" class="w-4 h-4"></i> Print
                    </button>
                    <button onclick="exportRekapPDF()" class="bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition flex items-center gap-2 shadow-sm">
                        <i data-lucide="download" class="w-4 h-4"></i> Export PDF
                    </button>
                </div>
            </div>

            <!-- Filter Tegangan -->
            <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-6">
                <p class="text-sm font-semibold text-slate-700 mb-3">Filter Jenis Tegangan:</p>
                <div class="flex flex-wrap gap-2">
                    <button onclick="filterRekapByTeganganKomponen('semua')" class="px-4 py-2 rounded-lg text-sm font-medium transition ${state.rekapTeganganFilter === 'semua' ? 'bg-brand text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}">
                        <i data-lucide="layers" class="w-4 h-4 inline-block mr-1"></i> Semua (${pekerjaanWithData.length})
                    </button>
                    <button onclick="filterRekapByTeganganKomponen('jtm')" class="px-4 py-2 rounded-lg text-sm font-medium transition ${state.rekapTeganganFilter === 'jtm' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}">
                        <i data-lucide="zap" class="w-4 h-4 inline-block mr-1"></i> JTM (${countJTM})
                    </button>
                    <button onclick="filterRekapByTeganganKomponen('jtr')" class="px-4 py-2 rounded-lg text-sm font-medium transition ${state.rekapTeganganFilter === 'jtr' ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}">
                        <i data-lucide="home" class="w-4 h-4 inline-block mr-1"></i> JTR (${countJTR})
                    </button>
                </div>
            </div>

            <!-- KPI Cards -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 print:hidden">
                <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center"><i data-lucide="briefcase" class="w-5 h-5 text-blue-600"></i></div>
                    <div><p class="text-xs text-slate-500 font-medium">Total Pekerjaan</p><p class="text-xl font-bold text-slate-800">${pekerjaanWithData.length}</p></div>
                </div>
                <div class="bg-white rounded-xl border border-purple-200 shadow-sm p-5 flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center"><i data-lucide="zap" class="w-5 h-5 text-purple-600"></i></div>
                    <div><p class="text-xs text-slate-500 font-medium">Total JTM</p><p class="text-lg font-bold text-purple-700">${fmtCur(grandTotalJTM)}</p><p class="text-[10px] text-slate-400">${countJTM} pekerjaan</p></div>
                </div>
                <div class="bg-white rounded-xl border border-orange-200 shadow-sm p-5 flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center"><i data-lucide="home" class="w-5 h-5 text-orange-600"></i></div>
                    <div><p class="text-xs text-slate-500 font-medium">Total JTR</p><p class="text-lg font-bold text-orange-700">${fmtCur(grandTotalJTR)}</p><p class="text-[10px] text-slate-400">${countJTR} pekerjaan</p></div>
                </div>
                <div class="bg-white rounded-xl border border-emerald-200 shadow-sm p-5 flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center"><i data-lucide="wallet" class="w-5 h-5 text-emerald-600"></i></div>
                    <div><p class="text-xs text-slate-500 font-medium">Grand Total RAB</p><p class="text-lg font-bold text-emerald-700">${fmtCur(grandTotalAll)}</p></div>
                </div>
            </div>

            <!-- Print View -->
            <div id="print-content" class="space-y-8">
                ${filteredPekerjaan.length === 0 ? '<div class="text-center py-12 text-slate-400 italic">Belum ada data RAB untuk filter yang dipilih</div>' :
                  filteredPekerjaan.map((p, idx) => buildRekapPekerjaanPrint(p, idx, fmtCur)).join('')}
            </div>

            <!-- Summary - Dynamic based on filter -->
            <div class="mt-8 pt-8 border-t-2 border-slate-300 print:break-inside-avoid" data-total-amount="${
                state.rekapTeganganFilter === 'jtm' ? grandTotalJTM : 
                state.rekapTeganganFilter === 'jtr' ? grandTotalJTR : 
                grandTotalAll
            }">
                <div class="bg-slate-50 rounded-xl p-6 border border-slate-200">
                    <h3 class="text-lg font-bold text-slate-800 mb-4">RINGKASAN TOTAL RAB</h3>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div class="border-l-4 border-blue-500 pl-4">
                            <p class="text-xs text-slate-500 font-medium">Sub Material</p>
                            <p class="text-2xl font-bold text-blue-700">${fmtCur(
                                state.rekapTeganganFilter === 'jtm' ? grandMaterialJTM : 
                                state.rekapTeganganFilter === 'jtr' ? grandMaterialJTR : 
                                grandMaterialAll
                            )}</p>
                        </div>
                        <div class="border-l-4 border-green-500 pl-4">
                            <p class="text-xs text-slate-500 font-medium">Sub Jasa</p>
                            <p class="text-2xl font-bold text-green-700">${fmtCur(
                                state.rekapTeganganFilter === 'jtm' ? grandJasaJTM : 
                                state.rekapTeganganFilter === 'jtr' ? grandJasaJTR : 
                                grandJasaAll
                            )}</p>
                        </div>
                        <div class="border-l-4 border-slate-400 pl-4">
                            <p class="text-xs text-slate-500 font-medium">Subtotal Material + Jasa</p>
                            <p class="text-2xl font-bold text-slate-800">${fmtCur(
                                state.rekapTeganganFilter === 'jtm' ? grandTotalJTM : 
                                state.rekapTeganganFilter === 'jtr' ? grandTotalJTR : 
                                grandTotalAll
                            )}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    lucide.createIcons();
}

function buildRekapPekerjaanPrint(p, pIdx, fmtCur) {
    const items = p.rabItems || [];
    
    // Build table rows untuk komponen RAB
    let tableRows = '';
    let rowNum = 1;
    let pSubtotal = 0;
    let pSubtotalMaterial = 0;
    let pSubtotalJasa = 0;
    
    items.forEach((item, itemIdx) => {
        const v = parseFloat(item.volume) || 0;
        const m = parseFloat(item.harga_material) || 0;
        const j = parseFloat(item.harga_jasa) || 0;
        const totalMat = v * m;
        const totalJasa = v * j;
        const total = totalMat + totalJasa;
        pSubtotalMaterial += totalMat;
        pSubtotalJasa += totalJasa;
        pSubtotal += total;
        
        tableRows += `<tr class="border-b border-slate-200 text-xs">
            <td class="p-2 text-center w-8 border-r border-slate-200">${rowNum}</td>
            <td class="p-2 border-r border-slate-200 font-medium">${item.uraian || '-'}</td>
            <td class="p-2 text-center w-20 border-r border-slate-200">${v}</td>
            <td class="p-2 text-center w-16 border-r border-slate-200">${item.satuan || '-'}</td>
            <td class="p-2 text-right w-24 border-r border-slate-200 font-mono">${fmtCur(m)}</td>
            <td class="p-2 text-right w-24 border-r border-slate-200 font-mono">${fmtCur(j)}</td>
            <td class="p-2 text-right w-24 border-r border-slate-200 font-mono text-blue-600">${fmtCur(totalMat)}</td>
            <td class="p-2 text-right w-24 border-r border-slate-200 font-mono text-green-600">${fmtCur(totalJasa)}</td>
            <td class="p-2 text-right w-28 font-bold font-mono">${fmtCur(total)}</td>
        </tr>`;
        rowNum++;
    });

    const dpp = pSubtotal * (11/12);
    const ppn = dpp * 0.12;
    const total = Math.round(pSubtotal + ppn);

    return `
        <div class="page-break print:page-break-inside-avoid bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm pekerjaan-item" data-pekerjaan-id="${p.id}">
            <!-- Header -->
            <div class="bg-slate-800 text-white px-6 py-4">
                <h3 class="text-lg font-bold mb-2 pekerjaan-nama">${p.nama_pekerjaan || p.nama || 'Pekerjaan'}</h3>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div><span class="text-slate-300">Tegangan:</span> <span class="font-mono">${p.jenis_tegangan || '-'}</span></div>
                    <div><span class="text-slate-300">Lokasi:</span> <span>${p.lokasi || '-'}</span></div>
                    <div><span class="text-slate-300">Komponen:</span> <span>${items.length}</span></div>
                    <div><span class="text-slate-300">Total RAB:</span> <span>${fmtCur(pSubtotal)}</span></div>
                </div>
            </div>

            <!-- Table -->
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead class="bg-slate-100 border-b-2 border-slate-300">
                        <tr class="text-xs font-bold text-slate-700">
                            <th class="p-2 text-center w-8 border-r border-slate-200">NO</th>
                            <th class="p-2 border-r border-slate-200">URAIAN KOMPONEN</th>
                            <th class="p-2 text-center w-20 border-r border-slate-200">VOLUME</th>
                            <th class="p-2 text-center w-16 border-r border-slate-200">SATUAN</th>
                            <th class="p-2 text-right w-24 border-r border-slate-200">HARGA MATERIAL</th>
                            <th class="p-2 text-right w-24 border-r border-slate-200">HARGA JASA</th>
                            <th class="p-2 text-right w-24 border-r border-slate-200 bg-blue-50">BAGIAN MATERIAL</th>
                            <th class="p-2 text-right w-24 border-r border-slate-200 bg-green-50">BAGIAN JASA</th>
                            <th class="p-2 text-right w-28">JUMLAH (Rp)</th>
                        </tr>
                    </thead>
                    <tbody>${tableRows}</tbody>
                    <tfoot class="bg-slate-100 border-t-2 border-slate-300 font-bold text-xs">
                        <tr>
                            <td colspan="4" class="p-2 text-right border-r border-slate-200"></td>
                            <td class="p-2 text-right border-r border-slate-200"></td>
                            <td class="p-2 text-right border-r border-slate-200"></td>
                            <td class="p-2 text-right border-r border-slate-200"></td>
                            <td class="p-2 text-right border-r border-slate-200"></td>
                            <td class="p-2 text-right"></td>
                        </tr>
                        <tr>
                            <td colspan="6" class="p-2 text-right border-r border-slate-200">JUMLAH:</td>
                            <td class="p-2 text-right border-r border-slate-200 font-mono w-24">${fmtCur(pSubtotalMaterial)}</td>
                            <td class="p-2 text-right border-r border-slate-200 font-mono w-24">${fmtCur(pSubtotalJasa)}</td>
                            <td class="p-2 text-right font-mono w-28">${fmtCur(pSubtotal)}</td>
                        </tr>
                        <tr style="display: none;">
                            <td colspan="6" class="p-2 text-right border-r border-slate-200">DPP (11/12):</td>
                            <td colspan="3" class="p-2 text-right font-mono w-72">${fmtCur(dpp)}</td>
                        </tr>
                        <tr style="display: none;">
                            <td colspan="6" class="p-2 text-right border-r border-slate-200">PPN (12%):</td>
                            <td colspan="3" class="p-2 text-right font-mono w-72">${fmtCur(ppn)}</td>
                        </tr>
                        <tr class="bg-emerald-50 border-t-2 border-emerald-300" style="display: none;">
                            <td colspan="6" class="p-2 text-right border-r border-slate-200 text-emerald-700">TOTAL:</td>
                            <td colspan="3" class="p-2 text-right font-mono text-emerald-700 font-bold text-sm w-72">${fmtCur(total)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
            
            <!-- RINGKASAN TOTAL RAB -->
            <div class="px-6 py-4 bg-slate-50 border-t border-slate-200" style="display: none;">
                <h4 class="text-sm font-bold text-slate-800 mb-4">RINGKASAN TOTAL RAB</h4>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div class="border-l-4 border-blue-500 pl-4">
                        <p class="text-xs text-slate-500 font-medium">Sub Material</p>
                        <p class="text-xl font-bold text-blue-700">${fmtCur(pSubtotalMaterial)}</p>
                    </div>
                    <div class="border-l-4 border-green-500 pl-4">
                        <p class="text-xs text-slate-500 font-medium">Sub Jasa</p>
                        <p class="text-xl font-bold text-green-700">${fmtCur(pSubtotalJasa)}</p>
                    </div>
                    <div class="border-l-4 border-slate-400 pl-4">
                        <p class="text-xs text-slate-500 font-medium">Subtotal Material + Jasa</p>
                        <p class="text-xl font-bold text-slate-800">${fmtCur(pSubtotal)}</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function buildRekapPengadaanPrint(pg, pgIdx, fmtCur) {
    const pekerjaan = pg.pekerjaan || [];
    
    // Build print-friendly table
    let tableRows = '';
    let rowNum = 1;
    let pgSubtotal = 0;
    
    pekerjaan.forEach(p => {
        const items = p.rabItems || [];
        items.forEach((item, itemIdx) => {
            const v = parseFloat(item.volume) || 0;
            const m = parseFloat(item.harga_material) || 0;
            const j = parseFloat(item.harga_jasa) || 0;
            const totalMat = v * m;
            const totalJasa = v * j;
            const total = totalMat + totalJasa;
            pgSubtotal += total;
            
            tableRows += `<tr class="border-b border-slate-200 text-xs">
                <td class="p-2 text-center w-8">${rowNum}</td>
                <td class="p-2 font-medium">${item.uraian || '-'}</td>
                <td class="p-2 text-center w-12">${v}</td>
                <td class="p-2 text-center w-16">${item.satuan || '-'}</td>
                <td class="p-2 text-right w-24 font-mono">${fmtCur(m)}</td>
                <td class="p-2 text-right w-24 font-mono">${fmtCur(j)}</td>
                <td class="p-2 text-right w-24 font-mono text-blue-600">${fmtCur(totalMat)}</td>
                <td class="p-2 text-right w-24 font-mono text-green-600">${fmtCur(totalJasa)}</td>
                <td class="p-2 text-right w-28 font-bold font-mono">${fmtCur(total)}</td>
            </tr>`;
            rowNum++;
        });
    });

    const dpp = pgSubtotal * (11/12);
    const ppn = dpp * 0.12;
    const total = Math.round(pgSubtotal + ppn);

    return `
        <div class="page-break print:page-break-inside-avoid bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm pengadaan-item" data-pengadaan-id="${pg.id}">
            <!-- Header -->
            <div class="bg-slate-800 text-white px-6 py-4">
                <h3 class="text-lg font-bold mb-2 pengadaan-nama">${pg.nama_pengadaan || 'Pengadaan'}</h3>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div><span class="text-slate-300">Paket:</span> <span class="font-mono">${pg.nomor_paket || '-'}</span></div>
                    <div><span class="text-slate-300">Lokasi:</span> <span>${pg.lokasi || '-'}</span></div>
                    <div><span class="text-slate-300">Pekerjaan:</span> <span>${pekerjaan.length}</span></div>
                    <div><span class="text-slate-300">Item RAB:</span> <span>${pekerjaan.flatMap(p => p.rabItems || []).length}</span></div>
                </div>
            </div>

            <!-- Table -->
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead class="bg-slate-100 border-b-2 border-slate-300">
                        <tr class="text-xs font-bold text-slate-700">
                            <th class="p-2 text-center w-8">NO</th>
                            <th class="p-2">URAIAN</th>
                            <th class="p-2 text-center w-12">VOL</th>
                            <th class="p-2 text-center w-16">SAT</th>
                            <th class="p-2 text-right w-24">HARGA MATERIAL</th>
                            <th class="p-2 text-right w-24">HARGA JASA</th>
                            <th class="p-2 text-right w-24 bg-blue-50">TOTAL MATERIAL</th>
                            <th class="p-2 text-right w-24 bg-green-50">TOTAL JASA</th>
                            <th class="p-2 text-right w-28">JUMLAH (Rp)</th>
                        </tr>
                    </thead>
                    <tbody>${tableRows}</tbody>
                    <tfoot class="bg-slate-100 border-t-2 border-slate-300 font-bold text-xs">
                        <tr>
                            <td colspan="6" class="p-2 text-right">SUBTOTAL</td>
                            <td class="p-2 text-right font-mono text-blue-700 w-24">${fmtCur(pgSubtotal * (11/12) - (pgSubtotal - pgSubtotal))}</td>
                            <td class="p-2 text-right font-mono text-green-700 w-24">${fmtCur(pgSubtotal * (11/12) - (pgSubtotal - pgSubtotal))}</td>
                            <td class="p-2 text-right font-mono w-28">${fmtCur(pgSubtotal)}</td>
                        </tr>
                        <tr>
                            <td colspan="6" class="p-2 text-right">DPP (11/12)</td>
                            <td colspan="3" class="p-2 text-right font-mono w-72">${fmtCur(dpp)}</td>
                        </tr>
                        <tr>
                            <td colspan="6" class="p-2 text-right">PPN (12%)</td>
                            <td colspan="3" class="p-2 text-right font-mono w-72">${fmtCur(ppn)}</td>
                        </tr>
                        <tr class="bg-emerald-50 border-t-2 border-emerald-300">
                            <td colspan="6" class="p-2 text-right text-emerald-700">TOTAL</td>
                            <td colspan="3" class="p-2 text-right font-mono text-emerald-700 font-bold text-sm w-72">${fmtCur(total)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    `;
}

function toggleRekapCard(tableId) {
    const el      = document.getElementById(tableId);
    const chevron = document.getElementById('chevron-' + tableId);
    if (!el) return;
    el.classList.toggle('hidden');
    if (chevron) chevron.style.transform = el.classList.contains('hidden') ? '' : 'rotate(180deg)';
}

function switchRekapTab(tab) {
    document.querySelectorAll('.rekap-tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.rekap-tab-btn').forEach(btn => {
        btn.classList.remove('border-brand','text-brand','bg-white','border-purple-600','text-purple-700','border-orange-600','text-orange-700');
        btn.classList.add('border-transparent','text-slate-500');
    });
    const contentEl = document.getElementById('tab-content-' + tab);
    if (contentEl) contentEl.classList.remove('hidden');
    const tabBtn = document.getElementById('tab-' + tab);
    if (tabBtn) {
        tabBtn.classList.remove('border-transparent','text-slate-500');
        if (tab === 'jtm') tabBtn.classList.add('border-purple-600','text-purple-700','bg-white');
        else if (tab === 'jtr') tabBtn.classList.add('border-orange-600','text-orange-700','bg-white');
        else tabBtn.classList.add('border-brand','text-brand','bg-white');
    }
}

function filterRekapByTeganganKomponen(tipe) {
    state.rekapTeganganFilter = tipe;
    renderRekap();
}

function printRekapRAB() {
    const printContent = document.getElementById('print-content');
    if (!printContent) return showToast('Data RAB tidak ditemukan', 'error');
    
    // Get all pekerjaan items (filtered)
    const pekerjaanItems = document.querySelectorAll('.pekerjaan-item');
    if (pekerjaanItems.length === 0) return showToast('Tidak ada data komponen untuk dipilih', 'error');
    
    // Build pekerjaan selection options
    let pekerjaanOptions = '';
    pekerjaanItems.forEach((item, idx) => {
        const nama = item.querySelector('.pekerjaan-nama')?.textContent || 'Pekerjaan ' + (idx + 1);
        const id = item.dataset.pekerjaanId;
        pekerjaanOptions += `<option value="${id}">${nama}</option>`;
    });
    
    // Show modal untuk pilih pekerjaan/komponen
    const modalHtml = `
        <div id="print-modal" style="position:fixed; inset:0; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; z-index:9999;">
            <div style="background:white; border-radius:12px; padding:24px; max-width:500px; width:90%; box-shadow:0 20px 25px rgba(0,0,0,0.15);">
                <h3 style="font-size:18px; font-weight:bold; margin-bottom:16px; color:#1f2937;">Pilih Komponen Pekerjaan untuk Diprint</h3>
                <select id="pekerjaan-select" style="width:100%; padding:8px 12px; border:1px solid #d1d5db; border-radius:8px; font-size:14px; margin-bottom:20px;">
                    <option value="">-- Semua Komponen --</option>
                    ${pekerjaanOptions}
                </select>
                <div style="display:flex; gap:12px; justify-content:flex-end;">
                    <button onclick="document.getElementById('print-modal').remove()" style="padding:8px 16px; background:#e5e7eb; color:#374151; border:none; border-radius:6px; cursor:pointer; font-weight:500;">Batal</button>
                    <button onclick="executePrintRekapKomponen()" style="padding:8px 16px; background:#0369a1; color:white; border:none; border-radius:6px; cursor:pointer; font-weight:500;">Print</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.getElementById('pekerjaan-select').focus();
}

function executePrintRekapKomponen() {
    const selectedPekerjaanId = document.getElementById('pekerjaan-select').value;
    document.getElementById('print-modal').remove();
    
    // Get data for selected pekerjaan or all
    let pekerjaanElements = [];
    if (selectedPekerjaanId) {
        pekerjaanElements = [document.querySelector(`[data-pekerjaan-id="${selectedPekerjaanId}"]`)];
    } else {
        pekerjaanElements = Array.from(document.querySelectorAll('.pekerjaan-item'));
    }
    
    if (pekerjaanElements.length === 0 || !pekerjaanElements[0]) {
        return showToast('Data komponen tidak ditemukan', 'error');
    }
    
    // Build print template with pekerjaan elements
    const printTemplate = buildPrintTemplateKomponen(pekerjaanElements);
    
    // Open new window for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printTemplate);
    printWindow.document.close();
    
    // Tunggu semua aset (termasuk logo) selesai dimuat sebelum print
    printWindow.onload = function() {
        printWindow.print();
    };
}

function buildPrintTemplateKomponen(pekerjaanElements) {
    if (!pekerjaanElements || pekerjaanElements.length === 0) {
        pekerjaanElements = Array.from(document.querySelectorAll('.pekerjaan-item'));
    }
    
    // Logo PLN
    const logoUrl = 'https://upload.wikimedia.org/wikipedia/commons/9/97/Logo_PLN.png';
    
    const fmtCur = (v) => {
        return new Intl.NumberFormat('id-ID', { 
            style: 'currency', 
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(v);
    };
    
    // Build all pekerjaan items HTML
    let pekerjaanItemsHtml = '';
    let grandTotalMaterial = 0;
    let grandTotalJasa = 0;
    let grandTotalAll = 0;
    
    pekerjaanElements.forEach((pekerjaanElement, idx) => {
        const tableRows = pekerjaanElement.querySelectorAll('tbody tr');
        
        tableRows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 9) {
                // Extract values from cells - index: 6=BAGIAN_MATERIAL, 7=BAGIAN_JASA, 8=JUMLAH
                const bagianMatCell = cells[6]?.textContent || '0';
                const bagianJasCell = cells[7]?.textContent || '0';
                const jumlahCell = cells[8]?.textContent || '0';
                
                const bagianMat = parseFloat(bagianMatCell.replace(/[^0-9.-]/g, '')) || 0;
                const bagianJas = parseFloat(bagianJasCell.replace(/[^0-9.-]/g, '')) || 0;
                const jumlah = parseFloat(jumlahCell.replace(/[^0-9.-]/g, '')) || 0;
                
                grandTotalMaterial += bagianMat;
                grandTotalJasa += bagianJas;
                grandTotalAll += jumlah;
            }
        });
        
        pekerjaanItemsHtml += pekerjaanElement.outerHTML;
    });
    
    return `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rekap RAB Komponen - PLN</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 10px; line-height: 1.3; padding: 10px; }
        @media print { 
            body { margin: 0; padding: 15px; }
            @page { size: A4 landscape; margin: 10mm; }
        }
        
        .header-container { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; border-bottom: 2px solid #000; padding-bottom: 8px; }
        .logo-section { display: flex; align-items: center; gap: 10px; }
        .logo { width: 50px; height: auto; }
        .header-info { flex: 1; }
        .header-info h3 { font-size: 12px; font-weight: bold; margin: 1px 0; }
        .header-info p { font-size: 9px; margin: 0; color: #333; }
        
        .title { text-align: center; font-size: 13px; font-weight: bold; margin: 5px 0; text-transform: uppercase; }
        
        .page-break { page-break-after: auto; margin-bottom: 10px; }
        .pekerjaan-item { margin-bottom: 10px; break-inside: avoid; page-break-inside: avoid; }
        
        .pekerjaan-header { background-color: #1f2937; color: white; padding: 12px 16px; margin-bottom: 0; }
        .pekerjaan-header h4 { font-size: 12px; font-weight: bold; margin: 0 0 8px 0; }
        .pekerjaan-info { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 15px; font-size: 9px; }
        .pekerjaan-info-label { color: #cbd5e1; font-size: 8px; }
        .pekerjaan-info-value { font-weight: bold; }
        
        table { width: 100%; border-collapse: collapse; margin: 0; font-size: 9px; }
        table thead { background-color: #f3f4f6; border-bottom: 2px solid #000; }
        table th { padding: 6px 3px; text-align: center; font-weight: bold; border: 1px solid #333; font-size: 8px; }
        table td { padding: 4px 3px; border: 1px solid #333; text-align: right; }
        table td:first-child { text-align: center; }
        table td:nth-child(2) { text-align: left; }
        table td:nth-child(3), table td:nth-child(4) { text-align: center; }
        table tbody tr { border-bottom: 1px solid #e2e8f0; }
        table tfoot tr { background-color: #f9fafb; font-weight: bold; }
        table tfoot td { border: 1px solid #333; padding: 6px 3px; }
        
        .summary-section { margin-top: 5px; margin-bottom: 10px; }
        .summary-title { font-weight: bold; font-size: 11px; margin-bottom: 10px; }
        
        .summary-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; }
        .summary-box { border: 1px solid #d1d5db; padding: 10px; border-radius: 4px; }
        .summary-box-label { font-size: 9px; color: #6b7280; margin-bottom: 4px; }
        .summary-box-value { font-size: 12px; font-weight: bold; color: #1f2937; font-family: monospace; }
        
        .footer { margin-top: 14px; padding-top: 8px; border-top: 1px solid #9ca3af; display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; font-size: 9px; break-inside: avoid; page-break-inside: avoid; }
        .sign-box { text-align: center; }
        .sign-box-space { height: 45px; }
        .sign-box-line { border-bottom: 1px solid #000; margin-bottom: 2px; }
        .sign-box p { margin: 0; font-weight: bold; font-size: 9px; }
    </style>
</head>
<body>
    <!-- Header -->
    <div class="header-container">
        <div class="logo-section">
            <img src="${logoUrl}" class="logo" alt="PLN Logo">
            <div class="header-info">
                <h3>PT PLN (Persero)</h3>
                <p>Unit Induk Distribusi Bali</p>
                <p>Unit Pelaksana Pelayanan Pelanggan - Bali Utara</p>
            </div>
        </div>
    </div>
    
    <!-- Title -->
    <div class="title">RENCANA ANGGARAN BIAYA (RAB) - ESTIMATOR</div>
    
    <!-- Pekerjaan Items -->
    ${pekerjaanItemsHtml}
    
    <!-- Footer with Signatures -->
    <div class="footer">
        <div class="sign-box">
            <div class="sign-box-space"></div>
            <div class="sign-box-line"></div>
            <p>Dibuat oleh</p>
        </div>
        <div class="sign-box">
            <div class="sign-box-space"></div>
            <div class="sign-box-line"></div>
            <p>Disetujui oleh</p>
        </div>
        <div class="sign-box">
            <div class="sign-box-space"></div>
            <div class="sign-box-line"></div>
            <p>Mengetahui</p>
        </div>
        <div class="sign-box">
            <div class="sign-box-space"></div>
            <div class="sign-box-line"></div>
            <p>Mengesahkan</p>
        </div>
    </div>
</body>
</html>
    `;
}

function buildPrintTemplate(pengadaanElements) {
    if (!pengadaanElements || pengadaanElements.length === 0) {
        pengadaanElements = Array.from(document.querySelectorAll('.pengadaan-item'));
    }
    
    // Get first pengadaan for info
    const firstPengadaan = pengadaanElements[0];
    const pengadaanNama = firstPengadaan?.querySelector('.pengadaan-nama')?.textContent || 'Pengadaan';
    const pengadaanId = firstPengadaan?.dataset.pengadaanId;
    
    // Get PRK info - Debug log untuk tracking
    let noPrk = '-';
    let urianPrk = '-';
    
    console.log('DEBUG: pengadaanId =', pengadaanId);
    console.log('DEBUG: window.allPengadaanList =', window.allPengadaanList);
    console.log('DEBUG: window.allPRKList =', window.allPRKList);
    
    // Try to get from allPengadaanList via id
    if (window.allPengadaanList && window.allPengadaanList.length > 0 && pengadaanId) {
        const pgData = window.allPengadaanList.find(p => String(p.id) === String(pengadaanId));
        console.log('DEBUG: pgData =', pgData);
        console.log('DEBUG: pengadaanId to search =', String(pengadaanId));
        console.log('DEBUG: all pengadaan ids =', window.allPengadaanList.map(p => ({ id: p.id, nama: p.nama_pengadaan })));
        
        if (pgData) {
            // Check different possible field names
            const prkId = pgData.id_prk || pgData.prk_id || pgData.id_program_rencana_kerja;
            console.log('DEBUG: prkId =', prkId, 'from fields:', { id_prk: pgData.id_prk, prk_id: pgData.prk_id, id_program_rencana_kerja: pgData.id_program_rencana_kerja });
            
            if (prkId && window.allPRKList && window.allPRKList.length > 0) {
                console.log('DEBUG: searching prk with id =', prkId, 'in list:', window.allPRKList.map(p => ({ id: p.id, no_prk: p.no_prk, nama: p.nama })));
                const prkData = window.allPRKList.find(p => String(p.id) === String(prkId));
                console.log('DEBUG: prkData =', prkData);
                
                if (prkData) {
                    noPrk = prkData.no_prk || prkData.nomor_prk || prkData.prk_number || '-';
                    // Tambahkan prkData.prk sebagai priority pertama (field yang dipakai di dropdown)
                    urianPrk = prkData.prk || prkData.nama || prkData.uraian || prkData.description || prkData.nama_prk || prkData.uraian_prk || '-';
                }
            }
        }
    }
    
    // Fallback: Try allPRKList directly
    if ((noPrk === '-' || urianPrk === '-') && window.allPRKList && window.allPRKList.length > 0) {
        const prkItem = window.allPRKList[0];
        noPrk = prkItem.no_prk || prkItem.nomor_prk || '-';
        // Tambahkan prkItem.prk sebagai priority pertama
        urianPrk = prkItem.prk || prkItem.nama || prkItem.uraian || prkItem.nama_prk || prkItem.uraian_prk || '-';
    }
    
    // Logo PLN - Real URL (deklarasi di atas sebelum digunakan)
    const logoUrl = 'https://upload.wikimedia.org/wikipedia/commons/9/97/Logo_PLN.png';
    
    console.log('DEBUG: Final noPrk =', noPrk, ', urianPrk =', urianPrk);
    console.log('DEBUG: logoUrl =', logoUrl);
    console.log('DEBUG: pengadaanNama =', pengadaanNama);
    
    // Pre-compute currency values
    const totalAmount = parseFloat(document.querySelector('[data-total-amount]')?.dataset.totalAmount || 0);
    const dpp = totalAmount * (11/12);
    const ppn = dpp * 0.12;
    const total = Math.round(totalAmount + ppn);
    
    const fmtTotalAmount = CONFIG.formatCurrency(totalAmount);
    const fmtDpp = CONFIG.formatCurrency(dpp);
    const fmtPpn = CONFIG.formatCurrency(ppn);
    const fmtTotal = CONFIG.formatCurrency(total);
    const terbilangText = numberToWords(total);
    
    // Format agar jika uraian kosong/hanya strip, tidak muncul dobel strip
    const displayPrk = (!urianPrk || urianPrk === '-' || urianPrk.trim() === '') 
        ? noPrk 
        : `${noPrk} - ${urianPrk}`;
    
    // Build table rows from selected pengadaan
    let tableRows = '';
    pengadaanElements.forEach(pgElement => {
        const pengadaanItems = pgElement.querySelectorAll('tbody tr');
        pengadaanItems.forEach(row => {
            tableRows += row.outerHTML;
        });
    });
    
    return `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rekap RAB - PLN</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 10px; line-height: 1.3; padding: 15px; }
        @media print { 
            body { margin: 0; padding: 10px; }
            @page { size: A4 landscape; margin: 10mm; }
        }
        
        .header-container { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; border-bottom: 2px solid #000; padding-bottom: 10px; }
        .logo-section { display: flex; align-items: center; gap: 10px; }
        .logo { width: 60px; height: auto; max-height: 60px; }
        .header-info { flex: 1; }
        .header-info h3 { font-size: 12px; font-weight: bold; margin: 1px 0; }
        .header-info p { font-size: 9px; margin: 0px 0; color: #333; }
        
        .title { text-align: center; font-size: 13px; font-weight: bold; margin: 10px 0; text-transform: uppercase; letter-spacing: 0.3px; }
        
        .project-info { margin: 8px 0; font-size: 9px; background: #f8f8f8; padding: 6px; border-left: 2px solid #0369a1; }
        .project-info div { margin: 2px 0; }
        .project-info label { font-weight: bold; display: inline-block; width: 110px; }
        .project-info .value { display: inline; }
        
        table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 9px; }
        table th, table td { border: 1px solid #333; padding: 3px; text-align: right; }
        table th { background-color: #333; color: white; font-weight: bold; font-size: 8px; }
        table td { text-align: right; }
        table td.text-left { text-align: left; }
        
        .summary-container { display: flex; gap: 15px; margin-top: 15px; }
        .summary-left { flex: 1; }
        .summary-right { flex: 1; }
        
        .summary-item { margin: 5px 0; display: flex; justify-content: flex-end; gap: 10px; font-size: 9px; padding: 0 2px; }
        .summary-item label { font-weight: bold; width: 85px; text-align: left; }
        .summary-item .amount { font-family: monospace; font-weight: bold; width: 110px; text-align: right; }
        
        .total-row { 
            display: flex; 
            justify-content: flex-end; 
            gap: 10px;
            margin-top: 8px; 
            padding: 8px; 
            background: #e0e7ff; 
            border: 2px solid #0369a1; 
            border-radius: 3px;
            font-size: 9px;
            width: fit-content;
            margin-left: auto;
        }
        .total-row label { font-weight: bold; font-size: 10px; width: 110px; text-align: left; }
        .total-row .amount { font-size: 11px; font-weight: bold; color: #0369a1; width: 110px; text-align: right; }
        
        .terbilang { padding: 8px; background-color: #fffbeb; border: 1px solid #fbbf24; border-radius: 3px; font-size: 9px; }
        .terbilang label { font-weight: bold; display: block; margin-bottom: 3px; font-size: 9px; }
        .terbilang-text { font-style: italic; font-size: 8px; line-height: 1.4; color: #92400e; }
        
        .footer { margin-top: 25px; display: flex; justify-content: space-between; font-size: 8px; }
        .sign-box { text-align: center; width: 22%; }
        .sign-box p { margin: 15px 0 3px 0; font-weight: bold; font-size: 8px; }
        .sign-box .date { margin-bottom: 30px; }
    </style>
</head>
<body>
    <!-- Header -->
    <div class="header-container">
        <div class="logo-section">
            <img src="${logoUrl}" class="logo" alt="PLN Logo">
            <div class="header-info">
                <h3>PT PLN (Persero)</h3>
                <p>Unit Induk Distribusi Bali</p>
                <p>Unit Pelaksana Pelayanan Pelanggan - Bali Utara</p>
            </div>
        </div>
    </div>
    
    <!-- Title -->
    <div class="title">Rencana Anggaran Biaya (RAB)</div>
    
    <!-- Project Info -->
    <div class="project-info">
        <div><label>Pekerjaan</label>: <span class="value">${pengadaanNama}</span></div>
        <div><label>Lokasi</label>: <span style="border-bottom: 1px dotted #666; display:inline-block; width:45%; padding-bottom:1px;"></span></div>
        <div><label>Pos Anggaran</label>: <span class="value">${displayPrk}</span></div>
    </div>
    
    <!-- Table -->
    <table>
        <thead>
            <tr>
                <th style="width: 3%; text-align: center;">NO</th>
                <th style="width: 22%; text-align: left;">URAIAN</th>
                <th style="width: 6%; text-align: center;">VOL</th>
                <th style="width: 6%; text-align: center;">SAT</th>
                <th style="width: 11%; text-align: right;">HARGA SATUAN MATERIAL</th>
                <th style="width: 9%; text-align: right;">TOTAL MATERIAL</th>
                <th style="width: 9%; text-align: right;">TOTAL JASA</th>
                <th style="width: 11%; text-align: right;">TOTAL (Rp)</th>
            </tr>
        </thead>
        <tbody>
            ${tableRows}
        </tbody>
    </table>
    
    <!-- Summary Section - TERBILANG LEFT, SUMMARY RIGHT -->
    <div class="summary-container">
        <!-- LEFT: Terbilang -->
        <div class="summary-left">
            <div class="terbilang">
                <label>Terbilang:</label>
                <div class="terbilang-text">${terbilangText} Rupiah</div>
            </div>
        </div>
        
        <!-- RIGHT: Subtotal, DPP, PPN, Total -->
        <div class="summary-right">
            <div class="summary-item">
                <label>Subtotal</label>
                <span class="amount">${fmtTotalAmount}</span>
            </div>
            <div class="summary-item">
                <label>DPP (11/12)</label>
                <span class="amount">${fmtDpp}</span>
            </div>
            <div class="summary-item">
                <label>PPN (12%)</label>
                <span class="amount">${fmtPpn}</span>
            </div>
            <div class="total-row">
                <label>TOTAL ANGGARAN</label>
                <span class="amount">${fmtTotal}</span>
            </div>
        </div>
    </div>
    
    <!-- Footer -->
    <div class="footer">
        <div class="sign-box">
            <p>Dibuat oleh:</p>
            <div class="date">........................<br/><span style="font-size: 7px;">Tanggal</span></div>
            <p>........................</p>
        </div>
        <div class="sign-box">
            <p>Disetujui oleh:</p>
            <div class="date">........................<br/><span style="font-size: 7px;">Tanggal</span></div>
            <p>........................</p>
        </div>
        <div class="sign-box">
            <p>Mengetahui:</p>
            <div class="date">........................<br/><span style="font-size: 7px;">Tanggal</span></div>
            <p>........................</p>
        </div>
        <div class="sign-box">
            <p>Mengesahkan:</p>
            <div class="date">........................<br/><span style="font-size: 7px;">Tanggal</span></div>
            <p>........................</p>
        </div>
    </div>
</body>
</html>
    `;
}

function exportRekapPDF() {
    showToast('Fitur export PDF akan segera tersedia', 'info');
}
