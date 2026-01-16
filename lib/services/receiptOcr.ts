'use client';

import Tesseract from 'tesseract.js';

// Types for extracted receipt data
export interface ExtractedReceiptData {
    liters?: number;
    pricePerLiter?: number;
    totalPrice?: number;
    fuelType?: 'pertamax' | 'pertamax-turbo' | 'pertalite' | 'solar' | 'dexlite';
    date?: Date;
    stationName?: string;
    confidence: number;
    rawText?: string;
}

/**
 * Convert image file to base64 data URL
 */
export async function imageToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            resolve(reader.result as string);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Extract number from text (handles Indonesian format like 6.667 or 6,667)
 */
function extractNumber(text: string): number | undefined {
    // Remove non-numeric characters except dots, commas
    const cleaned = text.replace(/[^\d.,]/g, '');
    if (!cleaned) return undefined;

    // For fuel liters, Indonesian format uses comma as decimal separator
    // Example: 6,667 L means 6.667 liters
    // If there's a comma, treat it as decimal separator
    let normalized = cleaned;
    if (cleaned.includes(',')) {
        // Replace comma with dot for decimal
        normalized = cleaned.replace(/\./g, '').replace(',', '.');
    }
    // If only dots and no comma, it's likely a whole number with thousand separator
    // Example: 6.667 could mean 6667 or 6.667 depending on context
    // For small numbers (< 100), keep the dot as decimal
    else if (cleaned.includes('.')) {
        const parts = cleaned.split('.');
        if (parts[0] && parseInt(parts[0]) < 100) {
            // Small number, keep dot as decimal
            normalized = cleaned;
        } else {
            // Large number, remove dots (thousand separator)
            normalized = cleaned.replace(/\./g, '');
        }
    }

    const num = parseFloat(normalized);
    return isNaN(num) ? undefined : num;
}

/**
 * Extract rupiah amount from text
 */
function extractRupiah(text: string): number | undefined {
    // Remove Rp, dots, spaces - keep only digits
    const cleaned = text.replace(/[Rp.\s]/gi, '').replace(/,/g, '');
    const num = parseInt(cleaned);
    return isNaN(num) ? undefined : num;
}

/**
 * Detect fuel type from text
 */
function detectFuelType(text: string): ExtractedReceiptData['fuelType'] | undefined {
    const upperText = text.toUpperCase();

    if (upperText.includes('PERTAMAX TURBO')) return 'pertamax-turbo';
    if (upperText.includes('PERTAMAX')) return 'pertamax';
    if (upperText.includes('PERTALITE')) return 'pertalite';
    if (upperText.includes('DEXLITE')) return 'dexlite';
    if (upperText.includes('SOLAR') || upperText.includes('BIO SOLAR')) return 'solar';

    return undefined;
}

/**
 * Parse date from text (DD/MM/YYYY or DD-MM-YYYY format)
 */
function parseDate(text: string): Date | undefined {
    // Common date patterns in Indonesian receipts
    const patterns = [
        /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,  // DD/MM/YYYY or DD-MM-YYYY
        /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/,  // YYYY/MM/DD or YYYY-MM-DD
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
            const [, a, b, c] = match;
            // Determine format based on which number is 4 digits
            if (c.length === 4) {
                // DD/MM/YYYY
                return new Date(parseInt(c), parseInt(b) - 1, parseInt(a));
            } else {
                // YYYY/MM/DD
                return new Date(parseInt(a), parseInt(b) - 1, parseInt(c));
            }
        }
    }
    return undefined;
}

/**
 * Parse receipt text and extract structured data
 */
