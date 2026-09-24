// ==========================================
// js/core/api.js
// Fungsi komunikasi ke Google Sheets API
// ==========================================

async function fetchAPI(urlParams, method = 'GET', bodyData = null) {
    try {
        let sep = urlParams ? '&' : '';
        let cacheBuster = method === 'GET' ? `${sep}_t=${Date.now()}` : '';
        let url = CONFIG.API_URL + '?' + urlParams + cacheBuster;

        // Untuk POST update/delete: sertakan action, table, dan id juga di URL
        if (method === 'POST' && bodyData) {
            const urlAction = bodyData.action || '';
            const urlId     = bodyData.id     || '';
            const urlTable  = bodyData.table  || '';
            const hasParams = urlParams && urlParams.trim() !== '';
            let extra = '';
            if (urlAction) extra += (hasParams ? '&' : '') + 'action=' + encodeURIComponent(urlAction);
            if (urlTable)  extra += '&table=' + encodeURIComponent(urlTable);
            if (urlId)     extra += '&id='    + encodeURIComponent(urlId);
            url += extra;
        }

        let options = { method: method, cache: 'no-store' };
        if (method === 'POST' && bodyData) {
            options.body = JSON.stringify(bodyData);
            options.headers = { 'Content-Type': 'text/plain;charset=utf-8' };
        }

        const response = await fetch(url, options);
        const result = await response.json();

        if (!result.success) throw new Error(result.message || 'Operasi gagal');
        return result.data !== undefined ? result.data : result;
    } catch (error) {
        console.error('API Error:', error);
        showToast(error.message || 'Terjadi kesalahan koneksi', 'error');
        return null;
    }
}

// Helper Universal untuk Hapus Data
async function deleteData(table, id, callback) {
    if (!confirm(`Hapus data ${table} ini dari sistem?`)) return;
    const user = state.currentUser ? state.currentUser.nama : 'Admin';
    const res = await fetchAPI('', 'POST', { action: 'delete', table: table, id: id, user: user });
    if (res) {
        showToast(`Data ${table} berhasil dihapus`);
        callback();
    }
}
