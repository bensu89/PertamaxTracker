import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    Timestamp,
    serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { FuelEntry, FuelEntryFormData } from '@/lib/types';
import { calculatePricePerLiter, calculateDistance, calculateEfficiency } from '@/lib/calculations';

const COLLECTION = 'fuelEntries';

// Convert Firestore doc to FuelEntry
function docToFuelEntry(doc: { id: string; data: () => Record<string, unknown> }): FuelEntry {
    const data = doc.data();
    return {
        id: doc.id,
        userId: data.userId as string,
        vehicleId: data.vehicleId as string,
        date: (data.date as Timestamp)?.toDate(),
        odometer: data.odometer as number,
        liters: data.liters as number,
        totalPrice: data.totalPrice as number,
        pricePerLiter: data.pricePerLiter as number,
        fuelType: data.fuelType as FuelEntry['fuelType'],
        isFullTank: data.isFullTank as boolean,
        distance: data.distance as number | undefined,
        efficiency: data.efficiency as number | undefined,
        notes: data.notes as string | undefined,
        createdAt: (data.createdAt as Timestamp)?.toDate(),
        updatedAt: (data.updatedAt as Timestamp)?.toDate(),
    };
}

// Get all fuel entries for a user (sorted by date desc)
export async function getFuelEntries(userId: string, vehicleId?: string): Promise<FuelEntry[]> {
    if (!db) throw new Error('Firestore not initialized');

    let q;
    if (vehicleId) {
        q = query(
            collection(db, COLLECTION),
            where('userId', '==', userId),
            where('vehicleId', '==', vehicleId)
        );
    } else {
        q = query(
            collection(db, COLLECTION),
            where('userId', '==', userId)
        );
    }

    const snapshot = await getDocs(q);
    const entries = snapshot.docs.map(doc => docToFuelEntry({ id: doc.id, data: () => doc.data() }));

    // Sort by date desc (client-side to avoid composite index)
    return entries.sort((a, b) => {
        const dateA = a.date?.getTime() || 0;
        const dateB = b.date?.getTime() || 0;
        return dateB - dateA;
    });
}