function parseReceiptText(text: string): ExtractedReceiptData {
    console.log('Parsing receipt text:', text);

    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    let liters: number | undefined;
    let pricePerLiter: number | undefined;
    let totalPrice: number | undefined;
    let date: Date | undefined;

    // Detect fuel type
    const fuelType = detectFuelType(text);

    // Parse each line
    for (const line of lines) {
        const upperLine = line.toUpperCase();

        // Volume / Liters - be specific to avoid matching "Harga/Liter"
        // Look for patterns like "Volume: 6,667" or "Liter: 6,667" or "(L) 6,667"
        if (!liters && (
            (upperLine.includes('VOLUME') && upperLine.includes(':')) ||
            (/^LITER\s*:/i.test(line)) || // "Liter:" at start of line
            (/\(L\)\s*[\d.,]+/i.test(line)) // "(L) 6,667"
        )) {
            // Exclude lines with "HARGA/LITER" or "HARGA/L"
            if (!upperLine.includes('HARGA')) {
                const match = line.match(/[\d.,]+/);
                if (match) {
                    liters = extractNumber(match[0]);
                    console.log('Found liters:', liters, 'from line:', line);
                }
            }
        }

        // Price per liter
        if (upperLine.includes('HARGA/LITER') || upperLine.includes('HARGA/L') || upperLine.includes('/LITER')) {
            const match = line.match(/[\d.,]+/g);
            if (match) {
                // Get the numeric value (usually after Rp)
                pricePerLiter = extractRupiah(match.join(''));
            }
        }

        // Total price
        if (upperLine.includes('TOTAL HARGA') || upperLine.includes('TOTAL') || upperLine.includes('AMOUNT')) {
            const match = line.match(/[\d.,]+/g);
            if (match) {
                const amount = extractRupiah(match.join(''));
                if (amount && amount > 10000) { // Reasonable minimum for fuel purchase
                    totalPrice = amount;
                }
            }
        }

        // Date (Waktu or Tanggal)
        if (upperLine.includes('WAKTU') || upperLine.includes('TANGGAL') || /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}/.test(line)) {
            const parsedDate = parseDate(line);
            if (parsedDate) {
                date = parsedDate;
            }
        }
    }

    // If we couldn't find total but found liters and price per liter, calculate
    if (!totalPrice && liters && pricePerLiter) {
        totalPrice = Math.round(liters * pricePerLiter);
    }

    // If we found total and liters but not price per liter, calculate
    if (totalPrice && liters && !pricePerLiter) {
        pricePerLiter = Math.round(totalPrice / liters);
    }

    // Calculate confidence based on how much data we extracted
    let confidence = 0;
    if (fuelType) confidence += 25;
    if (liters) confidence += 25;
    if (totalPrice) confidence += 25;
    if (pricePerLiter) confidence += 15;
    if (date) confidence += 10;

    return {
        liters,
        pricePerLiter,
        totalPrice,
        fuelType,
        date,
        confidence,
        rawText: text,
    };
}

/**
 * Parse receipt image using Tesseract.js OCR (100% free, client-side)
 */
export async function parseReceiptImage(imageDataUrl: string): Promise<ExtractedReceiptData> {
    console.log('Starting Tesseract OCR...');

    try {
        // Use Tesseract to recognize text
        const result = await Tesseract.recognize(
            imageDataUrl,
            'ind+eng', // Indonesian + English
            {
                logger: (info) => {
                    if (info.status === 'recognizing text') {
                        console.log(`OCR Progress: ${Math.round(info.progress * 100)}%`);
                    }
                }
            }
        );

        console.log('OCR completed. Raw text:', result.data.text);
        console.log('OCR confidence:', result.data.confidence);

        // Parse the recognized text
        const extractedData = parseReceiptText(result.data.text);

        // Adjust confidence based on Tesseract's confidence
        extractedData.confidence = Math.round(
            (extractedData.confidence * 0.7) + (result.data.confidence * 0.3)
        );

        console.log('Extracted data:', extractedData);
        return extractedData;

    } catch (error) {
        console.error('Tesseract OCR error:', error);
        return {
            confidence: 0,
            rawText: error instanceof Error ? error.message : 'OCR failed',
        };
    }
}
