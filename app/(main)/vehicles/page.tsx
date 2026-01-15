'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Car } from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { VehicleCard } from '@/components/vehicle';
import { useAuth } from '@/contexts';
import { getVehicles, setActiveVehicle, deleteVehicle } from '@/lib/services';
import type { Vehicle } from '@/lib/types';

export default function VehiclesPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch vehicles on mount
    useEffect(() => {
        async function fetchVehicles() {
            if (!user) return;

            try {
                setLoading(true);
                const data = await getVehicles(user.uid);
                setVehicles(data);
            } catch (err) {
                console.error('Error fetching vehicles:', err);
                setError('Gagal memuat data kendaraan');
            } finally {
                setLoading(false);
            }
        }

        fetchVehicles();
    }, [user]);

    const handleSetActive = async (vehicleId: string) => {
        if (!user) return;

        try {
            await setActiveVehicle(user.uid, vehicleId);
            // Update local state
            setVehicles(prev => prev.map(v => ({
                ...v,
                isActive: v.id === vehicleId
            })));
        } catch (err) {
            console.error('Error setting active vehicle:', err);
            alert('Gagal mengubah kendaraan aktif');
        }
    };

    const handleEdit = (vehicleId: string) => {
        router.push(`/vehicles/${vehicleId}/edit`);
    };

    const handleDelete = async (vehicleId: string) => {
        if (!confirm('Yakin ingin menghapus kendaraan ini?')) return;

        try {
            await deleteVehicle(vehicleId);
            setVehicles(prev => prev.filter(v => v.id !== vehicleId));
        } catch (err) {
            console.error('Error deleting vehicle:', err);
            alert('Gagal menghapus kendaraan');
        }
    };

    if (loading) {
        return (
            <div className="page">
                <PageHeader title="Kendaraan Saya" />
                <div className="page-content" style={{ display: 'flex', justifyContent: 'center', paddingTop: 'var(--space-8)' }}>
                    <div className="spinner" style={{ width: '32px', height: '32px' }} />
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <PageHeader
                title="Kendaraan Saya"
                rightContent={
                    <Link href="/vehicles/new" className="btn btn-primary" style={{ gap: 'var(--space-2)' }}>
                        <Plus size={18} />
                        Tambah
                    </Link>
                }
            />

            <div className="page-content">
                {error && (
                    <div
                        className="card"
                        style={{
                            background: 'var(--danger-light)',
                            color: 'var(--danger)',
                            marginBottom: 'var(--space-4)'
                        }}
                    >
                        {error}
                    </div>
                )}

                {vehicles.length === 0 ? (
                    <div className="empty-state">
                        <Car className="empty-state-icon" />
                        <h3 className="empty-state-title">Belum Ada Kendaraan</h3>
                        <p className="empty-state-description">
                            Tambahkan kendaraan pertama Anda untuk mulai mencatat pengisian BBM
                        </p>
                        <Link href="/vehicles/new" className="btn btn-primary">
                            <Plus size={18} />
                            Tambah Kendaraan
                        </Link>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {vehicles.map(vehicle => (
                            <VehicleCard
                                key={vehicle.id}
                                vehicle={vehicle}
                                onSetActive={handleSetActive}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
