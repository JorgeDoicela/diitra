import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, Globe, Layers, Fingerprint, Laptop, Copy, Check, ShieldCheck } from 'lucide-react';
import { useNotifications } from '../../../api/NotificationsContext';

export interface ConsentimientoData {
    id_consentimiento: number;
    uuid: string;
    id_usuario: number;
    nombre_usuario: string;
    version_politica: string;
    canal: string;
    fecha_consentimiento: string;
    ip_direccion?: string;
    user_agent?: string;
    estado: string;
}

interface ConsentDetailPanelProps {
    detailConsent: ConsentimientoData | null;
    onClose: () => void;
}

export const ConsentDetailPanel: React.FC<ConsentDetailPanelProps> = ({
    detailConsent,
    onClose
}) => {
    const { addToast } = useNotifications();
    const [copiedUuid, setCopiedUuid] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && detailConsent) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [detailConsent, onClose]);

    if (!detailConsent) return null;

    const handleCopyUuid = (uuid: string) => {
        navigator.clipboard.writeText(uuid);
        setCopiedUuid(true);
        setTimeout(() => setCopiedUuid(false), 2000);
        addToast('Copiado', 'UUID copiado al portapapeles.', 'info');
    };

    const isOtorgado = detailConsent.estado === 'Otorgado';

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex justify-end">
            {/* Backdrop con desenfoque suave sobre toda la ventana */}
            <div
                className="absolute inset-0 bg-bg-deep/90 backdrop-blur-sm cursor-pointer animate-fade-in"
                onClick={onClose}
            />

            {/* Drawer Lateral idéntico al estándar de Convocatorias / Paneles DIITRA */}
            <div className="relative w-full max-w-2xl h-full bg-surface border-l border-border-thin flex flex-col z-10 animate-fade-up overflow-hidden">
                {/* Top Bar / Header */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-border-thin bg-surface shrink-0">
                    <div className="flex items-center gap-3">
                        <span className="px-2.5 py-1 bg-bg-deep text-text-dim border border-border-thin text-[10px] font-mono uppercase rounded-md">
                            ID #{detailConsent.id_usuario}
                        </span>
                        <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider">
                            <span className={`dot dot-pulse ${isOtorgado ? 'dot-success' : 'dot-warning'}`} />
                            <span className={isOtorgado ? 'text-success' : 'text-warning'}>
                                {isOtorgado ? 'Consentimiento Activo' : `Estado: ${detailConsent.estado}`}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg text-text-dim hover:text-text-main hover:bg-surface-hover transition-colors cursor-pointer border-0 bg-transparent"
                        title="Cerrar (Esc)"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Content Body */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-surface custom-scrollbar">
                    {/* Título Principal y Resumen */}
                    <div className="space-y-3">
                        <h2 className="text-3xl font-bold tracking-tight text-text-main leading-tight font-sans">
                            {detailConsent.nombre_usuario}
                        </h2>
                        <p className="text-sm text-text-dim leading-relaxed font-medium">
                            Registro individual de aceptación de términos, aviso de privacidad y tratamiento de datos personales conforme a la LOPDP.
                        </p>
                    </div>

                    {/* Bento Grid de Parámetros */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bento-card static p-5 space-y-1.5">
                            <div className="text-[10px] font-bold text-text-dim uppercase tracking-widest flex items-center gap-1.5">
                                <Calendar size={12} /> Fecha de Registro
                            </div>
                            <div className="text-sm font-bold text-text-main font-mono">
                                {new Date(detailConsent.fecha_consentimiento).toLocaleDateString('es-EC', { 
                                    year: 'numeric', 
                                    month: '2-digit', 
                                    day: '2-digit' 
                                })}
                            </div>
                            <div className="text-[11px] text-text-dim font-mono">
                                {new Date(detailConsent.fecha_consentimiento).toLocaleTimeString('es-EC')}
                            </div>
                        </div>

                        <div className="bento-card static p-5 space-y-1.5">
                            <div className="text-[10px] font-bold text-brand uppercase tracking-widest flex items-center gap-1.5">
                                <Globe size={12} /> Canal de Registro
                            </div>
                            <div className="text-sm font-bold text-text-main">
                                {detailConsent.canal}
                            </div>
                            <div className="text-[11px] text-text-dim font-mono">
                                IP: {detailConsent.ip_direccion || '127.0.0.1'}
                            </div>
                        </div>

                        <div className="bento-card static p-5 space-y-1.5 col-span-2">
                            <div className="text-[10px] font-bold text-text-dim uppercase tracking-widest flex items-center gap-1.5">
                                <Layers size={12} /> Política / Versión de Normativa
                            </div>
                            <div className="text-sm font-bold text-text-main font-mono">
                                {detailConsent.version_politica}
                            </div>
                        </div>
                    </div>

                    {/* Trazabilidad y Firma Digital */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-text-main uppercase tracking-widest flex items-center gap-1.5">
                                <Fingerprint size={12} /> Firma Digital y Trazabilidad
                            </h4>
                        </div>
                        <div className="space-y-3">
                            {/* Identificador UUID */}
                            <div className="p-4 bento-card static space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] uppercase font-bold text-text-dim tracking-wider">
                                        Identificador Único de Auditoría (UUID)
                                    </span>
                                    <button
                                        onClick={() => handleCopyUuid(detailConsent.uuid)}
                                        className="text-[11px] font-semibold text-brand hover:text-brand-hover flex items-center gap-1 transition-colors cursor-pointer bg-transparent border-0 p-0"
                                    >
                                        {copiedUuid ? (
                                            <>
                                                <Check size={12} className="text-success" />
                                                <span className="text-success">Copiado</span>
                                            </>
                                        ) : (
                                            <>
                                                <Copy size={12} />
                                                <span>Copiar</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                                <div className="font-mono text-xs font-semibold text-text-main bg-bg-deep p-3 rounded-lg border border-border-thin select-all break-all">
                                    {detailConsent.uuid}
                                </div>
                            </div>

                            {/* User Agent */}
                            <div className="p-4 bento-card static space-y-2">
                                <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-text-dim tracking-wider">
                                    <Laptop size={12} />
                                    <span>Huella del Navegador y Sistema Operativo (User Agent)</span>
                                </div>
                                <div className="font-mono text-xs text-text-dim leading-relaxed bg-bg-deep p-3 rounded-lg border border-border-thin select-all break-words">
                                    {detailConsent.user_agent || 'No Registrado'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-8 border-t border-border-thin bg-surface flex gap-4 shrink-0">
                    <button
                        onClick={onClose}
                        className="btn-vercel-primary flex-1 py-3 text-center cursor-pointer"
                    >
                        Cerrar Detalle
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
