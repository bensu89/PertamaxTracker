import { BottomNav, Sidebar, FloatingActionButton } from '@/components/layout';
import { ProtectedRoute } from '@/components/auth';

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ProtectedRoute>
            <Sidebar />
            <main className="main-content">
                {children}
            </main>
            <FloatingActionButton />
            <BottomNav />
        </ProtectedRoute>
    );
}
