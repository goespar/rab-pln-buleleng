// ==========================================
// js/modules/log.js
// Modul Log Aktivitas Sistem
// ==========================================

window.renderLog = async function renderLog() {
    const contentArea = document.getElementById('app-content');
    contentArea.innerHTML = `
        <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-100 mb-6">
            <div class="flex justify-between items-center mb-6">
                <div>
                    <h2 class="text-lg font-semibold text-slate-800">Log Aktivitas Sistem</h2>
                    <p class="text-sm text-slate-500">Riwayat perubahan data oleh pengguna.</p>
                </div>
                <button class="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 flex items-center gap-2">
                    <i data-lucide="download" class="w-4 h-4"></i> Export CSV
                </button>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse text-sm">
                    <thead class="bg-slate-100">
                        <tr>
                            <th class="p-3 w-12 text-center">No</th>
                            <th class="p-3">Waktu</th>
                            <th class="p-3">Pengguna</th>
                            <th class="p-3">Aktivitas</th>
                            <th class="p-3">Modul</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100 text-slate-600" id="log-tbody">
                        <tr><td colspan="5" class="p-8 text-center"><div class="loader mx-auto"></div></td></tr>
                    </tbody>
                </table>
            </div>
            <div class="mt-4 flex justify-center">
                <button class="text-sm font-medium text-brand hover:underline">Muat lebih banyak...</button>
            </div>
        </div>
    `;
    lucide.createIcons();
    loadLogData();
}

async function loadLogData() {
    const tbody = document.getElementById('log-tbody');
    if (!tbody) return;

    const logList = await fetchAPI('action=list&table=LogAktivitas') || [];

    if (logList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="p-8 text-center text-slate-400 italic">Belum ada log aktivitas.</td></tr>';
        return;
    }

    // Urutkan terbaru dulu
    const sorted = [...logList].sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));

    let html = '';
    sorted.slice(0, 50).forEach((log, i) => {
        const avatarLetter = (log.user || 'S').charAt(0).toUpperCase();
        const avatarColor  = i % 3 === 0 ? 'bg-brand' : (i % 3 === 1 ? 'bg-blue-500' : 'bg-emerald-500');
        const jenisLower   = (log.jenis_aktivitas || '').toLowerCase();
        const modulBadge   = jenisLower.includes('rab') ? 'RAB' :
                             jenisLower.includes('realisasi') ? 'Realisasi' :
                             jenisLower.includes('kontrak') ? 'Kontrak' :
                             jenisLower.includes('pekerjaan') ? 'Pekerjaan' :
                             jenisLower.includes('material') ? 'Material' :
                             jenisLower.includes('penyedia') ? 'Penyedia' :
                             jenisLower.includes('catatan') ? 'Catatan' : 'Sistem';
        html += `
            <tr class="hover:bg-slate-50">
                <td class="p-3 text-center text-slate-500">${i + 1}</td>
                <td class="p-3 text-xs">${CONFIG.formatDate(log.tanggal)}</td>
                <td class="p-3 font-medium text-slate-800">
                    <span class="flex items-center gap-2">
                        <div class="w-6 h-6 rounded-full ${avatarColor} text-white flex items-center justify-center text-[10px]">${avatarLetter}</div>
                        ${log.user || '-'}
                    </span>
                </td>
                <td class="p-3">${log.catatan || log.keterangan || '-'}</td>
                <td class="p-3"><span class="bg-slate-100 px-2 py-0.5 rounded text-xs">${modulBadge}</span></td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

