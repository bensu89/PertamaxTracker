'use client';

import { useState, useEffect, useRef } from 'react';
import {
    Calendar, // Renamed from CalendarIcon
    Gauge,
    Droplets,
    Banknote, // Renamed from Wallet
    Save,
    Info,
    Camera, // New import
    Loader2 // New import
} from 'lucide-react';
import type { FuelEntryFormData, FuelType, Vehicle, FuelEntry } from '@/lib/types';
import { formatRupiah, formatNumber, formatDate } from '@/lib/utils';
import { extractReceiptData } from '@/lib/services/ocr'; // New import


interface FuelFormProps {
    vehicles: Vehicle[];
    previousEntry?: FuelEntry; // This was in the original, but not in the instruction's interface. Keeping it for now.
    initialData?: Partial<FuelEntryFormData>; // Changed from FuelEntry to Partial<FuelEntryFormData> in instruction, but original was Partial<FuelEntryFormData>. Keeping original.
    onSubmit: (data: FuelEntryFormData) => Promise<void>; // Changed return type to Promise<void>
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
    previousEntry, // Kept from original
    initialData,
    onSubmit,
    onCancel,
    onVehicleChange,
    isLoading = false
}: FuelFormProps) {
    // Current date for default value (YYYY-MM-DD)
    const today = new Date().toISOString().split('T')[0]; // New variable

    const activeVehicle = vehicles.find(v => v.isActive) || vehicles[0]; // Kept from original

    const [formData, setFormData] = useState<FuelEntryFormData>(
        initialData ? {
            vehicleId: initialData.vehicleId || activeVehicle?.id || '', // Added activeVehicle fallback
            date: initialData.date || new Date(), // Added new Date() fallback
            odometer: initialData.odometer || 0, // Added 0 fallback
            liters: initialData.liters || 0, // Added 0 fallback
            totalPrice: initialData.totalPrice || 0, // Added 0 fallback
            pricePerLiter: initialData.pricePerLiter || 0, // New field, added 0 fallback
            fuelType: initialData.fuelType || activeVehicle?.defaultFuelType || 'pertamax', // Added activeVehicle and 'pertamax' fallback
            isFullTank: initialData.isFullTank ?? true, // Added true fallback
            notes: initialData.notes || ''
        } : {
            vehicleId: activeVehicle?.id || '',
            date: new Date(),
            odometer: 0,
            liters: 0,
            totalPrice: 0,
            pricePerLiter: 0, // New field
            fuelType: activeVehicle?.defaultFuelType || 'pertamax',
            isFullTank: true,
            notes: ''
        }
    );

    // Scan Receipt State
    const [isScanning, setIsScanning] = useState(false); // New state
    const fileInputRef = useRef<HTMLInputElement>(null); // New ref

    const [lastEdited, setLastEdited] = useState<'total' | 'perLiter'>('total');
    const [errors, setErrors] = useState<Partial<Record<keyof FuelEntryFormData, string>>>({});


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
                setFormData(prev => ({ ...prev, pricePerLiter: Math.round(initialData.totalPrice! / litersValue) })); // Updated to set pricePerLiter in formData
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

            if (data.date) updates.date = new Date(data.date); // Convert date string to Date object
            if (data.volume) updates.liters = data.volume;
            if (data.totalPrice) updates.totalPrice = data.totalPrice;
            if (data.fuelType) {
                // Normalize fuel type string to match our FuelType
                const ft = data.fuelType.toLowerCase();
                if (ft.includes('turbo')) updates.fuelType = 'pertamax-turbo';
                else if (ft.includes('pertamax')) updates.fuelType = 'pertamax';
                else if (ft.includes('pertalite')) updates.fuelType = 'pertalite';
                else if (ft.includes('dex')) updates.fuelType = 'dexlite';
                else if (ft.includes('solar')) updates.fuelType = 'solar';
            };

            // Calculate price per liter if available
            if (data.pricePerLiter) {
                updates.pricePerLiter = data.pricePerLiter;
            }

            // Update notes with station name
            if (data.spbu) {
                updates.notes = `SPBU: ${data.spbu}`;
            }

            setFormData(prev => ({ ...prev, ...updates }));

            alert('Berhasil membaca struk! Silakan periksa data yang terisi.');
        } catch (error) {
            console.error('OCR Error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            alert(`Gagal membaca struk: ${errorMessage}. Coba foto lebih dekat atau resolusi lebih kecil.`);
        } finally {
            setIsScanning(false);
            // Reset input so same file can be selected again
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // Vehicle handling
    const selectedVehicle = vehicles.find(v => v.id === formData.vehicleId);

    useEffect(() => {
        if (selectedVehicle?.defaultFuelType) {
            setFormData(prev => ({
                ...prev,
                fuelType: selectedVehicle.defaultFuelType
            }));
        }
    }, [selectedVehicle]);

    // Handle liters change - recalculate based on which price field was edited last
    const handleLitersChange = (liters: number) => {
        setFormData(prev => {
            if (lastEdited === 'perLiter' && (prev.pricePerLiter || 0) > 0) {
                // Calculate total from price per liter
                const total = Math.round(liters * (prev.pricePerLiter || 0));
                return { ...prev, liters, totalPrice: total };
            } else if (lastEdited === 'total' && prev.totalPrice > 0) {
                // Keep total, recalculate price per liter display
                let newPricePerLiter = prev.pricePerLiter;
                if (liters > 0) {
                    newPricePerLiter = Math.round(prev.totalPrice / liters);
                }
                return { ...prev, liters, pricePerLiter: newPricePerLiter };
            } else {
                return { ...prev, liters };
            }
        });
    };

    // Handle price per liter change - ALWAYS calculate liters if totalPrice exists
    const handlePricePerLiterChange = (ppl: number) => {
        setLastEdited('perLiter');

        if (formData.totalPrice > 0 && ppl > 0) {
            // Always calculate liters from total price and price per liter
            const liters = parseFloat((formData.totalPrice / ppl).toFixed(2));
            setFormData(prev => ({ ...prev, pricePerLiter: ppl, liters }));
        } else {
            setFormData(prev => ({ ...prev, pricePerLiter: ppl }));
        }
    };

    // Handle total price change - ALWAYS calculate liters if pricePerLiter exists
    const handleTotalPriceChange = (total: number) => {
        setLastEdited('total');

        if ((formData.pricePerLiter || 0) > 0 && total > 0) {
            // Always calculate liters from total price and price per liter
            const liters = parseFloat((total / (formData.pricePerLiter || 1)).toFixed(2));
            setFormData(prev => ({ ...prev, totalPrice: total, liters }));
        } else {
            setFormData(prev => ({ ...prev, totalPrice: total }));
        }
    };

    // Calculated values for display
    const calculations = {
        pricePerLiter: formData.pricePerLiter || (formData.liters > 0 && formData.totalPrice > 0
            ? Math.round(formData.totalPrice / formData.liters)
            : 0),
        distance: previousEntry && formData.odometer > 0
            ? (formData.odometer - previousEntry.odometer > 0 ? formData.odometer - previousEntry.odometer : 0)
            : 0,
        efficiency: 0
    };

    // Calculate efficiency separately to avoid complexity in object literal
    if (formData.isFullTank && calculations.distance > 0 && formData.liters > 0) {
        calculations.efficiency = parseFloat((calculations.distance / formData.liters).toFixed(2));
    }

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            // Include pricePerLiter in the submitted data
            await onSubmit({
                ...formData,
                pricePerLiter: (formData.pricePerLiter || 0) > 0 ? formData.pricePerLiter : undefined
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
                className="card border-dashed p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-amber-50 transition-colors"
                style={{
                    border: '2px dashed #d97706',
                    background: '#fffbeb',
                    marginBottom: '1rem',
                    borderRadius: '0.75rem'
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
                    <div className="flex items-center gap-2 text-amber-600">
                        <Loader2 className="animate-spin w-5 h-5" />
                        <span className="font-medium">Menganalisis struk... (Offline)</span>
                    </div>
                ) : (
                    <>
                        <div className="p-3 bg-amber-100 rounded-full text-amber-600">
                            <Camera size={24} />
                        </div>
                        <div className="text-center">
                            <p className="font-medium text-amber-900">Scan Struk BBM</p>
                            <p className="text-sm text-amber-700">Otomatis isi form dari foto struk (Offline)</p>
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
                        <Calendar size={18} className="icon" />
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
                            <Banknote size={18} className="icon" />
                            <input
                                type="number"
                                className="input"
                                placeholder="15000"
                                value={formData.pricePerLiter || ''}
                                onChange={(e) => handlePricePerLiterChange(parseInt(e.target.value) || 0)}
                                min={0}
                            />
                        </div>
                        <span className="input-hint">Otomatis hitung liter atau total</span>
                    </div>

                    <div className="input-group">
                        <label className="input-label">Total Harga (Rp)</label>
                        <div className="input-icon">
                            <Banknote size={18} className="icon" />
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
