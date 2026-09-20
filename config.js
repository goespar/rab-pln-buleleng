// config.js
const CONFIG = {
    // TODO: Ganti URL di bawah ini dengan URL Web App Apps Script Anda dari Tahap 1
    API_URL: 'https://script.google.com/macros/s/AKfycbzxXguTLuAFBguiuJWx0dp7PMp6qibenDEM1P31Zs5WkTWy5EAJWqak-HhdGFLw0A1u/exec',
    
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