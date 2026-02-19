# **Product Requirements Document (PRD) \- Comprehensive**

## **Web Application Point of Sales (POS) \- "WarungPOS" (Local Standalone)**

| Atribut | Detail |
| :---- | :---- |
| **Versi Dokumen** | 4.2 (Warung Makan Edition \+ Sidebar Navigation) |
| **Status** | Finalized for Development |
| **Platform** | PWA (Progressive Web App) \- Standalone |
| **UI Framework** | **shadcn/ui** \+ Tailwind CSS |
| **Hosting** | **GitHub Pages** |
| **Target Rilis** | Q1 2026 |

## **1\. Pendahuluan**

### **1.1 Latar Belakang**

Warung makan membutuhkan sistem pencatatan yang sangat cepat (sat-set). Pengelola warung sering mengubah harga bahan baku, sehingga fitur pengubahan harga harus instan. Mereka tidak membutuhkan gambar produk yang berat, melainkan daftar menu teks yang mudah dibaca. Selain itu, transparansi pendapatan antara uang tunai dan digital (QRIS) sangat penting untuk rekapitulasi kas.

### **1.2 Tujuan Produk**

1. **Lightweight & Fast:** Tanpa gambar, load time instan di HP kentang sekalipun.  
2. **Easy Menu Config:** Ubah harga atau ketersediaan menu (Habis/Ada) dalam sekali klik.  
3. **Order Customization:** Mendukung catatan khusus per item (contoh: "Pedas", "Bungkus").  
4. **Detailed Insight:** Laporan keuangan yang memisahkan pendapatan tunai dan non-tunai secara otomatis.

### **1.3 Ruang Lingkup (Scope)**

* **Frontend Only:** React \+ Vite \+ shadcn/ui.  
* **Database:** IndexedDB (via Dexie.js).  
* **Hosting:** Static hosting di GitHub Pages.  
* **Fitur Utama:** Kasir (Tunai/QRIS), Manajemen Menu Teks, Laporan Harian & Bulanan Detail, Backup/Restore JSON.

## **2\. Arsitektur Sistem & Tech Stack**

### **2.1 Tech Stack**

* **Core:** React.js (Vite).  
* **UI Library:** **shadcn/ui** (Button, Card, Dialog, Table, Form, Input, Select, Tabs).  
* **Styling:** Tailwind CSS.  
* **Icons:** Lucide React (untuk ikon kategori: Makanan, Minuman, Snack, QRIS, Cash).  
* **Local DB:** **Dexie.js**.  
* **Router:** React Router DOM (menggunakan HashRouter agar kompatibel dengan GitHub Pages).  
* **Hosting:** GitHub Pages (Deployment via GitHub Actions).  
* **Charting:** **Recharts** (untuk visualisasi grafik laporan sederhana).

### **2.2 Topologi Data (Local-First)**

* **Storage:** 100% Client-side (Browser).  
* **Tanpa Server:** Tidak ada backend API.

## **3\. Desain Database (IndexedDB Schema)**

Skema disederhanakan tanpa kolom gambar.

**1\. Store: Settings**

* key (PK): 'store\_name', 'footer\_struk'.

**2\. Store: Products (Menu)**

* id (Auto Increment / UUID)  
* name (String)  
* price (Number)  
* category (String) \- Contoh: "Makanan Berat", "Minuman", "Gorengan".  
* is\_available (Boolean) \- *Penting untuk menandai menu yang habis hari ini.*  
* sort\_order (Number) \- Untuk mengatur urutan menu terlaris di atas.

**3\. Store: Transactions**

* id (UUID)  
* invoice\_number (String) \- Format: W-YYYYMMDD-001  
* timestamp (Date)  
* total\_amount (Number)  
* payment\_method (String) \- **Values: 'TUNAI' | 'QRIS'**  
* cash\_received (Number) \- *Jumlah uang diterima (hanya untuk Tunai)*  
* change\_amount (Number) \- *Kembalian (hanya untuk Tunai)*  
* items (Array of Objects):  
  * product\_name  
  * price  
  * qty  
  * note (String) \- *Contoh: "Jangan pedas"*

## **4\. Fitur Fungsional & User Flow**

### **4.1 Manajemen Menu (Admin Mode)**

* **Tampilan:** Menggunakan komponen Table dari shadcn/ui.  
* **Fitur:**  
  * **Quick Toggle:** Switch "Tersedia/Habis" langsung di tabel tanpa masuk form edit.  
  * **Quick Price Edit:** Klik harga di tabel \-\> muncul Input kecil \-\> Enter untuk simpan.  
  * **Tambah Menu:** Dialog modal sederhana (Nama, Kategori, Harga).

### **4.2 Modul Kasir (Operasional Warung)**

* **Layout:**  
  * Kiri: Daftar Menu (Teks/Card kecil) dikelompokkan per Kategori (Tabs).  
  * Kanan: Struk/Bill sementara.  
* **Alur Pesanan:**  
  1. Klik nama menu (misal: "Nasi Goreng").  
  2. (Opsional) Muncul pop-up kecil untuk **Catatan/Varian**: "Pedas?", "Telur Dadar/Ceplok?".  
  3. Item masuk bill.  
* **Pembayaran (Checkout):**  
  1. Klik tombol "Bayar".  
  2. Muncul Modal Pilihan Pembayaran: **\[ TUNAI \]** atau **\[ QRIS \]**.  
  3. **Jika TUNAI:**  
     * User input nominal uang (ada preset button: 10rb, 20rb, 50rb, Uang Pas).  
     * Sistem menghitung kembalian.  
  4. **Jika QRIS:**  
     * Sistem langsung mencatat sebagai lunas (manual verifikasi visual oleh kasir).  
  5. Simpan Transaksi & Cetak/Lihat Struk.

