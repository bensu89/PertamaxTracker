import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, query, where, orderBy, limit, Timestamp, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import type { UserStats, SystemStats } from '@/lib/types/admin';
import type { UserRole } from '@/lib/types';

const USERS_COLLECTION = 'users';
const VEHICLES_COLLECTION = 'vehicles';
const FUEL_ENTRIES_COLLECTION = 'fuelEntries';

/**
 * Check if user has admin role
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
    if (!db) return false;

    try {
        const userDoc = await getDoc(doc(db, USERS_COLLECTION, userId));
        if (!userDoc.exists()) return false;

        const userData = userDoc.data();
        return userData.role === 'admin';
    } catch (error) {
        console.error('Error checking admin status:', error);
        return false;
    }
}

/**
 * Get system-wide statistics (admin only)
 */
export async function getSystemStats(): Promise<SystemStats> {
    if (!db) throw new Error('Firestore not initialized');

    try {
        // Get total users
        const usersSnapshot = await getDocs(collection(db, USERS_COLLECTION));
        const totalUsers = usersSnapshot.size;

        // Get new users this month
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const newUsersQuery = query(
            collection(db, USERS_COLLECTION),
            where('createdAt', '>=', Timestamp.fromDate(firstDayOfMonth))
        );
        const newUsersSnapshot = await getDocs(newUsersQuery);
        const newUsersThisMonth = newUsersSnapshot.size;

        // Get active users (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const activeUsersQuery = query(
            collection(db, USERS_COLLECTION),
            where('lastActive', '>=', Timestamp.fromDate(thirtyDaysAgo))
        );
        const activeUsersSnapshot = await getDocs(activeUsersQuery);
        const activeUsers = activeUsersSnapshot.size;

        // Get total vehicles
        const vehiclesSnapshot = await getDocs(collection(db, VEHICLES_COLLECTION));
        const totalVehicles = vehiclesSnapshot.size;

        // Get total fuel entries and calculate total spending
        const entriesSnapshot = await getDocs(collection(db, FUEL_ENTRIES_COLLECTION));
        const totalFuelEntries = entriesSnapshot.size;

        let totalSpending = 0;
        entriesSnapshot.forEach(doc => {
            const data = doc.data();
            totalSpending += data.totalPrice || 0;
        });

        return {
            totalUsers,
            totalVehicles,
            totalFuelEntries,
            totalSpending,
            newUsersThisMonth,
            activeUsers
        };
    } catch (error) {
        console.error('Error fetching system stats:', error);
        throw error;
    }
}

/**
 * Get all users with their aggregated statistics (admin only)
 */
export async function getAllUsersStats(): Promise<UserStats[]> {
    if (!db) throw new Error('Firestore not initialized');

    try {
        const usersSnapshot = await getDocs(
            query(collection(db, USERS_COLLECTION), orderBy('createdAt', 'desc'))
        );

        const userStats: UserStats[] = [];

        for (const userDoc of usersSnapshot.docs) {
            const userData = userDoc.data();

            // Count vehicles for this user
            const vehiclesQuery = query(
                collection(db, VEHICLES_COLLECTION),
                where('userId', '==', userDoc.id)
            );
            const vehiclesSnapshot = await getDocs(vehiclesQuery);
            const vehicleCount = vehiclesSnapshot.size;

            // Count entries and calculate total spending for this user
            const entriesQuery = query(
                collection(db, FUEL_ENTRIES_COLLECTION),
                where('userId', '==', userDoc.id)
            );
            const entriesSnapshot = await getDocs(entriesQuery);
            const entryCount = entriesSnapshot.size;

            let totalSpending = 0;
            let totalLiters = 0;
            entriesSnapshot.forEach(doc => {
                const data = doc.data();
                totalSpending += data.totalPrice || 0;
                totalLiters += data.liters || 0;
            });

            userStats.push({
                userId: userDoc.id,
                email: userData.email || '',
                displayName: userData.displayName || 'Unknown',
                role: userData.role || 'user',
                createdAt: userData.createdAt,
                lastActive: userData.lastActive,
                vehicleCount,
                entryCount,
                totalSpending,
                totalLiters
            });
        }

        return userStats;
    } catch (error) {
        console.error('Error fetching user stats:', error);
        throw error;
    }
}

/**
 * Set or remove admin role for a user (admin only)
 */
export async function setUserRole(userId: string, role: UserRole): Promise<void> {
    if (!db) throw new Error('Firestore not initialized');

    try {
        const userRef = doc(db, USERS_COLLECTION, userId);
        await updateDoc(userRef, {
            role,
            updatedAt: Timestamp.now()
        });
    } catch (error) {
        console.error('Error updating user role:', error);
        throw error;
    }
}

/**
 * Delete a user and all their related data (admin only)
 */
export async function deleteUser(userId: string): Promise<void> {
    if (!db) throw new Error('Firestore not initialized');

    try {
        const batch = writeBatch(db);

        // Delete all fuel entries for this user
        const entriesQuery = query(
            collection(db, FUEL_ENTRIES_COLLECTION),
            where('userId', '==', userId)
        );
        const entriesSnap = await getDocs(entriesQuery);
        entriesSnap.forEach(docSnap => {
            batch.delete(doc(db!, FUEL_ENTRIES_COLLECTION, docSnap.id));
        });

        // Delete all vehicles for this user
        const vehiclesQuery = query(
            collection(db, VEHICLES_COLLECTION),
            where('userId', '==', userId)
        );
        const vehiclesSnap = await getDocs(vehiclesQuery);
        vehiclesSnap.forEach(docSnap => {
            batch.delete(doc(db!, VEHICLES_COLLECTION, docSnap.id));
        });

        // Delete the user document
        batch.delete(doc(db, USERS_COLLECTION, userId));

        // Commit the batch
        await batch.commit();
    } catch (error) {
        console.error('Error deleting user:', error);
        throw error;
    }
}
/**
 * Get user growth data for charts (monthly)
 */
export async function getUserGrowthData(): Promise<{ month: string; count: number }[]> {
    if (!db) throw new Error('Firestore not initialized');

    try {
        const usersSnapshot = await getDocs(collection(db, USERS_COLLECTION));
        const monthlyData: { [key: string]: number } = {};

        usersSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.createdAt) {
                const date = data.createdAt.toDate();
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
            }
        });

        // Convert to array and sort by date
        return Object.entries(monthlyData)
            .map(([month, count]) => ({ month, count }))
            .sort((a, b) => a.month.localeCompare(b.month))
            .slice(-12); // Last 12 months
    } catch (error) {
        console.error('Error fetching user growth data:', error);
        throw error;
    }
}

/**
 * Get total entries per month for charts
 */
export async function getEntriesPerMonth(): Promise<{ month: string; count: number }[]> {
    if (!db) throw new Error('Firestore not initialized');

    try {
        const entriesSnapshot = await getDocs(collection(db, FUEL_ENTRIES_COLLECTION));
        const monthlyData: { [key: string]: number } = {};

        entriesSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.createdAt) {
                const date = data.createdAt.toDate();
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
            }
        });

        return Object.entries(monthlyData)
            .map(([month, count]) => ({ month, count }))
            .sort((a, b) => a.month.localeCompare(b.month))
            .slice(-12);
    } catch (error) {
        console.error('Error fetching entries per month:', error);
        throw error;
    }
}