// Get a single fuel entry
export async function getFuelEntry(entryId: string): Promise<FuelEntry | null> {
    if (!db) throw new Error('Firestore not initialized');

    const docRef = doc(db, COLLECTION, entryId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;

    return docToFuelEntry({ id: docSnap.id, data: () => docSnap.data() });
}

// Get the latest fuel entry for a vehicle (highest odometer)
export async function getLatestFuelEntry(userId: string, vehicleId: string): Promise<FuelEntry | null> {
    if (!db) throw new Error('Firestore not initialized');

    const q = query(
        collection(db, COLLECTION),
        where('userId', '==', userId),
        where('vehicleId', '==', vehicleId)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    // Find entry with highest odometer (client-side)
    const entries = snapshot.docs.map(doc => docToFuelEntry({ id: doc.id, data: () => doc.data() }));
    return entries.reduce((latest, current) =>
        (current.odometer > latest.odometer) ? current : latest
    );
}

// Create a new fuel entry with auto-calculations
export async function createFuelEntry(userId: string, data: FuelEntryFormData): Promise<string> {
    if (!db) throw new Error('Firestore not initialized');

    // Use user-input pricePerLiter if provided, otherwise calculate
    const pricePerLiter = data.pricePerLiter || calculatePricePerLiter(data.totalPrice, data.liters);

    // Get previous entry for distance and efficiency calculation
    const previousEntry = await getLatestFuelEntry(userId, data.vehicleId);

    let distance: number | null = null;
    let efficiency: number | null = null;

    if (previousEntry && data.isFullTank) {
        distance = calculateDistance(data.odometer, previousEntry.odometer);
        efficiency = calculateEfficiency(data.odometer, previousEntry.odometer, data.liters);
    }

    const docRef = await addDoc(collection(db, COLLECTION), {
        userId,
        vehicleId: data.vehicleId,
        date: Timestamp.fromDate(data.date),
        odometer: data.odometer,
        liters: data.liters,
        totalPrice: data.totalPrice,
        pricePerLiter,
        fuelType: data.fuelType,
        isFullTank: data.isFullTank,
        distance: distance,
        efficiency: efficiency,
        notes: data.notes || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });

    return docRef.id;
}

// Update a fuel entry
export async function updateFuelEntry(entryId: string, data: Partial<FuelEntryFormData>): Promise<void> {
    if (!db) throw new Error('Firestore not initialized');

    const updateData: Record<string, unknown> = {
        ...data,
        updatedAt: serverTimestamp(),
    };

    // Recalculate price per liter if relevant fields changed
    if (data.totalPrice !== undefined && data.liters !== undefined) {
        updateData.pricePerLiter = calculatePricePerLiter(data.totalPrice, data.liters);
    }

    if (data.date) {
        updateData.date = Timestamp.fromDate(data.date);
    }

    const docRef = doc(db, COLLECTION, entryId);
    await updateDoc(docRef, updateData);
}

// Delete a fuel entry
export async function deleteFuelEntry(entryId: string): Promise<void> {
    if (!db) throw new Error('Firestore not initialized');

    const docRef = doc(db, COLLECTION, entryId);
    await deleteDoc(docRef);
}

// Calculate stats for a list of entries
export function calculateStats(entries: FuelEntry[]) {
    if (entries.length === 0) {
        return {
            totalSpending: 0,
            totalLiters: 0,
            totalDistance: 0,
            averageEfficiency: 0,
            entryCount: 0,
        };
    }

    const totalSpending = entries.reduce((sum, e) => sum + e.totalPrice, 0);
    const totalLiters = entries.reduce((sum, e) => sum + e.liters, 0);
    const totalDistance = entries.reduce((sum, e) => sum + (e.distance || 0), 0);

    const entriesWithEfficiency = entries.filter(e => e.efficiency && e.efficiency > 0);
    const averageEfficiency = entriesWithEfficiency.length > 0
        ? entriesWithEfficiency.reduce((sum, e) => sum + (e.efficiency || 0), 0) / entriesWithEfficiency.length
        : 0;

    return {
        totalSpending,
        totalLiters,
        totalDistance,
        averageEfficiency,
        entryCount: entries.length,
    };
}

// Get latest fuel prices for price trend
export async function getLatestPrices(userId: string, fuelType?: string): Promise<{
    currentPrice: number;
    previousPrice: number;
    fuelType: string;
}> {
    const entries = await getFuelEntries(userId);

    // Filter by fuel type if specified
    let filtered = entries;
    if (fuelType) {
        filtered = entries.filter(e => e.fuelType === fuelType);
    }

    // If no entries, return 0
    if (filtered.length === 0) {
        return {
            currentPrice: 0,
            previousPrice: 0,
            fuelType: fuelType || 'pertamax'
        };
    }

    // Sort by date desc to get latest first
    const sorted = [...filtered].sort((a, b) => {
        const dateA = a.date?.getTime() || 0;
        const dateB = b.date?.getTime() || 0;
        return dateB - dateA;
    });

    // Get current (latest) and previous price
    const currentPrice = sorted[0]?.pricePerLiter || 0;
    const previousPrice = sorted[1]?.pricePerLiter || currentPrice;

    return {
        currentPrice,
        previousPrice,
        fuelType: sorted[0]?.fuelType || fuelType || 'pertamax'
    };
}

// Get average price per fuel type from recent entries
export async function getAveragePrices(userId: string): Promise<Map<string, number>> {
    const entries = await getFuelEntries(userId);

    // Group by fuel type
    const pricesByType = new Map<string, number[]>();

    for (const entry of entries) {
        if (!pricesByType.has(entry.fuelType)) {
            pricesByType.set(entry.fuelType, []);
        }
        pricesByType.get(entry.fuelType)!.push(entry.pricePerLiter);
    }

    // Calculate average for each type
    const averages = new Map<string, number>();
    for (const [type, prices] of pricesByType) {
        const avg = prices.reduce((sum, p) => sum + p, 0) / prices.length;
        averages.set(type, Math.round(avg));
    }

    return averages;
}
