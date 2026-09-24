// ==========================================
// js/modules/laporan.js
// Modul Laporan & Monitoring
// ==========================================

window.renderLaporan = async function renderLaporan(filters = {}) {
    const contentArea = document.getElementById('app-content');

    const [pekerjaanList, kontrakList, realisasiList, penyediaList, pengadaanList] = await Promise.all([
        fetchWithCache('Pekerjaan'),
        fetchWithCache('Kontrak'),
        fetchWithCache('Realisasi'),
        fetchWithCache('Penyedia'),
        fetchWithCache('Pengadaan')
    ]);

    let pekerjaan = pekerjaanList  || [];
    let kontrak   = kontrakList    || [];
    let realisasi = realisasiList  || [];
    const pengadaan = pengadaanList || [];

    const lokasiUnique = [...new Set(pekerjaan.map(p => p.lokasi).filter(l => l))].sort();
    const tahunUnique  = [...new Set(pekerjaan.map(p => p.tahun_anggaran).filter(t => t))].sort().reverse();
    window.laporanLokasiOptions = lokasiUnique;
    window.laporanTahunOptions  = tahunUnique;

    const filterTahun    = filters.tahun    || '';
    const filterLokasi   = filters.lokasi   || '';
    const filterPenyedia = filters.penyedia || '';
    const filterStatus   = filters.status   || '';

    if (filterTahun)  pekerjaan = pekerjaan.filter(p => String(p.tahun_anggaran) === String(filterTahun));
    if (filterLokasi) pekerjaan = pekerjaan.filter(p => (p.lokasi || '') === filterLokasi);

    const pekerjaanIds = pekerjaan.map(p => String(p.id));
    kontrak = kontrak.filter(k => pekerjaanIds.includes(String(k.pekerjaan_id)));
    if (filterPenyedia) kontrak = kontrak.filter(k => String(k.nama_penyedia || '').toLowerCase().includes(String(filterPenyedia).toLowerCase()));
    if (filterStatus) {
        kontrak = kontrak.filter(k => {
            const st = (k.status || 'On Progress').toLowerCase();
            const fs = filterStatus.toLowerCase();
            if (fs === 'on progress') return !st.includes('selesai') && !st.includes('batal') && !st.includes('tunda') && !st.includes('belum');
            return st.includes(fs);
        });
    }
    const kontrakPekerjaanIds = kontrak.map(k => String(k.pekerjaan_id));
    pekerjaan = pekerjaan.filter(p => kontrakPekerjaanIds.includes(String(p.id)));
    realisasi = realisasi.filter(r => kontrakPekerjaanIds.includes(String(r.pekerjaan_id)));

    let totalKontrak = 0;
    kontrak.forEach(k => { totalKontrak += parseFloat(k.nilai_kontrak) || 0; });
    let totalRealisasiNilai = 0;
    realisasi.forEach(r => { totalRealisasiNilai += parseFloat(r.nilai) || 0; });
    const progPerPekerjaan = {};
    realisasi.forEach(r => {
        const pid = r.pekerjaan_id;
        const p   = parseFloat(r.progress) || 0;
        if (!progPerPekerjaan[pid] || p > progPerPekerjaan[pid]) progPerPekerjaan[pid] = p;
    });
    const progValues  = Object.values(progPerPekerjaan);
    const avgFisik    = progValues.length ? (progValues.reduce((a, b) => a + b, 0) / progValues.length) : 0;
    const pctKeuangan = totalKontrak > 0 ? ((totalRealisasiNilai / totalKontrak) * 100).toFixed(1) : 0;
    const sisaAnggaran= totalKontrak - totalRealisasiNilai;
    const totalPagu = pekerjaan.reduce((sum, item) => {
        const pengadaanId = item.pengadaan_id || item.id_pengadaan_prk;
        const parent = pengadaan.find(p => String(p.id) === String(pengadaanId));
        return sum + (parseFloat(item.nilai_pagu) || parseFloat(parent?.nilai_pagu) || 0);
    }, 0);
    const efisiensiNilai = totalPagu - totalKontrak;
    const efisiensiPersen = totalPagu > 0 ? (efisiensiNilai / totalPagu) * 100 : 0;
    const serapanPersen = totalKontrak > 0 ? (totalRealisasiNilai / totalKontrak) * 100 : 0;
    const fmtM        = (v) => v >= 1e9 ? `Rp ${(v/1e9).toFixed(2)} M` : `Rp ${(v/1e6).toFixed(0)} Jt`;

    const penyediaUnik = [...new Set((kontrakList||[]).map(k => k.nama_penyedia).filter(p => p))].sort();
    let optPenyedia = '<option value="">Semua Penyedia</option>';
    penyediaUnik.forEach(nama => { optPenyedia += `<option value="${nama}">${nama}</option>`; });

    contentArea.innerHTML = `
        <!-- FILTER -->
        <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-6">
            <div class="flex flex-col md:flex-row gap-3 items-end">
                <div class="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                        <label class="block text-xs font-medium text-slate-600 mb-1.5">Tahun Anggaran</label>
                        <select id="filter-tahun-lap" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-brand outline-none bg-white">
                            <option value="">Semua Tahun</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-slate-600 mb-1.5">Lokasi / ULP</label>
                        <select id="filter-lokasi-lap" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-brand outline-none bg-white">
                            <option value="">Semua Lokasi</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-slate-600 mb-1.5">Penyedia</label>
                        <select id="filter-penyedia-lap" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-brand outline-none bg-white">${optPenyedia}</select>
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-slate-600 mb-1.5">Status</label>
                        <select id="filter-status-lap" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-brand outline-none bg-white">
                            <option value="">Semua Status</option>
                            <option value="On Progress">On Progress</option>
                            <option value="Selesai">Selesai</option>
                            <option value="Belum Mulai">Belum Mulai</option>
                            <option value="Tunda">Tunda</option>
                        </select>
                    </div>
                </div>
                <div class="flex gap-2">
                    <button onclick="applyLaporanFilter()" class="bg-brand text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-sky-700 whitespace-nowrap shadow-sm">
                        <i data-lucide="filter" class="w-4 h-4"></i> Terapkan
                    </button>
                    <button onclick="resetLaporanFilter()" class="border border-slate-300 hover:bg-slate-50 text-slate-600 rounded-lg px-4 py-2 text-sm font-medium flex items-center gap-2">
                        <i data-lucide="x-circle" class="w-4 h-4"></i> Reset
                    </button>
                </div>
            </div>
        </div>

        <div class="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <h2 class="text-xl font-bold text-slate-800">Laporan & Monitoring</h2>
                <p class="text-sm text-slate-500">Realisasi fisik, keuangan dan progres pekerjaan</p>
            </div>
        </div>

        <!-- KPI CARDS -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                <div class="p-3 bg-emerald-100 text-emerald-600 rounded-xl"><i data-lucide="wallet" class="w-6 h-6"></i></div>
                <div><p class="text-[10px] font-bold text-slate-500 uppercase">Realisasi Keuangan</p><h3 class="text-lg font-bold text-slate-800">${fmtM(totalRealisasiNilai)}</h3><p class="text-[10px] text-slate-400"><span class="text-emerald-500 font-semibold">${pctKeuangan}%</span> dari kontrak</p></div>
            </div>
            <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                <div class="p-3 bg-blue-100 text-blue-600 rounded-xl"><i data-lucide="activity" class="w-6 h-6"></i></div>
                <div><p class="text-[10px] font-bold text-slate-500 uppercase">Realisasi Fisik</p><h3 class="text-lg font-bold text-slate-800">${avgFisik.toFixed(1)}%</h3><p class="text-[10px] text-slate-400">Rata-rata kumulatif</p></div>
            </div>
            <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                <div class="p-3 bg-amber-100 text-amber-600 rounded-xl"><i data-lucide="briefcase" class="w-6 h-6"></i></div>
                <div><p class="text-[10px] font-bold text-slate-500 uppercase">Paket Pekerjaan</p><h3 class="text-lg font-bold text-slate-800">${pekerjaan.length}</h3></div>
            </div>
            <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                <div class="p-3 bg-rose-100 text-rose-600 rounded-xl"><i data-lucide="trending-down" class="w-6 h-6"></i></div>
                <div><p class="text-[10px] font-bold text-slate-500 uppercase">Sisa Anggaran</p><h3 class="text-lg font-bold text-slate-800">${fmtM(sisaAnggaran > 0 ? sisaAnggaran : 0)}</h3></div>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div class="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                <div class="flex items-center justify-between mb-3"><h3 class="text-sm font-bold text-slate-800">Rekap Efisiensi</h3><i data-lucide="badge-percent" class="w-5 h-5 text-blue-500"></i></div>
                <div class="grid grid-cols-3 gap-3 text-xs"><div><p class="text-slate-500">Nilai Pagu</p><p class="font-bold text-slate-800 mt-1">${CONFIG.formatCurrency(totalPagu)}</p></div><div><p class="text-slate-500">Nilai Kontrak</p><p class="font-bold text-brand mt-1">${CONFIG.formatCurrency(totalKontrak)}</p></div><div><p class="text-slate-500">Efisiensi</p><p class="font-bold ${efisiensiNilai >= 0 ? 'text-emerald-600' : 'text-red-600'} mt-1">${CONFIG.formatCurrency(efisiensiNilai)} (${efisiensiPersen.toFixed(1)}%)</p></div></div>
            </div>
            <div class="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                <div class="flex items-center justify-between mb-3"><h3 class="text-sm font-bold text-slate-800">Rekap Serapan Anggaran</h3><i data-lucide="pie-chart" class="w-5 h-5 text-emerald-500"></i></div>
                <div class="grid grid-cols-3 gap-3 text-xs"><div><p class="text-slate-500">Nilai Kontrak</p><p class="font-bold text-slate-800 mt-1">${CONFIG.formatCurrency(totalKontrak)}</p></div><div><p class="text-slate-500">Realisasi Pembayaran</p><p class="font-bold text-emerald-600 mt-1">${CONFIG.formatCurrency(totalRealisasiNilai)}</p></div><div><p class="text-slate-500">Serapan</p><p class="font-bold text-brand mt-1">${serapanPersen.toFixed(1)}%</p></div></div>
            </div>
        </div>

        <!-- CHART -->
        <div class="bg-white p-5 rounded-xl shadow-sm border border-slate-100 mb-6">
            <h3 class="text-sm font-semibold text-brand border-b border-slate-100 pb-3 mb-4">Realisasi Bulanan</h3>
            <div class="h-64 relative w-full"><canvas id="chartLaporanBulanan"></canvas></div>
        </div>

        <!-- TABEL -->
        <div class="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div class="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 class="text-sm font-bold text-slate-800">Daftar Paket Pekerjaan</h3>
                <input id="search-laporan" type="text" placeholder="Cari pekerjaan..." oninput="filterLaporanSearch()"
                    class="border border-slate-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-brand w-48">
            </div>
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse text-xs whitespace-nowrap">
                    <thead class="bg-white border-b border-slate-200 text-slate-600 font-semibold">
                        <tr>
                            <th class="p-4 text-center w-10">No</th>
                            <th class="p-4">Nama Pekerjaan</th>
                            <th class="p-4">Penyedia</th>
                            <th class="p-4 text-right">Nilai Kontrak</th>
                            <th class="p-4 text-right">Realisasi</th>
                            <th class="p-4 text-center">Progress Fisik</th>
                            <th class="p-4 text-center">Status</th>
                            <th class="p-4 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody id="laporan-tbody" class="divide-y divide-slate-100"></tbody>
                </table>
            </div>
        </div>
    `;
    lucide.createIcons();

    // Populate filter dropdowns
    const tahunDD  = document.getElementById('filter-tahun-lap');
    const lokasiDD = document.getElementById('filter-lokasi-lap');
    if (tahunDD)  { tahunDD.innerHTML  = '<option value="">Semua Tahun</option>'  + tahunUnique.map(t  => `<option value="${t}"  ${t===filterTahun?'selected':''}>${t}</option>`).join(''); }
    if (lokasiDD) { lokasiDD.innerHTML = '<option value="">Semua Lokasi</option>' + lokasiUnique.map(l => `<option value="${l}" ${l===filterLokasi?'selected':''}>${l}</option>`).join(''); }
    if (document.getElementById('filter-penyedia-lap') && filterPenyedia) document.getElementById('filter-penyedia-lap').value = filterPenyedia;
    if (document.getElementById('filter-status-lap')   && filterStatus)   document.getElementById('filter-status-lap').value   = filterStatus;

    renderLaporanTable(pekerjaan, kontrak, realisasi);
    initLaporanChart(realisasi);
}

