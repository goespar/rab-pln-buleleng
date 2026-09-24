// ==========================================
// js/modules/detail.js
// Modul Detail Pekerjaan (tab ringkasan, RAB, realisasi, dokumentasi, peta)
// ==========================================

window.renderDetailPekerjaan = async function renderDetailPekerjaan(id) {
    const contentArea = document.getElementById('app-content');
    contentArea.innerHTML = '<div class="flex justify-center items-center min-h-[60vh]"><div class="loader"></div></div>';

    const [pekerjaanList, kontrakList, realisasiList, pengadaanList, penyediaList] = await Promise.all([
        fetchWithCache('Pekerjaan'),
        fetchWithCache('Kontrak'),
        fetchWithCache('Realisasi'),
        fetchWithCache('Pengadaan'),
        fetchWithCache('Penyedia')
    ]);

    const pekerjaan = pekerjaanList || [];
    const kontrak   = kontrakList   || [];
    const realisasi = realisasiList || [];
    const pengadaan = pengadaanList || [];
    const penyedia  = penyediaList  || [];

    let item = pekerjaan.find(p => String(p.id) === String(id));
    if (!item) { showToast('Data pekerjaan tidak ditemukan', 'error'); navigate('laporan'); return; }

    const k = kontrak.find(k => String(k.pekerjaan_id) === String(id)) || {};
    let namaPenyedia = k.nama_penyedia || '-';
    if (k.penyedia_id) { const p = penyedia.find(p => String(p.id) === String(k.penyedia_id)); if (p) namaPenyedia = p.nama || p.nama_perusahaan || namaPenyedia; }

    let tahunPekerjaan = item.tahun || '-';
    if (item.pengadaan_id) { const pg = pengadaan.find(p => String(p.id) === String(item.pengadaan_id)); if (pg) tahunPekerjaan = pg.tahun || tahunPekerjaan; }

    const realisasiItem = realisasi.filter(r => String(r.pekerjaan_id) === String(id));
    let totalRealisasiNilai = 0, maxProgress = 0;
    realisasiItem.forEach(r => { totalRealisasiNilai += parseFloat(r.nilai) || 0; const p = parseFloat(r.progress) || 0; if (p > maxProgress) maxProgress = p; });

    const nilaiKontrak = parseFloat(k.nilai_kontrak) || 0;
    const sisaKontrak  = nilaiKontrak - totalRealisasiNilai;
    const statusLabel  = maxProgress >= 100 ? 'Selesai' : maxProgress > 0 ? 'On Progress' : 'Belum Mulai';
    const statusClass  = maxProgress >= 100 ? 'bg-emerald-100 text-emerald-700' : maxProgress > 0 ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700';

    window.currentDetailPekerjaan = {
        ...item,
        nama_penyedia:      namaPenyedia,
        tahun:              tahunPekerjaan,
        nilai_kontrak:      nilaiKontrak,
        tanggal_mulai:      k.tanggal_mulai  || '-',
        tanggal_selesai:    k.tanggal_selesai || '-',
        nomor_kontrak:      k.nomor_kontrak  || '-',
        realisasi_keuangan: totalRealisasiNilai,
        realisasi_fisik:    maxProgress,
        sisa_kontrak:       sisaKontrak
    };
    window._realisasiListDetail = realisasiItem;

    contentArea.innerHTML = `
        <div class="mb-4">
            <button onclick="navigate('laporan')" class="text-sm font-medium text-slate-500 hover:text-brand flex items-center gap-2 mb-2 transition-colors">
                <i data-lucide="arrow-left" class="w-4 h-4"></i> Kembali ke Laporan
            </button>
            <div class="flex justify-between items-center bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                <div>
                    <h2 class="text-xl font-bold text-slate-800">${item.nama_pekerjaan}</h2>
                    <p class="text-sm text-slate-500">Informasi lengkap progres pekerjaan dan dokumentasi</p>
                </div>
                <div class="${statusClass} px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-2">
                    <div class="w-2 h-2 rounded-full bg-current animate-pulse"></div> ${statusLabel}
                </div>
            </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-slate-100 mb-6 overflow-hidden">
            <div class="flex gap-4 px-6 pt-4 border-b border-slate-100 overflow-x-auto">
                <button onclick="showDetailTab('ringkasan')"    id="tab-detail-ringkasan"    class="tab-detail-btn text-sm font-semibold text-brand border-b-2 border-brand pb-3 whitespace-nowrap flex items-center gap-2"><i data-lucide="layout-list" class="w-4 h-4"></i> Ringkasan</button>
                <button onclick="showDetailTab('rab')"          id="tab-detail-rab"          class="tab-detail-btn text-sm font-medium text-slate-500 hover:text-slate-800 pb-3 whitespace-nowrap flex items-center gap-2"><i data-lucide="calculator" class="w-4 h-4"></i> RAB</button>
                <button onclick="showDetailTab('realisasi')"    id="tab-detail-realisasi"    class="tab-detail-btn text-sm font-medium text-slate-500 hover:text-slate-800 pb-3 whitespace-nowrap flex items-center gap-2"><i data-lucide="trending-up" class="w-4 h-4"></i> Realisasi</button>
                <button onclick="showDetailTab('dokumentasi')"  id="tab-detail-dokumentasi"  class="tab-detail-btn text-sm font-medium text-slate-500 hover:text-slate-800 pb-3 whitespace-nowrap flex items-center gap-2"><i data-lucide="image" class="w-4 h-4"></i> Dokumentasi</button>
                <button onclick="showDetailTab('peta')"         id="tab-detail-peta"         class="tab-detail-btn text-sm font-medium text-slate-500 hover:text-slate-800 pb-3 whitespace-nowrap flex items-center gap-2"><i data-lucide="map-pin" class="w-4 h-4"></i> Peta Lokasi</button>
            </div>
            <div id="detail-tab-content-container" class="p-6 bg-slate-50/30">
                <div class="flex justify-center py-12"><div class="loader"></div></div>
            </div>
        </div>
    `;
    lucide.createIcons();
    showDetailTab('ringkasan');
}

