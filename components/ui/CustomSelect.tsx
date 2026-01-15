'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface SelectOption {
    value: string;
    label: string;
}

interface CustomSelectProps {
    options: SelectOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    icon?: React.ReactNode;
}

export default function CustomSelect({
    options,
    value,
    onChange,
    placeholder = 'Pilih opsi',
    icon
}: CustomSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt.value === value);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={ref} style={{ position: 'relative', width: '100%' }}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
                style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    fontSize: '16px',
                    fontFamily: 'var(--font-sans)',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    transition: 'all 150ms ease',
                }}
            >
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {icon && <span style={{ color: 'var(--text-muted)' }}>{icon}</span>}
                    {selectedOption?.label || placeholder}
                </span>
                <ChevronDown
                    size={18}
                    style={{
                        color: 'var(--text-muted)',
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                        flexShrink: 0,
                    }}
                />
            </button>

            {isOpen && (
                <div
                    style={{
                        position: 'absolute',
                        top: 'calc(100% + 8px)',
                        left: 0,
                        right: 0,
                        zIndex: 1000,
                        background: '#1C1C1F',
                        border: '1px solid #27272A',
                        borderRadius: '12px',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                        maxHeight: '280px',
                        overflowY: 'auto',
                        padding: '4px',
                    }}
                >
                    {options.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                                onChange(option.value);
                                setIsOpen(false);
                            }}
                            style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '12px 16px',
                                fontSize: '14px',
                                fontFamily: 'var(--font-sans)',
                                background: option.value === value ? 'rgba(34, 197, 94, 0.15)' : 'transparent',
                                border: 'none',
                                borderRadius: '8px',
                                color: option.value === value ? '#22C55E' : '#FAFAFA',
                                cursor: 'pointer',
                                textAlign: 'left',
                                transition: 'background 150ms ease',
                            }}
                            onMouseEnter={(e) => {
                                if (option.value !== value) {
                                    e.currentTarget.style.background = '#141416';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (option.value !== value) {
                                    e.currentTarget.style.background = 'transparent';
                                }
                            }}
                        >
                            <span>{option.label}</span>
                            {option.value === value && (
                                <Check size={16} style={{ color: '#22C55E' }} />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