function applyLaporanFilter() {
    const tahun    = document.getElementById('filter-tahun-lap')?.value    || '';
    const lokasi   = document.getElementById('filter-lokasi-lap')?.value   || '';
    const penyedia = document.getElementById('filter-penyedia-lap')?.value || '';
    const status   = document.getElementById('filter-status-lap')?.value   || '';
    renderLaporan({ tahun, lokasi, penyedia, status });
}

function resetLaporanFilter() { renderLaporan({}); }

function renderLaporanTable(pekerjaanList, kontrakList, realisasiList) {
    const tbody = document.getElementById('laporan-tbody');
    if (!tbody) return;
    const pekerjaan = pekerjaanList || [];
    const kontrak   = kontrakList   || [];
    const realisasi = realisasiList || [];

    if (pekerjaan.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="p-8 text-center text-slate-400 italic">Belum ada data pekerjaan.</td></tr>';
        return;
    }

    let html = '';
    pekerjaan.forEach((item, i) => {
        const k = kontrak.find(k => String(k.pekerjaan_id) === String(item.id) || String(k.nama_pekerjaan) === String(item.nama_pekerjaan)) || {};
        const nilaiKontrak  = parseFloat(k.nilai_kontrak) || 0;
        const namaPenyedia  = k.nama_penyedia || '-';
        const statusKontrak = k.status || '';
        const realisasiItem = realisasi.filter(r => String(r.pekerjaan_id) === String(item.id));
        let totalRealisasi = 0, maxProgress = 0;
        realisasiItem.forEach(r => { totalRealisasi += parseFloat(r.nilai) || 0; const p = parseFloat(r.progress) || 0; if (p > maxProgress) maxProgress = p; });
        const status  = statusKontrak || (maxProgress >= 100 ? 'Selesai' : maxProgress > 0 ? 'On Progress' : 'Belum Mulai');
        const pColor  = maxProgress >= 100 ? 'bg-emerald-500' : maxProgress > 0 ? 'bg-blue-500' : 'bg-slate-300';
        const sColor  = status === 'Selesai' ? 'text-emerald-600 bg-emerald-50' : status === 'On Progress' ? 'text-blue-600 bg-blue-50' : status === 'Belum Mulai' ? 'text-amber-600 bg-amber-50' : 'text-slate-600 bg-slate-50';
        html += `
            <tr class="hover:bg-slate-50 transition-colors laporan-row" data-penyedia="${namaPenyedia}" data-status="${status}" data-nama="${item.nama_pekerjaan.toLowerCase()}">
                <td class="p-4 text-center text-slate-500">${i+1}</td>
                <td class="p-4 font-semibold text-slate-800">${item.nama_pekerjaan}</td>
                <td class="p-4 text-slate-600">${namaPenyedia}</td>
                <td class="p-4 text-right font-medium text-slate-600">${nilaiKontrak > 0 ? CONFIG.formatCurrency(nilaiKontrak) : '-'}</td>
                <td class="p-4 text-right font-medium ${maxProgress>=100?'text-emerald-600':'text-slate-800'}">${totalRealisasi > 0 ? CONFIG.formatCurrency(totalRealisasi) : '-'}</td>
                <td class="p-4">
                    <div class="flex items-center justify-center gap-2">
                        <div class="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div class="${pColor} h-full rounded-full" style="width:${maxProgress}%"></div></div>
                        <span class="text-[10px] font-bold ${maxProgress>=100?'text-emerald-600':'text-slate-600'} w-8">${maxProgress}%</span>
                    </div>
                </td>
                <td class="p-4 text-center"><span class="px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wide ${sColor}">${status}</span></td>
                <td class="p-4 text-center">
                    <button onclick="renderDetailPekerjaan('${item.id}')" class="bg-white border border-slate-200 text-slate-600 hover:text-brand hover:border-brand px-3 py-1 rounded text-[10px] font-semibold transition-colors">Detail</button>
                </td>
            </tr>`;
    });
    tbody.innerHTML = html;
}

