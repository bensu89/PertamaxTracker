export interface ReceiptData {
    date?: Date;
    fuelType?: string;
    volume?: number;      // Liter
    pricePerLiter?: number;
    totalPrice?: number;
    spbu?: string;
}

export const parsePertaminaReceipt = (text: string): ReceiptData => {
    // 1. Normalisasi Teks (Ubah ke uppercase, ganti karakter yang sering salah baca)
    const cleanText = text.toUpperCase()
        .replace(/O/g, '0') // Huruf O jadi angka 0
        // .replace(/I/g, '1') // Huruf I jadi angka 1 (Sometimes I is part of text, be careful)
        .replace(/B/g, '8'); // Huruf B jadi angka 8

    // Variable penampung hasil
    let result: ReceiptData = {
        date: undefined,
        fuelType: undefined,
        volume: undefined,      // Liter
        pricePerLiter: undefined,
        totalPrice: undefined,
        spbu: undefined,
    };

    const lines = cleanText.split('\n');

    // --- LOGIKA REGEX & PARSING ---

    // 2. Deteksi Jenis BBM
    if (cleanText.includes('PERTAMAX TURBO')) result.fuelType = 'Pertamax Turbo';
    else if (cleanText.includes('PERTAMAX')) result.fuelType = 'Pertamax';
    else if (cleanText.includes('PERTALITE')) result.fuelType = 'Pertalite';
    else if (cleanText.includes('DEXLITE')) result.fuelType = 'Dexlite';
    else if (cleanText.includes('SOLAR') || cleanText.includes('BIOSOLAR')) result.fuelType = 'Solar';

    // 3. Deteksi Tanggal (Format umum: DD/MM/YYYY atau DD-MM-YYYY)
    const dateMatch = cleanText.match(/(\d{2}[-/]\d{2}[-/]\d{4})/);
    if (dateMatch) {
        const dateString = dateMatch[1].replace(/-/g, '/'); // Standarisasi ke /
        // Convert to Date object
        // Note: DD/MM/YYYY format
        const parts = dateString.split('/');
        if (parts.length === 3) {
            result.date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        }
    }

    // 4. Deteksi Angka-angka Penting
    // Kita loop setiap baris karena posisi baris bisa bergeser
    lines.forEach((line) => {
        // Bersihkan baris dari karakter non-angka kecuali titik/koma
        // We keep , and . for decimals/thousands separator
        const numberOnly = line.replace(/[^0-9.,]/g, '');

        // A. Cari Volume (Liter)
        // Biasanya ada kata "LITER", "L", atau "VOL"
        if (line.includes('LITER') || line.includes(' L ') || line.includes('VOL') || line.includes('(L)')) {
            // Regex mencari angka desimal (contoh: 15,55 atau 15.55)
            // Matches numbers like 12.34 or 12,34
            const volMatch = line.match(/(\d+[.,]\d+)/);
            if (volMatch) {
                result.volume = parseFloat(volMatch[1].replace(',', '.'));
            }
        }

        // B. Cari Total Harga
        // Biasanya diawali "TOTAL", "RP", atau "RUPIAH"
        if (line.includes('TOTAL') || line.includes('RUPIAH') || line.includes('BAYAR') || line.includes('RP')) {
            // Look for a number sequence that might be a price (e.g., 50.000 or 50,000)
            // This regex tries to match money format loosely
            const totalMatch = line.match(/(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)/);
            if (totalMatch) {
                // Hapus titik ribuan, ganti koma desimal jadi titik for standard parsing
                // Logic Assumption: If it has multiple dots, they are thousands separators. 
                // If it has comma, it might be decimal or thousands depending on locale.
                // In Indonesia, dot is thousands, comma is decimal.

                let rawValue = totalMatch[1];
                // Remove dots as thousands separators
                let cleanTotal = rawValue.replace(/\./g, '');
                // Replace comma with dot for decimal
                cleanTotal = cleanTotal.replace(',', '.');

                const parsed = parseFloat(cleanTotal);
                // Basic sanity check: Total price usually > 1000
                if (parsed > 500) {
                    result.totalPrice = parsed;
                }
            }
        }

        // C. Cari Harga Per Liter
        // Biasanya ada "@" atau "/L" atau angka standar harga (misal range 10rb - 20rb)
        const rawNumber = parseFloat(numberOnly.replace(/\./g, '').replace(',', '.'));
        if (
            (line.includes('@') || line.includes('/L') || line.includes('HARGA')) &&
            rawNumber > 5000 && rawNumber < 25000 // Range harga BBM wajar
        ) {
            // Logika sederhana: ambil angka yang masuk akal sebagai harga per liter
            result.pricePerLiter = rawNumber;
        } else if (rawNumber > 9000 && rawNumber < 25000 && !result.pricePerLiter) {
            // Fallback if no symbols found but number is in range
            result.pricePerLiter = rawNumber;
        }

        // D. Cari Nomor SPBU (Biasanya di header, format 31.XXXX atau 34.XXXX)
        // Regex for Pertamina SPBU code (2 digits . 5 digits usually, or similar)
        const spbuMatch = line.match(/(3[14]\.\d{4,5})/);
        if (spbuMatch) result.spbu = spbuMatch[1];
    });

    return result;
};
