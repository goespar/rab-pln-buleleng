// ==========================================
// js/modules/catatan.js
// Modal tambah catatan pada detail pekerjaan
// ==========================================

function showModalCatatan() {
    const modal = document.getElementById('modal-catatan');
    if (!modal) return;
    document.getElementById('catatan-text').value = '';
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        modal.querySelector('div').classList.remove('scale-95');
    }, 10);
}

function closeModalCatatan() {
    const modal = document.getElementById('modal-catatan');
    if (!modal) return;
    modal.classList.add('opacity-0');
    modal.querySelector('div').classList.add('scale-95');
    setTimeout(() => modal.classList.add('hidden'), 300);
}

async function saveCatatan(event) {
    event.preventDefault();
    const btn = document.getElementById('btn-save-catatan');
    if (btn) { btn.disabled = true; btn.innerHTML = 'Menyimpan...'; }

    try {
        const item = window.currentDetailPekerjaan;
        if (!item || !item.id) throw new Error('Data pekerjaan tidak ditemukan');

        const catatanText = document.getElementById('catatan-text').value.trim();
        if (!catatanText) throw new Error('Catatan tidak boleh kosong');

        const currentUser = state.currentUser ? state.currentUser.nama : 'Admin';
        const payload = {
            action: 'create',
            table: 'LogAktivitas',
            user: currentUser,
            data: {
                pekerjaan_id: item.id,
                tanggal: new Date().toISOString().split('T')[0],
                catatan: catatanText,
                user: currentUser,
                jenis_aktivitas: 'Catatan Manual'
            }
        };

        const result = await fetchAPI('', 'POST', payload);
        if (result) {
            showToast('Catatan berhasil disimpan');
            closeModalCatatan();
            const container = document.getElementById('detail-tab-content-container');
            if (container && item) loadDetailTabRingkasan(container, item);
        } else {
            throw new Error('Gagal menyimpan catatan ke Google Sheets');
        }
    } catch (error) {
        console.error('Error saving catatan:', error);
        showToast(error.message || 'Gagal menyimpan catatan', 'error');
    } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = 'Simpan Catatan'; }
    }
}
