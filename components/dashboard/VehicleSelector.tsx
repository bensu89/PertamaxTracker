'use client';

import { ChevronDown, Check } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import type { Vehicle } from '@/lib/types';

interface VehicleSelectorProps {
    vehicles: Vehicle[];
    selectedId?: string;
    onSelect: (vehicleId: string) => void;
}

export default function VehicleSelector({ vehicles, selectedId, onSelect }: VehicleSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedVehicle = vehicles.find(v => v.id === selectedId);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (vehicles.length === 0) {
        return (
            <div className="card" style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
                <p className="text-muted">Belum ada kendaraan terdaftar</p>
            </div>
        );
    }

    return (
        <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="card flex items-center justify-between w-full"
                style={{ cursor: 'pointer' }}
            >
                <div className="flex items-center gap-3">
                    <span style={{ fontSize: '24px' }}>🚗</span>
                    <div style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: 600 }}>
                            {selectedVehicle?.name || 'Pilih Kendaraan'}
                        </div>
                        {selectedVehicle && (
                            <div className="text-muted" style={{ fontSize: '13px' }}>
                                {selectedVehicle.plateNumber}
                            </div>
                        )}
                    </div>
                </div>
                <ChevronDown
                    size={20}
                    style={{
                        color: 'var(--text-muted)',
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease'
                    }}
                />
            </button>

            {isOpen && (
                <div
                    className="card-elevated"
                    style={{
                        position: 'absolute',
                        top: 'calc(100% + 8px)',
                        left: 0,
                        right: 0,
                        zIndex: 100,
                        padding: 'var(--space-2)',
                        maxHeight: '300px',
                        overflowY: 'auto',
                    }}
                >
                    {vehicles.map(vehicle => (
                        <button
                            key={vehicle.id}
                            onClick={() => {
                                onSelect(vehicle.id);
                                setIsOpen(false);
                            }}
                            className="flex items-center justify-between w-full"
                            style={{
                                padding: 'var(--space-3)',
                                borderRadius: 'var(--radius-md)',
                                background: vehicle.id === selectedId ? 'var(--primary-light)' : 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                textAlign: 'left',
                                color: 'var(--text-primary)',
                                transition: 'background 0.15s ease',
                            }}
                            onMouseEnter={(e) => {
                                if (vehicle.id !== selectedId) {
                                    e.currentTarget.style.background = 'var(--surface-elevated)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (vehicle.id !== selectedId) {
                                    e.currentTarget.style.background = 'transparent';
                                }
                            }}
                        >
                            <div className="flex items-center gap-3">
                                <span style={{ fontSize: '20px' }}>🚗</span>
                                <div>
                                    <div style={{ fontWeight: 500 }}>{vehicle.name}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                        {vehicle.plateNumber} • {vehicle.year}
                                    </div>
                                </div>
                            </div>
                            {vehicle.id === selectedId && (
                                <Check size={18} style={{ color: 'var(--primary)' }} />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
