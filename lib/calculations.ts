import type { FuelEntry } from './types';

/**
 * Calculate fuel efficiency (km/L)
 * Only valid for full-tank fill-ups
 */
export function calculateEfficiency(
    currentOdometer: number,
    previousOdometer: number,
    liters: number
): number {
    const distance = currentOdometer - previousOdometer;
    if (distance <= 0 || liters <= 0) return 0;
    return distance / liters;
}

/**
 * Calculate distance traveled between two odometer readings
 */
export function calculateDistance(
    currentOdometer: number,
    previousOdometer: number
): number {
    return Math.max(0, currentOdometer - previousOdometer);
}

/**
 * Calculate price per liter
 */
export function calculatePricePerLiter(totalPrice: number, liters: number): number {
    if (liters <= 0) return 0;
    return totalPrice / liters;
}

/**
 * Calculate estimated remaining distance based on tank capacity and efficiency
 */
export function calculateEstimatedDistance(
    tankCapacity: number,
    averageEfficiency: number,
    currentFuelLevel: number = 1 // 1 = full, 0.5 = half, etc.
): number {
    return tankCapacity * currentFuelLevel * averageEfficiency;
}

/**
 * Calculate average efficiency from multiple entries
 * Only considers full-tank entries for accurate calculation
 */
export function calculateAverageEfficiency(entries: FuelEntry[]): number {
    const validEntries = entries.filter(e => e.isFullTank && e.efficiency && e.efficiency > 0);
    if (validEntries.length === 0) return 0;

    const totalEfficiency = validEntries.reduce((sum, e) => sum + (e.efficiency || 0), 0);
    return totalEfficiency / validEntries.length;
}

/**
 * Calculate total spending for a period
 */
export function calculateTotalSpending(entries: FuelEntry[]): number {
    return entries.reduce((sum, e) => sum + e.totalPrice, 0);
}

/**
 * Calculate total liters for a period
 */
export function calculateTotalLiters(entries: FuelEntry[]): number {
    return entries.reduce((sum, e) => sum + e.liters, 0);
}

/**
 * Calculate total distance for a period
 */
export function calculateTotalDistance(entries: FuelEntry[]): number {
    return entries.reduce((sum, e) => sum + (e.distance || 0), 0);
}

/**
 * Get entries for current month
 */
export function getEntriesForCurrentMonth(entries: FuelEntry[]): FuelEntry[] {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    return entries.filter(e => {
        const entryDate = e.date instanceof Date ? e.date : new Date(e.date);
        return entryDate >= startOfMonth && entryDate <= endOfMonth;
    });
}

/**
 * Get entries for previous month
 */
export function getEntriesForPreviousMonth(entries: FuelEntry[]): FuelEntry[] {
    const now = new Date();
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    return entries.filter(e => {
        const entryDate = e.date instanceof Date ? e.date : new Date(e.date);
        return entryDate >= startOfLastMonth && entryDate <= endOfLastMonth;
    });
}

/**
 * Group entries by month
 */
export function groupEntriesByMonth(entries: FuelEntry[]): Map<string, FuelEntry[]> {
    const grouped = new Map<string, FuelEntry[]>();

    entries.forEach(entry => {
        const date = entry.date instanceof Date ? entry.date : new Date(entry.date);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        if (!grouped.has(key)) {
            grouped.set(key, []);
        }
        grouped.get(key)!.push(entry);
    });

    return grouped;
}

/**
 * Get monthly statistics
 */
export function getMonthlyStats(entries: FuelEntry[]): {
    month: string;
    spending: number;
    liters: number;
    efficiency: number;
    count: number;
}[] {
    const grouped = groupEntriesByMonth(entries);
    const stats: { month: string; spending: number; liters: number; efficiency: number; count: number }[] = [];

    grouped.forEach((monthEntries, key) => {
        stats.push({
            month: key,
            spending: calculateTotalSpending(monthEntries),
            liters: calculateTotalLiters(monthEntries),
            efficiency: calculateAverageEfficiency(monthEntries),
            count: monthEntries.length,
        });
    });

    return stats.sort((a, b) => a.month.localeCompare(b.month));
}

/**
 * Process new fuel entry - calculate efficiency and distance
 */
export function processFuelEntry(
    newEntry: Omit<FuelEntry, 'distance' | 'efficiency' | 'pricePerLiter'>,
    previousEntry?: FuelEntry
): Omit<FuelEntry, 'id' | 'createdAt' | 'updatedAt'> {
    const pricePerLiter = calculatePricePerLiter(newEntry.totalPrice, newEntry.liters);

    let distance: number | undefined;
    let efficiency: number | undefined;

    if (previousEntry) {
        distance = calculateDistance(newEntry.odometer, previousEntry.odometer);

        // Only calculate efficiency if this is a full tank fill-up
        if (newEntry.isFullTank && distance > 0) {
            efficiency = calculateEfficiency(newEntry.odometer, previousEntry.odometer, newEntry.liters);
        }
    }

    return {
        ...newEntry,
        pricePerLiter,
        distance,
        efficiency,
    };
}

/**
 * Validate odometer reading (must be greater than previous)
 */
export function validateOdometer(
    newOdometer: number,
    previousOdometer?: number
): { valid: boolean; message?: string } {
    if (newOdometer < 0) {
        return { valid: false, message: 'Odometer tidak boleh negatif' };
    }

    if (previousOdometer !== undefined && newOdometer <= previousOdometer) {
        return {
            valid: false,
            message: `Odometer harus lebih besar dari ${previousOdometer.toLocaleString('id-ID')} km`
        };
    }

    return { valid: true };
}

/**
 * Get efficiency rating (for visual feedback)
 */
export function getEfficiencyRating(
    efficiency: number,
    vehicleType: 'motor' | 'mobil' = 'mobil'
): 'excellent' | 'good' | 'average' | 'poor' {
    const thresholds = vehicleType === 'motor'
        ? { excellent: 45, good: 35, average: 25 }
        : { excellent: 15, good: 12, average: 9 };

    if (efficiency >= thresholds.excellent) return 'excellent';
    if (efficiency >= thresholds.good) return 'good';
    if (efficiency >= thresholds.average) return 'average';
    return 'poor';
}

/**
 * Get efficiency color based on rating
 */
export function getEfficiencyColor(rating: 'excellent' | 'good' | 'average' | 'poor'): string {
    const colors = {
        excellent: '#22C55E', // Green
        good: '#06B6D4', // Cyan
        average: '#F59E0B', // Yellow
        poor: '#EF4444', // Red
    };
    return colors[rating];
}
