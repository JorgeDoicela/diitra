import React from 'react';
import { ArrowLeft, Save, Clock, CheckCircle, Shield, Sun, Moon } from 'lucide-react';
import type { CoWorkUser } from '../../../../../core/cowork/types';

export interface BuilderHeaderProps {
    title: string;
    subtitle: string;
    readOnly?: boolean;
    isSyncing: boolean;
    isDirty: boolean;
    lastSaved: string | null;
    isOnline: boolean;
    isSlowConnection: boolean;
    users: CoWorkUser[];
    isDarkMode: boolean;
    onClose: () => void;
    onSave: () => void;
    toggleTheme: () => void;
}

export const BuilderHeader: React.FC<BuilderHeaderProps> = ({
    title,
    subtitle,
    readOnly = false,
    isSyncing,
    isDirty,
    lastSaved,
    isOnline,
    isSlowConnection,
    users,
    isDarkMode,
    onClose,
    onSave,
    toggleTheme
}) => {
    return (
        <div className="px-4 md:px-8 py-3 border-b border-border-thin bg-bg-deep/75 backdrop-blur-md flex flex-col md:flex-row justify-between items-center gap-4 md:gap-0 z-[50]">
            <div className="flex items-center justify-between w-full md:w-auto gap-4">
                <div className="flex items-center gap-3">
                    {/* Botón Volver/Cerrar */}
                    <button
                        onClick={onClose}
                        className="flex items-center gap-2 py-1.5 text-text-dim hover:text-text-main transition-all duration-200 group cursor-pointer text-[10px] md:text-xs font-bold uppercase tracking-wider bg-transparent border-0 active:scale-95"
                        title="Salir del documento y guardar cambios"
                        aria-label="Salir del documento"
                    >
                        <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
                        <span>Volver</span>
                    </button>

                    {/* Divisor Vertical */}
                    <div className="h-5 w-[1px] bg-border-thin mx-1" />

                    {/* Identidad */}
                    <div className="min-w-0">
                        <h2 className="text-xs md:text-sm font-black text-text-main tracking-tighter uppercase leading-none truncate max-w-[150px] xs:max-w-[220px] sm:max-w-[320px] md:max-w-[400px] lg:max-w-[500px]" title={title}>
                            {title}
                        </h2>
                        {subtitle && (
                            <p className="text-[8px] text-text-dim font-bold uppercase tracking-widest mt-0.5 truncate max-w-[120px] xs:max-w-[200px] sm:max-w-[300px] md:max-w-[380px] lg:max-w-[500px]" title={subtitle}>
                                {subtitle}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3 md:gap-4 flex-wrap md:flex-nowrap">
                {/* 1. Único Indicador de Persistencia Inteligente */}
                <div className="flex items-center">
                    {readOnly ? (
                        <span className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest text-warning cursor-default select-none flex items-center gap-1.5 animate-fade-in pr-1">
                            <Shield size={10} /> Solo lectura
                        </span>
                    ) : isSyncing ? (
                        <span className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest text-text-dim flex items-center gap-1.5 select-none animate-fade-in pr-1">
                            <Clock size={10} className="animate-spin text-text-dim" /> Guardando...
                        </span>
                    ) : isDirty ? (
                        <button
                            onClick={onSave}
                            className="px-3 py-1.5 bg-transparent hover:bg-surface border border-border-thin hover:border-text-dim/30 rounded-md text-[8px] md:text-[9px] font-bold uppercase tracking-widest text-text-main transition-all flex items-center justify-center gap-1.5 active:scale-95 animate-fade-in cursor-pointer"
                            title="Persistir cambios inmediatamente en base de datos"
                        >
                            <Save size={10} /> <span>Guardar cambios</span>
                        </button>
                    ) : (
                        <span className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest text-success flex items-center gap-1.5 select-none animate-fade-in pr-1" title="Todos los cambios están persistidos y sincronizados">
                            <CheckCircle size={10} /> {lastSaved ? `Guardado ${lastSaved}` : 'Guardado'}
                        </span>
                    )}
                </div>

                {/* 2. Estado de conexión */}
                <div className="flex items-center gap-1.5">
                    {!isOnline ? (
                        <>
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-[7px] md:text-[8px] font-black text-red-500 uppercase tracking-widest">Sin conexión</span>
                        </>
                    ) : isSlowConnection ? (
                        <>
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                            <span className="text-[7px] md:text-[8px] font-black text-amber-500 uppercase tracking-widest">Señal débil</span>
                        </>
                    ) : (
                        <>
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-[7px] md:text-[8px] font-black text-green-500 uppercase tracking-widest">En línea</span>
                        </>
                    )}
                </div>

                {/* 3. Avatares de colaboradores conectados */}
                {users.length > 0 ? (
                    <div className="flex -space-x-1.5 items-center">
                        {users.map((u, i) => (
                            <div
                                key={`${u.id}-${i}`}
                                className="w-5 h-5 rounded-full border border-surface flex items-center justify-center text-[8px] font-black text-white shadow-md cursor-help transition-transform hover:-translate-y-0.5"
                                style={{ backgroundColor: u.color }}
                                title={`${u.name} (${u.role})`}
                            >
                                {u.initials}
                            </div>
                        ))}
                    </div>
                ) : (
                    <span className="text-[7px] md:text-[8px] font-bold text-text-dim uppercase tracking-widest select-none">Solo tú</span>
                )}

                {/* 4. Botón de cambio de tema */}
                <button
                    onClick={toggleTheme}
                    className="p-1.5 text-text-dim hover:text-text-main transition-all duration-200 flex items-center justify-center cursor-pointer active:scale-90 bg-transparent border-0"
                    title={isDarkMode ? 'Activar Modo Claro' : 'Activar Modo Oscuro'}
                    aria-label="Cambiar tema claro/oscuro"
                >
                    {isDarkMode ? <Sun size={14} className="text-warning animate-pulse" /> : <Moon size={14} className="text-indigo-400" />}
                </button>
            </div>
        </div>
    );
};