function showDetailTab(tabName) {
    const item = window.currentDetailPekerjaan;
    if (!item) return;
    document.querySelectorAll('.tab-detail-btn').forEach(btn => {
        btn.classList.remove('text-brand', 'border-b-2', 'border-brand', 'font-semibold');
        btn.classList.add('text-slate-500', 'font-medium');
    });
    const activeBtn = document.getElementById('tab-detail-' + tabName);
    if (activeBtn) { activeBtn.classList.remove('text-slate-500','font-medium'); activeBtn.classList.add('text-brand','border-b-2','border-brand','font-semibold'); }
    const container = document.getElementById('detail-tab-content-container');
    if (!container) return;
    switch (tabName) {
        case 'ringkasan':    loadDetailTabRingkasan(container, item);    break;
        case 'rab':          loadDetailTabRAB(container, item);          break;
        case 'realisasi':    loadDetailTabRealisasi(container, item);    break;
        case 'dokumentasi':  loadDetailTabDokumentasi(container, item);  break;
        case 'peta':         loadDetailTabPeta(container, item);         break;
    }
}

async function loadDetailTabRingkasan(container, item) {
    container.innerHTML = '<div class="flex justify-center py-4"><div class="loader"></div></div>';
    const logList     = await fetchAPI('action=list&table=LogAktivitas') || [];
    const catatanList = logList.filter(log => String(log.pekerjaan_id) === String(item.id)).sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
    const sisaKontrak = item.sisa_kontrak || 0;

    let catatanHTML = catatanList.length > 0
        ? catatanList.slice(0, 3).map(c => `
            <div class="bg-amber-50 p-3 rounded-lg border border-amber-100 mb-2">
                <p class="text-xs text-amber-800 leading-relaxed">${c.catatan || c.keterangan || '-'}</p>
                <p class="text-[10px] text-amber-600 mt-1 font-medium">${CONFIG.formatDate(c.tanggal)} - ${c.user || 'System'}</p>
            </div>`).join('') + (catatanList.length > 3 ? `<p class="text-xs text-slate-400 italic text-center">+${catatanList.length - 3} catatan lainnya</p>` : '')
        : '<p class="text-xs text-slate-400 italic text-center py-4">Belum ada catatan untuk pekerjaan ini.</p>';

    container.innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div class="lg:col-span-2 space-y-6">
                <div class="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                    <h3 class="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Informasi Umum</h3>
                    <div class="grid grid-cols-[140px_10px_1fr] gap-y-3 text-sm">
                        <div class="text-slate-500">Nama Pekerjaan</div><div class="text-slate-400">:</div><div class="font-semibold text-slate-800">${item.nama_pekerjaan}</div>
                        <div class="text-slate-500">Nomor Paket</div><div class="text-slate-400">:</div><div class="font-medium text-slate-700">${item.nomor_paket || '-'}</div>
                        <div class="text-slate-500">Nomor Kontrak</div><div class="text-slate-400">:</div><div class="font-medium text-slate-700">${item.nomor_kontrak || '-'}</div>
                        <div class="text-slate-500">Penyedia</div><div class="text-slate-400">:</div><div class="font-medium text-slate-700">${item.nama_penyedia || '-'}</div>
                        <div class="text-slate-500">Lokasi</div><div class="text-slate-400">:</div><div class="font-medium text-slate-700">${item.lokasi || '-'}</div>
                        <div class="text-slate-500">Tahun</div><div class="text-slate-400">:</div><div class="font-medium text-slate-700">${item.tahun || '-'}</div>
                        <div class="text-slate-500">Nilai Kontrak</div><div class="text-slate-400">:</div><div class="font-bold text-emerald-600">${CONFIG.formatCurrency(item.nilai_kontrak || 0)}</div>
                        <div class="text-slate-500">Masa Pelaksanaan</div><div class="text-slate-400">:</div><div class="font-medium text-slate-700">${item.tanggal_mulai || '-'} s/d ${item.tanggal_selesai || '-'}</div>
                    </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                        <div class="flex justify-between items-center mb-3 border-b border-slate-100 pb-2">
                            <h3 class="text-sm font-bold text-slate-800">Foto Lapangan</h3>
                            <button onclick="showDetailTab('dokumentasi')" class="text-[10px] text-brand hover:underline font-semibold">Lihat Semua</button>
                        </div>
                        <div class="grid grid-cols-2 gap-3">
                            <div class="aspect-square bg-slate-100 rounded-lg overflow-hidden"><img src="https://images.unsplash.com/photo-1544256718-3b624d547f3b?auto=format&fit=crop&w=300&q=80" class="w-full h-full object-cover" alt="Foto lapangan"></div>
                            <div class="aspect-square bg-slate-100 rounded-lg overflow-hidden"><img src="https://images.unsplash.com/photo-1621505343632-159e4bb50be4?auto=format&fit=crop&w=300&q=80" class="w-full h-full object-cover" alt="Foto lapangan"></div>
                        </div>
                    </div>
                    <div class="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                        <h3 class="text-sm font-bold text-slate-800 mb-3 border-b border-slate-100 pb-2">Catatan Terbaru</h3>
                        <div id="catatan-container" class="mb-3 max-h-32 overflow-y-auto">${catatanHTML}</div>
                        <button onclick="showModalCatatan()" class="w-full py-2 border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors">Tambah Catatan</button>
                    </div>
                </div>
            </div>
            <div class="space-y-6">
                <div class="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                    <h3 class="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 mb-3">Progres Pekerjaan</h3>
                    <div class="flex flex-col items-center py-4">
                        <div class="relative w-32 h-32 mb-4 flex items-center justify-center">
                            <canvas id="chartDetailProgres"></canvas>
                            <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span class="text-2xl font-bold text-slate-800">${item.realisasi_fisik}%</span>
                            </div>
                        </div>
                    </div>
                    <div class="space-y-3 border-t border-slate-100 pt-3 text-xs">
                        <div class="flex justify-between items-center"><span class="text-slate-500">Realisasi Keuangan</span><span class="font-bold text-slate-800">${CONFIG.formatCurrency(item.realisasi_keuangan || 0)}</span></div>
                        <div class="flex justify-between items-center"><span class="text-slate-500">Realisasi Fisik</span><span class="font-bold text-slate-800">${item.realisasi_fisik}%</span></div>
                        <div class="flex justify-between items-center"><span class="text-slate-500">Sisa Kontrak</span><span class="font-bold ${sisaKontrak > 0 ? 'text-rose-500' : 'text-emerald-500'}">${CONFIG.formatCurrency(Math.abs(sisaKontrak))}</span></div>
                    </div>
                </div>
                <div class="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                    <div class="flex justify-between items-center mb-3">
                        <h3 class="text-sm font-bold text-slate-800">Lokasi</h3>
                        <button onclick="showDetailTab('peta')" class="text-[10px] text-brand hover:underline font-semibold">Lihat Peta</button>
                    </div>
                    <div class="bg-slate-200 rounded-lg overflow-hidden h-32 relative cursor-pointer" onclick="showDetailTab('peta')">
                        <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=400&q=80" class="w-full h-full object-cover opacity-80" alt="Peta">
                        <div class="absolute inset-0 flex items-center justify-center">
                            <div class="bg-white px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 text-xs font-bold text-brand">
                                <i data-lucide="map-pin" class="w-3.5 h-3.5"></i> ${item.lokasi || 'Lokasi'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- MODAL CATATAN (diperlukan di ringkasan) -->
        <div id="modal-catatan" class="fixed inset-0 bg-slate-900/50 z-50 hidden flex items-center justify-center backdrop-blur-sm transition-opacity opacity-0">
            <div class="bg-white rounded-xl shadow-xl w-full max-w-md p-6 transform transition-all scale-95">
                <div class="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
                    <h3 class="text-lg font-bold text-slate-800">Tambah Catatan</h3>
                    <button type="button" onclick="closeModalCatatan()" class="text-slate-400 hover:text-slate-700"><i data-lucide="x" class="w-5 h-5"></i></button>
                </div>
                <form onsubmit="saveCatatan(event)">
                    <textarea id="catatan-text" rows="4" required placeholder="Masukkan catatan atau update progres pekerjaan..."
                        class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-brand outline-none resize-none mb-4"></textarea>
                    <div class="flex justify-end gap-3">
                        <button type="button" onclick="closeModalCatatan()" class="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50">Batal</button>
                        <button type="submit" id="btn-save-catatan" class="px-6 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-sky-700">Simpan Catatan</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    lucide.createIcons();
    setTimeout(() => {
        const ctx = document.getElementById('chartDetailProgres');
        if (ctx) new Chart(ctx, {
            type: 'doughnut',
            data: { datasets: [{ data: [item.realisasi_fisik, Math.max(0, 100 - item.realisasi_fisik)], backgroundColor: ['#10b981', '#f1f5f9'], borderWidth: 0 }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, cutout: '75%' }
        });
    }, 100);
}

async function loadDetailTabRAB(container, item) {
    container.innerHTML = '<div class="flex justify-center py-12"><div class="loader"></div></div>';
    const rabList  = await fetchAPI('action=list&table=RAB') || [];
    const rabItems = getActiveRABItems(rabList.filter(r => String(r.pekerjaan_id) === String(item.id)));
    let totalRAB = 0, rows = '';
    if (rabItems.length === 0) {
        rows = '<tr><td colspan="8" class="px-4 py-8 text-center text-slate-400 italic">Belum ada data RAB.</td></tr>';
    } else {
        rabItems.forEach((r, i) => {
            const vol = parseFloat(r.volume) || 0, hMat = parseFloat(r.harga_material) || 0, hJasa = parseFloat(r.harga_jasa) || 0;
            const total = vol * (hMat + hJasa); totalRAB += total;
            rows += `<tr class="hover:bg-slate-50">
                <td class="px-3 py-2.5 text-center text-slate-500">${i+1}</td>
                <td class="px-3 py-2.5"><span class="px-2 py-0.5 rounded text-[10px] font-semibold ${r.kategori==='JTM'?'bg-purple-100 text-purple-700':'bg-orange-100 text-orange-700'}">${r.kategori||'-'}</span></td>
                <td class="px-4 py-2.5 font-medium text-slate-800">${r.uraian}</td>
                <td class="px-3 py-2.5 text-center text-slate-600">${r.satuan}</td>
                <td class="px-3 py-2.5 text-center font-medium">${vol}</td>
                <td class="px-3 py-2.5 text-right text-xs">${CONFIG.formatCurrency(hMat)}</td>
                <td class="px-3 py-2.5 text-right text-xs">${CONFIG.formatCurrency(hJasa)}</td>
                <td class="px-4 py-2.5 text-right font-bold text-slate-900">${CONFIG.formatCurrency(total)}</td>
            </tr>`;
        });
    }
    container.innerHTML = `
        <div class="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-base font-bold text-slate-800">Rencana Anggaran Biaya (RAB)</h3>
                <button onclick="navigate('rab'); state.selectedPekerjaanRAB='${item.id}'" class="px-3 py-1.5 bg-brand text-white text-xs font-semibold rounded-lg hover:bg-sky-700 flex items-center gap-1.5">
                    <i data-lucide="edit" class="w-3.5 h-3.5"></i> Edit RAB
                </button>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse text-xs">
                    <thead class="bg-slate-100 border-b border-slate-200"><tr>
                        <th class="px-3 py-2.5 text-center w-10">No</th><th class="px-3 py-2.5 w-20">Kategori</th>
                        <th class="px-4 py-2.5">Uraian</th><th class="px-3 py-2.5 text-center w-16">Sat</th>
                        <th class="px-3 py-2.5 text-center w-16">Vol</th><th class="px-3 py-2.5 text-right w-24">H. Material</th>
                        <th class="px-3 py-2.5 text-right w-24">H. Jasa</th><th class="px-4 py-2.5 text-right w-32">Total (Rp)</th>
                    </tr></thead>
                    <tbody class="divide-y divide-slate-100">${rows}</tbody>
                    <tfoot class="bg-blue-50 border-t-2 border-blue-200">
                        <tr class="font-bold"><td colspan="7" class="px-4 py-3 text-right text-slate-700">TOTAL RAB</td>
                        <td class="px-4 py-3 text-right text-brand text-base">${CONFIG.formatCurrency(totalRAB)}</td></tr>
                    </tfoot>
                </table>
            </div>
        </div>`;
    lucide.createIcons();
}

async function loadDetailTabRealisasi(container, item) {
    container.innerHTML = '<div class="flex justify-center py-12"><div class="loader"></div></div>';
    const realisasiItems = window._realisasiListDetail || [];
    let totalNilai = 0, totalProgress = 0, rows = '';
    if (realisasiItems.length === 0) {
        rows = '<tr><td colspan="5" class="px-4 py-8 text-center text-slate-400 italic">Belum ada data realisasi.</td></tr>';
    } else {
        realisasiItems.forEach((r, i) => {
            const nilai = parseFloat(r.nilai) || 0, prog = parseFloat(r.progress) || 0;
            totalNilai += nilai; totalProgress += prog;
            rows += `<tr class="hover:bg-slate-50">
                <td class="px-4 py-3 text-center text-slate-500">${i+1}</td>
                <td class="px-4 py-3 font-medium">${CONFIG.formatDate(r.tanggal)}</td>
                <td class="px-4 py-3 text-right font-semibold text-emerald-600">${CONFIG.formatCurrency(nilai)}</td>
                <td class="px-3 py-3 text-center"><div class="flex items-center gap-2 justify-center">
                    <div class="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden"><div class="bg-emerald-500 h-full rounded-full" style="width:${Math.min(prog,100)}%"></div></div>
                    <span class="text-xs font-bold">${prog}%</span></div></td>
                <td class="px-4 py-3 text-slate-500 text-xs">${r.keterangan || '-'}</td>
            </tr>`;
        });
    }
    container.innerHTML = `
        <div class="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <h3 class="text-base font-bold text-slate-800 mb-4">Riwayat Realisasi</h3>
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse text-xs">
                    <thead class="bg-slate-100"><tr>
                        <th class="px-4 py-2.5 text-center w-10">No</th><th class="px-4 py-2.5">Tanggal</th>
                        <th class="px-4 py-2.5 text-right">Nilai Terserap</th><th class="px-3 py-2.5 text-center">Progress Fisik</th>
                        <th class="px-4 py-2.5">Keterangan</th>
                    </tr></thead>
                    <tbody class="divide-y divide-slate-100">${rows}</tbody>
                    <tfoot class="bg-emerald-50 border-t-2 border-emerald-200">
                        <tr class="font-bold text-slate-800">
                            <td colspan="2" class="px-4 py-3 text-right">TOTAL KUMULATIF</td>
                            <td class="px-4 py-3 text-right text-emerald-600 text-base">${CONFIG.formatCurrency(totalNilai)}</td>
                            <td class="px-3 py-3 text-center text-brand text-base">${totalProgress.toFixed(1)}%</td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>`;
    lucide.createIcons();
}

function loadDetailTabDokumentasi(container, item) {
    container.innerHTML = `
        <div class="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-base font-bold text-slate-800">Dokumentasi Foto Lapangan</h3>
                <button onclick="uploadFotoLapangan()" class="px-3 py-1.5 bg-brand text-white text-xs font-semibold rounded-lg hover:bg-sky-700 flex items-center gap-1.5">
                    <i data-lucide="upload" class="w-3.5 h-3.5"></i> Upload Foto
                </button>
            </div>
            <input type="file" id="input-foto-lapangan" accept="image/*" multiple class="hidden" onchange="handleFotoUpload(event)">
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4" id="grid-foto-dokumentasi">
                <div class="aspect-square bg-slate-100 rounded-lg overflow-hidden relative group">
                    <img src="https://images.unsplash.com/photo-1544256718-3b624d547f3b?auto=format&fit=crop&w=300&q=80" class="w-full h-full object-cover" alt="Foto">
                    <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button class="p-2 bg-white rounded-lg text-slate-700 hover:bg-slate-100"><i data-lucide="eye" class="w-4 h-4"></i></button>
                    </div>
                </div>
                <div class="aspect-square bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center border-2 border-dashed border-slate-300 text-slate-400 hover:text-brand hover:border-brand cursor-pointer transition-colors" onclick="uploadFotoLapangan()">
                    <div class="text-center"><i data-lucide="plus" class="w-8 h-8 mx-auto mb-1"></i><p class="text-[10px] font-medium">Upload Foto</p></div>
                </div>
            </div>
            <div class="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <p class="text-xs text-blue-700 leading-relaxed"><strong>💡 Tips:</strong> Upload foto ke Google Drive terlebih dahulu, lalu masukkan link ke keterangan realisasi.</p>
            </div>
        </div>`;
    lucide.createIcons();
}

function uploadFotoLapangan() { document.getElementById('input-foto-lapangan')?.click(); }

function handleFotoUpload(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    const grid = document.getElementById('grid-foto-dokumentasi');
    if (!grid) return;
    Array.from(files).forEach(file => {
        if (!file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const newItem = document.createElement('div');
            newItem.className = 'aspect-square bg-slate-100 rounded-lg overflow-hidden relative group';
            newItem.innerHTML = `<img src="${e.target.result}" class="w-full h-full object-cover" alt="Foto">
                <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button onclick="this.closest('.aspect-square').remove()" class="p-2 bg-red-500 rounded-lg text-white hover:bg-red-600"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                </div>`;
            grid.insertBefore(newItem, grid.lastElementChild);
            lucide.createIcons({ root: newItem });
        };
        reader.readAsDataURL(file);
    });
    showToast('Foto ditambahkan (preview only).');
    event.target.value = '';
}

function loadDetailTabPeta(container, item) {
    const searchQuery   = encodeURIComponent((item.lokasi || 'Tabanan Bali') + ' PLN');
    const mapsDirectUrl = `https://www.google.com/maps/search/?api=1&query=${searchQuery}`;
    container.innerHTML = `
        <div class="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <div class="flex justify-between items-center mb-4">
                <div><h3 class="text-base font-bold text-slate-800">Peta Lokasi Pekerjaan</h3><p class="text-xs text-slate-500 mt-0.5">${item.lokasi || 'Lokasi pekerjaan'}</p></div>
                <a href="${mapsDirectUrl}" target="_blank" class="px-3 py-1.5 bg-brand text-white text-xs font-semibold rounded-lg hover:bg-sky-700 flex items-center gap-1.5">
                    <i data-lucide="external-link" class="w-3.5 h-3.5"></i> Buka di Google Maps
                </a>
            </div>
            <div class="aspect-video bg-slate-200 rounded-lg overflow-hidden relative mb-4">
                <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=800&q=80" class="w-full h-full object-cover" alt="Peta">
                <div class="absolute inset-0 flex items-center justify-center bg-black/20">
                    <div class="bg-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
                        <i data-lucide="map-pin" class="w-5 h-5 text-brand"></i>
                        <span class="font-bold text-slate-800">${item.lokasi || 'Lokasi Pekerjaan'}</span>
                    </div>
                </div>
            </div>
            <div class="p-4 bg-amber-50 rounded-lg border border-amber-100">
                <p class="text-xs text-amber-700 leading-relaxed"><strong>📍 Info:</strong> Untuk peta interaktif, diperlukan Google Maps API Key. Gunakan tombol "Buka di Google Maps" untuk navigasi.</p>
            </div>
        </div>`;
    lucide.createIcons();
}

