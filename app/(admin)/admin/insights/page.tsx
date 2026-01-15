'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout';
import { useAuth } from '@/contexts';
import { getSystemStats, getUserGrowthData, getEntriesPerMonth } from '@/lib/services/admin';
import type { SystemStats } from '@/lib/types/admin';
import { formatNumber } from '@/lib/utils';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, Fuel, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminInsightsPage() {
    const { user, isAdmin, loading: authLoading } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState<SystemStats | null>(null);
    const [userGrowth, setUserGrowth] = useState<{ month: string; count: number }[]>([]);
    const [entriesData, setEntriesData] = useState<{ month: string; count: number }[]>([]);
    const [loading, setLoading] = useState(true);

    // Redirect if not admin
    useEffect(() => {
        if (!authLoading && (!user || !isAdmin)) {
            router.push('/');
        }
    }, [user, isAdmin, authLoading, router]);

    useEffect(() => {
        async function fetchData() {
            if (!user || !isAdmin) return;

            try {
                setLoading(true);
                const [statsData, growthData, entriesMonthly] = await Promise.all([
                    getSystemStats(),
                    getUserGrowthData(),
                    getEntriesPerMonth()
                ]);

                setStats(statsData);
                setUserGrowth(growthData);
                setEntriesData(entriesMonthly);
            } catch (err) {
                console.error('Error fetching insights:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [user, isAdmin]);

    if (authLoading || loading) {
        return (
            <div className="page">
                <PageHeader title="System Insights" />
                <div className="page-content" style={{ display: 'flex', justifyContent: 'center', paddingTop: 'var(--space-8)' }}>
                    <div className="spinner" style={{ width: '32px', height: '32px' }} />
                </div>
            </div>
        );
    }

    if (!user || !isAdmin) {
        return null;
    }

    return (
        <div className="page">
            <PageHeader
                title="System Insights"
                leftContent={
                    <button
                        className="btn btn-ghost btn-icon"
                        onClick={() => router.push('/admin')}
                        aria-label="Back"
                    >
                        <ArrowLeft size={20} />
                    </button>
                }
            />

            <div className="page-content">
                {/* Summary Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
                    <div className="card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                            <Users size={16} style={{ color: 'var(--primary)' }} />
                            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Total Users</span>
                        </div>
                        <div className="stat-number-sm">{formatNumber(stats?.totalUsers || 0)}</div>
                    </div>

                    <div className="card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                            <Fuel size={16} style={{ color: 'var(--warning)' }} />
                            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Total Entries</span>
                        </div>
                        <div className="stat-number-sm">{formatNumber(stats?.totalFuelEntries || 0)}</div>
                    </div>

                    <div className="card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                            <TrendingUp size={16} style={{ color: 'var(--secondary)' }} />
                            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Active Users</span>
                        </div>
                        <div className="stat-number-sm">{formatNumber(stats?.activeUsers || 0)}</div>
                    </div>
                </div>

                {/* User Growth Chart */}
                <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: 'var(--space-4)' }}>
                        User Growth
                    </h3>
                    {userGrowth.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={userGrowth}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
                                <XAxis
                                    dataKey="month"
                                    stroke="#A1A1AA"
                                    style={{ fontSize: '12px' }}
                                />
                                <YAxis
                                    stroke="#A1A1AA"
                                    style={{ fontSize: '12px' }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        background: '#1C1C1F',
                                        border: '1px solid #27272A',
                                        borderRadius: '8px',
                                        color: '#FAFAFA'
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="count"
                                    stroke="#22C55E"
                                    strokeWidth={2}
                                    dot={{ fill: '#22C55E', r: 4 }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)' }}>
                            No data available
                        </div>
                    )}
                </div>

                {/* Fuel Entries Per Month */}
                <div className="card">
                    <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: 'var(--space-4)' }}>
                        Fuel Entries Per Month
                    </h3>
                    {entriesData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={entriesData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
                                <XAxis
                                    dataKey="month"
                                    stroke="#A1A1AA"
                                    style={{ fontSize: '12px' }}
                                />
                                <YAxis
                                    stroke="#A1A1AA"
                                    style={{ fontSize: '12px' }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        background: '#1C1C1F',
                                        border: '1px solid #27272A',
                                        borderRadius: '8px',
                                        color: '#FAFAFA'
                                    }}
                                />
                                <Bar
                                    dataKey="count"
                                    fill="#F59E0B"
                                    radius={[8, 8, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)' }}>
                            No data available
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
