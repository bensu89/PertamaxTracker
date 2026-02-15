import { createWorker } from 'tesseract.js';
import { parsePertaminaReceipt, ReceiptData } from '@/lib/utils/receiptParser';

/**
 * Extracts data from a fuel receipt image using Tesseract.js (Local OCR)
 */
export async function extractReceiptData(imageFile: File): Promise<ReceiptData> {
    try {
        // Create a worker for OCR
        const worker = await createWorker('ind');

        // Recognize text
        const result = await worker.recognize(imageFile);
        const text = result.data.text;

        // Terminate worker to free resources
        await worker.terminate();

        console.log("Raw OCR Text:", text); // Debugging

        // Parse text using our utility
        return parsePertaminaReceipt(text);

    } catch (error) {
        console.error('OCR Error:', error);
        throw new Error('Gagal memproses gambar. Pastikan pencahayaan cukup terang.');
    }
}
