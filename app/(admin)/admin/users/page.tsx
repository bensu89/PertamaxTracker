'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout';
import { useAuth } from '@/contexts';
import { getAllUsersStats, setUserRole } from '@/lib/services/admin';
import type { UserStats } from '@/lib/types/admin';
import { formatRupiah, formatNumber, formatDate } from '@/lib/utils';
import { Users, Search, Shield, ShieldOff, Car, Fuel, Wallet, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminUsersPage() {
    const { user, isAdmin, loading: authLoading } = useAuth();
    const router = useRouter();
    const [users, setUsers] = useState<UserStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

    // Redirect if not admin
    useEffect(() => {
        if (!authLoading && (!user || !isAdmin)) {
            router.push('/');
        }
    }, [user, isAdmin, authLoading, router]);

    useEffect(() => {
        async function fetchUsers() {
            if (!user || !isAdmin) return;

            try {
                setLoading(true);
                const data = await getAllUsersStats();
                setUsers(data);
            } catch (err) {
                console.error('Error fetching users:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchUsers();
    }, [user, isAdmin]);

    const handleToggleAdmin = async (userId: string, currentRole: 'user' | 'admin') => {
        if (!confirm(`Are you sure you want to ${currentRole === 'admin' ? 'remove' : 'grant'} admin privileges?`)) {
            return;
        }

        try {
            setUpdatingUserId(userId);
            const newRole = currentRole === 'admin' ? 'user' : 'admin';
            await setUserRole(userId, newRole);

            // Update local state
            setUsers(users.map(u =>
                u.userId === userId ? { ...u, role: newRole } : u
            ));
        } catch (err) {
            console.error('Error updating user role:', err);
            alert('Failed to update user role');
        } finally {
            setUpdatingUserId(null);
        }
    };

    const filteredUsers = users.filter(u =>
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.displayName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (authLoading || loading) {
        return (
            <div className="page">
                <PageHeader title="User Management" />
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
                title="User Management"
                leftContent={
                    <button
                        className="btn btn-ghost btn-icon"
                        onClick={() => router.push('/admin')}
                        aria-label="Back to Admin Dashboard"
                    >
                        <ArrowLeft size={20} />
                    </button>
                }
            />

            <div className="page-content">
                {/* Search */}
                <div className="card" style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-3)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                        <Search size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                        <input
                            type="text"
                            placeholder="Search users by email or name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                flex: 1,
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-primary)',
                                fontSize: '16px',
                                outline: 'none',
                                padding: 'var(--space-2)'
                            }}
                        />
                    </div>
                </div>

                {/* User List */}
                {filteredUsers.length === 0 ? (
                    <div className="empty-state">
                        <Users className="empty-state-icon" />
                        <h3 className="empty-state-title">No Users Found</h3>
                        <p className="empty-state-description">
                            {searchQuery ? 'Try a different search query' : 'No users registered yet'}
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                        {filteredUsers.map((userStats) => (
                            <div key={userStats.userId} className="card-elevated">
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--space-4)',
                                    flexWrap: 'wrap'
                                }}>
                                    {/* User Info */}
                                    <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 'var(--space-2)',
                                            marginBottom: 'var(--space-1)'
                                        }}>
                                            <span style={{
                                                fontSize: '16px',
                                                fontWeight: 600,
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                {userStats.displayName || 'Unknown'}
                                            </span>
                                            {userStats.role === 'admin' && (
                                                <Shield size={16} style={{ color: 'var(--warning)', flexShrink: 0 }} />
                                            )}
                                        </div>
                                        <div style={{
                                            fontSize: '14px',
                                            color: 'var(--text-secondary)',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {userStats.email}
                                        </div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 'var(--space-1)' }}>
                                            Joined {formatDate(userStats.createdAt.toDate())}
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', justifyContent: 'center', marginBottom: 'var(--space-1)' }}>
                                                <Car size={14} style={{ color: 'var(--text-muted)' }} />
                                                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Vehicles</span>
                                            </div>
                                            <div style={{ fontSize: '18px', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                                                {userStats.vehicleCount}
                                            </div>
                                        </div>

                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', justifyContent: 'center', marginBottom: 'var(--space-1)' }}>
                                                <Fuel size={14} style={{ color: 'var(--text-muted)' }} />
                                                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Entries</span>
                                            </div>
                                            <div style={{ fontSize: '18px', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                                                {userStats.entryCount}
                                            </div>
                                        </div>

                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', justifyContent: 'center', marginBottom: 'var(--space-1)' }}>
                                                <Wallet size={14} style={{ color: 'var(--text-muted)' }} />
                                                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Spending</span>
                                            </div>
                                            <div style={{ fontSize: '14px', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                                                {formatRupiah(userStats.totalSpending)}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div style={{ marginLeft: 'auto' }}>
                                        <button
                                            className={userStats.role === 'admin' ? 'btn btn-danger' : 'btn btn-secondary'}
                                            onClick={() => handleToggleAdmin(userStats.userId, userStats.role)}
                                            disabled={updatingUserId === userStats.userId || userStats.userId === user.uid}
                                            style={{ minWidth: '120px' }}
                                        >
                                            {updatingUserId === userStats.userId ? (
                                                <div className="spinner" style={{ width: '16px', height: '16px' }} />
                                            ) : (
                                                <>
                                                    {userStats.role === 'admin' ? (
                                                        <>
                                                            <ShieldOff size={16} />
                                                            Remove Admin
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Shield size={16} />
                                                            Make Admin
                                                        </>
                                                    )}
                                                </>
                                            )}
                                        </button>
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
