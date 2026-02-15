import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc, getDoc } from 'firebase/firestore';
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
            if (!process.env[key] && key.startsWith('NEXT_PUBLIC_FIREBASE')) {
                process.env[key] = value;
            }
        }
    });
} catch (error) {
    console.log('Could not load .env.local, using process.env');
}

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Change this EMAIL to the user you want to make admin
const TARGET_EMAIL = process.argv[2];

if (!TARGET_EMAIL) {
    console.error('Usage: node set-admin.mjs <email>');
    process.exit(1);
}

async function setAdmin() {
    console.log(`Searching for user with email: ${TARGET_EMAIL}...`);

    // Note: Since we don't know the UID, strictly speaking we should query by email.
    // BUT the 'users' collection is keyed by UID. 
    // In a real admin script we'd use firebase-admin SDK to lookup verify user by email.
    // Since this is client SDK, we can't easily look up UID by email unless we have a separate index.
    // HOWEVER, for this specific app, let's try to query the users collection if rules allow listing.
    // If not, ask user for UID.

    try {
        const { collection, query, where, getDocs } = await import('firebase/firestore');
        const q = query(collection(db, 'users'), where('email', '==', TARGET_EMAIL));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            console.error('User not found! Ensure the user has logged in at least once.');
            console.log('Alternatively, you can provide the UID directly if you know it.');
            process.exit(1);
        }

        const userDoc = snapshot.docs[0];
        console.log(`Found user: ${userDoc.id} (${userDoc.data().displayName})`);

        await updateDoc(doc(db, 'users', userDoc.id), {
            role: 'admin'
        });

        console.log(`SUCCESS: User ${TARGET_EMAIL} is now an ADMIN.`);
    } catch (error) {
        console.error('Error:', error.message);
        if (error.code === 'permission-denied') {
            console.error('Permission denied. Please ensure you have updated Firestore Rules to allow reads/writes.');
        }
    }
}

setAdmin();
