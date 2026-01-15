'use client';

import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ReactNode } from 'react';

interface PageHeaderProps {
    title: string;
    showBack?: boolean;
    leftContent?: ReactNode;
    rightContent?: ReactNode;
}

export default function PageHeader({ title, showBack = false, leftContent, rightContent }: PageHeaderProps) {
    const router = useRouter();

    return (
        <header className="page-header">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {leftContent}
                    {showBack && (
                        <button
                            onClick={() => router.back()}
                            className="btn btn-ghost btn-icon"
                            aria-label="Kembali"
                        >
                            <ChevronLeft size={24} />
                        </button>
                    )}
                    <h1 className="page-header-title">{title}</h1>
                </div>
                {rightContent && <div>{rightContent}</div>}
            </div>
        </header>
    );
}
