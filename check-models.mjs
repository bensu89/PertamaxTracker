import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '.env.local');

try {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            const value = match[2].trim().replace(/^['"]|['"]$/g, '');
            if (!process.env[key] && key.startsWith('NEXT_PUBLIC_FIREBASE') || key === 'NEXT_PUBLIC_GEMINI_API_KEY') {
                process.env[key] = value;
            }
        }
    });
} catch (error) {
    console.log('Could not load .env.local, using process.env');
}

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

async function listModels() {
    try {
        console.log('Checking available models...');
        // Note: The SDK doesn't expose listModels directly on genAI instance in all versions easily,
        // but let's try to just assume a safe default if we fail, or try a direct fetch if needed.
        // Actually, the error message suggested calling ListModels. 
        // In the Node SDK, it's usually via the model manager or not easily exposed in the high-level helper.

        // Let's try to test the model specifically.
        const modelName = 'gemini-1.5-flash';
        console.log(`Testing model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });

        // Simple prompt to test
        const result = await model.generateContent('Hello');
        const response = await result.response;
        console.log('Success! Response:', response.text());

    } catch (error) {
        console.error('Error with gemini-1.5-flash:', error.message);

        console.log('\n--- Listing Models via REST API ---');
        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
        if (!apiKey) {
            console.error('API Key not found!');
            return;
        }

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
            const data = await response.json();

            let output = '';
            if (data.error) {
                output += 'API Error: ' + JSON.stringify(data.error, null, 2) + '\n';
                console.error('API Error:', JSON.stringify(data.error, null, 2));
            } else if (data.models) {
                console.log('Available Models:');
                output += 'Available Models:\n';
                data.models.forEach(m => {
                    // Check if it supports generateContent
                    if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent')) {
                        console.log(`- ${m.name}`);
                        output += `- ${m.name}\n`;
                    }
                });
            } else {
                console.log('Unexpected response:', data);
                output += 'Unexpected response: ' + JSON.stringify(data) + '\n';
            }
            fs.writeFileSync(path.join(__dirname, 'models.txt'), output);
            console.log('Output written to models.txt');
        } catch (e) {
            console.error('Fetch error:', e);
        }
    }
}

listModels();
