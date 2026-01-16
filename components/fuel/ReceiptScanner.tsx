'use client';

import { useState, useRef } from 'react';
import { Camera, Upload, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { parseReceiptImage, imageToBase64, ExtractedReceiptData } from '@/lib/services/receiptOcr';

interface ReceiptScannerProps {
    onDataExtracted: (data: ExtractedReceiptData) => void;
    onError?: (error: string) => void;
}

export default function ReceiptScanner({ onDataExtracted, onError }: ReceiptScannerProps) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [result, setResult] = useState<ExtractedReceiptData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    const processImage = async (file: File) => {
        try {
            setIsProcessing(true);
            setError(null);
            setResult(null);

            // Create preview
            const previewUrl = URL.createObjectURL(file);
            setPreviewUrl(previewUrl);

            // Convert to data URL for Tesseract.js
            const dataUrl = await imageToBase64(file);
            const data = await parseReceiptImage(dataUrl);

            setResult(data);

            // Log for debugging
            console.log('OCR Result:', data);

            // Check if we have any useful data
            const hasUsefulData = data.liters || data.totalPrice || data.fuelType;

            if (data.confidence >= 30 || hasUsefulData) {
                onDataExtracted(data);
            } else {
                const errorMsg = 'Tidak dapat membaca struk dengan jelas. Coba dengan foto yang lebih jelas.';
                setError(errorMsg);
                onError?.(errorMsg);
            }
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Gagal memproses gambar';
            setError(errorMsg);
            onError?.(errorMsg);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            processImage(file);
        }
    };

    const handleClear = () => {
        setPreviewUrl(null);
        setResult(null);
        setError(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (cameraInputRef.current) cameraInputRef.current.value = '';
    };

    const formatNumber = (num: number) => num.toLocaleString('id-ID');

    return (
        <div
            className="card"
            style={{
                background: 'var(--surface-elevated)',
                marginBottom: 'var(--space-4)',
                overflow: 'hidden'
            }}
        >
            {/* Header */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 'var(--space-4)',
                    borderBottom: previewUrl ? '1px solid var(--border)' : 'none'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <Camera size={20} style={{ color: 'var(--primary)' }} />
                    <span style={{ fontWeight: 600 }}>Scan Struk BBM</span>
                </div>
                {previewUrl && (
                    <button
                        type="button"
                        className="btn btn-ghost btn-icon"
                        style={{ width: 32, height: 32 }}
                        onClick={handleClear}
                    >
                        <X size={18} />
                    </button>
                )}
            </div>

            {/* Content */}
            {!previewUrl ? (
                <div style={{ padding: 'var(--space-4)', paddingTop: 0 }}>
                    <p className="text-muted" style={{ fontSize: '13px', marginBottom: 'var(--space-3)' }}>
                        Foto struk BBM untuk mengisi form otomatis
                    </p>
                    <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                        {/* Camera Button */}
                        <button
                            type="button"
                            className="btn btn-primary"
                            style={{ flex: 1 }}
                            onClick={() => cameraInputRef.current?.click()}
                        >
                            <Camera size={18} />
                            Ambil Foto
                        </button>
                        <input
                            ref={cameraInputRef}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                        />

                        {/* Upload Button */}
                        <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ flex: 1 }}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Upload size={18} />
                            Upload
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                        />
                    </div>
                </div>
            ) : (
                <div style={{ padding: 'var(--space-4)', paddingTop: 0 }}>
                    {/* Image Preview */}
                    <div
                        style={{
                            position: 'relative',
                            borderRadius: 'var(--radius-md)',
                            overflow: 'hidden',
                            marginBottom: 'var(--space-3)'
                        }}
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={previewUrl}
                            alt="Receipt preview"
                            style={{
                                width: '100%',
                                height: '160px',
                                objectFit: 'cover',
                                display: 'block'
                            }}
                        />
                        {isProcessing && (
                            <div
                                style={{
                                    position: 'absolute',
                                    inset: 0,
                                    background: 'rgba(0,0,0,0.7)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 'var(--space-2)'
                                }}
                            >
                                <Loader2 size={32} className="spinner" style={{ color: 'var(--primary)' }} />
                                <span style={{ color: 'white', fontSize: '14px' }}>Menganalisis struk...</span>
                            </div>
                        )}
                    </div>

                    {/* Results */}
                    {result && (result.confidence >= 30 || result.liters || result.totalPrice) && (
                        <div
                            style={{
                                background: 'var(--primary-light)',
                                padding: 'var(--space-3)',
                                borderRadius: 'var(--radius-md)',
                                fontSize: '13px'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                                <CheckCircle size={16} style={{ color: 'var(--primary)' }} />
                                <span style={{ fontWeight: 600, color: 'var(--primary)' }}>
                                    Data Berhasil Diekstrak ({result.confidence}%)
                                </span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
                                {result.liters && (
                                    <div>
                                        <span className="text-muted">Liter: </span>
                                        <span style={{ fontWeight: 500 }}>{result.liters} L</span>
                                    </div>
                                )}
                                {result.totalPrice && (
                                    <div>
                                        <span className="text-muted">Total: </span>
                                        <span style={{ fontWeight: 500 }}>Rp {formatNumber(result.totalPrice)}</span>
                                    </div>
                                )}
                                {result.fuelType && (
                                    <div>
                                        <span className="text-muted">BBM: </span>
                                        <span style={{ fontWeight: 500, textTransform: 'capitalize' }}>{result.fuelType}</span>
                                    </div>
                                )}
                                {result.pricePerLiter && (
                                    <div>
                                        <span className="text-muted">Harga/L: </span>
                                        <span style={{ fontWeight: 500 }}>Rp {formatNumber(result.pricePerLiter)}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div
                            style={{
                                background: 'var(--danger-light)',
                                padding: 'var(--space-3)',
                                borderRadius: 'var(--radius-md)',
                                fontSize: '13px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--space-2)'
                            }}
                        >
                            <AlertCircle size={16} style={{ color: 'var(--danger)' }} />
                            <span style={{ color: 'var(--danger)' }}>{error}</span>
                        </div>
                    )}

                    {/* Retry Button */}
                    {(error || (result && result.confidence < 30 && !result.liters && !result.totalPrice)) && (
                        <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ width: '100%', marginTop: 'var(--space-3)' }}
                            onClick={handleClear}
                        >
                            Coba Lagi
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
