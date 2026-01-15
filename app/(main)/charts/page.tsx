'use client';

import { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/layout';
import { BarChart3 } from 'lucide-react';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { formatRupiah, formatNumber, getMonthName } from '@/lib/utils';
import { useAuth } from '@/contexts';
import { getFuelEntries, getVehicles } from '@/lib/services';
import type { FuelEntry, Vehicle } from '@/lib/types';

type TabType = 'efficiency' | 'spending' | 'price';

interface ChartData {
    month: string;
    efficiency?: number;
    spending?: number;
    price?: number;
}

export default function ChartsPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<TabType>('efficiency');
    const [entries, setEntries] = useState<FuelEntry[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [selectedVehicle, setSelectedVehicle] = useState<string>('all');
    const [loading, setLoading] = useState(true);

    const tabs = [
        { id: 'efficiency', label: 'Efisiensi' },
        { id: 'spending', label: 'Pengeluaran' },
        { id: 'price', label: 'Harga BBM' },
    ];

    useEffect(() => {
        async function fetchData() {
            if (!user) return;

            try {
                setLoading(true);
                const [entryData, vehicleData] = await Promise.all([
                    getFuelEntries(user.uid),
                    getVehicles(user.uid)
                ]);
                setEntries(entryData);
                setVehicles(vehicleData);
            } catch (err) {
                console.error('Error fetching chart data:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [user]);

    // Filter entries by selected vehicle
    const filteredEntries = useMemo(() => {
        if (selectedVehicle === 'all') return entries;
        return entries.filter(e => e.vehicleId === selectedVehicle);
    }, [entries, selectedVehicle]);

    // Group entries by month and calculate aggregates
    const chartData = useMemo(() => {
        const monthlyData = new Map<string, {
            spending: number;
            liters: number;
            distance: number;
            prices: number[];
            efficiencies: number[];
        }>();

        filteredEntries.forEach(entry => {
            const date = entry.date instanceof Date ? entry.date : new Date(entry.date);
            const key = `${date.getFullYear()}-${date.getMonth()}`;

            if (!monthlyData.has(key)) {
                monthlyData.set(key, {
                    spending: 0,
                    liters: 0,
                    distance: 0,
                    prices: [],
                    efficiencies: []
                });
            }

            const data = monthlyData.get(key)!;
            data.spending += entry.totalPrice;
            data.liters += entry.liters;
            data.distance += entry.distance || 0;
            data.prices.push(entry.pricePerLiter);
            if (entry.efficiency && entry.efficiency > 0) {
                data.efficiencies.push(entry.efficiency);
            }
        });

        // Convert to chart data array
        const result: ChartData[] = [];
        const sortedKeys = Array.from(monthlyData.keys()).sort();

        sortedKeys.slice(-6).forEach(key => { // Last 6 months
            const [year, month] = key.split('-').map(Number);
            const data = monthlyData.get(key)!;

            const avgEfficiency = data.efficiencies.length > 0
                ? data.efficiencies.reduce((a, b) => a + b, 0) / data.efficiencies.length
                : 0;

            const avgPrice = data.prices.length > 0
                ? data.prices.reduce((a, b) => a + b, 0) / data.prices.length
                : 0;

            result.push({
                month: getMonthName(month).slice(0, 3),
                efficiency: Math.round(avgEfficiency * 10) / 10,
                spending: data.spending,
                price: Math.round(avgPrice),
            });
        });

        return result;
    }, [filteredEntries]);

    // Calculate stats
    const stats = useMemo(() => {
        if (chartData.length === 0) {
            return {
                avgEfficiency: 0,
                maxEfficiency: 0,
                minEfficiency: 0,
                maxEfficiencyMonth: '-',
                minEfficiencyMonth: '-',
                totalSpending: 0,
                avgSpending: 0,
                maxSpendingMonth: '-',
                currentPrice: 0,
                priceChange: 0,
                priceChangePercent: 0,
            };
        }

        const efficiencies = chartData.filter(d => d.efficiency && d.efficiency > 0);
        const avgEfficiency = efficiencies.length > 0
            ? efficiencies.reduce((sum, d) => sum + (d.efficiency || 0), 0) / efficiencies.length
            : 0;

        const maxEff = efficiencies.reduce((max, d) =>
            (d.efficiency || 0) > (max.efficiency || 0) ? d : max,
            { efficiency: 0, month: '-' }
        );
        const minEff = efficiencies.reduce((min, d) =>
            (d.efficiency || 0) < (min.efficiency || Infinity) ? d : min,
            { efficiency: Infinity, month: '-' }
        );

        const totalSpending = chartData.reduce((sum, d) => sum + (d.spending || 0), 0);
        const avgSpending = chartData.length > 0 ? totalSpending / chartData.length : 0;
        const maxSpending = chartData.reduce((max, d) =>
            (d.spending || 0) > (max.spending || 0) ? d : max,
            { spending: 0, month: '-' }
        );

        const currentPrice = chartData[chartData.length - 1]?.price || 0;
        const previousPrice = chartData[chartData.length - 2]?.price || currentPrice;
        const priceChange = currentPrice - previousPrice;
        const priceChangePercent = previousPrice > 0 ? (priceChange / previousPrice) * 100 : 0;

        return {
            avgEfficiency,
            maxEfficiency: maxEff.efficiency || 0,
            minEfficiency: minEff.efficiency === Infinity ? 0 : minEff.efficiency || 0,
            maxEfficiencyMonth: maxEff.month,
            minEfficiencyMonth: minEff.month,
            totalSpending,
            avgSpending,
            maxSpendingMonth: maxSpending.month,
            currentPrice,
            priceChange,
            priceChangePercent,
        };
    }, [chartData]);

    if (loading) {
        return (
            <div className="page">
                <PageHeader title="Laporan & Grafik" />
                <div className="page-content" style={{ display: 'flex', justifyContent: 'center', paddingTop: 'var(--space-8)' }}>
                    <div className="spinner" style={{ width: '32px', height: '32px' }} />
                </div>
            </div>
        );
    }

    if (entries.length === 0) {
        return (
            <div className="page">
                <PageHeader title="Laporan & Grafik" />
                <div className="page-content">
                    <div className="empty-state">
                        <BarChart3 className="empty-state-icon" />
                        <h3 className="empty-state-title">Belum Ada Data</h3>
                        <p className="empty-state-description">
                            Tambahkan pengisian BBM untuk melihat laporan dan grafik
                        </p>
                        <a href="/fuel/new" className="btn btn-primary">
                            Tambah Pengisian
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <PageHeader title="Laporan & Grafik" />

            <div className="page-content">
                {/* Vehicle Filter */}
                {vehicles.length > 1 && (
                    <div className="card" style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-3)' }}>
                        <select
                            className="select"
                            style={{ border: 'none', background: 'transparent' }}
                            value={selectedVehicle}
                            onChange={(e) => setSelectedVehicle(e.target.value)}
                        >
                            <option value="all">Semua Kendaraan</option>
                            {vehicles.map(v => (
                                <option key={v.id} value={v.id}>{v.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Tabs */}
                <div
                    className="card flex gap-1"
                    style={{ padding: 'var(--space-1)', marginBottom: 'var(--space-6)' }}
                >
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as TabType)}
                            className="btn"
                            style={{
                                flex: 1,
                                background: activeTab === tab.id ? 'var(--primary)' : 'transparent',
                                color: activeTab === tab.id ? '#000' : 'var(--text-secondary)',
                                fontWeight: activeTab === tab.id ? 600 : 400,
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Charts */}
                {activeTab === 'efficiency' && (
                    <section>
                        <div className="card" style={{ padding: 'var(--space-5)' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: 'var(--space-4)' }}>
                                📈 Tren Efisiensi BBM
                            </h3>
                            <p className="text-muted" style={{ fontSize: '13px', marginBottom: 'var(--space-4)' }}>
                                Rata-rata: <strong style={{ color: 'var(--primary)' }}>
                                    {stats.avgEfficiency > 0 ? `${formatNumber(stats.avgEfficiency, 1)} km/L` : '-'}
                                </strong>
                            </p>
                            {chartData.length > 0 ? (
                                <div style={{ height: '280px', marginLeft: '-20px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                            <XAxis
                                                dataKey="month"
                                                stroke="var(--text-muted)"
                                                fontSize={12}
                                                tickLine={false}
                                            />
                                            <YAxis
                                                stroke="var(--text-muted)"
                                                fontSize={12}
                                                tickLine={false}
                                                axisLine={false}
                                                tickFormatter={(v) => `${v}`}
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: 'var(--surface)',
                                                    border: '1px solid var(--border)',
                                                    borderRadius: 'var(--radius-md)',
                                                    fontSize: '13px'
                                                }}
                                                formatter={(value) => [`${formatNumber(Number(value), 1)} km/L`, 'Efisiensi']}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="efficiency"
                                                stroke="var(--primary)"
                                                strokeWidth={3}
                                                dot={{ fill: 'var(--primary)', strokeWidth: 0, r: 5 }}
                                                activeDot={{ r: 7 }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <p className="text-muted">Belum ada data efisiensi</p>
                            )}
                        </div>

                        {/* Stats Cards */}
                        {stats.maxEfficiency > 0 && (
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(2, 1fr)',
                                    gap: 'var(--space-3)',
                                    marginTop: 'var(--space-4)'
                                }}
                            >
                                <div className="card" style={{ textAlign: 'center' }}>
                                    <div className="text-muted" style={{ fontSize: '12px', marginBottom: '4px' }}>Tertinggi</div>
                                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '24px', fontWeight: 700, color: 'var(--primary)' }}>
                                        {formatNumber(stats.maxEfficiency, 1)}
                                    </div>
                                    <div className="text-muted" style={{ fontSize: '12px' }}>km/L ({stats.maxEfficiencyMonth})</div>
                                </div>
                                <div className="card" style={{ textAlign: 'center' }}>
                                    <div className="text-muted" style={{ fontSize: '12px', marginBottom: '4px' }}>Terendah</div>
                                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '24px', fontWeight: 700, color: 'var(--warning)' }}>
                                        {formatNumber(stats.minEfficiency, 1)}
                                    </div>
                                    <div className="text-muted" style={{ fontSize: '12px' }}>km/L ({stats.minEfficiencyMonth})</div>
                                </div>
                            </div>
                        )}
                    </section>
                )}

                {activeTab === 'spending' && (
                    <section>
                        <div className="card" style={{ padding: 'var(--space-5)' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: 'var(--space-4)' }}>
                                💰 Pengeluaran per Bulan
                            </h3>
                            <p className="text-muted" style={{ fontSize: '13px', marginBottom: 'var(--space-4)' }}>
                                Total: <strong style={{ color: 'var(--text-primary)' }}>{formatRupiah(stats.totalSpending)}</strong>
                            </p>
                            {chartData.length > 0 ? (
                                <div style={{ height: '280px', marginLeft: '-20px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                            <XAxis
                                                dataKey="month"
                                                stroke="var(--text-muted)"
                                                fontSize={12}
                                                tickLine={false}
                                            />
                                            <YAxis
                                                stroke="var(--text-muted)"
                                                fontSize={12}
                                                tickLine={false}
                                                axisLine={false}
                                                tickFormatter={(v) => `${v / 1000}k`}
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: 'var(--surface)',
                                                    border: '1px solid var(--border)',
                                                    borderRadius: 'var(--radius-md)',
                                                    fontSize: '13px'
                                                }}
                                                formatter={(value) => [formatRupiah(Number(value)), 'Pengeluaran']}
                                            />
                                            <Bar
                                                dataKey="spending"
                                                fill="var(--secondary)"
                                                radius={[6, 6, 0, 0]}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <p className="text-muted">Belum ada data pengeluaran</p>
                            )}
                        </div>

                        {/* Stats */}
                        {stats.totalSpending > 0 && (
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(2, 1fr)',
                                    gap: 'var(--space-3)',
                                    marginTop: 'var(--space-4)'
                                }}
                            >
                                <div className="card" style={{ textAlign: 'center' }}>
                                    <div className="text-muted" style={{ fontSize: '12px', marginBottom: '4px' }}>Rata-rata/Bulan</div>
                                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', fontWeight: 700 }}>
                                        {formatRupiah(stats.avgSpending)}
                                    </div>
                                </div>
                                <div className="card" style={{ textAlign: 'center' }}>
                                    <div className="text-muted" style={{ fontSize: '12px', marginBottom: '4px' }}>Bulan Terboros</div>
                                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', fontWeight: 700, color: 'var(--danger)' }}>
                                        {stats.maxSpendingMonth}
                                    </div>
                                </div>
                            </div>
                        )}
                    </section>
                )}

                {activeTab === 'price' && (
                    <section>
                        <div className="card" style={{ padding: 'var(--space-5)' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: 'var(--space-4)' }}>
                                ⛽ Harga BBM (Per Pengisian)
                            </h3>
                            <p className="text-muted" style={{ fontSize: '13px', marginBottom: 'var(--space-4)' }}>
                                Saat ini: <strong style={{ color: 'var(--primary)' }}>
                                    {stats.currentPrice > 0 ? `${formatRupiah(stats.currentPrice)}/L` : '-'}
                                </strong>
                            </p>
                            {chartData.length > 0 ? (
                                <div style={{ height: '280px', marginLeft: '-20px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                            <XAxis
                                                dataKey="month"
                                                stroke="var(--text-muted)"
                                                fontSize={12}
                                                tickLine={false}
                                            />
                                            <YAxis
                                                stroke="var(--text-muted)"
                                                fontSize={12}
                                                tickLine={false}
                                                axisLine={false}
                                                tickFormatter={(v) => `${v / 1000}k`}
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: 'var(--surface)',
                                                    border: '1px solid var(--border)',
                                                    borderRadius: 'var(--radius-md)',
                                                    fontSize: '13px'
                                                }}
                                                formatter={(value) => [`${formatRupiah(Number(value))}/L`, 'Harga']}
                                            />
                                            <Line
                                                type="stepAfter"
                                                dataKey="price"
                                                stroke="var(--warning)"
                                                strokeWidth={3}
                                                dot={{ fill: 'var(--warning)', strokeWidth: 0, r: 5 }}
                                                activeDot={{ r: 7 }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <p className="text-muted">Belum ada data harga</p>
                            )}
                        </div>

                        {/* Price Change Info */}
                        {stats.currentPrice > 0 && (
                            <div className="card" style={{ marginTop: 'var(--space-4)' }}>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-muted" style={{ fontSize: '12px' }}>Perubahan Harga</div>
                                        <div style={{ fontSize: '18px', fontWeight: 600 }}>
                                            {stats.priceChange >= 0 ? '+' : ''}{formatRupiah(stats.priceChange)}/L
                                        </div>
                                    </div>
                                    <div className={`badge ${stats.priceChange > 0 ? 'badge-warning' : 'badge-primary'}`}>
                                        {stats.priceChange >= 0 ? '+' : ''}{formatNumber(stats.priceChangePercent, 1)}%
                                    </div>
                                </div>
                            </div>
                        )}
                    </section>
                )}
            </div>
        </div>
    );
}
