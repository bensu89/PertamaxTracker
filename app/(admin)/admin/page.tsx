'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout';
import { useAuth } from '@/contexts';
import { getSystemStats } from '@/lib/services/admin';
import type { SystemStats } from '@/lib/types/admin';
import { formatRupiah, formatNumber } from '@/lib/utils';
import { Users, Car, Fuel, Wallet, TrendingUp, Activity } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminDashboardPage() {
    const { user, isAdmin, loading: authLoading } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState<SystemStats | null>(null);
    const [loading, setLoading] = useState(true);

    // Redirect if not admin
    useEffect(() => {
        if (!authLoading && (!user || !isAdmin)) {
            router.push('/');
        }
    }, [user, isAdmin, authLoading, router]);

    useEffect(() => {
        async function fetchStats() {
            if (!user || !isAdmin) return;

            try {
                setLoading(true);
                const data = await getSystemStats();
                setStats(data);
            } catch (err) {
                console.error('Error fetching admin stats:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchStats();
    }, [user, isAdmin]);

    if (authLoading || loading) {
        return (
            <div className="page">
                <PageHeader title="Admin Dashboard" />
                <div className="page-content" style={{ display: 'flex', justifyContent: 'center', paddingTop: 'var(--space-8)' }}>
                    <div className="spinner" style={{ width: '32px', height: '32px' }} />
                </div>
            </div>
        );
    }

    if (!user || !isAdmin) {
        return null; // Will redirect
    }

    return (
        <div className="page">
            <PageHeader title="Admin Dashboard" />

            <div className="page-content">
                {/* System Stats Grid */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: 'var(--space-4)',
                        marginBottom: 'var(--space-6)'
                    }}
                >
                    {/* Total Users */}
                    <div className="card-elevated">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-3)' }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: 'var(--radius-md)',
                                background: 'var(--primary-light)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <Users size={24} style={{ color: 'var(--primary)' }} />
                            </div>
                            <div>
                                <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Total Users</div>
                                <div className="stat-number-sm">{formatNumber(stats?.totalUsers || 0)}</div>
                            </div>
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                            +{formatNumber(stats?.newUsersThisMonth || 0)} this month
                        </div>
                    </div>

                    {/* Total Vehicles */}
                    <div className="card-elevated">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-3)' }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: 'var(--radius-md)',
                                background: 'var(--secondary-light)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <Car size={24} style={{ color: 'var(--secondary)' }} />
                            </div>
                            <div>
                                <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Total Vehicles</div>
                                <div className="stat-number-sm">{formatNumber(stats?.totalVehicles || 0)}</div>
                            </div>
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                            Tracked across all users
                        </div>
                    </div>

                    {/* Total Entries */}
                    <div className="card-elevated">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-3)' }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: 'var(--radius-md)',
                                background: 'var(--warning-light)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <Fuel size={24} style={{ color: 'var(--warning)' }} />
                            </div>
                            <div>
                                <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Fuel Entries</div>
                                <div className="stat-number-sm">{formatNumber(stats?.totalFuelEntries || 0)}</div>
                            </div>
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                            All-time total
                        </div>
                    </div>

                    {/* Total Spending */}
                    <div className="card-elevated">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-3)' }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: 'var(--radius-md)',
                                background: 'rgba(34, 197, 94, 0.15)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <Wallet size={24} style={{ color: '#22C55E' }} />
                            </div>
                            <div>
                                <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Total Spending</div>
                                <div className="stat-number-sm" style={{ fontSize: '20px' }}>
                                    {formatRupiah(stats?.totalSpending || 0)}
                                </div>
                            </div>
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                            System-wide
                        </div>
                    </div>

                    {/* Active Users */}
                    <div className="card-elevated">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-3)' }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: 'var(--radius-md)',
                                background: 'rgba(6, 182, 212, 0.15)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <Activity size={24} style={{ color: '#06B6D4' }} />
                            </div>
                            <div>
                                <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Active Users</div>
                                <div className="stat-number-sm">{formatNumber(stats?.activeUsers || 0)}</div>
                            </div>
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                            Last 30 days
                        </div>
                    </div>

                    {/* Avg Entries per User */}
                    <div className="card-elevated">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-3)' }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: 'var(--radius-md)',
                                background: 'rgba(245, 158, 11, 0.15)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <TrendingUp size={24} style={{ color: '#F59E0B' }} />
                            </div>
                            <div>
                                <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Avg Entries/User</div>
                                <div className="stat-number-sm">
                                    {stats && stats.totalUsers > 0
                                        ? formatNumber(stats.totalFuelEntries / stats.totalUsers, 1)
                                        : '0'
                                    }
                                </div>
                            </div>
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                            User engagement metric
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="card" style={{ marginTop: 'var(--space-6)' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: 'var(--space-4)' }}>
                        Quick Actions
                    </h3>
                    <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                        <button
                            className="btn btn-secondary"
                            onClick={() => router.push('/admin/users')}
                        >
                            <Users size={18} />
                            Manage Users
                        </button>
                        <button
                            className="btn btn-secondary"
                            onClick={() => router.push('/admin/insights')}
                        >
                            <TrendingUp size={18} />
                            View Insights
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
