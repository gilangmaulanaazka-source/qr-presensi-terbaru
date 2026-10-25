# FEB Days 2026 — Fusion: Bridging Ideas Building Unity

**Aplikasi presensi QR mobile-first FEB UNSIQ** — tanpa Google Apps Script, Google Sheets, atau server database.

## Update tanggal kegiatan (versi ini)

- **FEB Days 2026 — 23–29 November 2026**
- Judul tetap: **Fusion: Bridging Ideas Building Unity**.
- Cache PWA ditingkatkan menjadi `febdays2026-fusion-v2` agar pengunjung menerima konfigurasi terbaru.
- ID acara `FEB-DAYS-2026` **tidak berubah**, sehingga QR dan data yang telah dibuat untuk acara yang sama tetap konsisten.
- Untuk memperbarui repository GitHub, ekstrak ZIP dan unggah isi folder ke **root repository** dengan path yang sama (atau perbarui tiga file: `config.js`, `index.html`, dan `sw.js`). Kemudian commit pada branch Pages, tunggu deployment berhasil, dan refresh aplikasi di HP.

## Pembaruan dari versi sebelumnya

- Nama acara: **FEB Days 2026**.
- Judul/tema kegiatan: **Fusion: Bridging Ideas Building Unity**. Terlihat di halaman pendaftaran dan kartu peserta.
- Daftar prodi: **Manajemen, Akuntansi, Perbankan Syari'ah, Bisnis Digital**.
- Warna dan logo FEB UNSIQ tetap menggunakan versi terakhir (abu-abu/hitam; aksen merah/ungu).
- ID acara baru: `FEB-DAYS-2026`. Kartu QR versi Manajemen Fest tidak bisa dipindai sebagai FEB Days.
- Data lokal dan backup memakai identitas acara baru agar tidak tercampur dengan acara sebelumnya.

## Cara kerja

1. Mahasiswa membuka halaman **Buat QR**, mengisi nama, NIM, program studi, semester.
2. Browser membuat QR yang memuat data peserta untuk acara FEB Days 2026.
3. Panitia membuka menu **Scanner**, memasukkan PIN, dan memindai QR mahasiswa.
4. Data hadir disimpan ke **IndexedDB browser di HP panitia**.
5. Di menu **Rekap**, panitia mengekspor **Excel (.xlsx)** atau **CSV (.csv)**.
6. Jika beberapa HP dipakai, gunakan **Backup JSON** dan **Gabungkan backup** pada satu perangkat utama.

## Cara mengunggah ke GitHub Pages (mengganti versi lama)

1. **Ekstrak ZIP** aplikasi ini di Mac (klik dua kali berkas ZIP melalui Finder).
2. Masuk ke repository GitHub tempat versi lama diunggah.
3. **Sebelum mengganti file**, jika data presensi lama masih diperlukan, ekspor backup dan Excel dahulu dari browser/perangkat lama.
4. Pada tab **Code**, pilih **Add file → Upload files** (lokasi menu bisa berubah mengikuti UI GitHub).
5. Seret **semua isi folder**, terutama `index.html`, `styles.css`, `app.js`, `config.js`, `sw.js`, `manifest.webmanifest`, `README.md`, serta folder `assets` berisi `icon.svg` dan `logo-feb.png`.
6. Jika GitHub meminta penggantian file yang sudah ada, pertahankan path yang sama dan commit perubahan ke branch `main`.
7. Jika Pages belum aktif: buka **Settings → Pages → Build and deployment**, atur **Deploy from a branch → main → / (root)**, lalu simpan.
8. Buka tautan GitHub Pages repository; lakukan reload setelah deploy selesai. Di iPhone/Android jika tampilan lama tersimpan, tutup tab dan buka kembali, atau refresh ulang setelah jaringan aktif.

### Membuat repository baru (opsional)

Jika belum memiliki repository, buat repository baru, lalu unggah seluruh isi folder seperti di atas. Pastikan **`index.html` berada di root repository**, bukan satu tingkat di bawah folder bernama `feb-days-2026-presensi`.

## Sebelum digunakan untuk acara

- Tanggal acara sudah ditetapkan menjadi **23–29 November 2026** melalui `config.js` dan kartu peserta. PIN awal panitia tetap `2468`, dapat diubah pada `config.js`.
- Jangan gunakan mode Private/Incognito saat menjadi scanner.
- Uji buat QR, scan, duplikasi NIM, dan ekspor.
- Backup rutin setiap 50–100 presensi serta ekspor setelah sesi selesai.
- Jangan membersihkan data situs/browser perangkat scanner sebelum ekspor.

**Penting:** Karena tanpa server, data tidak otomatis sinkron lintas HP. QR berisi identitas mahasiswa dan dapat dibuat ulang; token sederhana bukan validasi identitas resmi. Gunakan untuk presensi internal dan lakukan verifikasi peserta seperlunya.

## Struktur folder

```text
feb-days-2026-presensi/
├── index.html
├── styles.css
├── app.js
├── config.js
├── sw.js
├── manifest.webmanifest
├── README.md
└── assets/
    ├── icon.svg
    └── logo-feb.png
```
