'use client';

import { useState, useEffect } from 'react';
import { Fuel, Wallet, Gauge, Calendar } from 'lucide-react';
import {
    StatCard,
    VehicleSelector,
    LastEntryCard,
    PriceTrendCard
} from '@/components/dashboard';
import { useAuth } from '@/contexts';
import {
    getVehicles,
    setActiveVehicle,
    getFuelEntries,
    getLatestFuelEntry,
    calculateStats,
    getLatestPrices
} from '@/lib/services';
import type { Vehicle, FuelEntry } from '@/lib/types';
import { getGreeting, getCurrentPeriod, formatNumber, getFuelTypeName } from '@/lib/utils';
import { calculateEstimatedDistance } from '@/lib/calculations';

export default function DashboardPage() {
    const { user } = useAuth();
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
    const [monthlyEntries, setMonthlyEntries] = useState<FuelEntry[]>([]);
    const [lastEntry, setLastEntry] = useState<FuelEntry | null>(null);
    const [priceData, setPriceData] = useState<{
        currentPrice: number;
        previousPrice: number;
        fuelType: string;
    }>({ currentPrice: 0, previousPrice: 0, fuelType: 'pertamax' });
    const [loading, setLoading] = useState(true);

    const greeting = getGreeting();
    const period = getCurrentPeriod();

    useEffect(() => {
        async function fetchData() {
            if (!user) return;

            try {
                setLoading(true);

                // Get vehicles
                const vehicleData = await getVehicles(user.uid);
                setVehicles(vehicleData);

                // Get active vehicle
                const active = vehicleData.find(v => v.isActive) || vehicleData[0];
                setSelectedVehicle(active || null);

                if (active) {
                    // Get fuel entries for current month
                    const now = new Date();
                    const entries = await getFuelEntries(user.uid, active.id);
                    const thisMonthEntries = entries.filter(e => {
                        const entryDate = e.date instanceof Date ? e.date : new Date(e.date);
                        return entryDate.getMonth() === now.getMonth() &&
                            entryDate.getFullYear() === now.getFullYear();
                    });
                    setMonthlyEntries(thisMonthEntries);

                    // Get last entry
                    const latest = await getLatestFuelEntry(user.uid, active.id);
                    setLastEntry(latest);
                }

                // Get price data for default fuel type (pertamax)
                const prices = await getLatestPrices(user.uid);
                setPriceData(prices);
            } catch (err) {
                console.error('Error fetching dashboard data:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [user]);

    const handleVehicleChange = async (vehicleId: string) => {
        if (!user) return;

        try {
            await setActiveVehicle(user.uid, vehicleId);

            const vehicle = vehicles.find(v => v.id === vehicleId);
            if (vehicle) {
                setSelectedVehicle(vehicle);
                setVehicles(prev => prev.map(v => ({
                    ...v,
                    isActive: v.id === vehicleId
                })));

                // Refresh entries for new vehicle
                const entries = await getFuelEntries(user.uid, vehicleId);
                const now = new Date();
                const thisMonthEntries = entries.filter(e => {
                    const entryDate = e.date instanceof Date ? e.date : new Date(e.date);
                    return entryDate.getMonth() === now.getMonth() &&
                        entryDate.getFullYear() === now.getFullYear();
                });
                setMonthlyEntries(thisMonthEntries);

                const latest = await getLatestFuelEntry(user.uid, vehicleId);
                setLastEntry(latest);
            }
        } catch (err) {
            console.error('Error changing vehicle:', err);
        }
    };

    // Calculate stats
    const stats = calculateStats(monthlyEntries);

    // Calculate estimated distance
    const estimatedDistance = selectedVehicle && stats.averageEfficiency > 0
        ? calculateEstimatedDistance(selectedVehicle.tankCapacity, stats.averageEfficiency)
        : 0;

    if (loading) {
        return (
            <div className="page">
                <div className="page-content" style={{ display: 'flex', justifyContent: 'center', paddingTop: 'var(--space-8)' }}>
                    <div className="spinner" style={{ width: '32px', height: '32px' }} />
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <div className="page-content">
                {/* Greeting */}
                <div style={{ marginBottom: 'var(--space-4)' }}>
                    <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: 'var(--space-1)' }}>
                        {greeting}, {user?.displayName?.split(' ')[0] || 'User'}! 👋
                    </h1>
                    <p className="text-muted">{period}</p>
                </div>

                {/* Vehicle Selector */}
                {vehicles.length > 0 && (
                    <VehicleSelector
                        vehicles={vehicles}
                        selectedId={selectedVehicle?.id}
                        onSelect={handleVehicleChange}
                    />
                )}

                {vehicles.length === 0 ? (
                    <div className="empty-state" style={{ marginTop: 'var(--space-8)' }}>
                        <Gauge className="empty-state-icon" />
                        <h3 className="empty-state-title">Belum Ada Kendaraan</h3>
                        <p className="empty-state-description">
                            Tambahkan kendaraan untuk mulai mencatat pengisian BBM
                        </p>
                        <a href="/vehicles/new" className="btn btn-primary">
                            Tambah Kendaraan
                        </a>
                    </div>
                ) : (
                    <>
                        {/* Stats Grid */}
                        <div
                            className="stats-grid"
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(2, 1fr)',
                                gap: 'var(--space-4)',
                                marginTop: 'var(--space-6)'
                            }}
                        >
                            <StatCard
                                icon={Gauge}
                                label="Efisiensi"
                                value={stats.averageEfficiency > 0 ? formatNumber(stats.averageEfficiency, 1) : '-'}
                                unit="km/L"
                            />
                            <StatCard
                                icon={Wallet}
                                label="Pengeluaran Bulan Ini"
                                value={stats.totalSpending > 0 ? `Rp ${formatNumber(stats.totalSpending / 1000, 0)}K` : '-'}
                            />
                            <StatCard
                                icon={Fuel}
                                label="Estimasi Sisa"
                                value={estimatedDistance > 0 ? formatNumber(estimatedDistance, 0) : '-'}
                                unit="km"
                            />
                            <StatCard
                                icon={Calendar}
                                label="Total Pengisian"
                                value={stats.entryCount.toString()}
                                unit="kali"
                            />
                        </div>

                        {/* Price Trend */}
                        {priceData.currentPrice > 0 && (
                            <div style={{ marginTop: 'var(--space-6)' }}>
                                <PriceTrendCard
                                    currentPrice={priceData.currentPrice}
                                    previousPrice={priceData.previousPrice}
                                    fuelType={getFuelTypeName(priceData.fuelType)}
                                />
                            </div>
                        )}

                        {/* Last Entry */}
                        {lastEntry && (
                            <div style={{ marginTop: 'var(--space-6)' }}>
                                <LastEntryCard entry={lastEntry} />
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
