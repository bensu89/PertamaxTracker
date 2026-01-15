'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout';
import { VehicleForm } from '@/components/vehicle';
import { useAuth } from '@/contexts';
import { createVehicle } from '@/lib/services';
import type { VehicleFormData } from '@/lib/types';

export default function NewVehiclePage() {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (data: VehicleFormData) => {
        if (!user) {
            setError('Anda harus login terlebih dahulu');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            await createVehicle(user.uid, data);
            router.push('/vehicles');
        } catch (err) {
            console.error('Error creating vehicle:', err);
            setError('Gagal menyimpan kendaraan. Silakan coba lagi.');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        router.back();
    };

    return (
        <div className="page">
            <PageHeader
                title="Tambah Kendaraan"
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
                        onSubmit={handleSubmit}
                        onCancel={handleCancel}
                        isLoading={loading}
                    />
                </div>
            </div>
        </div>
    );
}