function filterLaporanSearch() {
    const q = (document.getElementById('search-laporan')?.value || '').toLowerCase();
    document.querySelectorAll('.laporan-row').forEach(tr => { tr.style.display = tr.dataset.nama.includes(q) ? '' : 'none'; });
}

function initLaporanChart(realisasiList) {
    const ctx = document.getElementById('chartLaporanBulanan');
    if (!ctx) return;
    const bulanLabels  = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
    const dataPerBulan = Array(12).fill(0);
    const progPerBulan = Array(12).fill(0);
    const countPerBulan= Array(12).fill(0);
    (realisasiList || []).forEach(r => {
        if (!r.tanggal) return;
        const d = new Date(r.tanggal); if (isNaN(d)) return;
        const m = d.getMonth();
        dataPerBulan[m]  += (parseFloat(r.nilai) || 0) / 1e6;
        progPerBulan[m]  += parseFloat(r.progress) || 0;
        countPerBulan[m]++;
    });
    let kumulatif = 0;
    const kumulatifData = progPerBulan.map((total, i) => {
        if (countPerBulan[i] > 0) kumulatif += total / countPerBulan[i];
        return parseFloat(kumulatif.toFixed(1));
    });
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: bulanLabels,
            datasets: [
                { type: 'line', label: 'Progress Kumulatif (%)', data: kumulatifData, borderColor: '#8b5cf6', backgroundColor: '#8b5cf620', borderWidth: 2, tension: 0.3, yAxisID: 'y1', pointRadius: 3 },
                { type: 'bar',  label: 'Realisasi (Juta Rp)', data: dataPerBulan.map(v => parseFloat(v.toFixed(1))), backgroundColor: '#10b981', borderRadius: 4, yAxisID: 'y' }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 6, font: { size: 10 } } } },
            scales: {
                x:  { grid: { display: false }, ticks: { font: { size: 10 } } },
                y:  { type: 'linear', display: true, position: 'left',  title: { display: true, text: 'Nilai (Juta Rp)', font: { size: 9 } }, grid: { color: '#f1f5f9' }, ticks: { font: { size: 9 } } },
                y1: { type: 'linear', display: true, position: 'right', title: { display: true, text: 'Progress %',    font: { size: 9 } }, grid: { drawOnChartArea: false }, ticks: { font: { size: 9 } }, min: 0, max: 100 }
            }
        }
    });
}

