# Panduan Instalasi Lanjayku

Aplikasi terdiri dari dua bagian yang dipasang terpisah:

| Bagian | Berkas | Dipasang di |
|---|---|---|
| **Backend** (database, login, logika bisnis) | `Kode.gs` | Google Apps Script |
| **Frontend** (tampilan aplikasi) | folder `lanjayku/` dari ZIP | GitHub Pages |

Kerjakan **backend dulu**, karena frontend butuh URL backend.

---

## BAGIAN A — Backend (Google Apps Script)

1. Login ke akun Google **khusus pemilik cafe** (data & email slip akan memakai akun ini).
2. Buka **https://script.google.com** → **Proyek baru**. Beri nama proyek, misalnya `Lanjayku Backend`.
3. Hapus isi `Code.gs`, lalu **salin-tempel seluruh isi `Kode.gs`**. Tekan **Ctrl + S**.
4. Atur zona waktu: ikon ⚙️ **Setelan proyek** → **Zona waktu** → pilih **(GMT+08:00) Makassar**.
5. Kembali ke **Editor** (ikon `< >`). Di dropdown fungsi (sebelah tombol ▶ Jalankan), pilih **`setupAppEnvironment`** → klik **▶ Jalankan**.
   - Muncul **"Otorisasi diperlukan"** → *Tinjau izin* → pilih akun → *Lanjutan* → *Buka Lanjayku Backend (tidak aman)* → *Izinkan*. Ini normal untuk skrip buatan sendiri.
   - Buka **Log eksekusi**, pastikan muncul `✅ Setup selesai!` beserta tautan spreadsheet & folder Drive.
   - ⚠️ **Jalankan hanya SEKALI.** Bila dijalankan lagi, skrip menolak agar data tidak dobel.
6. *(Opsional, untuk mencoba)* pilih **`seedDemoData`** → ▶ Jalankan. Membuat 10 bahan, 7 menu + resep, 3 karyawan, promo 10%, dan akun kasir `siti` / `kasir123`. Lewati bila ingin mulai dari data kosong.
7. **Deploy**: tombol biru **Terapkan → Deployment baru** → ikon ⚙️ pilih **Aplikasi web**:
   - Deskripsi: `v1`
   - **Jalankan sebagai: Saya (email Anda)**
   - **Yang memiliki akses: Siapa saja**
   - Klik **Terapkan** → **salin URL aplikasi web** (berakhiran `/exec`).
8. Uji cepat: buka URL `/exec` itu di browser. Harus tampil teks JSON berisi `"success":true` dan `"ready":true`.

> **Kenapa "Siapa saja"?** Karyawan tidak perlu akun Google. Keamanan ditangani aplikasi sendiri: login username + password (di-hash), token sesi, dan setiap aksi dicek hak aksesnya di server.

### Bila nanti Kode.gs diperbarui
Tempel kode baru → simpan → **Terapkan → Kelola deployment → ✏️ Edit → Versi: Versi baru → Terapkan**. Dengan cara ini **URL `/exec` tetap sama**, frontend tidak perlu diubah. Jika ada sheet/kolom baru, jalankan `upgradeSchema()` sekali.

---

## BAGIAN B — Frontend (GitHub Pages)

### B1. Isi URL backend
1. Ekstrak `lanjayku.zip` (klik kanan → *Extract All*). Hasilnya folder **`lanjayku`** yang langsung berisi `index.html`, `css/`, `js/`. Bila Anda melihat folder `lanjayku` lagi di dalamnya, masuk satu tingkat sampai `index.html` terlihat.
2. Buka **`lanjayku/js/config.js`** dengan Notepad, ganti baris:
   ```js
   const GAS_URL = 'https://script.google.com/macros/s/XXXX/exec';
   ```
   dengan URL `/exec` dari langkah A7. Simpan.

### B2. Upload ke GitHub
Folder yang di-`git init` adalah **folder `lanjayku` itu sendiri** — folder yang di dalamnya langsung terlihat `index.html`. Bukan folder induknya.

```
Downloads\
└── lanjayku\            ← git init DI SINI
    ├── index.html
    ├── css\
    └── js\
```

