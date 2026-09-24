// ==========================================
// js/core/utils.js
// Fungsi utilitas & helper umum
// ==========================================

function formatShortCurrency(amount) {
    if (!amount || isNaN(amount)) return 'Rp 0';
    if (amount >= 1000000000) return 'Rp ' + (amount / 1000000000).toFixed(2).replace('.', ',') + ' M';
    if (amount >= 1000000) return 'Rp ' + (amount / 1000000).toFixed(2).replace('.', ',') + ' Jt';
    return CONFIG.formatCurrency(amount);
}

function getActiveRABItems(items) {
    const rabItems = Array.isArray(items) ? items : [];
    const correctedItems = rabItems.filter(item => String(item.versi_rab || '').trim().toLowerCase() === 'terkoreksi');
    return correctedItems.length > 0
        ? correctedItems
        : rabItems.filter(item => String(item.versi_rab || '').trim().toLowerCase() !== 'terkoreksi');
}

function resolveLogModule(activity) {
    const text = String(activity || '').toLowerCase();
    if (text.includes('rab')) return 'RAB';
    if (text.includes('realisasi')) return 'Realisasi';
    if (text.includes('kontrak') || text.includes('spk')) return 'Kontrak / SPK';
    if (text.includes('pekerjaan')) return 'Pekerjaan';
    if (text.includes('pengadaan') || text.includes('tender')) return 'Pengadaan / Tender';
    if (text.includes('material')) return 'Material';
    if (text.includes('penyedia')) return 'Penyedia';
    if (text.includes('catatan')) return 'Catatan';
    if (text.includes('user') || text.includes('pengguna')) return 'Pengguna';
    return 'Sistem';
}

async function logAktivitas(pekerjaanId, jenisAktivitas, catatan, userName = null) {
    try {
        const currentUser = userName || (state.currentUser ? state.currentUser.nama : 'Admin');
        const payload = {
            action: 'create',
            table: 'LogAktivitas',
            user: currentUser,
            data: {
                pekerjaan_id: pekerjaanId,
                tanggal: new Date().toISOString(),
                catatan: catatan,
                user: currentUser,
                jenis_aktivitas: jenisAktivitas,
                modul: resolveLogModule(jenisAktivitas)
            }
        };
        await fetchAPI('', 'POST', payload);
        console.log('✓ Log aktivitas tersimpan:', jenisAktivitas);
    } catch (error) {
        console.warn('× Gagal menyimpan log aktivitas:', error);
        // Silent fail - jangan ganggu proses utama
    }
}

function numberToWords(number) {
    if (number === 0) return 'Nol';
    const satuan = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan',
        'Sepuluh', 'Sebelas', 'Dua Belas', 'Tiga Belas', 'Empat Belas', 'Lima Belas', 'Enam Belas',
        'Tujuh Belas', 'Delapan Belas', 'Sembilan Belas'];
    const puluhan = ['', '', 'Dua Puluh', 'Tiga Puluh', 'Empat Puluh', 'Lima Puluh',
        'Enam Puluh', 'Tujuh Puluh', 'Delapan Puluh', 'Sembilan Puluh'];

    function convert(n) {
        if (n < 20) return satuan[n];
        if (n < 100) return puluhan[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + satuan[n % 10] : '');
        if (n < 200) return 'Seratus' + (n % 100 !== 0 ? ' ' + convert(n % 100) : '');
        if (n < 1000) return satuan[Math.floor(n / 100)] + ' Ratus' + (n % 100 !== 0 ? ' ' + convert(n % 100) : '');
        if (n < 2000) return 'Seribu' + (n % 1000 !== 0 ? ' ' + convert(n % 1000) : '');
        if (n < 1000000) return convert(Math.floor(n / 1000)) + ' Ribu' + (n % 1000 !== 0 ? ' ' + convert(n % 1000) : '');
        if (n < 1000000000) return convert(Math.floor(n / 1000000)) + ' Juta' + (n % 1000000 !== 0 ? ' ' + convert(n % 1000000) : '');
        if (n < 1000000000000) return convert(Math.floor(n / 1000000000)) + ' Miliar' + (n % 1000000000 !== 0 ? ' ' + convert(n % 1000000000) : '');
        return convert(Math.floor(n / 1000000000000)) + ' Triliun' + (n % 1000000000000 !== 0 ? ' ' + convert(n % 1000000000000) : '');
    }

    const isNegative = number < 0;
    const result = convert(Math.abs(Math.round(number)));
    return (isNegative ? 'Minus ' : '') + result;
}
