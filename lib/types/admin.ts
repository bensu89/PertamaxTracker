import { Timestamp } from 'firebase/firestore';

export type UserRole = 'user' | 'admin';

export interface User {
    id: string;
    email: string;
    displayName: string;
    photoURL?: string;
    role: UserRole;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    lastActive?: Timestamp;
}

export interface SystemStats {
    totalUsers: number;
    totalVehicles: number;
    totalFuelEntries: number;
    totalSpending: number;
    newUsersThisMonth: number;
    activeUsers: number; // Active in last 30 days
}

export interface UserStats {
    userId: string;
    email: string;
    displayName: string;
    role: UserRole;
    createdAt: Timestamp;
    lastActive?: Timestamp;
    vehicleCount: number;
    entryCount: number;
    totalSpending: number;
}

export interface ActivityLog {
    id: string;
    type: 'user_registered' | 'fuel_entry_added' | 'vehicle_added';
    userId: string;
    userEmail: string;
    timestamp: Timestamp;
    details?: string;
}
