import { Fuel, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import type { FuelEntry, Vehicle } from '@/lib/types';
import { formatDate, formatRupiah, formatLiters, formatEfficiency } from '@/lib/utils';

interface LastEntryCardProps {
    entry: FuelEntry;
    vehicle?: Vehicle;
}

export default function LastEntryCard({ entry, vehicle }: LastEntryCardProps) {
    const entryDate = entry.date instanceof Date ? entry.date : new Date(entry.date);

    return (
        <Link href={`/history`} className="fuel-entry-card">
            <div className="fuel-entry-icon">
                <Fuel size={20} />
            </div>
            <div className="fuel-entry-content">
                <div className="fuel-entry-date">
                    {formatDate(entryDate)} {vehicle && `• ${vehicle.name}`}
                </div>
                <div className="fuel-entry-details">
                    {formatLiters(entry.liters)} @ {formatRupiah(entry.pricePerLiter)}/L
                </div>
            </div>
            <div className="fuel-entry-amount">
                <div className="fuel-entry-price">
                    {formatRupiah(entry.totalPrice)}
                </div>
                {entry.efficiency && (
                    <div className="fuel-entry-efficiency">
                        {formatEfficiency(entry.efficiency)}
                    </div>
                )}
            </div>
            <ChevronRight size={20} style={{ color: 'var(--text-muted)' }} />
        </Link>
    );
}
