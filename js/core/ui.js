// ==========================================
// js/core/ui.js
// Fungsi UI umum: toast, navigasi, sidebar
// ==========================================

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-green-500' : (type === 'error' ? 'bg-red-500' : 'bg-blue-500');
    const icon = type === 'success' ? 'check-circle' : (type === 'error' ? 'alert-circle' : 'info');

    toast.className = bgColor + ' text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 transform transition-all duration-300 translate-y-10 opacity-0 z-50';
    toast.innerHTML = '<i data-lucide="' + icon + '" class="w-5 h-5"></i><span class="text-sm font-medium">' + message + '</span>';

    container.appendChild(toast);
    lucide.createIcons({ root: toast });
    setTimeout(() => toast.classList.remove('translate-y-10', 'opacity-0'), 10);
    setTimeout(() => {
        toast.classList.add('opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function updateUserUI() {
    const user = state.currentUser;
    if (!user) return;
    const sidebarUser   = document.querySelector('.sidebar-user-name');
    const sidebarRole   = document.querySelector('.sidebar-user-role');
    const sidebarAvatar = document.querySelector('.sidebar-user-avatar');
    const headerGreet   = document.querySelector('.header-user-greet');
    if (sidebarUser)   sidebarUser.textContent   = user.nama;
    if (sidebarRole)   sidebarRole.textContent   = user.role;
    if (sidebarAvatar) sidebarAvatar.textContent = user.nama.charAt(0).toUpperCase();
    if (headerGreet)   headerGreet.textContent   = `Halo, ${user.nama.split(' ')[0]}!`;
}

function navigate(page) {
    state.currentPage = page;
    document.querySelectorAll('.nav-link').forEach(el => {
        el.classList.remove('active', 'bg-slate-800', 'text-white');
        if (el.dataset.page === page) el.classList.add('active', 'bg-slate-800', 'text-white');
    });

    const titles = {
        'dashboard'  : 'Dashboard',
        'prk'        : 'Program Rencana Kerja (PRK)',
        'rab'        : 'INPUT RAB',
        'workflow'   : 'Tender & Koreksi RAB',
        'rekap'      : 'Rekap RAB Komponen',
        'rekaprabpengadaan' : 'Rekap RAB Pengadaan',
        'realisasi'  : 'Data Realisasi',
        'penyedia'   : 'Data Penyedia',
        'kontrak'    : 'Data Kontrak',
        'pengadaan'  : 'Master Pengadaan',
        'pekerjaan'  : 'Master Pekerjaan',
        'material'   : 'Master Material',
        'laporan'    : 'Laporan & Monitoring',
        'laporanrealisasi' : 'Laporan Realisasi',
        'log'        : 'Log Aktivitas',
        'user'       : 'Manajemen Pengguna',
        'pengaturan' : 'Pengaturan Sistem'
    };

    const pageTitleEl = document.getElementById('page-title');
    if (pageTitleEl) pageTitleEl.innerText = titles[page] || 'Dashboard';

    const contentArea = document.getElementById('app-content');
    if (!contentArea) return;

    contentArea.innerHTML = `
        <div class="flex items-center justify-center h-64">
            <div class="flex flex-col items-center gap-3">
                <div class="loader"></div>
                <p class="text-sm text-slate-500">Memuat data...</p>
            </div>
        </div>
    `;

    switch (page) {
        case 'dashboard'  : renderDashboard();  break;
        case 'prk'        : renderPRK();         break;
        case 'rab'        : renderRAB();         break;
        case 'workflow'   : renderWorkflow();    break;
        case 'rekap'      : renderRekap();       break;
        case 'rekaprabpengadaan' : renderRekapRabPengadaan(); break;
        case 'realisasi'  : renderRealisasi();   break;
        case 'penyedia'   : renderPenyedia();    break;
        case 'kontrak'    : renderKontrak();     break;
        case 'pengadaan'  : renderPengadaan();   break;
        case 'pekerjaan'  : renderPekerjaan();   break;
        case 'material'   : renderMaterial();    break;
        case 'laporan'    : renderLaporan();     break;
        case 'laporanrealisasi' : renderLaporanRealisasi(); break;
        case 'log'        : renderLog();         break;
        case 'user'       : renderUser();        break;
        case 'pengaturan' : renderPengaturan();  break;
        default:
            contentArea.innerHTML = `
                <div class="bg-white p-8 rounded-xl border border-slate-200 text-center shadow-sm">
                    <i data-lucide="wrench" class="w-12 h-12 text-slate-300 mx-auto mb-4"></i>
                    <h3 class="text-lg font-semibold text-slate-700">Modul Segera Hadir</h3>
                    <p class="text-slate-500 mt-2">Modul ini akan dilanjutkan pada tahap berikutnya.</p>
                </div>
            `;
            lucide.createIcons();
    }

    if (window.innerWidth < 768) {
        const sidebar = document.getElementById('sidebar');
        if (sidebar && !sidebar.classList.contains('-translate-x-full')) toggleSidebar();
    }
}
