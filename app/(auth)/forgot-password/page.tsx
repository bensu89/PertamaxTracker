'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Droplets, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts';

export default function ForgotPasswordPage() {
    const { resetPassword, loading, error, clearError } = useAuth();

    const [email, setEmail] = useState('');
    const [localError, setLocalError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError('');
        clearError();
        setSuccess(false);

        if (!email) {
            setLocalError('Email wajib diisi');
            return;
        }

        try {
            await resetPassword(email);
            setSuccess(true);
        } catch {
            // Error is handled by AuthContext
        }
    };

    const displayError = localError || error;

    return (
        <div className="page" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: 'var(--space-4)'
        }}>
            <div style={{ width: '100%', maxWidth: '400px' }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 'var(--space-3)',
                        marginBottom: 'var(--space-4)'
                    }}>
                        <Droplets size={40} style={{ color: 'var(--primary)' }} />
                        <span style={{ fontSize: '28px', fontWeight: 700 }}>
                            <span style={{ color: 'var(--primary)' }}>Pertamax</span>Tracker
                        </span>
                    </div>
                </div>

                {/* Form Card */}
                <div className="card" style={{ padding: 'var(--space-6)' }}>
                    <h1 style={{ fontSize: '22px', fontWeight: 600, marginBottom: 'var(--space-2)', textAlign: 'center' }}>
                        Reset Password
                    </h1>
                    <p className="text-muted" style={{ textAlign: 'center', marginBottom: 'var(--space-6)', fontSize: '14px' }}>
                        Masukkan email Anda untuk menerima link reset password
                    </p>

                    {displayError && (
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--space-2)',
                                padding: 'var(--space-3)',
                                marginBottom: 'var(--space-4)',
                                background: 'var(--danger-light)',
                                borderRadius: 'var(--radius-md)',
                                color: 'var(--danger)',
                                fontSize: '14px'
                            }}
                        >
                            <AlertCircle size={18} />
                            {displayError}
                        </div>
                    )}

                    {success ? (
                        <div>
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: 'var(--space-3)',
                                    padding: 'var(--space-6)',
                                    background: 'var(--primary-light)',
                                    borderRadius: 'var(--radius-lg)',
                                    textAlign: 'center'
                                }}
                            >
                                <CheckCircle size={48} style={{ color: 'var(--primary)' }} />
                                <h3 style={{ fontSize: '18px', fontWeight: 600 }}>Email Terkirim!</h3>
                                <p className="text-muted" style={{ fontSize: '14px' }}>
                                    Silakan cek inbox email <strong>{email}</strong> untuk link reset password.
                                </p>
                            </div>

                            <Link
                                href="/login"
                                className="btn btn-primary w-full"
                                style={{ marginTop: 'var(--space-6)' }}
                            >
                                Kembali ke Login
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            {/* Email */}
                            <div className="input-group">
                                <label className="input-label">Email</label>
                                <div className="input-icon">
                                    <Mail size={18} className="icon" />
                                    <input
                                        type="email"
                                        className="input"
                                        placeholder="nama@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        autoComplete="email"
                                    />
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                className="btn btn-primary btn-lg w-full"
                                disabled={loading}
                                style={{ marginTop: 'var(--space-2)' }}
                            >
                                {loading ? <span className="spinner" /> : 'Kirim Link Reset'}
                            </button>

                            {/* Back to Login */}
                            <Link
                                href="/login"
                                className="btn btn-ghost w-full"
                                style={{ gap: 'var(--space-2)' }}
                            >
                                <ArrowLeft size={18} />
                                Kembali ke Login
                            </Link>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
