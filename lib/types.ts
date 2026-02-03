// Vehicle Types
export interface Vehicle {
  id: string;
  userId: string;
  name: string;
  plateNumber: string;
  year: number;
  tankCapacity: number;
  defaultFuelType: FuelType;
  isActive: boolean;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type FuelType = 'pertamax' | 'pertamax-turbo' | 'pertalite' | 'solar' | 'dexlite';

// Fuel Entry Types
export interface FuelEntry {
  id: string;
  userId: string;
  vehicleId: string;
  date: Date;
  odometer: number;
  liters: number;
  totalPrice: number;
  pricePerLiter: number;
  fuelType: FuelType;
  isFullTank: boolean;
  distance?: number; // Calculated from previous entry
  efficiency?: number; // km/L - Calculated
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// User Types
export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  email: string;
  displayName: string;
  photoUrl?: string;
  role: UserRole;
  createdAt: Date;
  lastActive?: Date;
}

// Statistics Types
export interface DashboardStats {
  totalSpendingThisMonth: number;
  averageEfficiency: number;
  estimatedRemainingDistance: number;
  totalFillUps: number;
  lastEntry?: FuelEntry;
  spendingTrend: number; // Percentage change from last month
}

export interface MonthlyStats {
  month: string;
  year: number;
  totalSpending: number;
  totalLiters: number;
  averageEfficiency: number;
  fillUpCount: number;
}

export interface PriceTrend {
  date: Date;
  price: number;
  fuelType: FuelType;
}

// Form Types
export interface VehicleFormData {
  name: string;
  plateNumber: string;
  year: number;
  tankCapacity: number;
  defaultFuelType: FuelType;
}

export interface FuelEntryFormData {
  vehicleId: string;
  date: Date;
  odometer: number;
  liters: number;
  totalPrice: number;
  pricePerLiter?: number;
  fuelType: FuelType;
  isFullTank: boolean;
  notes?: string;
}

// Filter Types
export interface HistoryFilter {
  vehicleId?: string;
  startDate?: Date;
  endDate?: Date;
  fuelType?: FuelType;
}

// Chart Data Types
export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface EfficiencyChartData {
  date: string;
  efficiency: number;
  vehicleName: string;
}

export interface SpendingChartData {
  month: string;
  spending: number;
}

// Navigation Types
export type NavItem = {
  label: string;
  href: string;
  icon: string;
};

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
