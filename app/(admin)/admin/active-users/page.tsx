'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout';
import { useAuth } from '@/contexts';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { formatDate } from '@/lib/utils';
import { ArrowLeft, Activity, User, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ActiveUser {
    userId: string;
    userName: string;
    userEmail: string;
    lastActive: Date;
}

export default function AdminActiveUsersPage() {
    const { user, isAdmin } = useAuth();
    const router = useRouter();
    const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || !isAdmin) {
            router.push('/');
            return;
        }

        async function fetchData() {
            try {
                if (!db) return;

                // Get users active in last 30 days
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

                const usersQuery = query(
                    collection(db, 'users'),
                    where('lastActive', '>=', Timestamp.fromDate(thirtyDaysAgo))
                );

                const usersSnap = await getDocs(usersQuery);
                const users: ActiveUser[] = [];

                usersSnap.forEach(doc => {
                    const data = doc.data();
                    if (data.lastActive) {
                        users.push({
                            userId: doc.id,
                            userName: data.displayName || 'Unknown',
                            userEmail: data.email || '',
                            lastActive: data.lastActive.toDate()
                        });
                    }
                });

                // Sort by most recent activity
                users.sort((a, b) => b.lastActive.getTime() - a.lastActive.getTime());
                setActiveUsers(users);
            } catch (err) {
                console.error('Error fetching data:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [user, isAdmin, router]);

    if (loading) {
        return (
            <div className="page">
                <PageHeader title="Pengguna Aktif" />
                <div className="page-content" style={{ display: 'flex', justifyContent: 'center', paddingTop: 'var(--space-8)' }}>
                    <div className="spinner" style={{ width: '32px', height: '32px' }} />
                </div>
            </div>
        );
    }

    function getActivityStatus(lastActive: Date): { text: string; color: string } {
        const now = new Date();
        const diffHours = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60);

        if (diffHours < 1) return { text: 'Aktif sekarang', color: 'var(--success)' };
        if (diffHours < 24) return { text: 'Aktif hari ini', color: 'var(--primary)' };
        if (diffHours < 168) return { text: 'Minggu ini', color: 'var(--secondary)' };
        return { text: 'Bulan ini', color: 'var(--text-muted)' };
    }

    return (
        <div className="page">
            <PageHeader
                title={`Pengguna Aktif (${activeUsers.length})`}
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
                <div className="card" style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-3)', background: 'var(--surface-elevated)' }}>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        Menampilkan pengguna yang aktif dalam 30 hari terakhir
                    </div>
                </div>

                {activeUsers.length === 0 ? (
                    <div className="empty-state">
                        <Activity className="empty-state-icon" />
                        <h3 className="empty-state-title">Tidak Ada Pengguna Aktif</h3>
                        <p className="empty-state-description">Tidak ada pengguna yang aktif dalam 30 hari terakhir</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                        {activeUsers.map((item) => {
                            const status = getActivityStatus(item.lastActive);
                            return (
                                <div key={item.userId} className="card-elevated">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
                                        {/* Activity Indicator */}
                                        <div style={{
                                            width: '12px',
                                            height: '12px',
                                            borderRadius: '50%',
                                            background: status.color,
                                            flexShrink: 0,
                                            boxShadow: `0 0 8px ${status.color}`
                                        }} />

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

                                        {/* Activity Info */}
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 'var(--space-1)' }}>
                                            <div style={{
                                                fontSize: '12px',
                                                fontWeight: 600,
                                                color: status.color,
                                                padding: '4px 8px',
                                                borderRadius: 'var(--radius-sm)',
                                                background: `${status.color}20`
                                            }}>
                                                {status.text}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', fontSize: '12px', color: 'var(--text-muted)' }}>
                                                <Clock size={12} />
                                                <span>{formatDate(item.lastActive)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
