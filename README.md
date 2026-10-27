# Lanjayku — Cafe OS

Aplikasi manajemen cafe: kasir, pembelian & stok bahan baku, HPP per menu, laporan keuangan (PDF/Excel), absensi QR, penggajian & slip gaji, serta kasbon karyawan.

- **Frontend:** HTML/CSS/JS vanilla, di-hosting di GitHub Pages (folder ini).
- **Backend:** Google Apps Script sebagai REST API JSON + Google Sheets sebagai database.
- **Zona waktu:** Asia/Makassar (WITA).

## Struktur

```
index.html            Kerangka aplikasi (SPA)
css/style.css         Design system "Retro OS"
js/config.js          ⚠️ URL backend (GAS_URL) — wajib diisi
js/api.js             Pemanggil API (fetch, text/plain)
js/ui.js              Helper tampilan, format Rupiah & WITA
js/app.js             Login, sesi, router, menu per peran
js/pages-*.js         Halaman: dashboard, kasir, inventori, laporan, absensi, gaji, admin
```

Backend (`Kode.gs`) **tidak** disimpan di repository ini. Lihat `PANDUAN-INSTALASI.md`.
