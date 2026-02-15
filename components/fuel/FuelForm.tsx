'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import {
    Calendar as CalendarIcon,
    Gauge,
    Droplets,
    Wallet,
    CheckSquare,
    Save,
    Info,
    Camera,
    Upload
} from 'lucide-react';
import type { FuelEntryFormData, FuelType, Vehicle, FuelEntry } from '@/lib/types';
import { formatRupiah, formatNumber, formatDate } from '@/lib/utils';
import { calculatePricePerLiter, calculateDistance, calculateEfficiency } from '@/lib/calculations';
import { extractReceiptData } from '@/lib/services/ocr';

interface FuelFormProps {
    vehicles: Vehicle[];
    previousEntry?: FuelEntry;
    initialData?: Partial<FuelEntryFormData>;
    onSubmit: (data: FuelEntryFormData) => void;
    onCancel?: () => void;
    onVehicleChange?: (vehicleId: string) => void;
    isLoading?: boolean;
}

const fuelTypes: { value: FuelType; label: string }[] = [
    { value: 'pertamax', label: 'Pertamax' },
    { value: 'pertamax-turbo', label: 'Pertamax Turbo' },
    { value: 'pertalite', label: 'Pertalite' },
    { value: 'solar', label: 'Solar' },
    { value: 'dexlite', label: 'Dexlite' },
];

