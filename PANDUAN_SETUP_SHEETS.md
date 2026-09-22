# Panduan Setup Google Sheets — Skema Database Baru

## Overview Hierarki
```
PRK (prk)
 └── Jenis Program (jenis_program) → SAR / DAL / EFI
      └── Pengadaan (pengadaan) → JTR / JTM
           └── Komponen Pekerjaan (komponen_pekerjaan)
                └── Jenis Material (jenis_material)
```

---

## Langkah Setup

Buka Google Spreadsheet Anda, lalu buat **2 sheet baru** dan **tambah kolom** ke 3 sheet yang sudah ada.
> ⚠️ Nama sheet dan header harus **persis sama** karena Apps Script membaca berdasarkan nama sheet dan nama kolom.

---

### Sheet 1: `prk` *(BUAT BARU)*

| Kolom | Nama Header | Keterangan |
|-------|-------------|------------|
| A | `id` | Primary Key — otomatis diisi sistem |
| B | `no_prk` | Nomor PRK dari pusat, contoh: `PRK-2026-001` |
| C | `prk` | Nama/deskripsi program, contoh: `Program Pemasangan SR 2026` |
| D | `tahun` | Tahun anggaran, contoh: `2026` |
| E | `sifat_prk` | Nilai: `Murni` atau `Lanjutan` |
| F | `pagu_dana` | Pagu dana PRK dalam Rupiah, contoh: `500000000` |

**Header baris 1:** `id`, `no_prk`, `prk`, `tahun`, `sifat_prk`, `pagu_dana`

---

### Sheet 2: `jenis_program` *(BUAT BARU)*

| Kolom | Nama Header | Keterangan |
|-------|-------------|------------|
| A | `id` | Primary Key |
| B | `id_prk` | Foreign Key ke sheet `prk` |
| C | `kode_jenis` | Nilai: `SAR`, `DAL`, atau `EFI` |
| D | `nama_program` | Keterangan tambahan (opsional) |

**Header baris 1:** `id`, `id_prk`, `kode_jenis`, `nama_program`

---

### Sheet 3: `Pengadaan` *(SUDAH ADA — tambah 2 kolom baru di akhir)*

Sheet ini sudah ada. **Jangan ubah kolom yang sudah ada.** Cukup tambahkan 2 kolom baru di kolom paling kanan:

| Kolom baru | Nama Header | Keterangan |
|------------|-------------|------------|
| Tambahkan | `id_jenis` | Diisi otomatis dari hierarki PRK (id jenis_program). Kosong = pengadaan standalone. |
| Tambahkan | `jenis_konstruksi` | Nilai: `JTR` atau `JTM`. Diisi dari hierarki PRK. |

> 💡 Pengadaan standalone (input dari menu Pengadaan biasa) tidak terpengaruh — kolom `id_jenis` akan kosong dan tidak muncul di hierarki PRK.

---

### Sheet 4: `Pekerjaan` *(SUDAH ADA — tambah 2 kolom baru di akhir)*

Sheet ini sudah ada. **Jangan ubah kolom yang sudah ada.** Cukup tambahkan 2 kolom baru di kolom paling kanan:

| Kolom baru | Nama Header | Keterangan |
|------------|-------------|------------|
| Tambahkan | `id_pengadaan_prk` | FK ke `Pengadaan` yang terikat PRK. Kosong = pekerjaan standalone. |
| Tambahkan | `nama_komponen` | Nama komponen pekerjaan (untuk hierarki PRK). Kosong = pekerjaan standalone. |

> 💡 Pekerjaan standalone (input dari menu Master Pekerjaan) tidak terpengaruh — kolom `id_pengadaan_prk` kosong.

---

### Sheet 5: `Material` *(SUDAH ADA — tambah 4 kolom baru di akhir)*

Sheet ini sudah ada. **Jangan ubah kolom yang sudah ada.** Tambahkan 4 kolom baru:

