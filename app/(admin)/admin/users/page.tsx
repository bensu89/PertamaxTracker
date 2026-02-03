'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout';
import { useAuth } from '@/contexts';
import { getAllUsersStats, setUserRole, deleteUser } from '@/lib/services/admin';
import type { UserStats } from '@/lib/types/admin';
import { formatRupiah, formatNumber, formatDate } from '@/lib/utils';
import { Users, Search, Shield, ShieldOff, Car, Fuel, Wallet, ArrowLeft, Clock, Droplets, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminUsersPage() {
    const { user, isAdmin, loading: authLoading } = useAuth();
    const router = useRouter();
    const [users, setUsers] = useState<UserStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
    const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

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
        if (!confirm(`Apakah Anda yakin ingin ${currentRole === 'admin' ? 'mencabut' : 'memberikan'} hak admin?`)) {
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
            alert('Gagal mengubah role pengguna');
        } finally {
            setUpdatingUserId(null);
        }
    };

    const handleDeleteUser = async (userId: string, displayName: string) => {
        if (!confirm(`Apakah Anda yakin ingin menghapus pengguna "${displayName}"?\n\nSemua data pengguna ini akan dihapus termasuk:\n- Kendaraan\n- Riwayat pengisian BBM\n\nTindakan ini tidak dapat dibatalkan!`)) {
            return;
        }

        try {
            setDeletingUserId(userId);
            await deleteUser(userId);

            // Remove from local state
            setUsers(users.filter(u => u.userId !== userId));
            alert('Pengguna berhasil dihapus');
        } catch (err) {
            console.error('Error deleting user:', err);
            alert('Gagal menghapus pengguna');
        } finally {
            setDeletingUserId(null);
        }
    };

    const filteredUsers = users.filter(u =>
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.displayName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Get last active status text
    const getLastActiveText = (lastActive?: { toDate: () => Date }) => {
        if (!lastActive) return 'Belum pernah aktif';

        const date = lastActive.toDate();
        const now = new Date();
        const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

        if (diffHours < 1) return 'Aktif sekarang';
        if (diffHours < 24) return 'Aktif hari ini';
        if (diffHours < 168) return 'Minggu ini';
        return formatDate(date);
    };

    const getLastActiveColor = (lastActive?: { toDate: () => Date }) => {
        if (!lastActive) return 'var(--text-muted)';

        const date = lastActive.toDate();
        const now = new Date();
        const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

        if (diffHours < 1) return 'var(--success)';
        if (diffHours < 24) return 'var(--primary)';
        if (diffHours < 168) return 'var(--secondary)';
        return 'var(--text-muted)';
    };

    if (authLoading || loading) {
        return (
            <div className="page">
                <PageHeader title="Kelola Pengguna" />
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
                title="Kelola Pengguna"
                leftContent={
                    <button
                        className="btn btn-ghost btn-icon"
                        onClick={() => router.push('/admin')}
                        aria-label="Kembali ke Dashboard Admin"
                    >
                        <ArrowLeft size={20} />
                    </button>
                }
            />

            <div className="page-content">
                {/* Summary Stats */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: 'var(--space-3)',
                    marginBottom: 'var(--space-4)'
                }}>
                    <div className="card" style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: 'var(--space-1)' }}>Total Pengguna</div>
                        <div style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{users.length}</div>
                    </div>
                    <div className="card" style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: 'var(--space-1)' }}>Admin</div>
                        <div style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--warning)' }}>
                            {users.filter(u => u.role === 'admin').length}
                        </div>
                    </div>
                </div>

                {/* Search */}
                <div className="card" style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-3)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                        <Search size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                        <input
                            type="text"
                            placeholder="Cari berdasarkan email atau nama..."
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
                        <h3 className="empty-state-title">Tidak Ada Pengguna</h3>
                        <p className="empty-state-description">
                            {searchQuery ? 'Coba kata kunci pencarian lain' : 'Belum ada pengguna terdaftar'}
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                        {filteredUsers.map((userStats) => (
                            <div key={userStats.userId} className="card-elevated">
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
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
                                                <span style={{
                                                    padding: '2px 8px',
                                                    borderRadius: 'var(--radius-sm)',
                                                    background: 'var(--warning)',
                                                    color: 'var(--background)',
                                                    fontSize: '10px',
                                                    fontWeight: 700,
                                                    textTransform: 'uppercase'
                                                }}>
                                                    Admin
                                                </span>
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
                                        <div style={{
                                            display: 'flex',
                                            flexWrap: 'wrap',
                                            gap: 'var(--space-3)',
                                            marginTop: 'var(--space-2)',
                                            fontSize: '12px',
                                            color: 'var(--text-muted)'
                                        }}>
                                            <span>Bergabung {formatDate(userStats.createdAt.toDate())}</span>
                                            <span style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                color: getLastActiveColor(userStats.lastActive)
                                            }}>
                                                <Clock size={12} />
                                                {getLastActiveText(userStats.lastActive)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
                                        <div style={{ textAlign: 'center', minWidth: '60px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', justifyContent: 'center', marginBottom: 'var(--space-1)' }}>
                                                <Car size={14} style={{ color: 'var(--text-muted)' }} />
                                                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Kendaraan</span>
                                            </div>
                                            <div style={{ fontSize: '18px', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                                                {userStats.vehicleCount}
                                            </div>
                                        </div>

                                        <div style={{ textAlign: 'center', minWidth: '60px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', justifyContent: 'center', marginBottom: 'var(--space-1)' }}>
                                                <Fuel size={14} style={{ color: 'var(--text-muted)' }} />
                                                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Pengisian</span>
                                            </div>
                                            <div style={{ fontSize: '18px', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                                                {userStats.entryCount}
                                            </div>
                                        </div>

                                        <div style={{ textAlign: 'center', minWidth: '60px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', justifyContent: 'center', marginBottom: 'var(--space-1)' }}>
                                                <Droplets size={14} style={{ color: 'var(--warning)' }} />
                                                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Liter</span>
                                            </div>
                                            <div style={{ fontSize: '18px', fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--warning)' }}>
                                                {formatNumber(userStats.totalLiters, 1)}
                                            </div>
                                        </div>

                                        <div style={{ textAlign: 'center', minWidth: '80px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', justifyContent: 'center', marginBottom: 'var(--space-1)' }}>
                                                <Wallet size={14} style={{ color: 'var(--text-muted)' }} />
                                                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Pengeluaran</span>
                                            </div>
                                            <div style={{ fontSize: '14px', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                                                {formatRupiah(userStats.totalSpending)}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 'var(--space-2)' }}>
                                        <button
                                            className={userStats.role === 'admin' ? 'btn btn-danger' : 'btn btn-secondary'}
                                            onClick={() => handleToggleAdmin(userStats.userId, userStats.role)}
                                            disabled={updatingUserId === userStats.userId || deletingUserId === userStats.userId || userStats.userId === user.uid}
                                            style={{ minWidth: '120px' }}
                                        >
                                            {updatingUserId === userStats.userId ? (
                                                <div className="spinner" style={{ width: '16px', height: '16px' }} />
                                            ) : (
                                                <>
                                                    {userStats.role === 'admin' ? (
                                                        <>
                                                            <ShieldOff size={16} />
                                                            Cabut Admin
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Shield size={16} />
                                                            Jadikan Admin
                                                        </>
                                                    )}
                                                </>
                                            )}
                                        </button>
                                        <button
                                            className="btn btn-ghost btn-icon"
                                            style={{ color: 'var(--danger)' }}
                                            onClick={() => handleDeleteUser(userStats.userId, userStats.displayName)}
                                            disabled={updatingUserId === userStats.userId || deletingUserId === userStats.userId || userStats.userId === user.uid || userStats.role === 'admin'}
                                            title={userStats.role === 'admin' ? 'Tidak dapat menghapus admin' : 'Hapus pengguna'}
                                        >
                                            {deletingUserId === userStats.userId ? (
                                                <div className="spinner" style={{ width: '16px', height: '16px' }} />
                                            ) : (
                                                <Trash2 size={18} />
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