### **4.3 Modul Laporan Detail (Enhanced Reporting)**

Fitur laporan harus memberikan insight mendalam untuk pemilik warung.

* **Filter:** Hari Ini, Kemarin, 7 Hari Terakhir, Bulan Ini, Custom Range.  
* **Metrik Utama (Cards):**  
  * **Total Omzet:** Gross Revenue.  
  * **Total Transaksi:** Jumlah struk keluar.  
  * **Rata-rata Bill:** Average Order Value (AOV).  
* **Rincian Pembayaran (PENTING):**  
  * **Total Tunai:** Uang fisik yang harus ada di laci kasir.  
  * **Total QRIS:** Uang yang masuk ke rekening/e-wallet.  
* **Analisa Menu:**  
  * **Top 5 Menu Terlaris:** Berdasarkan kuantitas terjual.  
  * **Top 5 Menu Revenue:** Berdasarkan sumbangan pendapatan terbesar.  
* **Grafik:**  
  * Grafik Batang (Bar Chart) penjualan per jam (untuk mengetahui jam sibuk/makan siang).

### **4.4 Sidebar Navigation**

* **Persistent Sidebar:** Sidebar navigasi yang selalu terlihat di desktop, collapsible di mobile.
* **Menu Items:**
  * **Dashboard** (Home icon) - Halaman utama dengan quick access cards
  * **Kasir** (ShoppingBag icon) - Halaman transaksi kasir
  * **Manajemen Menu** (Utensils icon) - Kelola daftar menu
  * **Laporan** (Receipt icon) - Lihat laporan penjualan
  * **Pengaturan** (Settings icon) - Konfigurasi aplikasi
* **Responsive Behavior:**
  * **Desktop:** Sidebar fixed di kiri dengan lebar ~250px, konten di kanan
  * **Mobile:** Sidebar tersembunyi, akses via hamburger menu (Sheet/Drawer)
* **Active State:** Menu aktif ditandai dengan background color berbeda dan icon yang lebih menonjol
* **Store Branding:** Nama toko ditampilkan di bagian atas sidebar

### **4.5 Backup & Restore**

* **Export:** Download file backup\_warung.json.
* **Import:** Restore data menu dan riwayat penjualan jika ganti HP/Laptop.

## **5\. Deployment ke GitHub Pages**

Karena GitHub Pages bersifat statis dan aplikasi ini menggunakan Client-side routing:

1. **Base URL:** Set base: "/nama-repo/" di vite.config.js.  
2. **Routing:** Gunakan HashRouter dari React Router (bukan BrowserRouter) untuk menghindari error 404 saat refresh halaman di sub-path.  
3. **Workflow:** Setup GitHub Actions untuk build & deploy otomatis saat push ke branch main.

## **6\. Komponen UI (shadcn/ui Specs)**

Penggunaan komponen spesifik untuk mempercepat development:

* **Card:** Untuk container area kasir dan summary laporan.
* **Table:** Untuk daftar menu dan riwayat transaksi.
* **Badge:** Untuk status menu (Hijau: Ada, Merah: Habis) dan status pembayaran.
* **Dialog (Modal):** Untuk form tambah menu dan konfirmasi bayar (Input Tunai/QRIS).
* **Tabs:** Untuk navigasi kategori (Makanan | Minuman | Tambahan) dan Filter Laporan (Harian | Bulanan).
* **Input & Button:** Elemen form standar.
* **ToggleGroup:** Untuk memilih metode pembayaran (Tunai/QRIS).
* **Toast:** Notifikasi "Transaksi Berhasil" atau "Data Disimpan".
* **Sidebar:** Navigasi utama aplikasi (persistent di desktop, collapsible di mobile).
* **Sheet:** Drawer untuk mobile navigation dan cart di layar kecil.

## **7\. Roadmap Pengembangan**

### **Fase 1: Setup & Menu (Minggu 1\)**

* Init Project Vite \+ Tailwind \+ shadcn/ui.  
* Setup Dexie.js (Schema Updated).  
* Halaman "Manajemen Menu" (CRUD, Toggle Stock).

### **Fase 2: Kasir & Transaksi (Minggu 2\)**

* Halaman Kasir dengan filtering kategori.  
* Logic Cart & input catatan (notes).  
* **Implementasi Modal Pembayaran (Tunai vs QRIS).**  
* Logic Checkout & Kalkulasi Kembalian.

### **Fase 3: Laporan & Deploy (Minggu 3\)**

* **Dashboard Laporan Detail (Omzet, Cash vs QRIS, Top Items).**  
* Fitur Export/Import JSON.  
* Konfigurasi GitHub Actions & Deploy ke GitHub Pages.

## **8\. Risiko & Mitigasi**

| Risiko | Mitigasi |
| :---- | :---- |
| **Browser Cache Terhapus** | Beri tombol besar "BACKUP DATA" di halaman depan agar user ingat. |
| **Selisih Kas** | Laporan memisahkan "Tunai" dan "QRIS" secara tegas agar kasir mudah mencocokkan uang di laci. |
| **Refresh di GitHub Pages** | Gunakan HashRouter agar tidak error 404\. |
| **Layar Sempit (HP)** | Gunakan *Drawer* (shadcn Sheet) untuk keranjang belanja di tampilan mobile. |

