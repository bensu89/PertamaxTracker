'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout';
import { useAuth } from '@/contexts';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, deleteDoc, query, where, writeBatch } from 'firebase/firestore';
import { formatNumber } from '@/lib/utils';
import { ArrowLeft, Car, User, Calendar, Trash2 } from 'lucide-react';
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
    const [deletingId, setDeletingId] = useState<string | null>(null);

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

    const handleDeleteVehicle = async (vehicle: VehicleWithOwner) => {
        if (!confirm(`Apakah Anda yakin ingin menghapus kendaraan "${vehicle.name}" (${vehicle.plateNumber})?\n\nSemua riwayat pengisian BBM untuk kendaraan ini juga akan dihapus.\n\nTindakan ini tidak dapat dibatalkan!`)) {
            return;
        }

        try {
            setDeletingId(vehicle.id);
            if (!db) throw new Error('Firestore not initialized');

            const batch = writeBatch(db);

            // Delete all fuel entries for this vehicle
            const entriesQuery = query(
                collection(db, 'fuelEntries'),
                where('vehicleId', '==', vehicle.id)
            );
            const entriesSnap = await getDocs(entriesQuery);
            entriesSnap.forEach(docSnap => {
                batch.delete(doc(db!, 'fuelEntries', docSnap.id));
            });

            // Delete the vehicle
            batch.delete(doc(db, 'vehicles', vehicle.id));

            // Commit the batch
            await batch.commit();

            // Update local state
            setVehicles(vehicles.filter(v => v.id !== vehicle.id));
            alert('Kendaraan berhasil dihapus');
        } catch (err) {
            console.error('Error deleting vehicle:', err);
            alert('Gagal menghapus kendaraan');
        } finally {
            setDeletingId(null);
        }
    };

    if (loading) {
        return (
            <div className="page">
                <PageHeader title="Semua Kendaraan" />
                <div className="page-content" style={{ display: 'flex', justifyContent: 'center', paddingTop: 'var(--space-8)' }}>
                    <div className="spinner" style={{ width: '32px', height: '32px' }} />
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <PageHeader
                title={`Semua Kendaraan (${formatNumber(vehicles.length)})`}
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
                        <h3 className="empty-state-title">Tidak Ada Kendaraan</h3>
                        <p className="empty-state-description">Belum ada kendaraan yang terdaftar</p>
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

                                    {/* Delete Button */}
                                    <button
                                        onClick={() => handleDeleteVehicle(vehicle)}
                                        disabled={deletingId === vehicle.id}
                                        style={{
                                            padding: 'var(--space-2)',
                                            background: 'var(--danger-light)',
                                            border: 'none',
                                            borderRadius: 'var(--radius-md)',
                                            color: 'var(--danger)',
                                            cursor: deletingId === vehicle.id ? 'not-allowed' : 'pointer',
                                            opacity: deletingId === vehicle.id ? 0.5 : 1,
                                            transition: 'all var(--transition-fast)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                        title="Hapus Kendaraan"
                                    >
                                        {deletingId === vehicle.id ? (
                                            <div className="spinner" style={{ width: '18px', height: '18px' }} />
                                        ) : (
                                            <Trash2 size={18} />
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
