'use client';

import { useState } from 'react';
import { User, Mail, Lock, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { updateProfile, updateEmail, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { PageHeader } from '@/components/layout';
import { useAuth } from '@/contexts';
import { auth } from '@/lib/firebase';

export default function SettingsPage() {
    const { user } = useAuth();

    // Profile state
    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [email, setEmail] = useState(user?.email || '');

    // Password state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // UI state
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const clearMessages = () => {
        setSuccess(null);
        setError(null);
    };

    // Update profile name
    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !auth) return;

        clearMessages();
        setLoading(true);

        try {
            await updateProfile(user, { displayName });
            setSuccess('Nama berhasil diperbarui!');
        } catch (err) {
            console.error('Error updating profile:', err);
            setError('Gagal memperbarui nama. Silakan coba lagi.');
        } finally {
            setLoading(false);
        }
    };

    // Update email
    const handleUpdateEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !auth) return;

        clearMessages();

        if (!currentPassword) {
            setError('Masukkan password saat ini untuk mengubah email');
            return;
        }

        setLoading(true);

        try {
            // Re-authenticate first
            const credential = EmailAuthProvider.credential(user.email!, currentPassword);
            await reauthenticateWithCredential(user, credential);

            // Update email
            await updateEmail(user, email);
            setSuccess('Email berhasil diperbarui!');
            setCurrentPassword('');
        } catch (err: unknown) {
            console.error('Error updating email:', err);
            if (err && typeof err === 'object' && 'code' in err) {
                const code = (err as { code: string }).code;
                if (code === 'auth/wrong-password') {
                    setError('Password salah');
                } else if (code === 'auth/email-already-in-use') {
                    setError('Email sudah digunakan akun lain');
                } else if (code === 'auth/requires-recent-login') {
                    setError('Silakan logout dan login kembali untuk mengubah email');
                } else {
                    setError('Gagal memperbarui email. Silakan coba lagi.');
                }
            } else {
                setError('Gagal memperbarui email. Silakan coba lagi.');
            }
        } finally {
            setLoading(false);
        }
    };

    // Update password
    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !auth) return;

        clearMessages();

        if (!currentPassword) {
            setError('Masukkan password saat ini');
            return;
        }

        if (newPassword.length < 6) {
            setError('Password baru minimal 6 karakter');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Konfirmasi password tidak sama');
            return;
        }

        setLoading(true);

        try {
            // Re-authenticate first
            const credential = EmailAuthProvider.credential(user.email!, currentPassword);
            await reauthenticateWithCredential(user, credential);

            // Update password
            await updatePassword(user, newPassword);
            setSuccess('Password berhasil diperbarui!');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: unknown) {
            console.error('Error updating password:', err);
            if (err && typeof err === 'object' && 'code' in err) {
                const code = (err as { code: string }).code;
                if (code === 'auth/wrong-password') {
                    setError('Password saat ini salah');
                } else if (code === 'auth/requires-recent-login') {
                    setError('Silakan logout dan login kembali untuk mengubah password');
                } else {
                    setError('Gagal memperbarui password. Silakan coba lagi.');
                }
            } else {
                setError('Gagal memperbarui password. Silakan coba lagi.');
            }
        } finally {
            setLoading(false);
        }
    };

    // Check if user logged in with Google (can't change email/password)
    const isGoogleUser = user?.providerData?.some(p => p.providerId === 'google.com');

    return (
        <div className="page">
            <PageHeader title="Pengaturan Akun" />

            <div className="page-content" style={{ maxWidth: '500px' }}>
                {/* Success Message */}
                {success && (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-2)',
                            padding: 'var(--space-3)',
                            marginBottom: 'var(--space-4)',
                            background: 'var(--primary-light)',
                            borderRadius: 'var(--radius-md)',
                            color: 'var(--primary)',
                            fontSize: '14px'
                        }}
                    >
                        <CheckCircle size={18} />
                        {success}
                    </div>
                )}

                {/* Error Message */}
                {error && (
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
                        {error}
                    </div>
                )}

                {/* Profile Section */}
                <div className="card" style={{ padding: 'var(--space-5)', marginBottom: 'var(--space-4)' }}>
                    <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: 'var(--space-4)' }}>
                        Profil
                    </h2>

                    <form onSubmit={handleUpdateProfile} className="flex flex-col gap-4">
                        <div className="input-group">
                            <label className="input-label">Nama Lengkap</label>
                            <div className="input-icon">
                                <User size={18} className="icon" />
                                <input
                                    type="text"
                                    className="input"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    placeholder="Nama lengkap"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading || displayName === user?.displayName}
                        >
                            {loading ? <span className="spinner" /> : <><Save size={18} /> Simpan Nama</>}
                        </button>
                    </form>
                </div>

                {/* Email Section */}
                <div className="card" style={{ padding: 'var(--space-5)', marginBottom: 'var(--space-4)' }}>
                    <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: 'var(--space-4)' }}>
                        Email
                    </h2>

                    {isGoogleUser ? (
                        <p className="text-muted" style={{ fontSize: '14px' }}>
                            Anda login menggunakan Google. Email tidak dapat diubah dari sini.
                        </p>
                    ) : (
                        <form onSubmit={handleUpdateEmail} className="flex flex-col gap-4">
                            <div className="input-group">
                                <label className="input-label">Email Baru</label>
                                <div className="input-icon">
                                    <Mail size={18} className="icon" />
                                    <input
                                        type="email"
                                        className="input"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="email@example.com"
                                    />
                                </div>
                            </div>

                            <div className="input-group">
                                <label className="input-label">Password Saat Ini</label>
                                <div className="input-icon">
                                    <Lock size={18} className="icon" />
                                    <input
                                        type="password"
                                        className="input"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        placeholder="Masukkan password untuk konfirmasi"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={loading || email === user?.email}
                            >
                                {loading ? <span className="spinner" /> : <><Save size={18} /> Ubah Email</>}
                            </button>
                        </form>
                    )}
                </div>

                {/* Password Section */}
                <div className="card" style={{ padding: 'var(--space-5)' }}>
                    <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: 'var(--space-4)' }}>
                        Ubah Password
                    </h2>

                    {isGoogleUser ? (
                        <p className="text-muted" style={{ fontSize: '14px' }}>
                            Anda login menggunakan Google. Password dikelola oleh Google.
                        </p>
                    ) : (
                        <form onSubmit={handleUpdatePassword} className="flex flex-col gap-4">
                            <div className="input-group">
                                <label className="input-label">Password Saat Ini</label>
                                <div className="input-icon">
                                    <Lock size={18} className="icon" />
                                    <input
                                        type="password"
                                        className="input"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        placeholder="Password saat ini"
                                    />
                                </div>
                            </div>

                            <div className="input-group">
                                <label className="input-label">Password Baru</label>
                                <div className="input-icon">
                                    <Lock size={18} className="icon" />
                                    <input
                                        type="password"
                                        className="input"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Minimal 6 karakter"
                                    />
                                </div>
                            </div>

                            <div className="input-group">
                                <label className="input-label">Konfirmasi Password Baru</label>
                                <div className="input-icon">
                                    <Lock size={18} className="icon" />
                                    <input
                                        type="password"
                                        className="input"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Ulangi password baru"
                                    />
                                </div>
                                {confirmPassword && newPassword !== confirmPassword && (
                                    <span style={{ color: 'var(--danger)', fontSize: '12px' }}>
                                        Password tidak sama
                                    </span>
                                )}
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={loading || !newPassword || !currentPassword}
                            >
                                {loading ? <span className="spinner" /> : <><Lock size={18} /> Ubah Password</>}
                            </button>
                        </form>
                    )}
                </div>

                {/* Account Info */}
                <div
                    className="card"
                    style={{
                        padding: 'var(--space-4)',
                        marginTop: 'var(--space-4)',
                        background: 'var(--surface)'
                    }}
                >
                    <p className="text-muted" style={{ fontSize: '13px', marginBottom: 'var(--space-2)' }}>
                        Terdaftar dengan: <strong>{user?.email}</strong>
                    </p>
                    <p className="text-muted" style={{ fontSize: '13px' }}>
                        Provider: <strong>{isGoogleUser ? 'Google' : 'Email/Password'}</strong>
                    </p>
                </div>
            </div>
        </div>
    );
}
