import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Format number as Indonesian Rupiah
 */
export function formatRupiah(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

/**
 * Format number with thousand separators
 */
export function formatNumber(num: number, decimals: number = 0): string {
    return new Intl.NumberFormat('id-ID', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(num);
}

/**
 * Format date to Indonesian locale
 */
export function formatDate(date: Date, format: 'short' | 'long' | 'full' = 'short'): string {
    const options: Intl.DateTimeFormatOptions = {
        short: { day: 'numeric', month: 'short', year: 'numeric' } as const,
        long: { day: 'numeric', month: 'long', year: 'numeric' } as const,
        full: { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' } as const,
    }[format];

    return new Intl.DateTimeFormat('id-ID', options).format(date);
}

/**
 * Format date to relative time (e.g., "2 jam lalu")
 */
export function formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Baru saja';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} menit lalu`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} jam lalu`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} hari lalu`;

    return formatDate(date, 'short');
}

/**
 * Format efficiency value (km/L)
 */
export function formatEfficiency(efficiency: number): string {
    return `${formatNumber(efficiency, 1)} km/L`;
}

/**
 * Format distance (km)
 */
export function formatDistance(km: number): string {
    return `${formatNumber(km)} km`;
}

/**
 * Format liters
 */
export function formatLiters(liters: number): string {
    return `${formatNumber(liters, 1)} L`;
}

/**
 * Get fuel type display name
 */
export function getFuelTypeName(type: string): string {
    const names: Record<string, string> = {
        'pertamax': 'Pertamax',
        'pertamax-turbo': 'Pertamax Turbo',
        'pertalite': 'Pertalite',
        'solar': 'Solar',
        'dexlite': 'Dexlite',
    };
    return names[type] || type;
}

/**
 * Get fuel type color
 */
export function getFuelTypeColor(type: string): string {
    const colors: Record<string, string> = {
        'pertamax': '#22C55E',
        'pertamax-turbo': '#06B6D4',
        'pertalite': '#F59E0B',
        'solar': '#EF4444',
        'dexlite': '#8B5CF6',
    };
    return colors[type] || '#A1A1AA';
}

/**
 * Calculate percentage change
 */
export function calculatePercentageChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
}

/**
 * Generate unique ID
 */
export function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

/**
 * Validate plate number format (Indonesia)
 */
export function isValidPlateNumber(plate: string): boolean {
    // Format: X 1234 XX or XX 1234 XXX
    const pattern = /^[A-Z]{1,2}\s?\d{1,4}\s?[A-Z]{1,3}$/i;
    return pattern.test(plate.trim());
}

/**
 * Format plate number
 */
export function formatPlateNumber(plate: string): string {
    const cleaned = plate.replace(/\s/g, '').toUpperCase();
    const match = cleaned.match(/^([A-Z]{1,2})(\d{1,4})([A-Z]{1,3})$/);
    if (match) {
        return `${match[1]} ${match[2]} ${match[3]}`;
    }
    return plate.toUpperCase();
}

/**
 * Get greeting based on time
 */
export function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Selamat Pagi';
    if (hour < 15) return 'Selamat Siang';
    if (hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
}

/**
 * Get month name in Indonesian
 */
export function getMonthName(month: number): string {
    const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return months[month];
}

/**
 * Get current month and year
 */
export function getCurrentPeriod(): string {
    const now = new Date();
    return `${getMonthName(now.getMonth())} ${now.getFullYear()}`;
}

/**
 * Sleep/delay helper
 */
export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Safe JSON parse
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
    try {
        return JSON.parse(json);
    } catch {
        return fallback;
    }
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - 3) + '...';
}
