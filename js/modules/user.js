// ==========================================
// js/modules/user.js
// Modul Manajemen Pengguna
// ==========================================

window.renderUser = async function renderUser() {
    const contentArea = document.getElementById('app-content');
    contentArea.innerHTML = '<div class="flex justify-center py-24"><div class="loader"></div></div>';

    const users = await getUsers();
    const roleColors = {
        'Administrator':     'bg-purple-100 text-purple-700',
        'Perencanaan':       'bg-blue-100 text-blue-700',
        'Pengawas Lapangan': 'bg-amber-100 text-amber-700',
        'Viewer':            'bg-slate-100 text-slate-600'
    };

    let userRows = '';
    users.forEach((u, i) => {
        const rClass    = roleColors[u.role] || 'bg-slate-100 text-slate-600';
        const sClass    = u.status === 'Aktif' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600';
        const isCurrent = state.currentUser && state.currentUser.id === u.id;
        userRows += `
            <tr class="hover:bg-slate-50 transition-colors ${isCurrent ? 'bg-blue-50/30' : ''}">
                <td class="p-3 text-center text-slate-500">${i + 1}</td>
                <td class="p-3">
                    <div class="flex items-center gap-2.5">
                        <div class="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-white font-bold text-sm shrink-0">${u.nama.charAt(0)}</div>
                        <div>
                            <p class="font-semibold text-slate-800 text-sm">${u.nama} ${isCurrent ? '<span class="text-[10px] text-brand">(Anda)</span>' : ''}</p>
                            <p class="text-xs text-slate-400">${u.email || '-'}</p>
                        </div>
                    </div>
                </td>
                <td class="p-3 text-sm text-slate-600 font-mono">${u.username}</td>
                <td class="p-3"><span class="px-2.5 py-1 rounded-md text-xs font-semibold ${rClass}">${u.role}</span></td>
                <td class="p-3 text-center"><span class="px-2.5 py-1 rounded-md text-xs font-semibold ${sClass}">${u.status}</span></td>
                <td class="p-3 text-center">
                    <div class="flex justify-center gap-2">
                        <button onclick="editUser('${u.id}')" class="text-blue-500 hover:text-blue-700 p-1"><i data-lucide="edit" class="w-4 h-4"></i></button>
                        ${!isCurrent ? `<button onclick="deleteUser('${u.id}')" class="text-red-400 hover:text-red-600 p-1"><i data-lucide="trash-2" class="w-4 h-4"></i></button>` : ''}
                    </div>
                </td>
            </tr>`;
    });

    contentArea.innerHTML = `
        <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-100 mb-6">
            <div class="flex justify-between items-center mb-6">
                <div>
                    <h2 class="text-lg font-semibold text-slate-800">Manajemen Pengguna</h2>
                    <p class="text-sm text-slate-500">Kelola akses dan peran pengguna aplikasi.</p>
                </div>
                <button onclick="showModalUser()" class="bg-brand text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-sky-700 transition flex items-center gap-2 shadow-sm">
                    <i data-lucide="user-plus" class="w-4 h-4"></i> Tambah Pengguna
                </button>
            </div>
            <div class="overflow-x-auto rounded-lg border border-slate-200">
                <table class="w-full text-left border-collapse text-sm">
                    <thead class="bg-slate-100">
                        <tr>
                            <th class="p-3 w-12 text-center text-slate-600 font-semibold">No</th>
                            <th class="p-3 text-slate-600 font-semibold">Nama Pengguna</th>
                            <th class="p-3 text-slate-600 font-semibold">Username</th>
                            <th class="p-3 text-slate-600 font-semibold">Peran (Role)</th>
                            <th class="p-3 text-center text-slate-600 font-semibold">Status</th>
                            <th class="p-3 text-center text-slate-600 font-semibold">Aksi</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">${userRows}</tbody>
                </table>
            </div>
        </div>

        <div id="modal-user" class="fixed inset-0 bg-slate-900/50 z-50 hidden flex items-center justify-center backdrop-blur-sm transition-opacity opacity-0">
            <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 transform transition-all scale-95">
                <div class="flex justify-between items-center mb-5 border-b border-slate-100 pb-4">
                    <h3 id="modal-user-title" class="text-lg font-bold text-slate-800">Tambah Pengguna Baru</h3>
                    <button type="button" onclick="closeModalUser()" class="text-slate-400 hover:text-slate-700"><i data-lucide="x" class="w-5 h-5"></i></button>
                </div>
                <form onsubmit="saveUserForm(event)">
                    <input type="hidden" id="user-edit-id" value="">
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap *</label>
                            <input type="text" id="user-nama" required placeholder="Contoh: Budi Santoso" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-brand outline-none">
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-slate-700 mb-1">Username *</label>
                                <input type="text" id="user-username" required placeholder="budi.santoso" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-brand outline-none">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-slate-700 mb-1">Password *</label>
                                <input type="text" id="user-password" placeholder="Kosongkan jika tidak diubah" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-brand outline-none">
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">Email</label>
                            <input type="email" id="user-email" placeholder="budi@pln.co.id" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-brand outline-none">
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-slate-700 mb-1">Peran (Role)</label>
                                <select id="user-role" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-brand outline-none bg-white">
                                    <option value="Administrator">Administrator</option>
                                    <option value="Perencanaan">Perencanaan</option>
                                    <option value="Pengawas Lapangan">Pengawas Lapangan</option>
                                    <option value="Viewer">Viewer</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-slate-700 mb-1">Status</label>
                                <select id="user-status" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-brand outline-none bg-white">
                                    <option value="Aktif">Aktif</option>
                                    <option value="Nonaktif">Nonaktif</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div class="mt-6 flex justify-end gap-3">
                        <button type="button" onclick="closeModalUser()" class="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50">Batal</button>
                        <button type="submit" id="btn-save-user" class="px-6 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-sky-700">Simpan Pengguna</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    lucide.createIcons();
}

function showModalUser(isEdit = false) {
    if (!isEdit) {
        document.getElementById('user-edit-id').value  = '';
        document.getElementById('user-nama').value     = '';
        document.getElementById('user-username').value = '';
        document.getElementById('user-password').value = '';
        document.getElementById('user-email').value    = '';
        document.getElementById('user-role').value     = 'Perencanaan';
        document.getElementById('user-status').value   = 'Aktif';
        document.getElementById('modal-user-title').innerText  = 'Tambah Pengguna Baru';
        document.getElementById('btn-save-user').innerText     = 'Simpan Pengguna';
        const pwInput = document.getElementById('user-password');
        pwInput.required = true; pwInput.placeholder = 'Password wajib diisi';
    }
    const modal = document.getElementById('modal-user');
    if (!modal) return;
    modal.classList.remove('hidden');
    setTimeout(() => { modal.classList.remove('opacity-0'); modal.querySelector('div').classList.remove('scale-95'); }, 10);
}

function closeModalUser() {
    const modal = document.getElementById('modal-user');
    if (!modal) return;
    modal.classList.add('opacity-0'); modal.querySelector('div').classList.add('scale-95');
    setTimeout(() => modal.classList.add('hidden'), 300);
}

async function editUser(id) {
    const users = await getUsers();
    const user  = users.find(u => u.id === id);
    if (!user) return;

    document.getElementById('user-edit-id').value   = user.id;
    document.getElementById('user-nama').value      = user.nama;
    document.getElementById('user-username').value  = user.username;
    document.getElementById('user-password').value  = '';
    document.getElementById('user-password').required    = false;
    document.getElementById('user-password').placeholder = 'Kosongkan jika tidak diubah';
    document.getElementById('user-email').value     = user.email || '';
    document.getElementById('user-role').value      = user.role;
    document.getElementById('user-status').value    = user.status;
    document.getElementById('modal-user-title').innerText = 'Edit Pengguna';
    document.getElementById('btn-save-user').innerText    = 'Update Pengguna';
    showModalUser(true);
}

function saveUserForm(event) {
    event.preventDefault();
    const btn = document.getElementById('btn-save-user');
    if (btn) { btn.disabled = true; btn.innerHTML = 'Menyimpan...'; }

    const editId   = document.getElementById('user-edit-id').value;
    const username = document.getElementById('user-username').value.trim();
    const password = document.getElementById('user-password').value.trim();

    if (!editId && !password) {
        if (btn) { btn.disabled = false; btn.innerHTML = 'Simpan Pengguna'; }
        return showToast('Password wajib diisi untuk pengguna baru', 'error');
    }

    getUsers().then(async users => {
        const duplicate = users.find(u => u.username === username && u.id !== editId);
        if (duplicate) {
            if (btn) { btn.disabled = false; btn.innerHTML = editId ? 'Update Pengguna' : 'Simpan Pengguna'; }
            return showToast('Username sudah digunakan pengguna lain.', 'error');
        }

        const userData = {
            nama:     document.getElementById('user-nama').value,
            username: username,
            email:    document.getElementById('user-email').value,
            role:     document.getElementById('user-role').value,
            status:   document.getElementById('user-status').value,
            password: ''
        };

        if (editId) {
            userData.id = editId;
            const oldUser  = users.find(u => u.id === editId);
            userData.password = password ? password : (oldUser ? oldUser.password : 'default123');
            const result = await saveUser(userData, true);
            if (result) {
                if (state.currentUser && state.currentUser.id === editId) {
                    state.currentUser = { ...userData };
                    localStorage.setItem('pln_session', JSON.stringify(state.currentUser));
                    sessionStorage.setItem('pln_session', JSON.stringify(state.currentUser));
                    updateUserUI();
                }
                showToast('Data pengguna berhasil diperbarui');
                closeModalUser();
                renderUser();
            } else {
                showToast('Gagal menyimpan ke Google Sheets', 'error');
            }
        } else {
            userData.password = password;
            const result = await saveUser(userData, false);
            if (result) {
                showToast('Pengguna baru berhasil ditambahkan');
                closeModalUser();
                renderUser();
            } else {
                showToast('Gagal menyimpan ke Google Sheets', 'error');
            }
        }
        if (btn) { btn.disabled = false; btn.innerHTML = editId ? 'Update Pengguna' : 'Simpan Pengguna'; }
    }).catch(err => {
        console.error('Save user error:', err);
        showToast('Error saat menyimpan user', 'error');
        if (btn) { btn.disabled = false; btn.innerHTML = editId ? 'Update Pengguna' : 'Simpan Pengguna'; }
    });
}

async function deleteUser(id) {
    if (!confirm('Hapus pengguna ini dari sistem?')) return;
    const result = await deleteUserFromSheets(id);
    if (result) {
        renderUser();
        showToast('Pengguna berhasil dihapus');
    } else {
        showToast('Gagal menghapus user dari Google Sheets', 'error');
    }
}

