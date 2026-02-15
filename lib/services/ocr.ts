import Groq from 'groq-sdk';

// Initialize Groq AI lazily
let groq: Groq | null = null;

function getGroqClient() {
    if (!groq) {
        const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;
        if (!apiKey) {
            throw new Error('Groq API Key is missing. Please check .env.local');
        }
        groq = new Groq({
            apiKey: apiKey,
            dangerouslyAllowBrowser: true
        });
    }
    return groq;
}

export interface ReceiptData {
    date?: Date;
    fuelType?: string;
    liters?: number;
    pricePerLiter?: number;
    totalPrice?: number;
    stationName?: string;
}

/**
 * Extracts data from a fuel receipt image using Groq AI (Llama 3.2 Vision)
 */
export async function extractReceiptData(imageFile: File): Promise<ReceiptData> {
    if (!process.env.NEXT_PUBLIC_GROQ_API_KEY) {
        throw new Error('Groq API Key is missing');
    }

    try {
        // Convert file to base64 data URL
        const base64DataUrl = await fileToBase64(imageFile);

        const completion = await getGroqClient().chat.completions.create({
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: `
                            Analyze this fuel receipt image and extract the following information in strict JSON format:
                            - stationName: The name of the gas station (SPBU)
                            - date: The date of transaction (YYYY-MM-DD format)
                            - fuelType: The type of fuel (e.g., Pertamax, Pertalite, Solar, Dexlite)
                            - liters: The volume of fuel in liters (number)
                            - pricePerLiter: The price per liter (number)
                            - totalPrice: The total price paid (number)

                            If a field is not visible or clear, set it to null.
                            Return ONLY the JSON object, do not include markdown formatting or explanation.
                            `
                        },
                        {
                            type: 'image_url',
                            image_url: {
                                url: base64DataUrl
                            }
                        }
                    ]
                }
            ],
            model: 'llama-3.2-11b-vision-preview',
            temperature: 0,
            max_tokens: 1024,
            response_format: { type: 'json_object' }
        });

        const jsonString = completion.choices[0]?.message?.content || '{}';

        // Sometimes the response might still contain markdown code blocks even with json_object
        const cleanJson = jsonString.replace(/```json|```/g, '').trim();
        const data = JSON.parse(cleanJson);

        return {
            stationName: data.stationName || undefined,
            date: data.date ? new Date(data.date) : undefined,
            fuelType: normalizeFuelType(data.fuelType),
            liters: typeof data.liters === 'number' ? data.liters : parseFloat(data.liters),
            pricePerLiter: typeof data.pricePerLiter === 'number' ? data.pricePerLiter : parseFloat(data.pricePerLiter),
            totalPrice: typeof data.totalPrice === 'number' ? data.totalPrice : parseFloat(data.totalPrice),
        };
    } catch (error) {
        console.error('Error extracting receipt data with Groq:', error);
        throw new Error('Gagal membaca struk dengan Groq. Pastikan gambar jelas.');
    }
}

/**
 * Helper to convert File to Base64 Data URL
 */
function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
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
