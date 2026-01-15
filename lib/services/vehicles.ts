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
    orderBy,
    Timestamp,
    serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Vehicle, VehicleFormData } from '@/lib/types';

const COLLECTION = 'vehicles';

// Get all vehicles for a user
export async function getVehicles(userId: string): Promise<Vehicle[]> {
    if (!db) throw new Error('Firestore not initialized');

    const q = query(
        collection(db, COLLECTION),
        where('userId', '==', userId)
    );

    const snapshot = await getDocs(q);
    const vehicles = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: (doc.data().createdAt as Timestamp)?.toDate(),
        updatedAt: (doc.data().updatedAt as Timestamp)?.toDate(),
    })) as Vehicle[];

    // Sort by createdAt desc (client-side to avoid composite index)
    return vehicles.sort((a, b) => {
        const dateA = a.createdAt?.getTime() || 0;
        const dateB = b.createdAt?.getTime() || 0;
        return dateB - dateA;
    });
}

// Get a single vehicle
export async function getVehicle(vehicleId: string): Promise<Vehicle | null> {
    if (!db) throw new Error('Firestore not initialized');

    const docRef = doc(db, COLLECTION, vehicleId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;

    return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: (docSnap.data().createdAt as Timestamp)?.toDate(),
        updatedAt: (docSnap.data().updatedAt as Timestamp)?.toDate(),
    } as Vehicle;
}

// Create a new vehicle
export async function createVehicle(userId: string, data: VehicleFormData): Promise<string> {
    if (!db) throw new Error('Firestore not initialized');

    // Get count of existing vehicles to determine if this should be active
    const existing = await getVehicles(userId);
    const isFirst = existing.length === 0;

    const docRef = await addDoc(collection(db, COLLECTION), {
        userId,
        name: data.name,
        plateNumber: data.plateNumber.toUpperCase(),
        year: data.year,
        tankCapacity: data.tankCapacity,
        defaultFuelType: data.defaultFuelType,
        isActive: isFirst, // First vehicle is automatically active
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });

    return docRef.id;
}

// Update a vehicle
export async function updateVehicle(vehicleId: string, data: Partial<VehicleFormData>): Promise<void> {
    if (!db) throw new Error('Firestore not initialized');

    const docRef = doc(db, COLLECTION, vehicleId);
    await updateDoc(docRef, {
        ...data,
        plateNumber: data.plateNumber?.toUpperCase(),
        updatedAt: serverTimestamp(),
    });
}

// Delete a vehicle
export async function deleteVehicle(vehicleId: string): Promise<void> {
    if (!db) throw new Error('Firestore not initialized');

    const docRef = doc(db, COLLECTION, vehicleId);
    await deleteDoc(docRef);
}

// Set active vehicle (and deactivate others)
export async function setActiveVehicle(userId: string, vehicleId: string): Promise<void> {
    if (!db) throw new Error('Firestore not initialized');

    // Get all user's vehicles
    const vehicles = await getVehicles(userId);
    const firestore = db;

    // Update all vehicles
    const updates = vehicles.map(vehicle => {
        const docRef = doc(firestore, COLLECTION, vehicle.id);
        return updateDoc(docRef, {
            isActive: vehicle.id === vehicleId,
            updatedAt: serverTimestamp()
        });
    });

    await Promise.all(updates);
}

// Get active vehicle
export async function getActiveVehicle(userId: string): Promise<Vehicle | null> {
    if (!db) throw new Error('Firestore not initialized');

    const q = query(
        collection(db, COLLECTION),
        where('userId', '==', userId),
        where('isActive', '==', true)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    return {
        id: doc.id,
        ...doc.data(),
        createdAt: (doc.data().createdAt as Timestamp)?.toDate(),
        updatedAt: (doc.data().updatedAt as Timestamp)?.toDate(),
    } as Vehicle;
}
