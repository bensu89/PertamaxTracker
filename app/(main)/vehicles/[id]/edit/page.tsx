'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout';
import { VehicleForm } from '@/components/vehicle';
import { useAuth } from '@/contexts';
import { getVehicle, updateVehicle } from '@/lib/services';
import type { Vehicle, VehicleFormData } from '@/lib/types';

export default function EditVehiclePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { user } = useAuth();
    const [vehicle, setVehicle] = useState<Vehicle | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchVehicle() {
            try {
                const data = await getVehicle(id);
                if (!data) {
                    setError('Kendaraan tidak ditemukan');
                    return;
                }
                setVehicle(data);
            } catch (err) {
                console.error('Error fetching vehicle:', err);
                setError('Gagal memuat data kendaraan');
            } finally {
                setLoading(false);
            }
        }

        fetchVehicle();
    }, [id]);

    const handleSubmit = async (data: VehicleFormData) => {
        if (!user) return;

        try {
            setSaving(true);
            setError(null);
            await updateVehicle(id, data);
            router.push('/vehicles');
        } catch (err) {
            console.error('Error updating vehicle:', err);
            setError('Gagal menyimpan perubahan. Silakan coba lagi.');
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
                <PageHeader title="Edit Kendaraan" showBack />
                <div className="page-content" style={{ display: 'flex', justifyContent: 'center', paddingTop: 'var(--space-8)' }}>
                    <div className="spinner" style={{ width: '32px', height: '32px' }} />
                </div>
            </div>
        );
    }

    if (!vehicle) {
        return (
            <div className="page">
                <PageHeader title="Edit Kendaraan" showBack />
                <div className="page-content">
                    <div className="card" style={{ background: 'var(--danger-light)', color: 'var(--danger)' }}>
                        {error || 'Kendaraan tidak ditemukan'}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <PageHeader
                title="Edit Kendaraan"
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
                    <VehicleForm
                        initialData={{
                            name: vehicle.name,
                            plateNumber: vehicle.plateNumber,
                            year: vehicle.year,
                            tankCapacity: vehicle.tankCapacity,
                            defaultFuelType: vehicle.defaultFuelType,
                        }}
                        onSubmit={handleSubmit}
                        onCancel={handleCancel}
                        isLoading={saving}
                    />
                </div>
            </div>
        </div>
    );
}
