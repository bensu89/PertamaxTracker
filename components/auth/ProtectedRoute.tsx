'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts';
import { AlertTriangle } from 'lucide-react';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { user, loading, isConfigured } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // Only redirect if Firebase is configured and user is not authenticated
        if (!loading && isConfigured && !user) {
            router.push('/login');
        }
    }, [user, loading, isConfigured, router]);

    if (loading) {
        return (
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    background: 'var(--background)'
                }}
            >
                <div className="spinner" style={{ width: '32px', height: '32px' }} />
            </div>
        );
    }

    // Demo mode - Firebase not configured
    if (!isConfigured) {
        return (
            <>
                {/* Demo Mode Banner */}
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        background: 'var(--warning)',
                        color: '#000',
                        padding: 'var(--space-2) var(--space-4)',
                        fontSize: '13px',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 'var(--space-2)',
                        zIndex: 1000
                    }}
                >
                    <AlertTriangle size={16} />
                    Mode Demo - Firebase belum dikonfigurasi. Data tidak akan disimpan.
                </div>
                <div style={{ paddingTop: '36px' }}>
                    {children}
                </div>
            </>
        );
    }

    // Firebase configured but not authenticated
    if (!user) {
        return null;
    }

    return <>{children}</>;
}
