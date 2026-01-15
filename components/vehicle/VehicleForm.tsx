'use client';

import { useState } from 'react';
import { Car, Hash, Calendar, Fuel, Save } from 'lucide-react';
import type { VehicleFormData, FuelType } from '@/lib/types';
import { formatPlateNumber, isValidPlateNumber } from '@/lib/utils';

interface VehicleFormProps {
    initialData?: Partial<VehicleFormData>;
    onSubmit: (data: VehicleFormData) => void;
    onCancel?: () => void;
    isLoading?: boolean;
}

const fuelTypes: { value: FuelType; label: string }[] = [
    { value: 'pertamax', label: 'Pertamax' },
    { value: 'pertamax-turbo', label: 'Pertamax Turbo' },
    { value: 'pertalite', label: 'Pertalite' },
    { value: 'solar', label: 'Solar' },
    { value: 'dexlite', label: 'Dexlite' },
];

const currentYear = new Date().getFullYear();

export default function VehicleForm({
    initialData,
    onSubmit,
    onCancel,
    isLoading = false
}: VehicleFormProps) {
    const [formData, setFormData] = useState<VehicleFormData>({
        name: initialData?.name || '',
        plateNumber: initialData?.plateNumber || '',
        year: initialData?.year || currentYear,
        tankCapacity: initialData?.tankCapacity || 0,
        defaultFuelType: initialData?.defaultFuelType || 'pertamax',
    });

    const [errors, setErrors] = useState<Partial<Record<keyof VehicleFormData, string>>>({});

    const validate = (): boolean => {
        const newErrors: typeof errors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Nama kendaraan wajib diisi';
        }

        if (!formData.plateNumber.trim()) {
            newErrors.plateNumber = 'Plat nomor wajib diisi';
        } else if (!isValidPlateNumber(formData.plateNumber)) {
            newErrors.plateNumber = 'Format plat nomor tidak valid';
        }

        if (formData.year < 1990 || formData.year > currentYear) {
            newErrors.year = `Tahun harus antara 1990 - ${currentYear}`;
        }

        if (formData.tankCapacity <= 0 || formData.tankCapacity > 100) {
            newErrors.tankCapacity = 'Kapasitas tangki harus 1-100 liter';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            onSubmit({
                ...formData,
                plateNumber: formatPlateNumber(formData.plateNumber),
            });
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Nama Kendaraan */}
            <div className="input-group">
                <label className="input-label">Nama Kendaraan</label>
                <div className="input-icon">
                    <Car size={18} className="icon" />
                    <input
                        type="text"
                        className="input"
                        placeholder="contoh: Honda Beat"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        maxLength={50}
                    />
                </div>
                {errors.name && (
                    <span style={{ color: 'var(--danger)', fontSize: '12px' }}>{errors.name}</span>
                )}
            </div>

            {/* Plat Nomor */}
            <div className="input-group">
                <label className="input-label">Plat Nomor</label>
                <div className="input-icon">
                    <Hash size={18} className="icon" />
                    <input
                        type="text"
                        className="input"
                        placeholder="contoh: B 1234 ABC"
                        value={formData.plateNumber}
                        onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value.toUpperCase() })}
                        maxLength={12}
                    />
                </div>
                {errors.plateNumber && (
                    <span style={{ color: 'var(--danger)', fontSize: '12px' }}>{errors.plateNumber}</span>
                )}
            </div>

            {/* Tahun & Kapasitas Tangki */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div className="input-group">
                    <label className="input-label">Tahun</label>
                    <div className="input-icon">
                        <Calendar size={18} className="icon" />
                        <input
                            type="number"
                            className="input"
                            placeholder="2021"
                            value={formData.year || ''}
                            onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || 0 })}
                            min={1990}
                            max={currentYear}
                        />
                    </div>
                    {errors.year && (
                        <span style={{ color: 'var(--danger)', fontSize: '12px' }}>{errors.year}</span>
                    )}
                </div>

                <div className="input-group">
                    <label className="input-label">Kapasitas Tangki (L)</label>
                    <div className="input-icon">
                        <Fuel size={18} className="icon" />
                        <input
                            type="number"
                            className="input"
                            placeholder="45"
                            value={formData.tankCapacity || ''}
                            onChange={(e) => setFormData({ ...formData, tankCapacity: parseFloat(e.target.value) || 0 })}
                            min={1}
                            max={100}
                            step={0.1}
                        />
                    </div>
                    {errors.tankCapacity && (
                        <span style={{ color: 'var(--danger)', fontSize: '12px' }}>{errors.tankCapacity}</span>
                    )}
                </div>
            </div>

            {/* Jenis BBM Default */}
            <div className="input-group">
                <label className="input-label">Jenis BBM Default</label>
                <select
                    className="select"
                    value={formData.defaultFuelType}
                    onChange={(e) => setFormData({ ...formData, defaultFuelType: e.target.value as FuelType })}
                >
                    {fuelTypes.map(type => (
                        <option key={type.value} value={type.value}>
                            {type.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* Actions */}
            <div className="flex gap-3" style={{ marginTop: 'var(--space-4)' }}>
                {onCancel && (
                    <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ flex: 1 }}
                        onClick={onCancel}
                        disabled={isLoading}
                    >
                        Batal
                    </button>
                )}
                <button
                    type="submit"
                    className="btn btn-primary btn-lg"
                    style={{ flex: 2 }}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <span className="spinner" />
                    ) : (
                        <>
                            <Save size={18} />
                            Simpan Kendaraan
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}
