'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout';
import { useAuth } from '@/contexts';
import { getSystemStats } from '@/lib/services/admin';
import type { SystemStats } from '@/lib/types/admin';
import { formatRupiah, formatNumber } from '@/lib/utils';
import { Users, Car, Fuel, Wallet, TrendingUp, Activity, Settings, LogOut, RefreshCw, Clock, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';

interface RecentActivity {
    id: string;
    type: 'user_registered' | 'fuel_entry';
    userName: string;
    userEmail?: string;
    fuelType?: string;
    liters?: number;
    timestamp: Date;
}

interface FuelDistribution {
    fuelType: string;
    count: number;
    totalLiters: number;
    percentage: number;
}

export default function AdminDashboardPage() {
    const { user, isAdmin, loading: authLoading, logout } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState<SystemStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
    const [fuelDistribution, setFuelDistribution] = useState<FuelDistribution[]>([]);

    // Redirect if not admin
    useEffect(() => {
        if (!authLoading && (!user || !isAdmin)) {
            router.push('/');
        }
    }, [user, isAdmin, authLoading, router]);

    // Auto-refresh interval (30 seconds)
    const REFRESH_INTERVAL = 30000;
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const fetchStats = async () => {
        if (!user || !isAdmin) return;

        try {
            const data = await getSystemStats();
            setStats(data);
            setLastUpdated(new Date());

            // Fetch recent activities
            await fetchRecentActivities();

            // Fetch fuel distribution
            await fetchFuelDistribution();
        } catch (err) {
            console.error('Error fetching admin stats:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchRecentActivities = async () => {
        try {
            const activities: RecentActivity[] = [];

            // Get recent fuel entries
            const entriesQuery = query(
                collection(db!, 'fuelEntries'),
                orderBy('createdAt', 'desc'),
                limit(10)
            );
            const entriesSnap = await getDocs(entriesQuery);

            // Get users map
            const usersSnap = await getDocs(collection(db!, 'users'));
            const usersMap = new Map();
            usersSnap.forEach(doc => {
                const data = doc.data();
                usersMap.set(doc.id, {
                    displayName: data.displayName || 'Unknown',
                    email: data.email || ''
                });
            });

            entriesSnap.forEach(doc => {
                const data = doc.data();
                const userData = usersMap.get(data.userId);
                activities.push({
                    id: doc.id,
                    type: 'fuel_entry',
                    userName: userData?.displayName || 'Unknown',
                    userEmail: userData?.email,
                    fuelType: data.fuelType,
                    liters: data.liters,
                    timestamp: data.createdAt?.toDate() || new Date()
                });
            });

            setRecentActivities(activities.slice(0, 10));
        } catch (err) {
            console.error('Error fetching activities:', err);
        }
    };

    const fetchFuelDistribution = async () => {
        try {
            const entriesSnap = await getDocs(collection(db!, 'fuelEntries'));
            const fuelMap = new Map<string, { count: number; totalLiters: number }>();
            let totalEntries = 0;

            entriesSnap.forEach(doc => {
                const data = doc.data();
                const fuelType = data.fuelType || 'unknown';
                const liters = data.liters || 0;

                if (!fuelMap.has(fuelType)) {
                    fuelMap.set(fuelType, { count: 0, totalLiters: 0 });
                }

                const current = fuelMap.get(fuelType)!;
                current.count += 1;
                current.totalLiters += liters;
                totalEntries += 1;
            });

            const distribution: FuelDistribution[] = Array.from(fuelMap.entries()).map(([fuelType, data]) => ({
                fuelType,
                count: data.count,
                totalLiters: data.totalLiters,
                percentage: (data.count / totalEntries) * 100
            }));

            distribution.sort((a, b) => b.count - a.count);
            setFuelDistribution(distribution);
        } catch (err) {
            console.error('Error fetching fuel distribution:', err);
        }
    };

    // Initial fetch
    useEffect(() => {
        if (user && isAdmin) {
            setLoading(true);
            fetchStats();
        }
    }, [user, isAdmin]);

    // Auto-refresh
    useEffect(() => {
        if (!user || !isAdmin) return;

        const interval = setInterval(() => {
            fetchStats();
        }, REFRESH_INTERVAL);

        return () => clearInterval(interval);
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
            <PageHeader
                title="Admin Dashboard"
                rightContent={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                        {lastUpdated && (
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                Updated: {lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        )}
                        <button
                            className="btn btn-ghost btn-icon"
                            onClick={() => {
                                setLoading(true);
                                fetchStats();
                            }}
                            title="Refresh data"
                            style={{ padding: '6px' }}
                        >
                            <RefreshCw size={18} />
                        </button>
                        <button
                            className="btn btn-ghost btn-icon"
                            onClick={() => router.push('/settings')}
                            title="Pengaturan"
                            style={{ padding: '6px' }}
                        >
                            <Settings size={18} />
                        </button>
                        <button
                            className="btn btn-ghost btn-icon"
                            onClick={async () => {
                                try {
                                    await logout();
                                    router.push('/login');
                                } catch (error) {
                                    console.error('Logout error:', error);
                                }
                            }}
                            title="Keluar"
                            style={{ padding: '6px', color: 'var(--danger)' }}
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                }
            />

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
                    <div
                        className="card-elevated"
                        onClick={() => router.push('/admin/users')}
                        style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
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
                            +{formatNumber(stats?.newUsersThisMonth || 0)} this month • Click to view
                        </div>
                    </div>

                    {/* Total Vehicles */}
                    <div
                        className="card-elevated"
                        onClick={() => router.push('/admin/vehicles')}
                        style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
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
                            Tracked across all users • Click to view
                        </div>
                    </div>

                    {/* Total Entries */}
                    <div
                        className="card-elevated"
                        onClick={() => router.push('/admin/fuel-entries')}
                        style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
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
                            All-time total • Click to view per user
                        </div>
                    </div>

                    {/* Total Spending */}
                    <div
                        className="card-elevated"
                        onClick={() => router.push('/admin/spending')}
                        style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
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
                            System-wide • Click to view per user
                        </div>
                    </div>


                    {/* Avg Entries per User */}
                    <div
                        className="card-elevated"
                        onClick={() => router.push('/admin/users')}
                        style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
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
                            User engagement metric • Click to view users
                        </div>
                    </div>
                </div>

                {/* Recent Activity & Fuel Distribution */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 'var(--space-4)', marginTop: 'var(--space-6)' }}>
                    {/* Recent Activity Log */}
                    <div className="card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
                            <Activity size={20} style={{ color: 'var(--primary)' }} />
                            <h3 style={{ fontSize: '18px', fontWeight: 600 }}>Recent Activity</h3>
                        </div>

                        {recentActivities.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--text-muted)' }}>
                                <Activity size={32} style={{ opacity: 0.3, margin: '0 auto var(--space-2)' }} />
                                <p>No recent activity</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                                {recentActivities.map(activity => (
                                    <div
                                        key={activity.id}
                                        style={{
                                            padding: 'var(--space-3)',
                                            background: 'var(--surface)',
                                            borderRadius: 'var(--radius-md)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 'var(--space-3)'
                                        }}
                                    >
                                        <div style={{
                                            width: '36px',
                                            height: '36px',
                                            borderRadius: '50%',
                                            background: 'var(--warning-light)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0
                                        }}>
                                            <Fuel size={18} style={{ color: 'var(--warning)' }} />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '2px' }}>
                                                {activity.userName}
                                            </div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                                Added {formatNumber(activity.liters || 0, 2)}L {activity.fuelType}
                                            </div>
                                        </div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'right', flexShrink: 0 }}>
                                            <Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                            {activity.timestamp.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Fuel Type Distribution */}
                    <div className="card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
                            <TrendingUp size={20} style={{ color: 'var(--warning)' }} />
                            <h3 style={{ fontSize: '18px', fontWeight: 600 }}>Fuel Distribution</h3>
                        </div>

                        {fuelDistribution.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--text-muted)' }}>
                                <Fuel size={32} style={{ opacity: 0.3, margin: '0 auto var(--space-2)' }} />
                                <p>No fuel data</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                                {fuelDistribution.map((item, index) => (
                                    <div key={item.fuelType}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                                <div style={{
                                                    width: '8px',
                                                    height: '8px',
                                                    borderRadius: '50%',
                                                    background: index === 0 ? 'var(--primary)' : index === 1 ? 'var(--warning)' : index === 2 ? 'var(--secondary)' : 'var(--text-muted)'
                                                }} />
                                                <span style={{ fontSize: '14px', fontWeight: 500, textTransform: 'capitalize' }}>
                                                    {item.fuelType}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                                                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                                                    {formatNumber(item.totalLiters, 1)}L
                                                </span>
                                                <span style={{ fontSize: '14px', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                                                    {item.percentage.toFixed(1)}%
                                                </span>
                                            </div>
                                        </div>
                                        <div style={{
                                            width: '100%',
                                            height: '6px',
                                            background: 'var(--surface)',
                                            borderRadius: '3px',
                                            overflow: 'hidden'
                                        }}>
                                            <div style={{
                                                width: `${item.percentage}%`,
                                                height: '100%',
                                                background: index === 0 ? 'var(--primary)' : index === 1 ? 'var(--warning)' : index === 2 ? 'var(--secondary)' : 'var(--text-muted)',
                                                transition: 'width 0.3s ease'
                                            }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
