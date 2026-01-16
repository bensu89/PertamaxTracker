'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Car, History, BarChart3, Settings, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts';

const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/vehicles', label: 'Kendaraan', icon: Car },
    { href: '/history', label: 'Riwayat', icon: History },
    { href: '/charts', label: 'Grafik', icon: BarChart3 },
    { href: '/settings', label: 'Akun', icon: Settings },
];

export default function BottomNav() {
    const pathname = usePathname();
    const router = useRouter();
    const { logout } = useAuth();

    const handleLogout = async () => {
        try {
            await logout();
            router.push('/login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    return (
        <nav className="bottom-nav">
            {navItems.map((item) => {
                const isActive = pathname === item.href ||
                    (item.href !== '/' && pathname.startsWith(item.href));
                const Icon = item.icon;

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`nav-item ${isActive ? 'active' : ''}`}
                    >
                        <Icon className="icon" />
                        <span>{item.label}</span>
                    </Link>
                );
            })}
            <button
                className="nav-item"
                onClick={handleLogout}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
                <LogOut className="icon" />
                <span>Keluar</span>
            </button>
        </nav>
    );
}
