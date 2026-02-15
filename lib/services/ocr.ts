import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

export interface ReceiptData {
    date?: Date;
    fuelType?: string;
    liters?: number;
    pricePerLiter?: number;
    totalPrice?: number;
    stationName?: string;
}

/**
 * Extracts data from a fuel receipt image using Gemini AI (Flash model)
 */
export async function extractReceiptData(imageFile: File): Promise<ReceiptData> {
    if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
        throw new Error('Gemini API Key is missing');
    }

    try {
        // Convert file to base64
        const base64Data = await fileToGenerativePart(imageFile);

        // Use Gemini 1.5 Flash for speed and cost efficiency
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `
        Analyze this fuel receipt image and extract the following information in JSON format:
        - stationName: The name of the gas station (SPBU)
        - date: The date of transaction (YYYY-MM-DD format)
        - fuelType: The type of fuel (e.g., Pertamax, Pertalite, Solar, Dexlite)
        - liters: The volume of fuel in liters (number)
        - pricePerLiter: The price per liter (number)
        - totalPrice: The total price paid (number)

        If a field is not visible or clear, set it to null.
        Return only the JSON object, no markdown formatting.
        `;

        const result = await model.generateContent([prompt, base64Data]);
        const response = await result.response;
        const text = response.text();

        // Clean up the response to get pure JSON
        const jsonString = text.replace(/```json|```/g, '').trim();
        const data = JSON.parse(jsonString);

        return {
            stationName: data.stationName || undefined,
            date: data.date ? new Date(data.date) : undefined,
            fuelType: normalizeFuelType(data.fuelType),
            liters: typeof data.liters === 'number' ? data.liters : parseFloat(data.liters),
            pricePerLiter: typeof data.pricePerLiter === 'number' ? data.pricePerLiter : parseFloat(data.pricePerLiter),
            totalPrice: typeof data.totalPrice === 'number' ? data.totalPrice : parseFloat(data.totalPrice),
        };
    } catch (error) {
        console.error('Error extracting receipt data:', error);
        throw new Error('Gagal membaca struk. Pastikan gambar jelas.');
    }
}

/**
 * Helper to convert File to GoogleGenerativeAI Part
 */
async function fileToGenerativePart(file: File): Promise<{ inlineData: { data: string; mimeType: string } }> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
            const base64Data = base64String.split(',')[1];
            resolve({
                inlineData: {
                    data: base64Data,
                    mimeType: file.type
                },
            });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Helper to normalize fuel type string to match our internal types
 */
function normalizeFuelType(type: string | null): string | undefined {
    if (!type) return undefined;

    const lower = type.toLowerCase();

    if (lower.includes('turbo')) return 'pertamax-turbo';
    if (lower.includes('pertamax')) return 'pertamax';
    if (lower.includes('pertalite')) return 'pertalite';
    if (lower.includes('dexlite')) return 'dexlite';
    if (lower.includes('solar') || lower.includes('bio')) return 'solar';

    return 'pertamax'; // Default fallback
}
