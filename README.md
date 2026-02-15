# Pertamax Tracker ⛽

Web App sederhana untuk mencatat dan memantau penggunaan BBM kendaraan, khusus dirancang untuk pengguna Pertamax/BBM lainnya di Indonesia. Aplikasi ini dibuat dengan **Next.js 16** dan **Firebase**, dengan tampilan modern yang responsif.

## ✨ Fitur Utama

-   **Multi-Kendaraan**: Kelola pencatatan untuk lebih dari satu kendaraan (Mobil/Motor).
-   **Dashboard Statistik**: Lihat pengeluaran bulanan, efisiensi rata-rata (KM/L), dan estimasi jarak tempuh.
-   **Scan Struk Otomatis (OCR Offline)**:
    -   Scan foto struk SPBU langsung dari HP.
    -   Menggunakan **AI Lokal (Tesseract.js)** di browser, tanpa perlu upload ke server (Privasi aman & Hemat kuota).
    -   Otomatis mendeteksi Tanggal, Liter, Harga/Liter, dan Total Harga.
-   **Riwayat Pengisian**: Log lengkap riwayat pengisian BBM.
-   **Grafik Tren**: Visualisasi tren harga BBM.
-   **PWA Ready**: Bisa diinstall di HP sebagai Web App (Progressive Web App).

## 🛠️ Teknologi

-   **Framework**: [Next.js 16 (App Router)](https://nextjs.org/)
-   **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
-   **Database & Auth**: [Firebase (Firestore & Authentication)](https://firebase.google.com/)
-   **OCR Engine**: [Tesseract.js](https://tesseract.projectnaptha.com/) (Wasm-based)
-   **Icons**: [Lucide React](https://lucide.dev/)
-   **Charts**: [Recharts](https://recharts.org/)

## 🚀 Cara Menjalankan (Local Development)

Ikuti langkah ini untuk menjalankan project di komputer Anda:

### 1. Prasyarat
-   Node.js (versi 18 atau terbaru)
-   Akun Firebase

### 2. Clone Repository
```bash
git clone https://github.com/bensu89/PertamaxTracker.git
cd pertamax-tracker
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Konfigurasi Firebase
1.  Buat project baru di [Firebase Console](https://console.firebase.google.com/).
2.  Aktifkan **Authentication** (Email/Password & Google).
3.  Aktifkan **Firestore Database**.
4.  Buat file `.env.local` di root project Anda, dan isi dengan config Firebase Anda:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 5. Jalankan Aplikasi
```bash
npm run dev
```
Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

## 📱 Fitur OCR (Scan Struk)
Fitur OCR berjalan sepenuhnya di sisi klien (browser).
-   **Model Bahasa**: Menggunakan model Bahasa Indonesia (`ind.traineddata.gz`).
-   Cara kerja:
    1.  Ambil foto struk lewat kamera HP.
    2.  `Tesseract.js` memproses gambar menjadi teks.
    3.  Regex parser (`lib/utils/receiptParser.ts`) mengekstrak data penting.
    4.  Form otomatis terisi.

## 📂 Struktur Project
-   `app/`: Pages & Layouts (Next.js App Router)
-   `components/`: UI Components reusable
-   `lib/`:
    -   `services/`: Firebase logic (Auth, Firestore)
    -   `utils/`: Helper functions, Formatters, & Parsers
    -   `hooks/`: Custom React Hooks
-   `public/`: Static assets

## 🤝 Kontribusi
Silakan *fork* repository ini dan buat *Pull Request* jika Anda ingin berkontribusi atau memperbaiki bug.

## 📄 Lisensi
MIT License
