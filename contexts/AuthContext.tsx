'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
    User,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile,
    GoogleAuthProvider,
    signInWithPopup,
    sendPasswordResetEmail
} from 'firebase/auth';
import { auth, isFirebaseAvailable } from '@/lib/firebase';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    error: string | null;
    isConfigured: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, displayName: string) => Promise<void>;
    logout: () => Promise<void>;
    loginWithGoogle: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // If Firebase is not configured, stop loading and allow demo mode
        if (!isFirebaseAvailable || !auth) {
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const login = async (email: string, password: string) => {
        if (!auth) {
            setError('Firebase tidak dikonfigurasi. Silakan setup credentials.');
            throw new Error('Firebase tidak dikonfigurasi');
        }

        try {
            setError(null);
            setLoading(true);
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err: unknown) {
            const errorMessage = getAuthErrorMessage(err);
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const register = async (email: string, password: string, displayName: string) => {
        if (!auth) {
            setError('Firebase tidak dikonfigurasi. Silakan setup credentials.');
            throw new Error('Firebase tidak dikonfigurasi');
        }

        try {
            setError(null);
            setLoading(true);
            const { user } = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(user, { displayName });
        } catch (err: unknown) {
            const errorMessage = getAuthErrorMessage(err);
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        if (!auth) return;

        try {
            setError(null);
            await signOut(auth);
        } catch (err: unknown) {
            const errorMessage = getAuthErrorMessage(err);
            setError(errorMessage);
            throw new Error(errorMessage);
        }
    };

    const loginWithGoogle = async () => {
        if (!auth) {
            setError('Firebase tidak dikonfigurasi. Silakan setup credentials.');
            throw new Error('Firebase tidak dikonfigurasi');
        }

        try {
            setError(null);
            setLoading(true);
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
        } catch (err: unknown) {
            const errorMessage = getAuthErrorMessage(err);
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const resetPassword = async (email: string) => {
        if (!auth) {
            setError('Firebase tidak dikonfigurasi. Silakan setup credentials.');
            throw new Error('Firebase tidak dikonfigurasi');
        }

        try {
            setError(null);
            await sendPasswordResetEmail(auth, email);
        } catch (err: unknown) {
            const errorMessage = getAuthErrorMessage(err);
            setError(errorMessage);
            throw new Error(errorMessage);
        }
    };

    const clearError = () => setError(null);

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            error,
            isConfigured: isFirebaseAvailable,
            login,
            register,
            logout,
            loginWithGoogle,
            resetPassword,
            clearError
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

// Helper function to get user-friendly error messages
function getAuthErrorMessage(error: unknown): string {
    if (error && typeof error === 'object' && 'code' in error) {
        const code = (error as { code: string }).code;
        switch (code) {
            case 'auth/email-already-in-use':
                return 'Email sudah terdaftar. Silakan login atau gunakan email lain.';
            case 'auth/invalid-email':
                return 'Format email tidak valid.';
            case 'auth/operation-not-allowed':
                return 'Metode login ini tidak diizinkan.';
            case 'auth/weak-password':
                return 'Password terlalu lemah. Gunakan minimal 6 karakter.';
            case 'auth/user-disabled':
                return 'Akun ini telah dinonaktifkan.';
            case 'auth/user-not-found':
                return 'Email tidak terdaftar.';
            case 'auth/wrong-password':
                return 'Password salah.';
            case 'auth/invalid-credential':
                return 'Email atau password salah.';
            case 'auth/too-many-requests':
                return 'Terlalu banyak percobaan. Coba lagi nanti.';
            case 'auth/popup-closed-by-user':
                return 'Popup login ditutup sebelum selesai.';
            case 'auth/network-request-failed':
                return 'Koneksi internet bermasalah.';
            default:
                return 'Terjadi kesalahan. Silakan coba lagi.';
        }
    }
    return 'Terjadi kesalahan. Silakan coba lagi.';
}
