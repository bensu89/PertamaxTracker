'use client';

import { useState, useEffect } from 'react';
import { Filter, Download, Fuel, ChevronRight } from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { CustomSelect } from '@/components/ui';
import { useAuth } from '@/contexts';
import { getFuelEntries, getVehicles } from '@/lib/services';
import type { FuelEntry, Vehicle } from '@/lib/types';
import { formatDate, formatRupiah, formatLiters, formatNumber, getMonthName } from '@/lib/utils';

// Group entries by month
function groupByMonth(entries: FuelEntry[]): Map<string, { entries: FuelEntry[]; total: number }> {
    const grouped = new Map<string, { entries: FuelEntry[]; total: number }>();

    entries.forEach(entry => {
        const date = entry.date instanceof Date ? entry.date : new Date(entry.date);
        const key = `${date.getFullYear()}-${date.getMonth()}`;

        if (!grouped.has(key)) {
            grouped.set(key, { entries: [], total: 0 });
        }
        const group = grouped.get(key)!;
        group.entries.push(entry);
        group.total += entry.totalPrice;
    });

    return grouped;
}

export default function HistoryPage() {
    const { user } = useAuth();
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [entries, setEntries] = useState<FuelEntry[]>([]);
    const [selectedVehicle, setSelectedVehicle] = useState<string>('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            if (!user) return;

            try {
                setLoading(true);
                const [vehicleData, entryData] = await Promise.all([
                    getVehicles(user.uid),
                    getFuelEntries(user.uid)
                ]);
                setVehicles(vehicleData);
                setEntries(entryData);
            } catch (err) {
                console.error('Error fetching data:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [user]);

    const filteredEntries = selectedVehicle === 'all'
        ? entries
        : entries.filter(e => e.vehicleId === selectedVehicle);

    const groupedEntries = groupByMonth(filteredEntries);

    const getVehicleName = (vehicleId: string) => {
        return vehicles.find(v => v.id === vehicleId)?.name || 'Unknown';
    };

    const handleExport = () => {
        // Create CSV content
        const headers = ['Tanggal', 'Kendaraan', 'Odometer', 'Liter', 'Total', 'Harga/L', 'Efisiensi'];
        const rows = filteredEntries.map(e => [
            formatDate(e.date instanceof Date ? e.date : new Date(e.date)),
            getVehicleName(e.vehicleId),
            e.odometer,
            e.liters,
            e.totalPrice,
            e.pricePerLiter,
            e.efficiency || '-'
        ]);

        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `riwayat-bbm-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    if (loading) {
        return (
            <div className="page">
                <PageHeader title="Riwayat Pengisian" />
                <div className="page-content" style={{ display: 'flex', justifyContent: 'center', paddingTop: 'var(--space-8)' }}>
                    <div className="spinner" style={{ width: '32px', height: '32px' }} />
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <PageHeader
                title="Riwayat Pengisian"
                rightContent={
                    <button className="btn btn-ghost btn-icon" onClick={handleExport} aria-label="Ekspor">
                        <Download size={20} />
                    </button>
                }
            />

            <div className="page-content">
                {/* Filters */}
                <div
                    className="card flex items-center gap-3"
                    style={{
                        marginBottom: 'var(--space-6)',
                        padding: 'var(--space-3)',
                        overflow: 'visible',
                        position: 'relative',
                        zIndex: 10
                    }}
                >
                    <Filter size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                    <div style={{ flex: 1, position: 'relative' }}>
                        <CustomSelect
                            options={[
                                { value: 'all', label: 'Semua Kendaraan' },
                                ...vehicles.map(v => ({ value: v.id, label: v.name }))
                            ]}
                            value={selectedVehicle}
                            onChange={setSelectedVehicle}
                            placeholder="Pilih Kendaraan"
                        />
                    </div>
                </div>

                {/* Entries List */}
                {filteredEntries.length === 0 ? (
                    <div className="empty-state">
                        <Fuel className="empty-state-icon" />
                        <h3 className="empty-state-title">Belum Ada Riwayat</h3>
                        <p className="empty-state-description">
                            Data pengisian BBM akan muncul di sini
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-6">
                        {Array.from(groupedEntries.entries()).map(([key, group]) => {
                            const [year, month] = key.split('-').map(Number);
                            const monthLabel = `${getMonthName(month)} ${year}`;

                            return (
                                <section key={key}>
                                    {/* Month Header */}
                                    <div
                                        className="flex items-center justify-between"
                                        style={{
                                            marginBottom: 'var(--space-3)',
                                            padding: '0 var(--space-2)'
                                        }}
                                    >
                                        <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                            {monthLabel}
                                        </h3>
                                        <span
                                            style={{
                                                fontSize: '13px',
                                                fontFamily: 'var(--font-mono)',
                                                color: 'var(--primary)',
                                                fontWeight: 600
                                            }}
                                        >
                                            {formatRupiah(group.total)}
                                        </span>
                                    </div>

                                    {/* Entries */}
                                    <div className="flex flex-col gap-2">
                                        {group.entries.map(entry => {
                                            const entryDate = entry.date instanceof Date ? entry.date : new Date(entry.date);

                                            return (
                                                <div
                                                    key={entry.id}
                                                    className="fuel-entry-card"
                                                >
                                                    <div className="fuel-entry-icon">
                                                        <Fuel size={18} />
                                                    </div>
                                                    <div className="fuel-entry-content">
                                                        <div className="fuel-entry-date">
                                                            {formatDate(entryDate)} • {getVehicleName(entry.vehicleId)}
                                                        </div>
                                                        <div className="fuel-entry-details">
                                                            {formatLiters(entry.liters)} @ {formatRupiah(entry.pricePerLiter)}/L
                                                        </div>
                                                    </div>
                                                    <div className="fuel-entry-amount">
                                                        <div className="fuel-entry-price">
                                                            {formatRupiah(entry.totalPrice)}
                                                        </div>
                                                        {entry.efficiency && (
                                                            <div className="fuel-entry-efficiency">
                                                                {formatNumber(entry.efficiency, 2)} km/L
                                                            </div>
                                                        )}
                                                    </div>
                                                    <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </section>
                            );
                        })}
                    </div>
                )}

                {/* Export Button */}
                {filteredEntries.length > 0 && (
                    <div style={{ marginTop: 'var(--space-8)', textAlign: 'center' }}>
                        <button className="btn btn-secondary" onClick={handleExport}>
                            <Download size={18} />
                            Ekspor ke CSV
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
