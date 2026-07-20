import React from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';

interface SidebarBrandProps {
    currentTheme: 'dark' | 'light';
    onClose?: () => void;
}

export const SidebarBrand: React.FC<SidebarBrandProps> = ({ currentTheme, onClose }) => {
    return (
        <>
            {/* Mobile Close Button */}
            <button
                onClick={onClose}
                className="absolute right-4 top-4 p-2 text-text-dim hover:text-text-main lg:hidden border-0 bg-transparent cursor-pointer"
            >
                <X size={20} />
            </button>

            {/* Brand Header */}
            <Link
                to="/dashboard"
                onClick={() => {
                    if (onClose) onClose();
                }}
                className="px-4 mb-4 flex items-center gap-2 cursor-pointer select-none no-underline"
            >
                <img
                    src={currentTheme === 'dark' ? `${import.meta.env.BASE_URL}logo_blanco.png` : `${import.meta.env.BASE_URL}logo_negro.png`}
                    alt="DIITRA Logo"
                    className="h-6 w-auto object-contain"
                />
                <span className="text-[12px] font-semibold text-text-main tracking-[0.4em] font-sans uppercase">
                    DIITRA
                </span>
            </Link>
        </>
    );
};