Ringkasnya (panduan langkah demi langkah ada di percakapan):
```bash
git init
git add .
git commit -m "Upload pertama Lanjayku"
git branch -M main
git remote add origin https://github.com/USERNAME/lanjayku.git
git push -u origin main
```
Saat diminta password, tempel **Personal Access Token** (bukan password GitHub). Layar memang tidak menampilkan apa pun saat token ditempel — itu normal.

Lalu di repo GitHub: **Settings → Pages → Deploy from a branch → `main` / `(root)` → Save**, centang **Enforce HTTPS**. Situs aktif di `https://USERNAME.github.io/lanjayku/` dalam 1–2 menit.

> HTTPS wajib: kamera (pemindai QR) dan GPS (batas lokasi absen) hanya jalan di HTTPS.

### B3. Update frontend nanti
```bash
git add .
git commit -m "Keterangan perubahan"
git push
```
Bila tampilan masih versi lama: **Ctrl + Shift + R** atau buka jendela Incognito.

---

## BAGIAN C — Mulai Pakai

1. Buka situs → login **`admin` / `admin123`** → aplikasi **memaksa ganti password**.
2. **Pengaturan**: isi nama cafe, alamat, jam shift, toleransi telat. Opsional: isi lokasi outlet (tombol *Isi dengan lokasi saya*) agar absen hanya bisa di area cafe.
3. **Akun Karyawan → Tambah Karyawan** (isi email untuk kirim slip), lalu **Tambah Akun Pengguna** dan tautkan ke karyawan. Berikan password sementara — karyawan wajib menggantinya saat login pertama.
4. **Stok & HPP → Tambah Bahan Baku** (stok awal + harga per satuan).
5. **Produk & Resep → Tambah Produk** + isi resep per porsi. HPP & margin langsung terhitung.
6. **Produk & Resep → Tambah Promo** bila ada diskon.
7. **Absensi & QR → Layar Kiosk QR** di tablet/laptop outlet. Karyawan memindai dengan kamera HP → login → konfirmasi masuk/pulang.

## Alur harian singkat

| Siapa | Kegiatan |
|---|---|
| Kasir | Kasir → pilih menu → diskon → bayar → **Simpan (F9)**. Stok bahan terpotong otomatis. |
| Admin | Pembelian Bahan saat belanja; Stok Opname saat hitung fisik; catat listrik/sewa di Laporan → *Catat Kas Lain*. |
| Akhir bulan | Penggajian → **Hitung Gaji** → edit bonus/potongan → **Finalisasi** (kasbon terpotong) → **Kirim Semua Slip**. |

## Catatan penting

- **Akun admin**: jaga minimal satu admin aktif. Lupa password admin → di editor Apps Script jalankan `resetAdminPassword()` (password kembali `admin123`, wajib diganti).
- **Kuota email**: Gmail gratis ±100 email/hari — cukup untuk < 10 karyawan.
- **Cadangan**: tiap minggu/bulan, buka spreadsheet database → *File → Buat salinan*.
- **Jangan ubah nama sheet atau urutan kolom** di spreadsheet secara manual.
- **Laporan laba rugi**: biaya bahan diakui saat terjual (HPP), bukan saat dibeli. Pembelian bahan, kasbon, dan gaji tetap muncul sebagai kas keluar di Buku Besar Arus Kas. Gaji masuk laba rugi setelah difinalisasi.
- **QR absensi** berganti tiap 60 detik (bisa diubah di Pengaturan) dan token hanya berlaku ±3 menit, jadi foto QR tidak bisa dipakai belakangan.

## Troubleshooting

| Gejala | Solusi |
|---|---|
| Login: "GAS_URL belum diisi" | Isi `js/config.js` (B1), push ulang. |
| "Tidak dapat terhubung ke server" | Cek URL `/exec` benar & deployment akses **Siapa saja**. |
| "Respons server tidak valid" | Deployment belum "Siapa saja", atau URL yang dipakai berakhiran `/dev`. Pakai `/exec`. |
| "Backend belum di-setup" | Jalankan `setupAppEnvironment()` (A5). |
| Halaman 404 di GitHub Pages | `index.html` tidak di root repo — `git init` dijalankan di folder yang salah. |
| Tampilan polos tanpa warna | Folder `css/`/`js/` tidak ikut — jangan upload lewat tombol *Upload files* di web GitHub. |
| Kamera pemindai tidak terbuka | Pastikan situs dibuka lewat `https://`, izinkan kamera; atau pindai dengan aplikasi kamera bawaan HP. |
