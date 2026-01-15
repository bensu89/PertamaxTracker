'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';

export default function FloatingActionButton() {
    return (
        <Link href="/fuel/new" className="fab" aria-label="Tambah Pengisian">
            <Plus size={28} strokeWidth={2.5} />
        </Link>
    );
}