export default function FuelForm({
    vehicles,
    previousEntry,
    initialData,
    onSubmit,
    onCancel,
    onVehicleChange,
    isLoading = false
}: FuelFormProps) {
    const activeVehicle = vehicles.find(v => v.isActive) || vehicles[0];

    const [formData, setFormData] = useState<FuelEntryFormData>({
        vehicleId: activeVehicle?.id || '',
        date: new Date(),
        odometer: 0,
        liters: 0,
        totalPrice: 0,
        fuelType: activeVehicle?.defaultFuelType || 'pertamax',
        isFullTank: true,
        notes: '',
    });

    const [pricePerLiter, setPricePerLiter] = useState(0);
    const [lastEdited, setLastEdited] = useState<'total' | 'perLiter'>('total');
    const [errors, setErrors] = useState<Partial<Record<keyof FuelEntryFormData, string>>>({});

    // Scan Receipt State
    const [isScanning, setIsScanning] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Update form when initialData from receipt scanner changes
    useEffect(() => {
        if (initialData) {
            // Ensure liters is a proper number (convert comma to dot if needed)
            const litersValue = initialData.liters
                ? parseFloat(String(initialData.liters).replace(',', '.'))
                : undefined;

            setFormData(prev => ({
                ...prev,
                ...initialData,
                // Override liters with properly parsed value
                liters: litersValue ?? prev.liters,
                // Keep vehicleId from active vehicle if not provided
                vehicleId: initialData.vehicleId || prev.vehicleId,
                // Keep date as today if not provided
                date: initialData.date || prev.date,
            }));
            // Also update pricePerLiter display if totalPrice and liters are provided
            if (initialData.totalPrice && litersValue && litersValue > 0) {
                setPricePerLiter(Math.round(initialData.totalPrice / litersValue));
            }
        }
    }, [initialData]);

    // Handle receipt file selection
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsScanning(true);
        try {
            const data = await extractReceiptData(file);

            // Map extracted data to form
            const updates: Partial<FuelEntryFormData> = {};

            if (data.date) updates.date = data.date;
            if (data.liters) updates.liters = data.liters;
            if (data.totalPrice) updates.totalPrice = data.totalPrice;
            if (data.fuelType) updates.fuelType = data.fuelType as FuelType;

            // Calculate price per liter if available
            if (data.pricePerLiter) {
                setPricePerLiter(data.pricePerLiter);
                setLastEdited('perLiter');
            } else if (data.totalPrice && data.liters) {
                setPricePerLiter(Math.round(data.totalPrice / data.liters));
                setLastEdited('perLiter');
            }

            // Update notes with station name
            if (data.stationName) {
                updates.notes = `SPBU: ${data.stationName}`;
            }

            setFormData(prev => ({ ...prev, ...updates }));

            alert('Berhasil membaca struk! Silakan periksa data yang terisi.');
        } catch (error) {
            console.error('OCR Error:', error);
            alert('Gagal membaca struk. Pastikan gambar jelas dan pencahayaan cukup.');
        } finally {
            setIsScanning(false);
            // Reset input so same file can be selected again
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // Handle liters change - recalculate based on which price field was edited last
    const handleLitersChange = (liters: number) => {
        if (lastEdited === 'perLiter' && pricePerLiter > 0) {
            // Calculate total from price per liter
            const total = Math.round(liters * pricePerLiter);
            setFormData({ ...formData, liters, totalPrice: total });
        } else if (lastEdited === 'total' && formData.totalPrice > 0) {
            // Keep total, recalculate price per liter display
            setFormData({ ...formData, liters });
        } else {
            setFormData({ ...formData, liters });
        }
    };

    // Handle price per liter change - ALWAYS calculate liters if totalPrice exists
    const handlePricePerLiterChange = (ppl: number) => {
        setPricePerLiter(ppl);
        setLastEdited('perLiter');

        if (formData.totalPrice > 0 && ppl > 0) {
            // Always calculate liters from total price and price per liter
            const liters = parseFloat((formData.totalPrice / ppl).toFixed(2));
            setFormData({ ...formData, liters });
        }
    };

    // Handle total price change - ALWAYS calculate liters if pricePerLiter exists
    const handleTotalPriceChange = (total: number) => {
        setLastEdited('total');

        if (pricePerLiter > 0 && total > 0) {
            // Always calculate liters from total price and price per liter
            const liters = parseFloat((total / pricePerLiter).toFixed(2));
            setFormData({ ...formData, totalPrice: total, liters });
        } else {
            setFormData({ ...formData, totalPrice: total });
        }
    };

    // Calculated values for display
    const calculations = useMemo(() => {
        const calculatedPricePerLiter = formData.liters > 0
            ? calculatePricePerLiter(formData.totalPrice, formData.liters)
            : pricePerLiter;

        const distance = previousEntry && formData.odometer > 0
            ? calculateDistance(formData.odometer, previousEntry.odometer)
            : 0;

        const efficiency = formData.isFullTank && distance > 0 && formData.liters > 0
            ? calculateEfficiency(formData.odometer, previousEntry?.odometer || 0, formData.liters)
            : 0;

        return { pricePerLiter: calculatedPricePerLiter, distance, efficiency };
    }, [formData.totalPrice, formData.liters, formData.odometer, formData.isFullTank, previousEntry, pricePerLiter]);

    const validate = (): boolean => {
        const newErrors: typeof errors = {};

        if (!formData.vehicleId) {
            newErrors.vehicleId = 'Pilih kendaraan';
        }

        // Odometer is optional - no strict validation since it can be reset manually
        if (formData.odometer < 0) {
            newErrors.odometer = 'Odometer tidak boleh negatif';
        }

        if (formData.liters <= 0) {
            newErrors.liters = 'Jumlah liter harus lebih dari 0';
        }

        if (formData.totalPrice <= 0) {
            newErrors.totalPrice = 'Total harga harus lebih dari 0';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            // Include pricePerLiter in the submitted data
            onSubmit({
                ...formData,
                pricePerLiter: pricePerLiter > 0 ? pricePerLiter : undefined
            });
        }
    };

    const formatDateForInput = (date: Date): string => {
        if (!date) return '';
        // Handle case where date might be invalid or string
        try {
            return new Date(date).toISOString().split('T')[0];
        } catch {
            return '';
        }
    };

    return (
        <div className="flex flex-col gap-4">
            {/* Scan Receipt Button */}
            <div
                className="card border-dashed p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-gray-50 transition-colors"
                style={{
                    border: '2px dashed var(--border)',
                    background: 'var(--card-bg)',
                    marginBottom: 'var(--space-2)'
                }}
                onClick={() => !isScanning && !isLoading && fileInputRef.current?.click()}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                    disabled={isScanning || isLoading}
                />

                {isScanning ? (
                    <div className="flex items-center gap-2 text-primary">
                        <span className="spinner w-5 h-5"></span>
                        <span className="font-medium">Menganalisis struk...</span>
                    </div>
                ) : (
                    <>
                        <div className="p-3 bg-primary-light rounded-full text-primary">
                            <Camera size={24} />
                        </div>
                        <div className="text-center">
                            <p className="font-medium">Scan Struk BBM</p>
                            <p className="text-sm text-muted">Otomatis isi form dari foto struk</p>
                        </div>
                    </>
                )}
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Vehicle Select */}
                <div className="input-group">
                    <label className="input-label">Kendaraan</label>
                    <select
                        className="select"
                        value={formData.vehicleId}
                        onChange={(e) => {
                            const vehicle = vehicles.find(v => v.id === e.target.value);
                            setFormData({
                                ...formData,
                                vehicleId: e.target.value,
                                fuelType: vehicle?.defaultFuelType || formData.fuelType
                            });
                            onVehicleChange?.(e.target.value);
                        }}
                    >
                        {vehicles.map(v => (
                            <option key={v.id} value={v.id}>
                                🚗 {v.name} ({v.plateNumber})
                            </option>
                        ))}
                    </select>
                    {errors.vehicleId && (
                        <span style={{ color: 'var(--danger)', fontSize: '12px' }}>{errors.vehicleId}</span>
                    )}
                </div>

                {/* Date */}
                <div className="input-group">
                    <label className="input-label">Tanggal</label>
                    <div className="input-icon">
                        <CalendarIcon size={18} className="icon" />
                        <input
                            type="date"
                            className="input"
                            value={formatDateForInput(formData.date)}
                            onChange={(e) => setFormData({ ...formData, date: new Date(e.target.value) })}
                            max={formatDateForInput(new Date())}
                        />
                    </div>
                </div>

                {/* Odometer */}
                <div className="input-group">
                    <label className="input-label">Odometer (KM) - Opsional</label>
                    <div className="input-icon">
                        <Gauge size={18} className="icon" />
                        <input
                            type="number"
                            className="input"
                            placeholder="0"
                            value={formData.odometer || ''}
                            onChange={(e) => setFormData({ ...formData, odometer: parseInt(e.target.value) || 0 })}
                            min={0}
                        />
                    </div>
                    <span className="input-hint flex items-center gap-1">
                        <Info size={12} />
                        Bisa dikosongkan jika odometer di-reset manual
                    </span>
                    {errors.odometer && (
                        <span style={{ color: 'var(--danger)', fontSize: '12px' }}>{errors.odometer}</span>
                    )}
                </div>

                {/* Liters & Fuel Type */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                    <div className="input-group">
                        <label className="input-label">Jumlah Liter</label>
                        <div className="input-icon">
                            <Droplets size={18} className="icon" />
                            <input
                                type="number"
                                className="input"
                                placeholder="15.5"
                                value={formData.liters || ''}
                                onChange={(e) => handleLitersChange(parseFloat(e.target.value) || 0)}
                                min={0}
                                step="any"
                                lang="en"
                            />
                        </div>
                        {errors.liters && (
                            <span style={{ color: 'var(--danger)', fontSize: '12px' }}>{errors.liters}</span>
                        )}
                    </div>

                    <div className="input-group">
                        <label className="input-label">Jenis BBM</label>
                        <select
                            className="select"
                            value={formData.fuelType}
                            onChange={(e) => setFormData({ ...formData, fuelType: e.target.value as FuelType })}
                        >
                            {fuelTypes.map(type => (
                                <option key={type.value} value={type.value}>
                                    {type.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Price Per Liter & Total Price */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                    <div className="input-group">
                        <label className="input-label">Harga/Liter (Rp)</label>
                        <div className="input-icon">
                            <Wallet size={18} className="icon" />
                            <input
                                type="number"
                                className="input"
                                placeholder="15000"
                                value={pricePerLiter || ''}
                                onChange={(e) => handlePricePerLiterChange(parseInt(e.target.value) || 0)}
                                min={0}
                            />
                        </div>
                        <span className="input-hint">Otomatis hitung liter atau total</span>
                    </div>

                    <div className="input-group">
                        <label className="input-label">Total Harga (Rp)</label>
                        <div className="input-icon">
                            <Wallet size={18} className="icon" />
                            <input
                                type="number"
                                className="input"
                                placeholder="203050"
                                value={formData.totalPrice || ''}
                                onChange={(e) => handleTotalPriceChange(parseInt(e.target.value) || 0)}
                                min={0}
                            />
                        </div>
                        {errors.totalPrice && (
                            <span style={{ color: 'var(--danger)', fontSize: '12px' }}>{errors.totalPrice}</span>
                        )}
                    </div>
                </div>

                {/* Notes (Added for OCR station name) */}
                <div className="input-group">
                    <label className="input-label">Catatan</label>
                    <textarea
                        className="input"
                        placeholder="Contoh: SPBU ... (Opsional)"
                        value={formData.notes || ''}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        rows={2}
                        style={{ resize: 'none' }}
                    />
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
                                Simpan Pengisian
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
