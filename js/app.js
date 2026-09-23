// ==========================================
// js/app.js — Entry Point
// State global & inisialisasi aplikasi
// Semua modul sudah di-load sebelum file ini.
// ==========================================

// ---- STATE GLOBAL ----
const state = {
    currentPage:                  'dashboard',
    selectedPekerjaanRAB:         '',
    selectedPekerjaanNamaRAB:     '',
    selectedPengadaanIdRAB:       '',
    selectedPengadaanNamaRAB:     '',
    selectedPekerjaanRealisasi:   '',
    selectedPekerjaanNamaRealisasi: '',
    selectedPengadaanIdRealisasi: '',
    selectedPengadaanNamaRealisasi: '',
    tempRABItems:                 [],
    editId:                       null,
    editingRealisasiId:           null,
    currentUser:                  null,
    rekapTeganganFilter:          'semua',  // 'semua', 'jtm', 'jtr'
    
    // ---- CACHE MANAGEMENT ----
    dataCache: {
        'Pekerjaan':     { data: null, timestamp: null },
        'RAB':           { data: null, timestamp: null },
        'Tender':        { data: null, timestamp: null },
        'Pengadaan':     { data: null, timestamp: null },
        'Tahun':         { data: null, timestamp: null },
        'prk':           { data: null, timestamp: null },
        'jenis_program': { data: null, timestamp: null },
        'Material':      { data: null, timestamp: null },
        'Kontrak':       { data: null, timestamp: null },
        'Realisasi':     { data: null, timestamp: null },
        'Penyedia':      { data: null, timestamp: null },
        'LogAktivitas':  { data: null, timestamp: null }
    },
    cacheTTL: 5 * 60 * 1000  // 5 minutes cache TTL
};

// ---- CACHE HELPER FUNCTIONS ----
window.fetchWithCache = async function fetchWithCache(tableName) {
    const now = Date.now();
    const cached = state.dataCache[tableName];
    
    // Return cached data jika masih valid
    if (cached.data && cached.timestamp && (now - cached.timestamp) < state.cacheTTL) {
        console.log(`[CACHE HIT] ${tableName} — using cached data`);
        return cached.data;
    }
    
    // Fetch baru dari API
    console.log(`[CACHE MISS] ${tableName} — fetching from API...`);
    const data = await fetchAPI(`action=list&table=${tableName}`);
    
    // Update cache
    state.dataCache[tableName] = {
        data: data || [],
        timestamp: now
    };
    
    return data || [];
}

window.invalidateCache = function invalidateCache(tableName) {
    if (tableName === '*') {
        Object.keys(state.dataCache).forEach(key => {
            state.dataCache[key] = { data: null, timestamp: null };
        });
        console.log('[CACHE] All cache invalidated');
    } else {
        state.dataCache[tableName] = { data: null, timestamp: null };
        console.log(`[CACHE] ${tableName} invalidated`);
    }
}

// ---- INISIALISASI SAAT DOM SIAP ----
document.addEventListener('DOMContentLoaded', () => {
    // Load API URL yang tersimpan di localStorage (jika pernah diubah di Pengaturan)
    const savedApiUrl = localStorage.getItem('pln_api_url');
    if (savedApiUrl) CONFIG.API_URL = savedApiUrl;

    // Cek sesi login
    const sessionUser = localStorage.getItem('pln_session') || sessionStorage.getItem('pln_session');
    if (sessionUser) {
        state.currentUser = JSON.parse(sessionUser);
        updateUserUI();
        navigate(state.currentPage);
    } else {
        renderLogin();
    }
});
