import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { FileText, X, Plus, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { createEvento, buildPayload, COLORES_OPCIONES } from '../../services/calendarioService';
import './StickyNotesFloatingButton.css';

interface StickyNotesFloatingButtonProps {
    onOpenHelp?: () => void;
    pendingCount?: number;
}

/** Deriva un label corto de la pathname actual para mostrar como chip de contexto */
const getContextoLabel = (pathname: string): { label: string; icon: string } | null => {
    if (pathname.startsWith('/investigacion/proyectos')) return { label: 'Proyectos', icon: '📁' };
    if (pathname.startsWith('/investigacion/convocatorias')) return { label: 'Convocatorias', icon: '📢' };
    if (pathname.startsWith('/investigacion/monitoreo')) return { label: 'Monitoreo', icon: '📊' };
    if (pathname.startsWith('/investigacion')) return { label: 'Investigación', icon: '🔬' };
    if (pathname.startsWith('/agenda')) return { label: 'Agenda', icon: '📅' };
    if (pathname.startsWith('/analiticas')) return { label: 'Analíticas', icon: '📈' };
    if (pathname.startsWith('/admin')) return { label: 'Admin', icon: '⚙️' };
    return null;
};

export const StickyNotesFloatingButton: React.FC<StickyNotesFloatingButtonProps> = ({
    onOpenHelp,
    pendingCount = 0,
}) => {
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const [text, setText] = useState('');
    const [detalle, setDetalle] = useState('');
    const [detalleExpanded, setDetalleExpanded] = useState(false);
    const [color, setColor] = useState('#F59E0B');

    const contexto = getContextoLabel(location.pathname);

    // Cerrar con Escape
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsOpen(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    // Limpiar formulario al cerrar
    const handleClose = () => {
        setIsOpen(false);
        setText('');
        setDetalle('');
        setDetalleExpanded(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim()) return;

        const payload = buildPayload({
            titulo: text.trim(),
            descripcion: `Creado desde nota rápida flotante en la página: ${location.pathname}`,
            tipo: 'Personal',
            fechaInicio: null,
            fechaFin: null,
            esTodoElDia: true,
            colorHex: color,
            esPrivado: true,
            prioridad: 'Media',
            estado: 'Inbox',
            alertaDias: '',
            recurrenciaAnual: false,
            urlAccion: location.pathname,
            notaDetalle: detalle.trim() || null,
        });

        // Limpieza y cierre inmediato
        handleClose();

        // Envío asíncrono en segundo plano
        createEvento(payload).then(() => {
            window.dispatchEvent(new CustomEvent('diitra:note-created'));
        }).catch(err => {
            console.error('Error al guardar nota rápida flotante en background:', err);
        });
    };

    // No renderizar en rutas públicas
    const publicRoutes = ['/login', '/registro', '/recuperar-password', '/restablecer-password'];
    if (publicRoutes.includes(location.pathname)) return null;

    return (
        <div className="sticky-floating-container">
            {isOpen ? (
                <div className="sticky-floating-card animate-slide-up">
                    <div className="sticky-floating-header">
                        <h3>Añadir Nota Rápida</h3>
                        <button type="button" onClick={handleClose} className="sticky-floating-close">
                            <X size={18} />
                        </button>
                    </div>

                    {/* Chip de contexto de página */}
                    {contexto && (
                        <div className="sticky-context-chip">
                            <span>{contexto.icon}</span>
                            <span>{contexto.label}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="sticky-floating-form">
                        <textarea
                            placeholder="Escribe un recordatorio o idea..."
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            className="sticky-floating-textarea"
                            rows={3}
                            required
                            autoFocus
                        />

                        {/* Campo expandible de descripción */}
                        <button
                            type="button"
                            className="sticky-detalle-toggle"
                            onClick={() => setDetalleExpanded(v => !v)}
                        >
                            {detalleExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            {detalleExpanded ? 'Ocultar detalles' : 'Añadir más detalles...'}
                        </button>

                        {detalleExpanded && (
                            <textarea
                                placeholder="Contexto, pasos a seguir, referencias..."
                                value={detalle}
                                onChange={(e) => setDetalle(e.target.value)}
                                className="sticky-floating-textarea sticky-detalle-textarea animate-expand"
                                rows={2}
                            />
                        )}

                        <div className="sticky-floating-actions">
                            <div className="sticky-floating-colors">
                                {COLORES_OPCIONES.map((col) => (
                                    <button
                                        key={col.value}
                                        type="button"
                                        className={`sticky-color-dot ${color === col.value ? 'active' : ''}`}
                                        style={{ backgroundColor: col.value }}
                                        onClick={() => setColor(col.value)}
                                        title={col.label}
                                    />
                                ))}
                            </div>

                            <div className="sticky-floating-buttons">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="btn-vercel-secondary text-xs py-1 px-3 rounded"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="btn-vercel-primary text-xs py-1 px-3 rounded"
                                    disabled={!text.trim()}
                                >
                                    Guardar
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="sticky-floating-triggers-wrapper">
                    {onOpenHelp && (
                        <button
                            type="button"
                            onClick={onOpenHelp}
                            className="sticky-floating-help-btn"
                            title="Guía Interactiva de la página"
                        >
                            <HelpCircle size={15} />
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={() => setIsOpen(true)}
                        className="sticky-floating-trigger-btn"
                        title="Nueva Nota Rápida (Inbox)"
                    >
                        <FileText size={18} />
                        <span className="sticky-floating-badge-plus">
                            <Plus size={8} />
                        </span>
                        {pendingCount > 0 && (
                            <span
                                className="sticky-floating-badge-count"
                                title={`${pendingCount} nota${pendingCount > 1 ? 's' : ''} sin planificar`}
                            >
                                {pendingCount > 9 ? '9+' : pendingCount}
                            </span>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
};
