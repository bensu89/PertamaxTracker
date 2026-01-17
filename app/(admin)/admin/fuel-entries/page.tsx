'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout';
import { useAuth } from '@/contexts';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, deleteDoc, query, where } from 'firebase/firestore';
import { formatNumber } from '@/lib/utils';
import { ArrowLeft, Fuel, User, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { FuelEntry } from '@/lib/types';

interface UserFuelData {
    userId: string;
    userName: string;
    userEmail: string;
    totalLiters: number;
    entryCount: number;
    fuelTypes: { [key: string]: number }; // fuel type -> liters
    entries?: (FuelEntry & { id: string })[]; // Individual entries
}

export default function AdminFuelEntriesPage() {
    const { user, isAdmin } = useAuth();
    const router = useRouter();
    const [userData, setUserData] = useState<UserFuelData[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
    const [deletingEntry, setDeletingEntry] = useState<string | null>(null);

    useEffect(() => {
        if (!user || !isAdmin) {
            router.push('/');
            return;
        }

        async function fetchData() {
            try {
                if (!db) return;

                // Fetch all fuel entries
                const entriesSnap = await getDocs(collection(db, 'fuelEntries'));
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

                // Aggregate by user
                const userDataMap = new Map<string, UserFuelData>();
                entriesSnap.forEach(doc => {
                    const data = doc.data();
                    const userId = data.userId;
                    const liters = data.liters || 0;
                    const fuelType = data.fuelType || 'Unknown';

                    if (!userDataMap.has(userId)) {
                        const userData = usersMap.get(userId);
                        userDataMap.set(userId, {
                            userId,
                            userName: userData?.displayName || 'Unknown',
                            userEmail: userData?.email || '',
                            totalLiters: 0,
                            entryCount: 0,
                            fuelTypes: {}
                        });
                    }

                    const current = userDataMap.get(userId)!;
                    current.totalLiters += liters;
                    current.entryCount += 1;

                    // Track fuel types
                    if (!current.fuelTypes[fuelType]) {
                        current.fuelTypes[fuelType] = 0;
                    }
                    current.fuelTypes[fuelType] += liters;
                });

                const userDataArray = Array.from(userDataMap.values());
                userDataArray.sort((a, b) => b.totalLiters - a.totalLiters);
                setUserData(userDataArray);
            } catch (err) {
                console.error('Error fetching data:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [user, isAdmin, router]);

    const toggleUserExpansion = async (userId: string) => {
        const newExpanded = new Set(expandedUsers);

        if (newExpanded.has(userId)) {
            newExpanded.delete(userId);
        } else {
            newExpanded.add(userId);

            // Fetch entries for this user if not already loaded
            const userDataItem = userData.find(u => u.userId === userId);
            if (userDataItem && !userDataItem.entries) {
                try {
                    const q = query(collection(db!, 'fuelEntries'), where('userId', '==', userId));
                    const entriesSnap = await getDocs(q);
                    const entries: (FuelEntry & { id: string })[] = [];

                    entriesSnap.forEach(docSnap => {
                        const data = docSnap.data() as FuelEntry;
                        entries.push({
                            ...data,
                            id: docSnap.id
                        });
                    });

                    // Sort by date descending
                    entries.sort((a, b) => {
                        const dateA = a.date instanceof Date ? a.date : new Date(a.date);
                        const dateB = b.date instanceof Date ? b.date : new Date(b.date);
                        return dateB.getTime() - dateA.getTime();
                    });

                    // Update userData with entries
                    setUserData(prev => prev.map(u =>
                        u.userId === userId ? { ...u, entries } : u
                    ));
                } catch (err) {
                    console.error('Error fetching user entries:', err);
                }
            }
        }

        setExpandedUsers(newExpanded);
    };

    const handleDeleteEntry = async (entryId: string, userId: string) => {
        if (!confirm('Apakah Anda yakin ingin menghapus entry ini?')) return;

        try {
            setDeletingEntry(entryId);
            await deleteDoc(doc(db!, 'fuelEntries', entryId));

            // Remove from local state
            setUserData(prev => prev.map(u => {
                if (u.userId === userId && u.entries) {
                    const newEntries = u.entries.filter(e => e.id !== entryId);
                    const deletedEntry = u.entries.find(e => e.id === entryId);

                    if (deletedEntry) {
                        return {
                            ...u,
                            entries: newEntries,
                            entryCount: u.entryCount - 1,
                            totalLiters: u.totalLiters - (deletedEntry.liters || 0),
                            fuelTypes: {
                                ...u.fuelTypes,
                                [deletedEntry.fuelType]: (u.fuelTypes[deletedEntry.fuelType] || 0) - (deletedEntry.liters || 0)
                            }
                        };
                    }
                }
                return u;
            }));
        } catch (err) {
            console.error('Error deleting entry:', err);
            alert('Gagal menghapus entry');
        } finally {
            setDeletingEntry(null);
        }
    };

    if (loading) {
        return (
            <div className="page">
                <PageHeader title="Fuel Entries Per User" />
                <div className="page-content" style={{ display: 'flex', justifyContent: 'center', paddingTop: 'var(--space-8)' }}>
                    <div className="spinner" style={{ width: '32px', height: '32px' }} />
                </div>
            </div>
        );
    }

    const totalLiters = userData.reduce((sum, u) => sum + u.totalLiters, 0);
    const totalEntries = userData.reduce((sum, u) => sum + u.entryCount, 0);

    return (
        <div className="page">
            <PageHeader
                title="Fuel Entries Per User"
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
                {/* Summary */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
                    <div className="card">
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>Total Liters</div>
                        <div className="stat-number-sm">{formatNumber(totalLiters, 1)} L</div>
                    </div>
                    <div className="card">
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>Total Entries</div>
                        <div className="stat-number-sm">{formatNumber(totalEntries)}</div>
                    </div>
                    <div className="card">
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>Avg per User</div>
                        <div className="stat-number-sm">{userData.length > 0 ? formatNumber(totalLiters / userData.length, 1) : 0} L</div>
                    </div>
                </div>

                {/* User List */}
                {userData.length === 0 ? (
                    <div className="empty-state">
                        <Fuel className="empty-state-icon" />
                        <h3 className="empty-state-title">No Fuel Entries</h3>
                        <p className="empty-state-description">No fuel entries have been recorded yet</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                        {userData.map((item, index) => {
                            const isExpanded = expandedUsers.has(item.userId);

                            return (
                                <div key={item.userId} className="card-elevated">
                                    <div
                                        style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap', cursor: 'pointer' }}
                                        onClick={() => toggleUserExpansion(item.userId)}
                                    >
                                        {/* Rank */}
                                        <div style={{
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '50%',
                                            background: index < 3 ? 'var(--primary-light)' : 'var(--surface-elevated)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: 600,
                                            fontSize: '14px',
                                            color: index < 3 ? 'var(--primary)' : 'var(--text-secondary)',
                                            flexShrink: 0
                                        }}>
                                            {index + 1}
                                        </div>

                                        {/* User Info */}
                                        <div style={{ flex: '1 1 250px', minWidth: 0 }}>
                                            <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: 'var(--space-1)' }}>
                                                {item.userName}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                                <User size={12} />
                                                <span>{item.userEmail}</span>
                                            </div>
                                        </div>

                                        {/* Stats */}
                                        <div style={{ display: 'flex', gap: 'var(--space-6)' }}>
                                            <div style={{ textAlign: 'center' }}>
                                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: 'var(--space-1)' }}>Total Liters</div>
                                                <div style={{ fontSize: '20px', fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--warning)' }}>
                                                    {formatNumber(item.totalLiters, 1)} L
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'center' }}>
                                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: 'var(--space-1)' }}>Entries</div>
                                                <div style={{ fontSize: '20px', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                                                    {formatNumber(item.entryCount)}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Expand Icon */}
                                        <div style={{ marginLeft: 'auto' }}>
                                            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                        </div>
                                    </div>

                                    {/* Fuel Types Breakdown */}
                                    {Object.keys(item.fuelTypes).length > 0 && (
                                        <div style={{
                                            marginTop: 'var(--space-3)',
                                            paddingTop: 'var(--space-3)',
                                            borderTop: '1px solid var(--border)',
                                            display: 'flex',
                                            flexWrap: 'wrap',
                                            gap: 'var(--space-2)'
                                        }}>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', width: '100%', marginBottom: 'var(--space-1)' }}>
                                                Jenis Bahan Bakar:
                                            </div>
                                            {Object.entries(item.fuelTypes)
                                                .sort(([, a], [, b]) => b - a)
                                                .map(([fuelType, liters]) => (
                                                    <div
                                                        key={fuelType}
                                                        style={{
                                                            padding: '4px 12px',
                                                            borderRadius: 'var(--radius-sm)',
                                                            background: 'var(--surface-elevated)',
                                                            fontSize: '13px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 'var(--space-2)'
                                                        }}
                                                    >
                                                        <span style={{ fontWeight: 600 }}>{fuelType}</span>
                                                        <span style={{ color: 'var(--text-muted)' }}>•</span>
                                                        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--warning)' }}>
                                                            {formatNumber(liters, 1)} L
                                                        </span>
                                                    </div>
                                                ))
                                            }
                                        </div>
                                    )}

                                    {/* Individual Entries */}
                                    {isExpanded && item.entries && (
                                        <div style={{
                                            marginTop: 'var(--space-4)',
                                            paddingTop: 'var(--space-4)',
                                            borderTop: '2px solid var(--border)'
                                        }}>
                                            <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: 'var(--space-3)' }}>
                                                Detail Pengisian ({item.entries.length})
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                                                {item.entries.map(entry => (
                                                    <div
                                                        key={entry.id}
                                                        style={{
                                                            padding: 'var(--space-3)',
                                                            background: 'var(--surface)',
                                                            borderRadius: 'var(--radius-md)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 'var(--space-3)',
                                                            fontSize: '13px'
                                                        }}
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 'var(--space-2)' }}>
                                                            <div>
                                                                <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Tanggal</div>
                                                                <div style={{ fontWeight: 500 }}>
                                                                    {(() => {
                                                                        let date: Date;
                                                                        if (entry.date instanceof Date) {
                                                                            date = entry.date;
                                                                        } else if (typeof (entry.date as any)?.toDate === 'function') {
                                                                            date = (entry.date as any).toDate();
                                                                        } else {
                                                                            date = new Date(entry.date);
                                                                        }
                                                                        return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
                                                                    })()}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Liter</div>
                                                                <div style={{ fontWeight: 500, color: 'var(--warning)' }}>{formatNumber(entry.liters, 1)} L</div>
                                                            </div>
                                                            <div>
                                                                <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Total</div>
                                                                <div style={{ fontWeight: 500 }}>Rp {formatNumber(entry.totalPrice)}</div>
                                                            </div>
                                                            <div>
                                                                <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>BBM</div>
                                                                <div style={{ fontWeight: 500, textTransform: 'capitalize' }}>{entry.fuelType}</div>
                                                            </div>
                                                        </div>
                                                        <button
                                                            className="btn btn-ghost btn-icon"
                                                            style={{ color: 'var(--danger)' }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteEntry(entry.id, item.userId);
                                                            }}
                                                            disabled={deletingEntry === entry.id}
                                                        >
                                                            {deletingEntry === entry.id ? (
                                                                <div className="spinner" style={{ width: '18px', height: '18px' }} />
                                                            ) : (
                                                                <Trash2 size={18} />
                                                            )}
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
