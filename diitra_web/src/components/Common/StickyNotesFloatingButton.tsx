import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { FileText, X, Plus } from 'lucide-react';
import { createEvento, buildPayload, COLORES_OPCIONES } from '../../services/calendarioService';
import './StickyNotesFloatingButton.css';

export const StickyNotesFloatingButton: React.FC = () => {
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const [text, setText] = useState('');
    const [color, setColor] = useState('#F59E0B');

    // Evitar renderizar en rutas públicas como login
    const publicRoutes = ['/login', '/registro', '/recuperar-password', '/restablecer-password'];
    if (publicRoutes.includes(location.pathname)) {
        return null;
    }

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
        });

        // Limpieza y cierre inmediato (0ms de lag)
        setText('');
        setIsOpen(false);

        // Envío asíncrono en segundo plano
        createEvento(payload).then(() => {
            window.dispatchEvent(new CustomEvent('diitra:note-created'));
        }).catch(err => {
            console.error('Error al guardar nota rápida flotante en background:', err);
        });
    };

    return (
        <div className="sticky-floating-container">
            {isOpen ? (
                <div className="sticky-floating-card animate-slide-up">
                    <div className="sticky-floating-header">
                        <h3>Añadir Nota Rápida</h3>
                        <button type="button" onClick={() => setIsOpen(false)} className="sticky-floating-close">
                            <X size={14} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="sticky-floating-form">
                        <textarea
                            placeholder="Escribe un recordatorio o idea..."
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            className="sticky-floating-textarea"
                            rows={3}
                            required
                        />

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

                            <button
                                type="submit"
                                className="btn-vercel-primary text-xs py-1 px-3 rounded"
                                disabled={!text.trim()}
                            >
                                Guardar
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => setIsOpen(true)}
                    className="sticky-floating-trigger-btn"
                    title="Nueva Nota Adhesiva (Inbox)"
                >
                    <FileText size={18} />
                    <span className="sticky-floating-badge-plus">
                        <Plus size={8} />
                    </span>
                </button>
            )}
        </div>
    );
};