| Kolom baru | Nama Header | Keterangan |
|------------|-------------|------------|
| Tambahkan | `id_komponen` | FK ke `Pekerjaan` (komponen PRK). Kosong = harga standar RAB. |
| Tambahkan | `spesifikasi` | Spesifikasi teknis, contoh: `SNI, XLPE, 20kV` |
| Tambahkan | `volume` | Volume material di komponen **(OPSIONAL)** — kalau kosong berarti belum ditentukan |
| Tambahkan | `harga_jasa` | Harga jasa satuan **(OPSIONAL)** — kalau kosong = 0. Kombinasi dengan `harga_satuan` untuk biaya total |

**Catatan penting:**
- `harga_satuan` (kolom lama) = **harga material** — **(OPSIONAL)**
- `harga_jasa` (kolom baru) = harga jasa per satuan — **(OPSIONAL)**
- `volume` (kolom baru) = **(OPSIONAL)** — kalau kosong berarti belum ditentukan
- Total harga = Volume × (Harga Material + Harga Jasa) — **jika volume kosong, total akan ditampilkan "—"**

> 💡 Material standar RAB (input dari menu Master Material) tidak terpengaruh — kolom `id_komponen` kosong, `harga_jasa` tidak perlu diisi.

---

---

## Ringkasan Sheet

| No | Nama Sheet | Status | Yang perlu dilakukan |
|----|------------|--------|----------------------|
| 1 | `prk` | **Buat baru** | Buat sheet dengan 5 kolom header |
| 2 | `jenis_program` | **Buat baru** | Buat sheet dengan 4 kolom header |
| 3 | `Pengadaan` | Sudah ada | Tambah 2 kolom: `id_jenis`, `jenis_konstruksi` |
| 4 | `Pekerjaan` | Sudah ada | Tambah 2 kolom: `id_pengadaan_prk`, `nama_komponen` |
| 5 | `Material` | Sudah ada | Tambah 4 kolom: `id_komponen`, `spesifikasi`, `volume`, `total_harga` |

---

## Ringkasan Nama Sheet

| No | Nama Sheet | Fungsi |
|----|------------|--------|
| 1 | `prk` | Program Rencana Kerja (induk) |
| 2 | `jenis_program` | Klasifikasi SAR/DAL/EFI |
| 3 | `PengadaanPRK` | Jenis konstruksi JTR/JTM (khusus hierarki PRK) |
| 4 | `komponen_pekerjaan` | Kelompok komponen pekerjaan |
| 5 | `Material` *(sudah ada, tambah kolom)* | Material PRK + harga standar RAB — **satu sheet** |

---

## Sheet yang Sudah Ada (Tidak Perlu Diubah Strukturnya)

Sheet-sheet lama tetap berfungsi. Yang diubah hanya **penambahan kolom baru** di 3 sheet:

| Nama Sheet | Status | Catatan |
|------------|--------|---------|
| `Pengadaan` | Tambah 2 kolom | `id_jenis`, `jenis_konstruksi` |
| `Pekerjaan` | Tambah 2 kolom | `id_pengadaan_prk`, `nama_komponen` |
| `Material` | Tambah 4 kolom | `id_komponen`, `spesifikasi`, `volume`, `total_harga` |
| `Kontrak` | Tidak diubah | — |
| `RAB` | Tidak diubah | — |
| `Realisasi` | Tidak diubah | — |
| `Penyedia` | Tidak diubah | — |
| `Users` | Tidak diubah | — |
| `LogAktivitas` | Tidak diubah | — |

---

## Verifikasi

Setelah membuat semua sheet, buka aplikasi dan:
1. Klik menu **PRK** di sidebar kiri
2. Klik tombol **+ Tambah PRK** dan isi form
3. Klik **Lihat Program** untuk masuk ke hierarki jenis program
4. Tambahkan SAR/DAL/EFI, lalu masuk ke Pengadaan → Komponen → Material

Jika muncul error `Sheet 'prk' tidak ditemukan`, berarti nama sheet belum sesuai. Pastikan nama sheet menggunakan **huruf kecil semua** dan tidak ada spasi.

---

*Dibuat otomatis — RAB & Monitoring PLN v3.0*
