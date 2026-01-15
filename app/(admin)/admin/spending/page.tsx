'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout';
import { useAuth } from '@/contexts';
import { getAllUsersStats } from '@/lib/services/admin';
import type { UserStats } from '@/lib/types/admin';
import { formatRupiah, formatNumber } from '@/lib/utils';
import { ArrowLeft, Wallet, User, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminSpendingPage() {
    const { user, isAdmin } = useAuth();
    const router = useRouter();
    const [users, setUsers] = useState<UserStats[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || !isAdmin) {
            router.push('/');
            return;
        }

        async function fetchData() {
            try {
                const data = await getAllUsersStats();
                // Sort by spending
                data.sort((a, b) => b.totalSpending - a.totalSpending);
                setUsers(data);
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
                <PageHeader title="Spending Per User" />
                <div className="page-content" style={{ display: 'flex', justifyContent: 'center', paddingTop: 'var(--space-8)' }}>
                    <div className="spinner" style={{ width: '32px', height: '32px' }} />
                </div>
            </div>
        );
    }

    const totalSpending = users.reduce((sum, u) => sum + u.totalSpending, 0);
    const avgSpending = users.length > 0 ? totalSpending / users.length : 0;

    return (
        <div className="page">
            <PageHeader
                title="Spending Per User"
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
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>Total Spending</div>
                        <div className="stat-number-sm" style={{ fontSize: '20px' }}>{formatRupiah(totalSpending)}</div>
                    </div>
                    <div className="card">
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>Average per User</div>
                        <div className="stat-number-sm" style={{ fontSize: '20px' }}>{formatRupiah(avgSpending)}</div>
                    </div>
                </div>

                {/* User List */}
                {users.length === 0 ? (
                    <div className="empty-state">
                        <Wallet className="empty-state-icon" />
                        <h3 className="empty-state-title">No Spending Data</h3>
                        <p className="empty-state-description">No spending has been recorded yet</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                        {users.map((item, index) => (
                            <div key={item.userId} className="card-elevated">
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
                                    {/* Rank */}
                                    <div style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '50%',
                                        background: index < 3 ? 'rgba(34, 197, 94, 0.15)' : 'var(--surface-elevated)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 600,
                                        fontSize: '14px',
                                        color: index < 3 ? '#22C55E' : 'var(--text-secondary)',
                                        flexShrink: 0
                                    }}>
                                        {index + 1}
                                    </div>

                                    {/* User Info */}
                                    <div style={{ flex: '1 1 250px', minWidth: 0 }}>
                                        <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: 'var(--space-1)' }}>
                                            {item.displayName}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                            <User size={12} />
                                            <span>{item.email}</span>
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    <div style={{ display: 'flex', gap: 'var(--space-6)', alignItems: 'center' }}>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: 'var(--space-1)' }}>Total Spending</div>
                                            <div style={{ fontSize: '20px', fontWeight: 600, fontFamily: 'var(--font-mono)', color: '#22C55E' }}>
                                                {formatRupiah(item.totalSpending)}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: 'var(--space-1)' }}>Entries</div>
                                            <div style={{ fontSize: '18px', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                                                {formatNumber(item.entryCount)}
                                            </div>
                                        </div>
                                        {item.totalSpending > avgSpending && (
                                            <TrendingUp size={20} style={{ color: 'var(--success)' }} />
                                        )}
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
