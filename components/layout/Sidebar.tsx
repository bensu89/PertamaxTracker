'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    Home,
    Car,
    Fuel,
    History,
    BarChart3,
    Settings,
    LogOut,
    Droplets
} from 'lucide-react';
import { useAuth } from '@/contexts';

const mainNavItems = [
    { href: '/', label: 'Dashboard', icon: Home },
    { href: '/vehicles', label: 'Kendaraan', icon: Car },
    { href: '/fuel/new', label: 'Pengisian', icon: Fuel },
    { href: '/history', label: 'Riwayat', icon: History },
    { href: '/charts', label: 'Laporan', icon: BarChart3 },
];

const bottomNavItems = [
    { href: '/settings', label: 'Pengaturan', icon: Settings },
];

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { logout, user } = useAuth();

    const handleLogout = async () => {
        try {
            await logout();
            router.push('/login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    return (
        <aside className="sidebar">
            {/* Logo */}
            <div className="sidebar-logo">
                <Droplets className="logo-icon" />
                <span className="logo-text">
                    <span style={{ color: 'var(--primary)' }}>Pertamax</span>Tracker
                </span>
            </div>

            {/* User Info */}
            {user && (
                <div
                    style={{
                        padding: 'var(--space-3) var(--space-4)',
                        marginBottom: 'var(--space-4)',
                        background: 'var(--surface-elevated)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '13px'
                    }}
                >
                    <div style={{ fontWeight: 500, marginBottom: '2px' }}>
                        {user.displayName || 'User'}
                    </div>
                    <div className="text-muted" style={{ fontSize: '12px' }}>
                        {user.email}
                    </div>
                </div>
            )}

            {/* Main Navigation */}
            <nav className="sidebar-nav">
                {mainNavItems.map((item) => {
                    const isActive = pathname === item.href ||
                        (item.href !== '/' && pathname.startsWith(item.href));
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`sidebar-item ${isActive ? 'active' : ''}`}
                        >
                            <Icon size={20} />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom Navigation */}
            <div className="sidebar-nav" style={{ marginTop: 'auto' }}>
                {bottomNavItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`sidebar-item ${isActive ? 'active' : ''}`}
                        >
                            <Icon size={20} />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}

                <button
                    className="sidebar-item"
                    style={{ width: '100%', border: 'none', cursor: 'pointer', background: 'transparent' }}
                    onClick={handleLogout}
                >
                    <LogOut size={20} />
                    <span>Keluar</span>
                </button>
            </div>
        </aside>
    );
}
