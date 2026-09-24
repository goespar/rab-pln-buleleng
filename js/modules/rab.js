// ==========================================
// js/modules/rab.js
// Modul Penyusunan RAB (Rencana Anggaran Biaya)
// ==========================================

window.renderRAB = async function renderRAB() {
    const contentArea = document.getElementById('app-content');

    // Show loading indicator
    contentArea.innerHTML = `
        <div class="flex items-center justify-center h-screen">
            <div class="text-center">
                <div class="inline-block animate-spin mb-4">
                    <i data-lucide="loader" class="w-8 h-8 text-blue-600"></i>
                </div>
                <p class="text-slate-600 font-medium">Memuat form RAB...</p>
            </div>
        </div>
    `;
    lucide.createIcons();

    // Fetch data with caching
    const [pekerjaanList, pengadaanList, prkList, jenisProgramList] = await Promise.all([
        fetchWithCache('Pekerjaan'),
        fetchWithCache('Pengadaan'),
        fetchWithCache('prk'),
        fetchWithCache('jenis_program')
    ]);
    window.allPekerjaanList  = pekerjaanList  || [];
    window.allPengadaanList  = pengadaanList  || [];
    window.allPRKList        = prkList        || [];
    window.allJenisProgramList = jenisProgramList || [];

    // Dropdown Tahun - ekstrak dari PRK
    const tahunSet = new Set();
    window.allPRKList.forEach(p => {
        if (p.tahun) tahunSet.add(p.tahun);
    });
    const tahunArray = Array.from(tahunSet).sort().reverse();
    let tahunOptions = '<option value="">-- Pilih Tahun --</option>';
    tahunArray.forEach(t => {
        tahunOptions += `<option value="${t}">${t}</option>`;
    });

    // Dropdown PRK (akan di-populate saat tahun dipilih)
    let prkOptions = '<option value="">-- Pilih Tahun Dulu --</option>';

    // Dropdown Jenis Program (akan di-populate saat PRK dipilih)
    let jenisProgramOptions = '<option value="">-- Pilih Jenis Program --</option>';

    // Dropdown Pengadaan (akan di-populate saat Jenis Program dipilih)
    let pengadaanOptions = '<option value="">-- Pilih Pengadaan --</option>';

    contentArea.innerHTML = `
        <div class="mb-4">
            <h2 class="text-xl font-bold text-slate-800">Penyusunan RAB</h2>
            <p class="text-sm text-slate-500">Estimator Rencana Anggaran Biaya Pekerjaan</p>
        </div>

        <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-100 mb-6">
            <!-- WIZARD STEPS -->
            <div class="flex flex-col sm:flex-row items-center justify-between border-b border-slate-100 pb-6 mb-6 gap-4">
                <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-sm"><i data-lucide="check" class="w-4 h-4"></i></div>
                    <span class="text-sm font-semibold text-slate-800">Pilih Pekerjaan</span>
                </div>
                <div class="hidden sm:block h-px bg-slate-200 flex-1 mx-4"></div>
                <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center font-bold text-sm">2</div>
                    <span class="text-sm font-semibold text-brand">Rincian RAB Estimator</span>
                </div>
                <div class="hidden sm:block h-px bg-slate-200 flex-1 mx-4"></div>
                <div class="flex items-center gap-2 opacity-50">
                    <div class="w-8 h-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm">3</div>
                    <span class="text-sm font-medium text-slate-500">Review & Simpan</span>
                </div>
            </div>

            <!-- INFORMASI PEKERJAAN -->
            <h3 class="text-base font-bold text-slate-800 mb-4 flex items-center gap-2"><i data-lucide="info" class="w-5 h-5 text-brand"></i> Informasi Pekerjaan</h3>
            <div class="space-y-5 mb-8 bg-slate-50/50 p-5 rounded-xl border border-slate-100">
                <!-- Row 0: Tahun -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label class="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Pilih Tahun *</label>
                        <select id="select-tahun-rab" onchange="handleSelectTahunRAB(this.value)"
                            class="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-brand bg-white font-medium shadow-sm">
                            ${tahunOptions}
                        </select>
                    </div>
                    <div></div>
                    <div></div>
                </div>

                <!-- Row 1: PRK, Jenis Program, Pengadaan -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label class="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Daftar PRK</label>
                        <select id="select-prk-rab" onchange="handleSelectPRKRAB(this.value)"
                            class="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-brand bg-white font-medium shadow-sm">
                            <option value="">-- Pilih Tahun Dulu --</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Jenis Program PRK</label>
                        <select id="select-jenis-program-rab" onchange="handleSelectJenisProgramRAB(this.value)"
                            class="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-brand bg-white font-medium shadow-sm">
                            <option value="">-- Pilih Jenis Program --</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Pengadaan</label>
                        <select id="select-pengadaan-rab" onchange="handleSelectPengadaanRAB(this.value)"
                            class="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-brand bg-white font-medium shadow-sm">
                            <option value="">-- Pilih Pengadaan --</option>
                        </select>
                    </div>
                </div>

                <!-- Row 2: Pilih Pekerjaan, Lokasi -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Pilih Nama Pekerjaan</label>
                        <select id="select-pekerjaan-rab" onchange="handleSelectPekerjaanRAB(this.value)"
                            class="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-brand bg-white font-medium shadow-sm">
                            <option value="">-- Pilih Paket Pekerjaan --</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Lokasi / ULP <span class="text-xs text-slate-400">(opsional)</span></label>
                        <input type="text" id="info-lokasi-manual" placeholder="Ketik lokasi manual..."
                            class="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-brand bg-white shadow-sm">
                    </div>
                </div>

                <!-- Row 3: Info tambahan (HIDDEN) -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 hidden">
                    <div>
                        <label class="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Jenis Pekerjaan</label>
                        <div class="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-slate-100 text-slate-700 font-medium flex items-center shadow-inner" id="info-kegiatan">-</div>
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Tahun Anggaran</label>
                        <div class="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-slate-100 text-slate-700 font-medium flex items-center shadow-inner" id="info-tahun">-</div>
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Volume Paket</label>
                        <div class="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-slate-100 text-brand font-bold flex items-center shadow-inner" id="info-volume">-</div>
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Sumber Anggaran</label>
                        <div class="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-slate-100 text-slate-700 font-medium flex items-center shadow-inner" id="info-sumber">-</div>
                    </div>
                </div>
            </div>

            <!-- RINCIAN RAB -->
            <div id="rab-section-container" class="hidden">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                    <h3 class="text-base font-bold text-slate-800 flex items-center gap-2"><i data-lucide="calculator" class="w-5 h-5 text-emerald-500"></i> Rincian Biaya Estimator</h3>
                    <button onclick="showModalRAB()" id="btn-add-modal" class="bg-brand text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-sky-700 transition flex items-center gap-1.5 shadow-sm">
                        <i data-lucide="plus" class="w-4 h-4"></i> Tambah Item
                    </button>
                </div>
                <div id="rab-table-container">
                    <div class="text-center py-12 text-slate-400 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                        <i data-lucide="calculator" class="w-12 h-12 mx-auto mb-3 text-slate-300"></i>
                        <p>Silakan pilih paket pekerjaan terlebih dahulu.</p>
                    </div>
                </div>
                <div class="mt-8 flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-slate-100">
                    <p class="text-xs text-slate-500">Pastikan semua perhitungan RAB sudah sesuai sebelum menyimpan.</p>
                    <div class="flex gap-2">
                        <button onclick="printRABEstimator()" class="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 shadow-sm flex items-center gap-2">
                            <i data-lucide="printer" class="w-4 h-4"></i> Print
                        </button>
                        <button onclick="saveAllRABToSheets()" id="btn-save-all" class="px-6 py-2.5 bg-brand text-white rounded-xl text-sm font-semibold hover:bg-sky-700 shadow-sm flex items-center gap-2">
                            <i data-lucide="save" class="w-4 h-4"></i> Simpan ke Sheet
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- MODAL FORM INPUT RAB -->
        <div id="modal-rab" class="fixed inset-0 bg-slate-900/50 z-50 hidden flex items-center justify-center backdrop-blur-sm transition-opacity opacity-0 p-4">
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-8 transform transition-all scale-95 max-h-[90vh] overflow-y-auto">
                <div class="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                    <div class="flex items-center gap-3">
                        <div class="bg-blue-50 text-brand p-2.5 rounded-xl"><i data-lucide="file-text" class="w-6 h-6"></i></div>
                        <h3 class="text-xl font-bold text-slate-800" id="modal-rab-title">Tambah Item RAB</h3>
                    </div>
                    <button type="button" onclick="closeModalRAB()" class="text-slate-400 hover:text-slate-700 p-2"><i data-lucide="x" class="w-6 h-6"></i></button>
                </div>
                <form id="form-rab" onsubmit="saveItemModalToTemp(event)">
                    <input type="hidden" id="modal-edit-index" value="">
                    <div class="space-y-5">
                        <div>
                            <label class="block text-sm font-semibold text-slate-700 mb-1.5">Uraian Pekerjaan / Material</label>
                            <input type="text" id="modal-uraian" required placeholder="Contoh: Tiang Beton 13/350" class="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:border-brand outline-none">
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-semibold text-slate-700 mb-1.5">Satuan</label>
                                <input type="text" id="modal-satuan" required placeholder="Btg / m3 / ls" class="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:border-brand outline-none">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-slate-700 mb-1.5">Volume</label>
                                <input type="number" step="any" id="modal-volume" value="1" required oninput="calculateModalPreview()" class="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:border-brand outline-none">
                            </div>
                        </div>
                        <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                            <div class="flex items-center justify-between">
                                <p class="text-xs font-bold text-slate-500 uppercase tracking-wider">Harga Satuan (Rp)</p>
                                <button type="button" onclick="openMaterialPickerRAB()" class="text-xs bg-brand text-white px-3 py-1 rounded-lg hover:bg-sky-700 transition flex items-center gap-1">
                                    <i data-lucide="database" class="w-3 h-3"></i> Ambil dari Master Material
                                </button>
                            </div>
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-xs font-medium text-slate-600 mb-1">Material</label>
                                    <input type="number" step="any" id="modal-harga-material" value="0" class="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-slate-50 outline-none" readonly onfocus="this.blur()">
                                </div>
                                <div>
                                    <label class="block text-xs font-medium text-slate-600 mb-1">Jasa</label>
                                    <input type="number" step="any" id="modal-harga-jasa" value="0" class="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-slate-50 outline-none" readonly onfocus="this.blur()">
                                </div>
                            </div>
                        </div>
                        <div class="bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-2">
                            <div class="flex justify-between text-xs text-slate-600">
                                <span>Bagian Material: <b id="modal-preview-mat" class="text-slate-800">Rp 0</b></span>
                                <span>Bagian Jasa: <b id="modal-preview-jasa" class="text-slate-800">Rp 0</b></span>
                            </div>
                            <div class="pt-2 border-t border-blue-200 flex justify-between items-center">
                                <span class="text-sm font-bold text-slate-700">Total Harga Item:</span>
                                <input type="text" id="modal-jumlah-preview" readonly class="text-right border-0 bg-transparent text-lg font-bold text-brand outline-none w-1/2" value="Rp 0">
                            </div>
                        </div>
                    </div>
                    <div class="mt-8 flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <button type="button" onclick="closeModalRAB()" class="px-5 py-2.5 border border-slate-300 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50">Batal</button>
                        <button type="submit" class="px-6 py-2.5 bg-brand text-white rounded-xl text-sm font-semibold hover:bg-sky-700 shadow-md">Simpan Item</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    lucide.createIcons();

    if (state.selectedPekerjaanRAB) {
        document.getElementById('select-pekerjaan-rab').value = state.selectedPekerjaanRAB;
        handleSelectPekerjaanRAB(state.selectedPekerjaanRAB);
    }
}

function handleSelectTahunRAB(tahun) {
    const selectPRK = document.getElementById('select-prk-rab');
    const selectJenis = document.getElementById('select-jenis-program-rab');
    const selectPengadaan = document.getElementById('select-pengadaan-rab');
    
    if (!selectPRK) return;

    // Filter PRK berdasarkan tahun
    let prkOptions = '<option value="">-- Pilih PRK --</option>';
    if (tahun) {
        const filteredPRK = (window.allPRKList || []).filter(p => String(p.tahun) === String(tahun));
        filteredPRK.forEach(p => {
            prkOptions += `<option value="${p.id}" data-tahun="${p.tahun || ''}">${p.no_prk || ''} - ${p.prk || ''}</option>`;
        });
    }
    selectPRK.innerHTML = prkOptions;
    selectPRK.value = '';

    // Reset dropdown berikutnya
    if (selectJenis) {
        selectJenis.innerHTML = '<option value="">-- Pilih Jenis Program --</option>';
        selectJenis.value = '';
    }
    if (selectPengadaan) {
        selectPengadaan.innerHTML = '<option value="">-- Pilih Pengadaan --</option>';
        selectPengadaan.value = '';
    }
}

function handleSelectPRKRAB(prkId) {
    const select = document.getElementById('select-jenis-program-rab');
    if (!select) return;
    
    // Filter jenis_program berdasarkan PRK yang dipilih
    let options = '<option value="">-- Pilih Jenis Program --</option>';
    if (prkId) {
        const filteredJenis = (window.allJenisProgramList || []).filter(j => String(j.id_prk) === String(prkId));
        filteredJenis.forEach(j => {
            options += `<option value="${j.id}" data-kode="${j.kode_jenis || ''}">${j.kode_jenis || ''} - ${j.nama_program || ''}</option>`;
        });
    }
    select.innerHTML = options;
    select.value = '';
}

function handleSelectJenisProgramRAB(jenisProgramId) {
    const selectPengadaan = document.getElementById('select-pengadaan-rab');
    if (!selectPengadaan) return;

    // Filter pengadaan berdasarkan jenis_program yang dipilih
    let options = '<option value="">-- Pilih Pengadaan --</option>';
    if (jenisProgramId) {
        const filteredPengadaan = (window.allPengadaanList || []).filter(p => String(p.id_jenis) === String(jenisProgramId));
        filteredPengadaan.forEach(p => {
            options += `<option value="${p.id}">${p.nama_pengadaan || p.nomor_pengadaan || ''}</option>`;
        });
    } else {
        // Jika kosong, tampilkan semua pengadaan
        (window.allPengadaanList || []).forEach(p => {
            options += `<option value="${p.id}">${p.nama_pengadaan || p.nomor_pengadaan || ''}</option>`;
        });
    }
    selectPengadaan.innerHTML = options;
    selectPengadaan.value = '';

    // Reset pekerjaan dropdown
    const selectPekerjaan = document.getElementById('select-pekerjaan-rab');
    if (selectPekerjaan) {
        selectPekerjaan.innerHTML = '<option value="">-- Pilih Paket Pekerjaan --</option>';
        selectPekerjaan.value = '';
    }
}

function handleSelectPengadaanRAB(pengadaanId) {
    const selectPekerjaan = document.getElementById('select-pekerjaan-rab');
    if (!selectPekerjaan) return;

    // Filter pekerjaan berdasarkan pengadaan yang dipilih
    let options = '<option value="">-- Pilih Paket Pekerjaan --</option>';
    if (pengadaanId) {
        // Cari pekerjaan yang id_pengadaan_prk = pengadaan yang dipilih (dari hierarki PRK)
        let filteredPekerjaan = (window.allPekerjaanList || []).filter(p => String(p.id_pengadaan_prk) === String(pengadaanId));
        
        // Jika tidak ada pekerjaan dari PRK, fallback ke pengadaan_id (untuk pekerjaan lama)
        if (filteredPekerjaan.length === 0) {
            filteredPekerjaan = (window.allPekerjaanList || []).filter(p => String(p.pengadaan_id) === String(pengadaanId));
        }

        if (filteredPekerjaan.length > 0) {
            filteredPekerjaan.forEach(p => {
                const nomor = p.nomor_paket || '-';
                options += `<option value="${p.id}">${nomor} : ${p.nama_pekerjaan || p.nama_komponen || ''}</option>`;
            });
        } else {
            // Jika masih tidak ada, tampilkan pesan
            options = '<option value="">-- Tidak ada pekerjaan di pengadaan ini --</option>';
        }
    } else {
        // Jika kosong, tampilkan semua pekerjaan
        (window.allPekerjaanList || []).forEach(p => {
            const nomor = p.nomor_paket || '-';
            options += `<option value="${p.id}">${nomor} : ${p.nama_pekerjaan || p.nama_komponen || ''}</option>`;
        });
    }
    selectPekerjaan.innerHTML = options;
    selectPekerjaan.value = '';
}

async function handleSelectPekerjaanRAB(id) {
    state.selectedPekerjaanRAB = id;

    if (!id) {
        const sectionRAB = document.getElementById('rab-section-container');
        if (sectionRAB) sectionRAB.classList.add('hidden');
        return;
    }

    if (window.allPekerjaanList) {
        const selectedObj = window.allPekerjaanList.find(p => String(p.id) === String(id));
        state.selectedPekerjaanNamaRAB   = selectedObj ? selectedObj.nama_pekerjaan : '';
        state.selectedPengadaanIdRAB     = selectedObj ? (selectedObj.pengadaan_id || selectedObj.id_pengadaan_prk || '') : '';

        let pengadaanObj = null;
        if (state.selectedPengadaanIdRAB && window.allPengadaanList) {
            pengadaanObj = window.allPengadaanList.find(p => String(p.id) === String(state.selectedPengadaanIdRAB));
        }
        state.selectedPengadaanNamaRAB = pengadaanObj ? pengadaanObj.nama_pengadaan : (selectedObj ? selectedObj.nama_pengadaan : '');

        if (selectedObj) {
            const tahunValue  = selectedObj.tahun_anggaran || (pengadaanObj ? pengadaanObj.tahun : '-');
            const sumberValue = selectedObj.sumber_anggaran || (pengadaanObj ? pengadaanObj.sumber_anggaran : '-');
            const lokasiInput = document.getElementById('info-lokasi-manual');
            const lokasiValue = selectedObj.lokasi || (lokasiInput ? lokasiInput.value : '') || '';
            const el = (elId) => document.getElementById(elId);
            if (el('info-tahun'))    el('info-tahun').innerText    = tahunValue;
            if (el('info-sumber'))   el('info-sumber').innerText   = sumberValue;
            if (el('info-kegiatan')) el('info-kegiatan').innerText = selectedObj.jenis_kegiatan || selectedObj.jenis_tegangan || '-';
            if (el('info-volume'))   el('info-volume').innerText   = selectedObj.volume_paket || '-';
            if (lokasiInput && selectedObj.lokasi) lokasiInput.value = selectedObj.lokasi;
        }
    }

    const sectionRAB = document.getElementById('rab-section-container');
    if (sectionRAB) sectionRAB.classList.remove('hidden');
    
    const allRAB    = await fetchAPI('action=list&table=RAB') || [];
    const existingRAB = allRAB.filter(item => String(item.pekerjaan_id) === String(id) && String(item.versi_rab || '').trim().toLowerCase() !== 'terkoreksi');
    state.tempRABItems = existingRAB.map(item => ({
        id:             item.id || 'temp_' + Date.now(),
        kategori:       item.kategori || 'Umum',
        uraian:         item.uraian || '',
        satuan:         item.satuan || '',
        volume:         parseFloat(item.volume) || 0,
        harga_material: parseFloat(item.harga_material) || 0,
        harga_jasa:     parseFloat(item.harga_jasa) || 0,
        isSaved:        true,
        _isDirty:       false
    }));
    // JANGAN tambah empty item otomatis — biarkan user pilih "Tambah Item" dulu
    renderRABTable();
}

function showModalRAB(editIndex = null) {
    const modal = document.getElementById('modal-rab');
    if (!modal) return;
    document.getElementById('form-rab').reset();
    document.getElementById('modal-edit-index').value = '';
    document.getElementById('modal-rab-title').innerText = 'Tambah Item RAB';
    document.getElementById('modal-volume').value = '1';
    document.getElementById('modal-jumlah-preview').value = 'Rp 0';
    document.getElementById('modal-preview-mat').innerText = 'Rp 0';
    document.getElementById('modal-preview-jasa').innerText = 'Rp 0';

    if (editIndex !== null && state.tempRABItems[editIndex]) {
        const item = state.tempRABItems[editIndex];
        document.getElementById('modal-rab-title').innerText = 'Edit Item RAB';
        document.getElementById('modal-edit-index').value    = editIndex;
        document.getElementById('modal-uraian').value        = item.uraian;
        document.getElementById('modal-satuan').value        = item.satuan;
        document.getElementById('modal-volume').value        = item.volume;
        document.getElementById('modal-harga-material').value = item.harga_material;
        document.getElementById('modal-harga-jasa').value   = item.harga_jasa;
        calculateModalPreview();
    }
    modal.classList.remove('hidden');
    setTimeout(() => { modal.classList.remove('opacity-0'); modal.querySelector('div').classList.remove('scale-95'); }, 10);
}

function closeModalRAB() {
    const modal = document.getElementById('modal-rab');
    modal.classList.add('opacity-0'); modal.querySelector('div').classList.add('scale-95');
    setTimeout(() => modal.classList.add('hidden'), 300);
}

async function openMaterialPickerRAB() {
    if (!window.allMaterialList || window.allMaterialList.length === 0) {
        showToast('Memuat data material...', 'info');
        window.allMaterialList = await fetchAPI('action=list&table=Material') || [];
    }
    let pickerDiv = document.getElementById('modal-material-picker');
    if (!pickerDiv) { pickerDiv = document.createElement('div'); pickerDiv.id = 'modal-material-picker'; document.body.appendChild(pickerDiv); }

    // Ambil komponen pekerjaan yang sedang dipilih
    const selectedPekerjaanId = state.selectedPekerjaanRAB;
    let komponenName = '';
    if (selectedPekerjaanId && window.allPekerjaanList) {
        const pekerjaan = window.allPekerjaanList.find(p => String(p.id) === String(selectedPekerjaanId));
        komponenName = pekerjaan ? (pekerjaan.nama_komponen || pekerjaan.nama_pekerjaan || '') : '';
    }

    // Filter material: HANYA tampilkan material dengan id_komponen = pekerjaan yang dipilih
    let matList = window.allMaterialList;
    let filteredList = [];

    if (selectedPekerjaanId) {
        filteredList = matList.filter(m => String(m.id_komponen) === String(selectedPekerjaanId));
    } else {
        filteredList = []; // Jika belum pilih pekerjaan, kosong
    }

    let rows = filteredList.length === 0
        ? '<tr><td colspan="6" class="px-4 py-6 text-center text-slate-400 italic">Belum ada data material.</td></tr>'
        : filteredList.map((m, i) => {
            const nama     = m.material || m.nama_material || m.uraian || m.nama || '-';
            const kategori = m.kategori || 'Umum';
            const satuan   = m.satuan || m.unit || '-';
            const hargaMat = parseFloat(m.harga) || parseFloat(m.harga_material) || 0;
            const hargaJasa= parseFloat(m.harga_jasa) || 0;
            return `<tr class="hover:bg-blue-50 cursor-pointer" onclick="selectMaterialForRAB('${nama.replace(/'/g,"\\'")}','${satuan}',${hargaMat},${hargaJasa})">
                <td class="px-3 py-2.5 text-center text-slate-400 text-xs">${i+1}</td>
                <td class="px-3 py-2.5"><span class="bg-blue-50 text-brand px-2 py-0.5 rounded text-[10px] font-semibold">${kategori}</span></td>
                <td class="px-3 py-2.5 font-medium text-slate-800 text-xs">${nama}</td>
                <td class="px-3 py-2.5 text-xs text-slate-500">${satuan}</td>
                <td class="px-3 py-2.5 text-right text-xs font-semibold text-emerald-600">${CONFIG.formatCurrency(hargaMat)}</td>
                <td class="px-3 py-2.5 text-right text-xs text-slate-500">${CONFIG.formatCurrency(hargaJasa)}</td>
            </tr>`;
        }).join('');

    pickerDiv.innerHTML = `
        <div class="fixed inset-0 bg-slate-900/60 z-[60] flex items-center justify-center backdrop-blur-sm p-4">
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                <div class="flex justify-between items-center px-6 py-4 border-b border-slate-100">
                    <div>
                        <h3 class="text-lg font-bold text-slate-800">Pilih Material dari Komponen</h3>
                        <p class="text-xs text-slate-500">
                            ${komponenName ? `Komponen: <b>${komponenName}</b>` : 'Pilih pekerjaan untuk melihat material'}
                        </p>
                    </div>
                    <button onclick="closeMaterialPicker()" class="text-slate-400 hover:text-slate-700 p-1">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                </div>
                <div class="px-6 py-3 border-b border-slate-100">
                    <input type="text" id="search-mat-picker" oninput="filterMaterialPicker()" placeholder="Cari nama material..."
                        class="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand">
                </div>
                <div class="overflow-y-auto flex-1">
                    <table class="w-full text-left border-collapse text-xs">
                        <thead class="bg-slate-50 sticky top-0"><tr class="text-slate-600 font-semibold border-b border-slate-200">
                            <th class="px-3 py-2.5 text-center w-10">No</th>
                            <th class="px-3 py-2.5">Nama Material</th>
                            <th class="px-3 py-2.5">Satuan</th><th class="px-3 py-2.5 text-right">Harga Material</th><th class="px-3 py-2.5 text-right">Harga Jasa</th>
                        </tr></thead>
                        <tbody id="material-picker-tbody" class="divide-y divide-slate-100">${rows}</tbody>
                    </table>
                </div>
            </div>
        </div>`;
}

function filterMaterialPicker() {
    const q      = (document.getElementById('search-mat-picker')?.value || '').toLowerCase().trim();
    const tbody  = document.getElementById('material-picker-tbody');
    if (!tbody) return;
    const matList = window.allMaterialList || [];
    const filtered= q ? matList.filter(m => {
        const nama    = (m.material || m.nama_material || m.uraian || m.nama || '').toLowerCase();
        const kategori= (m.kategori || '').toLowerCase();
        return nama.includes(q) || kategori.includes(q);
    }) : matList;
    tbody.innerHTML = filtered.map((m, i) => {
        const nama     = m.material || m.nama_material || m.uraian || m.nama || '-';
        const satuan   = m.satuan || '-';
        const hargaMat = parseFloat(m.harga) || parseFloat(m.harga_material) || 0;
        const hargaJasa= parseFloat(m.harga_jasa) || 0;
        return `<tr class="hover:bg-blue-50 cursor-pointer" onclick="selectMaterialForRAB('${nama.replace(/'/g,"\\'")}','${satuan}',${hargaMat},${hargaJasa})">
            <td class="px-3 py-2.5 text-center text-slate-400">${i+1}</td>
            <td class="px-3 py-2.5 font-medium text-slate-800">${nama}</td>
            <td class="px-3 py-2.5 text-slate-500">${satuan}</td>
            <td class="px-3 py-2.5 text-right font-semibold text-emerald-600">${CONFIG.formatCurrency(hargaMat)}</td>
            <td class="px-3 py-2.5 text-right text-slate-500">${CONFIG.formatCurrency(hargaJasa)}</td>
        </tr>`;
    }).join('') || '<tr><td colspan="5" class="px-4 py-6 text-center text-slate-400 italic">Tidak ditemukan.</td></tr>';
}

function selectMaterialForRAB(nama, satuan, hargaMat, hargaJasa) {
    const uraianEl = document.getElementById('modal-uraian');
    const satuanEl = document.getElementById('modal-satuan');
    const hMatEl   = document.getElementById('modal-harga-material');
    const hJasaEl  = document.getElementById('modal-harga-jasa');
    if (uraianEl) uraianEl.value = nama;
    if (satuanEl && !satuanEl.value) satuanEl.value = satuan;
    if (hMatEl)  hMatEl.value  = hargaMat;
    if (hJasaEl) hJasaEl.value = hargaJasa;
    calculateModalPreview();
    closeMaterialPicker();
    showToast('Material berhasil dipilih');
}

function closeMaterialPicker() {
    const pickerDiv = document.getElementById('modal-material-picker');
    if (pickerDiv) pickerDiv.remove();
}

function calculateModalPreview() {
    const vol  = parseFloat(document.getElementById('modal-volume').value) || 0;
    const hMat = parseFloat(document.getElementById('modal-harga-material').value) || 0;
    const hJasa= parseFloat(document.getElementById('modal-harga-jasa').value) || 0;
    document.getElementById('modal-preview-mat').innerText    = CONFIG.formatCurrency(vol * hMat);
    document.getElementById('modal-preview-jasa').innerText   = CONFIG.formatCurrency(vol * hJasa);
    document.getElementById('modal-jumlah-preview').value     = CONFIG.formatCurrency((vol * hMat) + (vol * hJasa));
}

function saveItemModalToTemp(event) {
    event.preventDefault();
    const editIndex  = document.getElementById('modal-edit-index').value;
    const isEditing  = editIndex !== '';
    const existingItem = isEditing ? state.tempRABItems[editIndex] : null;
    const needsDelete  = existingItem && existingItem.isSaved === true && existingItem.id && !existingItem.id.toString().startsWith('temp_');

    const newItem = {
        id:             'temp_' + Date.now(),
        kategori:       'Umum',
        uraian:         document.getElementById('modal-uraian').value,
        satuan:         document.getElementById('modal-satuan').value,
        volume:         parseFloat(document.getElementById('modal-volume').value) || 0,
        harga_material: parseFloat(document.getElementById('modal-harga-material').value) || 0,
        harga_jasa:     parseFloat(document.getElementById('modal-harga-jasa').value) || 0,
        isSaved:        false,
        _isDirty:       false,
        _oldId:         needsDelete ? existingItem.id : null
    };

    if (isEditing) state.tempRABItems[editIndex] = newItem;
    else           state.tempRABItems.push(newItem);

    closeModalRAB();
    renderRABTable();
    showToast('Item berhasil diubah. Klik "Simpan ke Sheet" untuk menyimpan.');
}

function removeTempRow(index) {
    const item = state.tempRABItems[index];
    if (item.isSaved) deleteData('RAB', item.id, () => { state.tempRABItems.splice(index, 1); renderRABTable(); });
    else { state.tempRABItems.splice(index, 1); renderRABTable(); }
}

function renderRABTable() {
    const container = document.getElementById('rab-table-container');
    if (!container) return;

    let html = `
        <div class="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
            <table class="w-full text-left border-collapse whitespace-nowrap text-xs">
                <thead>
                    <tr class="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold text-center">
                        <th rowspan="2" class="px-3.5 py-3.5 border-r border-slate-200 w-12">NO</th>
                        <th rowspan="2" class="px-4 py-3.5 border-r border-slate-200 text-left">URAIAN PEKERJAAN / MATERIAL</th>
                        <th rowspan="2" class="px-3 py-3.5 border-r border-slate-200 w-20">VOLUME</th>
                        <th rowspan="2" class="px-3 py-3.5 border-r border-slate-200 w-20">SATUAN</th>
                        <th colspan="2" class="px-3 py-2 border-b border-r border-slate-200 bg-slate-200/60">HARGA SATUAN (Rp)</th>
                        <th colspan="2" class="px-3 py-2 border-b border-r border-slate-200 bg-slate-200/60">BAGIAN (Rp)</th>
                        <th rowspan="2" class="px-4 py-3.5 border-r border-slate-200 text-right">JUMLAH (Rp)</th>
                        <th rowspan="2" class="px-3 py-3.5 w-20">AKSI</th>
                    </tr>
                    <tr class="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-center">
                        <th class="px-3 py-2 border-r border-slate-200">MATERIAL</th>
                        <th class="px-3 py-2 border-r border-slate-200">JASA</th>
                        <th class="px-3 py-2 border-r border-slate-200">MATERIAL</th>
                        <th class="px-3 py-2 border-r border-slate-200">JASA</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 text-slate-700">
    `;

    if (state.tempRABItems.length === 0) {
        html += '<tr><td colspan="11" class="px-4 py-10 text-center text-slate-400 italic">Belum ada item. Klik "Tambah Item" untuk menambahkan.</td></tr>';
    } else {
        state.tempRABItems.forEach((item, index) => {
            const vol  = parseFloat(item.volume) || 0;
            const hMat = parseFloat(item.harga_material) || 0;
            const hJasa= parseFloat(item.harga_jasa) || 0;
            const bMat = vol * hMat, bJasa = vol * hJasa;
            const totalItem = bMat + bJasa;
            const statusBadge = item._isDirty
                ? '<span class="text-[9px] bg-orange-100 text-orange-700 px-1 py-0.5 rounded ml-1 font-semibold">Diubah</span>'
                : item.isSaved
                    ? '<span class="text-[9px] bg-green-100 text-green-700 px-1 py-0.5 rounded ml-1 font-semibold">Tersimpan</span>'
                    : '<span class="text-[9px] bg-amber-100 text-amber-700 px-1 py-0.5 rounded ml-1 font-semibold">Baru</span>';
            html += `
                <tr class="hover:bg-blue-50/30 transition-colors">
                    <td class="px-3.5 py-3 text-center border-r border-slate-100 text-slate-500 font-medium">${index + 1} ${statusBadge}</td>
                    <td class="px-4 py-3 border-r border-slate-100 font-semibold text-slate-800 whitespace-normal min-w-[220px]">${item.uraian}</td>
                    <td class="px-3 py-3 text-center border-r border-slate-100 font-medium">${vol}</td>
                    <td class="px-3 py-3 text-center border-r border-slate-100 text-slate-600">${item.satuan}</td>
                    <td class="px-3 py-3 text-right border-r border-slate-100">${hMat > 0 ? CONFIG.formatCurrency(hMat) : '-'}</td>
                    <td class="px-3 py-3 text-right border-r border-slate-100">${hJasa > 0 ? CONFIG.formatCurrency(hJasa) : '-'}</td>
                    <td class="px-3 py-3 text-right border-r border-slate-100 text-slate-600 font-medium bg-slate-50/50">${bMat > 0 ? CONFIG.formatCurrency(bMat) : '-'}</td>
                    <td class="px-3 py-3 text-right border-r border-slate-100 text-slate-600 font-medium bg-slate-50/50">${bJasa > 0 ? CONFIG.formatCurrency(bJasa) : '-'}</td>
                    <td class="px-4 py-3 text-right border-r border-slate-100 font-bold text-slate-900 bg-blue-50/20">${CONFIG.formatCurrency(totalItem)}</td>
                    <td class="px-3 py-3 text-center">
                        <div class="flex justify-center gap-1">
                            <button type="button" onclick="showModalRAB(${index})" class="text-blue-500 hover:text-blue-700 p-1"><i data-lucide="edit-2" class="w-4 h-4"></i></button>
                            <button type="button" onclick="removeTempRow(${index})" class="text-red-400 hover:text-red-600 p-1"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                        </div>
                    </td>
                </tr>`;
        });
    }

    html += `
            </tbody>
            <tfoot class="bg-slate-50 text-xs">
                <tr class="border-t border-b-2 border-slate-300 font-bold">
                    <td colspan="4" class="px-4 py-3 text-right border-r border-slate-200"></td>
                    <td class="px-3 py-3 text-right border-r border-slate-200 text-slate-800 bg-slate-50/50 font-medium" id="footer-sum-harga-material">Rp 0</td>
                    <td class="px-3 py-3 text-right border-r border-slate-200 text-slate-800 bg-slate-50/50 font-medium" id="footer-sum-harga-jasa">Rp 0</td>
                    <td class="px-3 py-3 text-right border-r border-slate-200 text-slate-800 bg-slate-50/50 font-medium" id="footer-total-material">Rp 0</td>
                    <td class="px-3 py-3 text-right border-r border-slate-200 text-slate-800 bg-slate-50/50 font-medium" id="footer-total-jasa">Rp 0</td>
                    <td class="px-4 py-3 text-right border-r border-slate-200 text-slate-900 bg-blue-50/20 font-bold" id="footer-total">Rp 0</td>
                    <td class="border-r border-slate-200"></td>
                </tr>
            </tfoot>
        </table></div>`;

    container.innerHTML = html;
    lucide.createIcons();
    recalculateSubtotalFooter();
}

function recalculateSubtotalFooter() {
    let sumHargaMaterial = 0;
    let sumHargaJasa = 0;
    let totalMaterial = 0;
    let totalJasa = 0;
    let subtotal = 0;
    
    state.tempRABItems.forEach(item => {
        const vol  = parseFloat(item.volume) || 0;
        const hMat = parseFloat(item.harga_material) || 0;
        const hJasa= parseFloat(item.harga_jasa) || 0;
        sumHargaMaterial += hMat;
        sumHargaJasa += hJasa;
        totalMaterial += (vol * hMat);
        totalJasa += (vol * hJasa);
        subtotal += (vol * hMat) + (vol * hJasa);
    });
    
    const sumHargaMatEl = document.getElementById('footer-sum-harga-material');
    const sumHargaJasEl = document.getElementById('footer-sum-harga-jasa');
    const matEl = document.getElementById('footer-total-material');
    const jasEl = document.getElementById('footer-total-jasa');
    const totEl = document.getElementById('footer-total');
    
    if (sumHargaMatEl) sumHargaMatEl.innerText = CONFIG.formatCurrency(sumHargaMaterial);
    if (sumHargaJasEl) sumHargaJasEl.innerText = CONFIG.formatCurrency(sumHargaJasa);
    if (matEl) matEl.innerText = CONFIG.formatCurrency(totalMaterial);
    if (jasEl) jasEl.innerText = CONFIG.formatCurrency(totalJasa);
    if (totEl) totEl.innerText = CONFIG.formatCurrency(subtotal);
}

async function saveAllRABToSheets() {
    if (!state.selectedPekerjaanRAB) return showToast('Pilih pekerjaan terlebih dahulu', 'error');

    const lokasi = document.getElementById('info-lokasi-manual')?.value.trim() || '';
    const savedItems = state.tempRABItems.filter(item =>
        item.isSaved && item.id && !String(item.id).startsWith('temp_')
    );
    const itemsNew = state.tempRABItems.filter(item =>
        (!item.isSaved || item.id.toString().startsWith('temp_')) && item.uraian && item.uraian.trim() !== ''
    );

    if (itemsNew.length === 0) {
        if (!lokasi || savedItems.length === 0) {
            return showToast('Tidak ada perubahan baru yang perlu disimpan.', 'info');
        }

        const currentUser = state.currentUser ? state.currentUser.nama : 'Admin';
        let updatedCount = 0;
        for (const item of savedItems) {
            const result = await fetchAPI('', 'POST', {
                action: 'update',
                table: 'RAB',
                user: currentUser,
                data: { id: item.id, lokasi: lokasi }
            });
            if (result) updatedCount++;
        }

        if (updatedCount > 0) {
            invalidateCache('RAB');
            showToast(`Lokasi berhasil disimpan pada ${updatedCount} item RAB`);
            await handleSelectPekerjaanRAB(state.selectedPekerjaanRAB);
        }
        return;
    }

    const btn = document.getElementById('btn-save-all');
    if (btn) { btn.disabled = true; btn.innerHTML = '<div class="loader w-4 h-4 border-2 border-white border-t-transparent"></div> Menyimpan...'; }

    const currentUser = state.currentUser ? state.currentUser.nama : 'Admin';
    let successCount  = 0;

    for (let item of itemsNew) {
        if (item._oldId) {
            try { await fetchAPI('', 'POST', { action: 'delete', table: 'RAB', id: String(item._oldId), user: currentUser }); } catch (e) { /* silent */ }
        }
        const vol  = parseFloat(item.volume) || 0;
        const hMat = parseFloat(item.harga_material) || 0;
        const hJasa= parseFloat(item.harga_jasa) || 0;
        const payload = {
            action: 'create', table: 'RAB', user: currentUser,
            data: {
                pengadaan_id: state.selectedPengadaanIdRAB, nama_pengadaan: state.selectedPengadaanNamaRAB,
                pekerjaan_id: state.selectedPekerjaanRAB,   nama_pekerjaan: state.selectedPekerjaanNamaRAB,
                lokasi: lokasi,
                kategori: item.kategori, uraian: item.uraian, satuan: item.satuan,
                volume: vol, harga_material: hMat, harga_jasa: hJasa,
                bagian_material: vol*hMat, bagian_jasa: vol*hJasa, jumlah: vol*(hMat+hJasa)
            }
        };
        try {
            const res = await fetchAPI('', 'POST', payload);
            if (res) successCount++;
        } catch (err) { console.error('Create error:', err); }
    }

    if (btn) { btn.disabled = false; btn.innerHTML = '<i data-lucide="save" class="w-4 h-4"></i> Simpan ke Sheet'; lucide.createIcons(); }

    if (successCount > 0) {
        showToast(`Berhasil menyimpan ${successCount} dari ${itemsNew.length} item ke Google Sheets!`);
        await handleSelectPekerjaanRAB(state.selectedPekerjaanRAB);
    } else {
        showToast('Gagal menyimpan data.', 'error');
    }
}

function printRABEstimator() {
    const rabTable = document.querySelector('#rab-table-container table');
    if (!rabTable || state.tempRABItems.length === 0) {
        return showToast('Tidak ada data RAB untuk diprint', 'error');
    }

    // Get pekerjaan info
    const pekerjaan = state.selectedPekerjaanNamaRAB || 'Pekerjaan';
    const pengadaan = state.selectedPengadaanNamaRAB || 'Pengadaan';
    
    // Get PRK info
    let noPrk = '-';
    let urianPrk = '-';
    
    if (window.allPengadaanList && state.selectedPengadaanIdRAB) {
        const pgData = window.allPengadaanList.find(p => String(p.id) === String(state.selectedPengadaanIdRAB));
        if (pgData) {
            const prkId = pgData.id_prk || pgData.prk_id || pgData.id_program_rencana_kerja;
            if (prkId && window.allPRKList && window.allPRKList.length > 0) {
                const prkData = window.allPRKList.find(p => String(p.id) === String(prkId));
                if (prkData) {
                    noPrk = prkData.no_prk || prkData.nomor_prk || '-';
                    // Tambahkan prkData.prk sebagai priority pertama (field yang dipakai di dropdown)
                    urianPrk = prkData.prk || prkData.nama || prkData.uraian || prkData.nama_prk || prkData.uraian_prk || '-';
                }
            }
        }
    }
    
    // Format PRK display
    const displayPrk = (!urianPrk || urianPrk === '-' || urianPrk.trim() === '') 
        ? noPrk 
        : `${noPrk} - ${urianPrk}`;
    
    // Calculate totals
    let subtotal = 0;
    let totalMaterial = 0;
    let totalJasa = 0;
    let tableRows = '';
    let rowNum = 1;
    
    state.tempRABItems.forEach(item => {
        const vol = parseFloat(item.volume) || 0;
        const hMat = parseFloat(item.harga_material) || 0;
        const hJasa = parseFloat(item.harga_jasa) || 0;
        const totalMat = vol * hMat;
        const totalJasa_item = vol * hJasa;
        const total = totalMat + totalJasa_item;
        
        totalMaterial += totalMat;
        totalJasa += totalJasa_item;
        subtotal += total;
        
        tableRows += `<tr class="border-b border-slate-200 text-xs">
            <td class="p-2 text-center w-8">${rowNum}</td>
            <td class="p-2 font-medium">${item.uraian || '-'}</td>
            <td class="p-2 text-center w-12">${vol}</td>
            <td class="p-2 text-center w-16">${item.satuan || '-'}</td>
            <td class="p-2 text-right w-24 font-mono">${CONFIG.formatCurrency(hMat)}</td>
            <td class="p-2 text-right w-24 font-mono text-blue-600">${CONFIG.formatCurrency(totalMat)}</td>
            <td class="p-2 text-right w-24 font-mono text-green-600">${CONFIG.formatCurrency(totalJasa_item)}</td>
            <td class="p-2 text-right w-28 font-bold font-mono">${CONFIG.formatCurrency(total)}</td>
        </tr>`;
        rowNum++;
    });
    
    // Format values
    const fmtSubtotal = CONFIG.formatCurrency(subtotal);
    const fmtTotalMat = CONFIG.formatCurrency(totalMaterial);
    const fmtTotalJas = CONFIG.formatCurrency(totalJasa);
    
    // Logo PLN
    const logoUrl = 'https://upload.wikimedia.org/wikipedia/commons/9/97/Logo_PLN.png';
    
    // Build HTML for print
    const printHtml = `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RAB Estimator - PLN</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 10px; line-height: 1.3; padding: 15px; }
        @media print { 
            body { margin: 0; padding: 10px; }
            @page { size: A4 landscape; margin: 10mm; }
        }
        
        .header-container { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; border-bottom: 2px solid #000; padding-bottom: 10px; }
        .logo-section { display: flex; align-items: center; gap: 10px; }
        .logo { width: 60px; height: auto; max-height: 60px; }
        .header-info { flex: 1; }
        .header-info h3 { font-size: 12px; font-weight: bold; margin: 1px 0; }
        .header-info p { font-size: 9px; margin: 0px 0; color: #333; }
        
        .title { text-align: center; font-size: 13px; font-weight: bold; margin: 10px 0; text-transform: uppercase; letter-spacing: 0.3px; }
        
        .project-info { margin: 8px 0; font-size: 9px; background: #f8f8f8; padding: 6px; border-left: 2px solid #0369a1; }
        .project-info div { margin: 2px 0; }
        .project-info label { font-weight: bold; display: inline-block; width: 110px; }
        .project-info .value { display: inline; }
        
        table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 9px; }
        table th, table td { border: 1px solid #333; padding: 3px; text-align: right; }
        table th { background-color: #333; color: white; font-weight: bold; font-size: 8px; }
        table td { text-align: right; }
        table td.text-left { text-align: left; }
        
        .summary-container { display: flex; gap: 15px; margin-top: 15px; }
        .summary-left { flex: 1; }
        .summary-right { flex: 1; }
        
        .summary-item { margin: 5px 0; display: flex; justify-content: flex-end; gap: 10px; font-size: 9px; padding: 0 2px; }
        .summary-item label { font-weight: bold; width: 85px; text-align: left; }
        .summary-item .amount { font-family: monospace; font-weight: bold; width: 110px; text-align: right; }
        
        .total-row { 
            display: flex; 
            justify-content: flex-end; 
            gap: 10px;
            margin-top: 8px; 
            padding: 8px; 
            background: #e0e7ff; 
            border: 2px solid #0369a1; 
            border-radius: 3px;
            font-size: 9px;
            width: fit-content;
            margin-left: auto;
        }
        .total-row label { font-weight: bold; font-size: 10px; width: 110px; text-align: left; }
        .total-row .amount { font-size: 11px; font-weight: bold; color: #0369a1; width: 110px; text-align: right; }
        
        .terbilang { padding: 8px; background-color: #fffbeb; border: 1px solid #fbbf24; border-radius: 3px; font-size: 9px; }
        .terbilang label { font-weight: bold; display: block; margin-bottom: 3px; font-size: 9px; }
        .terbilang-text { font-style: italic; font-size: 8px; line-height: 1.4; color: #92400e; }
        
        .footer { margin-top: 25px; display: flex; justify-content: space-between; font-size: 8px; }
        .sign-box { text-align: center; width: 22%; }
        .sign-box p { margin: 15px 0 3px 0; font-weight: bold; font-size: 8px; }
        .sign-box .date { margin-bottom: 30px; }
    </style>
</head>
<body>
    <!-- Header -->
    <div class="header-container">
        <div class="logo-section">
            <img src="${logoUrl}" class="logo" alt="PLN Logo">
            <div class="header-info">
                <h3>PT PLN (Persero)</h3>
                <p>Unit Induk Distribusi Bali</p>
                <p>Unit Pelaksana Pelayanan Pelanggan - Bali Utara</p>
            </div>
        </div>
    </div>
    
    <!-- Title -->
    <div class="title">Rencana Anggaran Biaya (RAB) - Estimator</div>
    
    <!-- Project Info -->
    <div class="project-info">
        <div><label>Pekerjaan</label>: <span class="value">${pekerjaan}</span></div>
        <div><label>Pengadaan</label>: <span class="value">${pengadaan}</span></div>
        <div><label>Lokasi</label>: <span style="border-bottom: 1px dotted #666; display:inline-block; width:35%; padding-bottom:1px;"></span></div>
        <div><label>Pos Anggaran</label>: <span class="value">${displayPrk}</span></div>
    </div>
    
    <!-- Table -->
    <table>
        <thead>
            <tr>
                <th style="width: 3%; text-align: center;">NO</th>
                <th style="width: 22%; text-align: left;">URAIAN</th>
                <th style="width: 6%; text-align: center;">VOL</th>
                <th style="width: 6%; text-align: center;">SAT</th>
                <th style="width: 11%; text-align: right;">HARGA SATUAN MATERIAL</th>
                <th style="width: 9%; text-align: right;">TOTAL MATERIAL</th>
                <th style="width: 9%; text-align: right;">TOTAL JASA</th>
                <th style="width: 11%; text-align: right;">TOTAL (Rp)</th>
            </tr>
        </thead>
        <tbody>
            ${tableRows}
        </tbody>
    </table>
    
    <!-- Summary Section -->
    <div class="summary-container">
        <!-- LEFT: Empty -->
        <div class="summary-left">
        </div>
        
        <!-- RIGHT: Jumlah, DPP, PPN, Total -->
        <div class="summary-right">
            <div class="summary-item" style="border-bottom: 1px solid #d1d5db; padding-bottom: 6px; margin-bottom: 6px;">
                <label>JUMLAH</label>
                <span class="amount">${fmtSubtotal}</span>
            </div>
            <div class="summary-item" style="border-bottom: 1px solid #d1d5db; padding-bottom: 6px; margin-bottom: 6px;">
                <label>DPP (11/12)</label>
                <span class="amount">${CONFIG.formatCurrency(subtotal * (11/12))}</span>
            </div>
            <div class="summary-item" style="border-bottom: 1px solid #d1d5db; padding-bottom: 6px; margin-bottom: 6px;">
                <label>PPN (12%)</label>
                <span class="amount">${CONFIG.formatCurrency((subtotal * (11/12)) * 0.12)}</span>
            </div>
            <div class="total-row">
                <label>TOTAL ANGGARAN</label>
                <span class="amount">${CONFIG.formatCurrency(Math.round(subtotal + ((subtotal * (11/12)) * 0.12)))}</span>
            </div>
        </div>
    </div>
    
    <!-- Footer -->
    <div class="footer">
        <div class="sign-box">
            <p>Dibuat oleh:</p>
            <div class="date">........................<br/><span style="font-size: 7px;">Tanggal</span></div>
            <p>........................</p>
        </div>
        <div class="sign-box">
            <p>Disetujui oleh:</p>
            <div class="date">........................<br/><span style="font-size: 7px;">Tanggal</span></div>
            <p>........................</p>
        </div>
        <div class="sign-box">
            <p>Mengetahui:</p>
            <div class="date">........................<br/><span style="font-size: 7px;">Tanggal</span></div>
            <p>........................</p>
        </div>
        <div class="sign-box">
            <p>Mengesahkan:</p>
            <div class="date">........................<br/><span style="font-size: 7px;">Tanggal</span></div>
            <p>........................</p>
        </div>
    </div>
</body>
</html>
    `;
    
    // Open print window
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printHtml);
    printWindow.document.close();
    
    // Tunggu semua aset (termasuk logo) selesai dimuat sebelum print
    printWindow.onload = function() {
        printWindow.print();
    };
}
