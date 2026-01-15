import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
    label: string;
    value: string | number;
    unit?: string;
    icon?: LucideIcon;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    className?: string;
}

export default function StatCard({
    label,
    value,
    unit,
    icon: Icon,
    trend,
    className
}: StatCardProps) {
    return (
        <div className={cn('stat-card', className)}>
            <div className="stat-card-header">
                {Icon && <Icon className="stat-card-icon" size={18} />}
                <span className="stat-card-label">{label}</span>
            </div>
            <div className="stat-card-value">
                {value}
                {unit && <span className="stat-card-unit"> {unit}</span>}
            </div>
            {trend && (
                <div className={`stat-card-trend ${trend.isPositive ? 'up' : 'down'}`}>
                    {trend.isPositive ? '▲' : '▼'} {Math.abs(trend.value).toFixed(1)}%
                    <span style={{ color: 'var(--text-muted)', marginLeft: '4px' }}>vs bulan lalu</span>
                </div>
            )}
        </div>
    );
}
