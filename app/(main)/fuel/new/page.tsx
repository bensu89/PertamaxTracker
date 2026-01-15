'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout';
import { FuelForm } from '@/components/fuel';
import { useAuth } from '@/contexts';
import { getVehicles, getLatestFuelEntry, createFuelEntry } from '@/lib/services';
import type { Vehicle, FuelEntry, FuelEntryFormData } from '@/lib/types';

export default function NewFuelEntryPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [previousEntry, setPreviousEntry] = useState<FuelEntry | undefined>();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            if (!user) return;

            try {
                setLoading(true);
                const vehicleData = await getVehicles(user.uid);
                setVehicles(vehicleData);

                // Get previous entry for active vehicle
                const activeVehicle = vehicleData.find(v => v.isActive) || vehicleData[0];
                if (activeVehicle) {
                    const lastEntry = await getLatestFuelEntry(user.uid, activeVehicle.id);
                    setPreviousEntry(lastEntry || undefined);
                }
            } catch (err) {
                console.error('Error fetching data:', err);
                setError('Gagal memuat data');
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [user]);

    const handleVehicleChange = async (vehicleId: string) => {
        if (!user) return;

        try {
            const lastEntry = await getLatestFuelEntry(user.uid, vehicleId);
            setPreviousEntry(lastEntry || undefined);
        } catch (err) {
            console.error('Error fetching previous entry:', err);
        }
    };

    const handleSubmit = async (data: FuelEntryFormData) => {
        if (!user) {
            setError('Anda harus login terlebih dahulu');
            return;
        }

        try {
            setSaving(true);
            setError(null);
            await createFuelEntry(user.uid, data);
            router.push('/history');
        } catch (err) {
            console.error('Error creating fuel entry:', err);
            setError('Gagal menyimpan pengisian. Silakan coba lagi.');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        router.back();
    };

    if (loading) {
        return (
            <div className="page">
                <PageHeader title="Pencatatan Pengisian" showBack />
                <div className="page-content" style={{ display: 'flex', justifyContent: 'center', paddingTop: 'var(--space-8)' }}>
                    <div className="spinner" style={{ width: '32px', height: '32px' }} />
                </div>
            </div>
        );
    }

    if (vehicles.length === 0) {
        return (
            <div className="page">
                <PageHeader title="Pencatatan Pengisian" showBack />
                <div className="page-content">
                    <div className="empty-state">
                        <h3 className="empty-state-title">Belum Ada Kendaraan</h3>
                        <p className="empty-state-description">
                            Tambahkan kendaraan terlebih dahulu sebelum mencatat pengisian BBM
                        </p>
                        <button
                            className="btn btn-primary"
                            onClick={() => router.push('/vehicles/new')}
                        >
                            Tambah Kendaraan
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <PageHeader
                title="Pencatatan Pengisian"
                showBack
            />

            <div className="page-content" style={{ maxWidth: '500px' }}>
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

                <div className="card" style={{ padding: 'var(--space-6)' }}>
                    <FuelForm
                        vehicles={vehicles}
                        previousEntry={previousEntry}
                        onSubmit={handleSubmit}
                        onCancel={handleCancel}
                        onVehicleChange={handleVehicleChange}
                        isLoading={saving}
                    />
                </div>
            </div>
        </div>
    );
}
