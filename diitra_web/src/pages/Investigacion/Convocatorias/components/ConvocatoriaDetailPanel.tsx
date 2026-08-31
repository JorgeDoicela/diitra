import React from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { X, Calendar, Layers, FileText } from 'lucide-react';
import type { Convocatoria, Catalogo } from '../types';
import { buildWorkspacePath } from '../../../../core/documents/templateUrl';

interface ConvocatoriaDetailPanelProps {
    selectedConvocatoria: Convocatoria | null;
    setSelectedConvocatoria: React.Dispatch<React.SetStateAction<Convocatoria | null>>;
    setLastActiveUuid: React.Dispatch<React.SetStateAction<string | null>>;
    tiposConv: Catalogo[];
    canEditConvocatoria: (estado: Convocatoria['estado']) => boolean;
    handleEdit: (conv: Convocatoria) => void;
    handleStatusChange: (uuid: string, newStatus: string) => Promise<void>;
    handleOpenPublishDrawer?: (conv: Convocatoria) => void;
}

export const ConvocatoriaDetailPanel = ({
    selectedConvocatoria,
    setSelectedConvocatoria,
    setLastActiveUuid,
    tiposConv,
    canEditConvocatoria,
    handleEdit,
    handleStatusChange,
    handleOpenPublishDrawer
}: ConvocatoriaDetailPanelProps) => {
    if (!selectedConvocatoria) return null;

    const handleClose = () => {
        setLastActiveUuid(selectedConvocatoria.uuid);
        setSelectedConvocatoria(null);
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex justify-end">
            <div
                className="absolute inset-0 bg-bg-deep/90 backdrop-blur-sm cursor-pointer"
                onClick={handleClose}
            />

            <div className="relative w-full max-w-2xl h-full bg-surface border-l border-border-thin flex flex-col z-10 animate-fade-up">
                <div className="flex items-center justify-between px-8 py-6 border-b border-border-thin bg-surface">
                    <div className="flex items-center gap-3">
                        <span className="px-2.5 py-1 bg-bg-deep text-text-dim border border-border-thin text-[10px] font-mono uppercase rounded-md">
                            {selectedConvocatoria.codigo_convocatoria}
                        </span>
                        <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider">
                            <span className={`dot dot-pulse ${selectedConvocatoria.estado === 'Abierta' ? 'dot-success' : 'dot-warning'}`} />
                            <span className={selectedConvocatoria.estado === 'Abierta' ? 'text-success' : 'text-warning'}>
                                {selectedConvocatoria.estado === 'Abierta' ? 'Convocatoria Activa' : `Estado: ${selectedConvocatoria.estado}`}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 rounded-lg text-text-dim hover:text-text-main hover:bg-surface-hover transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-surface">
                    <div className="space-y-2">
                        <h2 className="text-3xl font-bold tracking-tight text-text-main leading-tight font-sans">
                            {selectedConvocatoria.titulo}
                        </h2>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bento-card static p-5 space-y-1.5">
                            <div className="text-[10px] font-bold text-text-dim uppercase tracking-widest flex items-center gap-1.5">
                                <Calendar size={12} /> Fecha de Apertura
                            </div>
                            <div className="text-sm font-bold text-text-main font-mono">
                                {selectedConvocatoria.fecha_apertura}
                            </div>
                        </div>
                        <div className="bento-card static p-5 space-y-1.5">
                            <div className="text-[10px] font-bold text-error uppercase tracking-widest flex items-center gap-1.5">
                                <Calendar size={12} /> Fecha de Cierre (Límite)
                            </div>
                            <div className="text-sm font-bold text-error font-mono">
                                {selectedConvocatoria.fecha_cierre}
                            </div>
                        </div>
                        <div className="bento-card static p-5 space-y-1.5 col-span-2">
                            <div className="text-[10px] font-bold text-brand uppercase tracking-widest flex items-center gap-1.5">
                                <Layers size={12} /> Tipo de Convocatoria
                            </div>
                            <div className="text-sm font-bold text-text-main">
                                {tiposConv.find(t => t.id === selectedConvocatoria.id_tipo_convocatoria)?.nombre || 'Estándar'}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-text-main uppercase tracking-widest flex items-center gap-1.5">
                                <FileText size={12} /> Proyectos Asociados
                            </h4>
                            {selectedConvocatoria.proyectos && selectedConvocatoria.proyectos.length > 0 && (
                                <span className="px-2 py-0.5 text-[10px] bg-brand/10 text-brand rounded-full font-bold">
                                    {selectedConvocatoria.proyectos.length}
                                </span>
                            )}
                        </div>
                        <div className="space-y-2">
                            {selectedConvocatoria.proyectos && selectedConvocatoria.proyectos.length > 0 ? (
                                selectedConvocatoria.proyectos.map((proyecto, idx) => (
                                    <Link
                                        key={idx}
                                        to={buildWorkspacePath('PROTOCOLO_INVESTIGACION', proyecto.uuid, '', '/investigacion')}
                                        onClick={() => {
                                            setSelectedConvocatoria(null);
                                        }}
                                        className="flex items-center justify-between p-3 bento-card static text-xs hover:border-brand transition-all duration-200 group cursor-pointer decoration-none"
                                    >
                                        <div className="flex flex-col min-w-0 pr-3">
                                            <span className="font-bold text-text-main truncate group-hover:text-brand transition-colors">
                                                {proyecto.titulo}
                                            </span>
                                            {proyecto.codigo_institucional && (
                                                <span className="text-[10px] text-text-dim font-mono mt-0.5">
                                                    {proyecto.codigo_institucional}
                                                </span>
                                            )}
                                        </div>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold shrink-0 uppercase tracking-wider ${
                                            proyecto.estado === 'Aprobado' || proyecto.estado === 'Ejecución' ? 'bg-success/10 text-success' :
                                            proyecto.estado === 'Borrador' ? 'bg-text-dim/10 text-text-dim' :
                                            'bg-brand/10 text-brand'
                                        }`}>
                                            {proyecto.estado}
                                        </span>
                                    </Link>
                                ))
                            ) : (
                                <p className="text-xs text-text-dim">No hay proyectos registrados en esta convocatoria.</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-8 border-t border-border-thin bg-surface flex gap-4">
                    {canEditConvocatoria(selectedConvocatoria.estado) && (
                        <button
                            onClick={() => {
                                handleEdit(selectedConvocatoria);
                                setSelectedConvocatoria(null);
                            }}
                            className="btn-vercel-primary flex-1"
                        >
                            Editar Convocatoria
                        </button>
                    )}
                    {selectedConvocatoria.estado === 'Borrador' && (
                        <button
                            onClick={() => {
                                if (handleOpenPublishDrawer) {
                                    handleOpenPublishDrawer(selectedConvocatoria);
                                } else {
                                    handleStatusChange(selectedConvocatoria.uuid, 'Abierta');
                                }
                                setSelectedConvocatoria(null);
                            }}
                            className="btn-brand flex-1"
                        >
                            Publicar y Difundir
                        </button>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};
