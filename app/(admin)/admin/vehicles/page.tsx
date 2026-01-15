'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout';
import { useAuth } from '@/contexts';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { formatNumber } from '@/lib/utils';
import { ArrowLeft, Car, User, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface VehicleWithOwner {
    id: string;
    name: string;
    plateNumber: string;
    year: number;
    tankCapacity: number;
    ownerId: string;
    ownerName: string;
    ownerEmail: string;
    createdAt: Date;
}

export default function AdminVehiclesPage() {
    const { user, isAdmin } = useAuth();
    const router = useRouter();
    const [vehicles, setVehicles] = useState<VehicleWithOwner[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || !isAdmin) {
            router.push('/');
            return;
        }

        async function fetchVehicles() {
            try {
                if (!db) return;

                // Fetch all vehicles
                const vehiclesSnap = await getDocs(collection(db, 'vehicles'));
                // Fetch all users
                const usersSnap = await getDocs(collection(db, 'users'));

                const usersMap = new Map();
                usersSnap.forEach(doc => {
                    const data = doc.data();
                    usersMap.set(doc.id, {
                        displayName: data.displayName || 'Unknown',
                        email: data.email || ''
                    });
                });

                const vehiclesData: VehicleWithOwner[] = [];
                vehiclesSnap.forEach(doc => {
                    const data = doc.data();
                    const owner = usersMap.get(data.userId);
                    vehiclesData.push({
                        id: doc.id,
                        name: data.name,
                        plateNumber: data.plateNumber,
                        year: data.year,
                        tankCapacity: data.tankCapacity,
                        ownerId: data.userId,
                        ownerName: owner?.displayName || 'Unknown',
                        ownerEmail: owner?.email || '',
                        createdAt: data.createdAt?.toDate() || new Date()
                    });
                });

                vehiclesData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
                setVehicles(vehiclesData);
            } catch (err) {
                console.error('Error fetching vehicles:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchVehicles();
    }, [user, isAdmin, router]);

    if (loading) {
        return (
            <div className="page">
                <PageHeader title="All Vehicles" />
                <div className="page-content" style={{ display: 'flex', justifyContent: 'center', paddingTop: 'var(--space-8)' }}>
                    <div className="spinner" style={{ width: '32px', height: '32px' }} />
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <PageHeader
                title={`All Vehicles (${formatNumber(vehicles.length)})`}
                leftContent={
                    <button
                        className="btn btn-ghost btn-icon"
                        onClick={() => router.push('/admin')}
                    >
                        <ArrowLeft size={20} />
                    </button>
                }
            />

            <div className="page-content">
                {vehicles.length === 0 ? (
                    <div className="empty-state">
                        <Car className="empty-state-icon" />
                        <h3 className="empty-state-title">No Vehicles</h3>
                        <p className="empty-state-description">No vehicles have been registered yet</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                        {vehicles.map((vehicle) => (
                            <div key={vehicle.id} className="card-elevated">
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
                                    {/* Vehicle Icon */}
                                    <div style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: 'var(--radius-md)',
                                        background: 'var(--secondary-light)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0
                                    }}>
                                        <Car size={24} style={{ color: 'var(--secondary)' }} />
                                    </div>

                                    {/* Vehicle Info */}
                                    <div style={{ flex: '1 1 300px', minWidth: 0 }}>
                                        <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: 'var(--space-1)' }}>
                                            {vehicle.name}
                                        </div>
                                        <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>
                                            {vehicle.plateNumber} • {vehicle.year} • {vehicle.tankCapacity}L
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '12px', color: 'var(--text-muted)' }}>
                                            <User size={12} />
                                            <span>{vehicle.ownerName} ({vehicle.ownerEmail})</span>
                                        </div>
                                    </div>

                                    {/* Created Date */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', fontSize: '12px', color: 'var(--text-muted)' }}>
                                        <Calendar size={14} />
                                        <span>{vehicle.createdAt.toLocaleDateString('id-ID')}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
