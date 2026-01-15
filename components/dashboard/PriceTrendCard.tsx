'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatRupiah } from '@/lib/utils';

interface PriceTrendCardProps {
    currentPrice: number;
    previousPrice: number;
    fuelType?: string;
}

export default function PriceTrendCard({
    currentPrice,
    previousPrice,
    fuelType = 'Pertamax'
}: PriceTrendCardProps) {
    const priceDiff = currentPrice - previousPrice;
    const percentChange = previousPrice > 0
        ? ((priceDiff / previousPrice) * 100)
        : 0;
    const isUp = priceDiff > 0;

    return (
        <div className="card">
            <div className="flex items-center justify-between mb-4">
                <h3 style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>
                    📈 Harga {fuelType}
                </h3>
                <div
                    className={`badge ${isUp ? 'badge-danger' : 'badge-primary'}`}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                    {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {isUp ? '+' : ''}{percentChange.toFixed(1)}%
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Sebelumnya</div>
                    <div style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '16px',
                        textDecoration: 'line-through',
                        color: 'var(--text-muted)'
                    }}>
                        {formatRupiah(previousPrice)}
                    </div>
                </div>
                <div style={{ fontSize: '24px', color: 'var(--text-muted)' }}>→</div>
                <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Saat Ini</div>
                    <div style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '20px',
                        fontWeight: 600,
                        color: isUp ? 'var(--danger)' : 'var(--primary)'
                    }}>
                        {formatRupiah(currentPrice)}
                    </div>
                </div>
            </div>

            {/* Mini Sparkline Placeholder */}
            <div
                style={{
                    height: '40px',
                    marginTop: 'var(--space-4)',
                    background: 'linear-gradient(to right, var(--primary-light), transparent)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'flex-end',
                    padding: '0 4px 4px',
                    gap: '2px'
                }}
            >
                {[35, 42, 38, 45, 50, 48, 55, 52, 58, 62, 60, 65].map((h, i) => (
                    <div
                        key={i}
                        style={{
                            flex: 1,
                            height: `${h}%`,
                            background: i === 11 ? 'var(--primary)' : 'rgba(34, 197, 94, 0.4)',
                            borderRadius: '2px',
                        }}
                    />
                ))}
            </div>
        </div>
    );
}
