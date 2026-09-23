// config.js
const CONFIG = {
    // TODO: Ganti URL di bawah ini dengan URL Web App Apps Script Anda dari Tahap 1
    API_URL: 'https://script.google.com/macros/s/AKfycbw3Z2wa8TBZpZPULva3XY-j2IE8CeFzmZ_4r99YV_Dck8_mHhKni5E4REHsAMVkgqGk/exec',
    
    // Konfigurasi format mata uang
    formatCurrency: (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    },
    
    // Konfigurasi format tanggal
    formatDate: (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        }).format(date);
    }
};
