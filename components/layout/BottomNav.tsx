'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Car, History, BarChart3 } from 'lucide-react';

const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/vehicles', label: 'Kendaraan', icon: Car },
    { href: '/history', label: 'Riwayat', icon: History },
    { href: '/charts', label: 'Grafik', icon: BarChart3 },
];

export default function BottomNav() {
    const pathname = usePathname();

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
        </nav>
    );
}
