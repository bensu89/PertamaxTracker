'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, User, Flame, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts';

export default function RegisterPage() {
    const router = useRouter();
    const { register, loginWithGoogle, loading, error, clearError } = useAuth();

    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [localError, setLocalError] = useState('');

    // Password strength indicators
    const passwordChecks = {
        length: password.length >= 6,
        hasNumber: /\d/.test(password),
        hasLetter: /[a-zA-Z]/.test(password),
    };
    const passwordStrength = Object.values(passwordChecks).filter(Boolean).length;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError('');
        clearError();

        if (!displayName || !email || !password) {
            setLocalError('Semua field wajib diisi');
            return;
        }

        if (password !== confirmPassword) {
            setLocalError('Password tidak sama');
            return;
        }

        if (password.length < 6) {
            setLocalError('Password minimal 6 karakter');
            return;
        }

        try {
            await register(email, password, displayName);
            router.push('/');
        } catch (err) {
            console.error('Registration error:', err);
            // Error is handled by AuthContext
        }
    };

    const handleGoogleLogin = async () => {
        try {
            await loginWithGoogle();
            router.push('/');
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
                <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 'var(--space-3)',
                        marginBottom: 'var(--space-3)'
                    }}>
                        <Flame size={36} style={{ color: 'var(--primary)' }} />
                        <span style={{ fontSize: '24px', fontWeight: 700 }}>
                            <span style={{ color: 'var(--primary)' }}>Pertamax</span>Tracker
                        </span>
                    </div>
                    <p className="text-muted" style={{ fontSize: '14px' }}>
                        Buat akun untuk mulai mencatat
                    </p>
                </div>

                {/* Register Form */}
                <div className="card" style={{ padding: 'var(--space-6)' }}>
                    <h1 style={{ fontSize: '20px', fontWeight: 600, marginBottom: 'var(--space-5)', textAlign: 'center' }}>
                        Daftar Akun Baru
                    </h1>

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

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        {/* Display Name */}
                        <div className="input-group">
                            <label className="input-label">Nama Lengkap</label>
                            <div className="input-icon">
                                <User size={18} className="icon" />
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="John Doe"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    autoComplete="name"
                                />
                            </div>
                        </div>

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

                        {/* Password */}
                        <div className="input-group">
                            <label className="input-label">Password</label>
                            <div className="input-icon" style={{ position: 'relative' }}>
                                <Lock size={18} className="icon" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    className="input"
                                    placeholder="Minimal 6 karakter"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoComplete="new-password"
                                    style={{ paddingRight: '44px' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute',
                                        right: 'var(--space-3)',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--text-muted)',
                                        cursor: 'pointer',
                                        padding: '4px'
                                    }}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>

                            {/* Password Strength */}
                            {password && (
                                <div style={{ marginTop: 'var(--space-2)' }}>
                                    <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
                                        {[1, 2, 3].map((level) => (
                                            <div
                                                key={level}
                                                style={{
                                                    flex: 1,
                                                    height: '4px',
                                                    borderRadius: '2px',
                                                    background: passwordStrength >= level
                                                        ? passwordStrength === 1 ? 'var(--danger)'
                                                            : passwordStrength === 2 ? 'var(--warning)'
                                                                : 'var(--primary)'
                                                        : 'var(--border)'
                                                }}
                                            />
                                        ))}
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                        {[
                                            { check: passwordChecks.length, text: '6+ karakter' },
                                            { check: passwordChecks.hasLetter, text: 'Huruf' },
                                            { check: passwordChecks.hasNumber, text: 'Angka' },
                                        ].map((item, i) => (
                                            <span
                                                key={i}
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '2px',
                                                    marginRight: 'var(--space-3)',
                                                    color: item.check ? 'var(--primary)' : 'var(--text-muted)'
                                                }}
                                            >
                                                <CheckCircle size={12} />
                                                {item.text}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div className="input-group">
                            <label className="input-label">Konfirmasi Password</label>
                            <div className="input-icon">
                                <Lock size={18} className="icon" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    className="input"
                                    placeholder="Ulangi password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    autoComplete="new-password"
                                />
                            </div>
                            {confirmPassword && password !== confirmPassword && (
                                <span style={{ color: 'var(--danger)', fontSize: '12px' }}>
                                    Password tidak sama
                                </span>
                            )}
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className="btn btn-primary btn-lg w-full"
                            disabled={loading}
                            style={{ marginTop: 'var(--space-2)' }}
                        >
                            {loading ? <span className="spinner" /> : 'Daftar'}
                        </button>
                    </form>

                    {/* Divider */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-4)',
                        margin: 'var(--space-5) 0'
                    }}>
                        <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                        <span className="text-muted" style={{ fontSize: '13px' }}>atau</span>
                        <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                    </div>

                    {/* Google Login */}
                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        className="btn btn-secondary w-full"
                        disabled={loading}
                        style={{ gap: 'var(--space-3)' }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Daftar dengan Google
                    </button>

                    {/* Login Link */}
                    <p style={{
                        textAlign: 'center',
                        marginTop: 'var(--space-5)',
                        fontSize: '14px',
                        color: 'var(--text-secondary)'
                    }}>
                        Sudah punya akun?{' '}
                        <Link
                            href="/login"
                            style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}
                        >
                            Masuk di sini
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
