import { Car, Star, Calendar, Fuel, Edit2, Trash2 } from 'lucide-react';
import type { Vehicle } from '@/lib/types';
import { getFuelTypeName } from '@/lib/utils';

interface VehicleCardProps {
    vehicle: Vehicle;
    onSetActive?: (id: string) => void;
    onEdit?: (id: string) => void;
    onDelete?: (id: string) => void;
}

export default function VehicleCard({
    vehicle,
    onSetActive,
    onEdit,
    onDelete
}: VehicleCardProps) {
    return (
        <div className={`vehicle-card ${vehicle.isActive ? 'active' : ''}`}>
            <div className="vehicle-card-header">
                <div className="vehicle-icon">
                    <Car size={24} />
                </div>
                <div className="vehicle-info">
                    <div className="vehicle-name">
                        {vehicle.name}
                        {vehicle.isActive && (
                            <Star size={16} style={{ color: 'var(--warning)', fill: 'var(--warning)' }} />
                        )}
                    </div>
                    <div className="vehicle-plate">{vehicle.plateNumber}</div>
                </div>
            </div>

            <div className="vehicle-meta">
                <span className="flex items-center gap-1">
                    <Calendar size={14} />
                    {vehicle.year}
                </span>
                <span className="flex items-center gap-1">
                    <Fuel size={14} />
                    {vehicle.tankCapacity}L
                </span>
                <span>{getFuelTypeName(vehicle.defaultFuelType)}</span>
            </div>

            <div className="vehicle-actions">
                {!vehicle.isActive && onSetActive && (
                    <button
                        className="btn btn-secondary"
                        style={{ flex: 1 }}
                        onClick={() => onSetActive(vehicle.id)}
                    >
                        <Star size={16} />
                        Set Aktif
                    </button>
                )}
                {onEdit && (
                    <button
                        className="btn btn-ghost btn-icon"
                        onClick={() => onEdit(vehicle.id)}
                        aria-label="Edit"
                    >
                        <Edit2 size={18} />
                    </button>
                )}
                {onDelete && (
                    <button
                        className="btn btn-ghost btn-icon"
                        onClick={() => onDelete(vehicle.id)}
                        aria-label="Hapus"
                        style={{ color: 'var(--danger)' }}
                    >
                        <Trash2 size={18} />
                    </button>
                )}
            </div>
        </div>
    );
}
