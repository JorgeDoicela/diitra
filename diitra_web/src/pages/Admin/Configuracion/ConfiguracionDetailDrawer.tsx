import React from 'react';
import { BookOpen, Calendar, Tag, Globe, BarChart2, CheckCircle, XCircle, ChevronRight, Edit2 } from 'lucide-react';
import { useConfiguracion } from './useConfiguracion';
import type { 
    LineaInvestigacion, 
    PeriodoAcademico, 
    TipoProducto, 
    DominioAcademico, 
    ConfigIndicador, 
    EventoNormativo 
} from './useConfiguracion';

interface ConfiguracionDetailDrawerProps {
    detailItem: { type: 'linea' | 'periodo' | 'producto' | 'dominio' | 'indicador' | 'calendario'; data: any; } | null;
    setDetailItem: React.Dispatch<React.SetStateAction<{ type: 'linea' | 'periodo' | 'producto' | 'dominio' | 'indicador' | 'calendario'; data: any; } | null>>;
    hook: ReturnType<typeof useConfiguracion>;
}

export const ConfiguracionDetailDrawer: React.FC<ConfiguracionDetailDrawerProps> = ({ 
    detailItem, 
    setDetailItem, 
    hook 
}) => {
    if (!detailItem) return null;

    const {
        handleOpenLineaModal,
        handleOpenPeriodoModal,
        handleOpenProductoModal,
        handleOpenDominioModal,
        handleOpenIndicadorModal,
        handleOpenCalendarioModal
    } = hook;

    return (
        <div className="fixed inset-0 z-[9999] flex justify-end">
            <div 
                className="absolute inset-0 bg-bg-deep/90 backdrop-blur-sm cursor-pointer animate-fade-in"
                onClick={() => setDetailItem(null)}
            />
            <div className="relative w-full max-w-xl h-full bg-surface border-l border-border-thin flex flex-col z-10 animate-fade-up overflow-hidden">
                <div className="modal-header">
                    <div className="flex items-center gap-3">
                        <div className="icon-circle icon-circle-brand">
                            {detailItem.type === 'linea' && <BookOpen size={20} />}
                            {detailItem.type === 'periodo' && <Calendar size={20} />}
                            {detailItem.type === 'producto' && <Tag size={20} />}
                            {detailItem.type === 'dominio' && <Globe size={20} />}
                            {detailItem.type === 'indicador' && <BarChart2 size={20} />}
                            {detailItem.type === 'calendario' && <Calendar size={20} />}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-text-main uppercase tracking-tight">
                                {detailItem.type === 'linea' && (detailItem.data as LineaInvestigacion).nombreLinea}
                                {detailItem.type === 'periodo' && ((detailItem.data as PeriodoAcademico).detalle || (detailItem.data as PeriodoAcademico).idPeriodo)}
                                {detailItem.type === 'producto' && (detailItem.data as TipoProducto).nombre}
                                {detailItem.type === 'dominio' && (detailItem.data as DominioAcademico).nombre}
                                {detailItem.type === 'indicador' && (detailItem.data as ConfigIndicador).nombreIndicador}
                                {detailItem.type === 'calendario' && (detailItem.data as EventoNormativo).titulo}
                            </h3>
                            <p className="section-label text-text-dim">
                                {detailItem.type === 'linea' && 'Línea de Investigación'}
                                {detailItem.type === 'periodo' && 'Período Académico'}
                                {detailItem.type === 'producto' && 'Tipo de Producto'}
                                {detailItem.type === 'dominio' && 'Dominio Académico'}
                                {detailItem.type === 'indicador' && 'Indicador CACES'}
                                {detailItem.type === 'calendario' && 'Hito Normativo'}
                            </p>
                        </div>
                    </div>
                    <button onClick={() => setDetailItem(null)} className="text-text-dim hover:text-text-main transition-colors">
                        <ChevronRight size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {detailItem.type === 'linea' && (() => {
                        const l = detailItem.data as LineaInvestigacion;
                        return (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bento-card static p-4">
                                        <label className="section-label text-text-dim mb-2">Código</label>
                                        <p className="text-sm font-semibold text-text-main font-mono">{l.codigoLinea || 'Sin código'}</p>
                                    </div>
                                    <div className="bento-card static p-4">
                                        <label className="section-label text-text-dim mb-2">Estado</label>
                                        {l.activo ? (
                                            <span className="badge-vercel badge-vercel-success"><CheckCircle size={10} /> Activo</span>
                                        ) : (
                                            <span className="badge-vercel badge-vercel-error"><XCircle size={10} /> Inactivo</span>
                                        )}
                                    </div>
                                </div>
                                {l.descripcion && (
                                    <div className="bento-card static p-4 space-y-3">
                                        <label className="section-label text-text-main"><BookOpen size={12} /> Descripción</label>
                                        <div className="divider-vercel !my-0" />
                                        <p className="text-sm text-text-main leading-relaxed">{l.descripcion}</p>
                                    </div>
                                )}
                            </>
                        );
                    })()}

                    {detailItem.type === 'periodo' && (() => {
                        const p = detailItem.data as PeriodoAcademico;
                        return (
                            <>
                                <div className="bento-card static p-4">
                                    <label className="section-label text-text-dim mb-2">Identificador</label>
                                    <p className="text-sm font-semibold text-text-main font-mono">{p.idPeriodo}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bento-card static p-4">
                                        <label className="section-label text-text-dim mb-2">Fecha de Inicio</label>
                                        <p className="text-sm font-semibold text-text-main font-mono">{p.fechaInicial ? p.fechaInicial.split('T')[0] : 'N/A'}</p>
                                    </div>
                                    <div className="bento-card static p-4">
                                        <label className="section-label text-text-dim mb-2">Fecha de Fin</label>
                                        <p className="text-sm font-semibold text-text-main font-mono">{p.fechaFinal ? p.fechaFinal.split('T')[0] : 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bento-card static p-4">
                                        <label className="section-label text-text-dim mb-2">Estado</label>
                                        {p.activo ? (
                                            <span className="badge-vercel badge-vercel-success"><CheckCircle size={10} /> Activo</span>
                                        ) : (
                                            <span className="badge-vercel badge-vercel-error"><XCircle size={10} /> Inactivo</span>
                                        )}
                                    </div>
                                    <div className="bento-card static p-4">
                                        <label className="section-label text-text-dim mb-2">Cerrado</label>
                                        {p.cerrado ? (
                                            <span className="badge-vercel badge-vercel-error"><XCircle size={10} /> Cerrado</span>
                                        ) : (
                                            <span className="badge-vercel badge-vercel-success"><CheckCircle size={10} /> Abierto</span>
                                        )}
                                    </div>
                                </div>
                            </>
                        );
                    })()}

                    {detailItem.type === 'producto' && (() => {
                        const t = detailItem.data as TipoProducto;
                        return (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bento-card static p-4">
                                        <label className="section-label text-text-dim mb-2">Categoría</label>
                                        <span className="badge-vercel badge-vercel-brand">{t.categoria}</span>
                                    </div>
                                    <div className="bento-card static p-4">
                                        <label className="section-label text-text-dim mb-2">Estado</label>
                                        {t.activo ? (
                                            <span className="badge-vercel badge-vercel-success"><CheckCircle size={10} /> Activo</span>
                                        ) : (
                                            <span className="badge-vercel badge-vercel-error"><XCircle size={10} /> Inactivo</span>
                                        )}
                                    </div>
                                </div>
                                <div className="bento-card static p-4 space-y-3">
                                    <label className="section-label text-text-main"><Tag size={12} /> Registro de Propiedad Intelectual</label>
                                    <div className="divider-vercel !my-0" />
                                    <p className="text-sm text-text-main">{t.requiereRegistro ? 'Requiere registro SENADI / Indexación' : 'No requiere registro adicional'}</p>
                                </div>
                            </>
                        );
                    })()}

                    {detailItem.type === 'dominio' && (() => {
                        const d = detailItem.data as DominioAcademico;
                        return (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bento-card static p-4">
                                        <label className="section-label text-text-dim mb-2">Fecha de Registro</label>
                                        <p className="text-sm font-bold text-text-main font-mono">{d.fechaRegistro ? d.fechaRegistro.split('T')[0] : 'N/A'}</p>
                                    </div>
                                    <div className="bento-card static p-4">
                                        <label className="section-label text-text-dim mb-2">Estado</label>
                                        {d.activo ? (
                                            <span className="badge-vercel badge-vercel-success"><CheckCircle size={10} /> Activo</span>
                                        ) : (
                                            <span className="badge-vercel badge-vercel-error"><XCircle size={10} /> Inactivo</span>
                                        )}
                                    </div>
                                </div>
                            </>
                        );
                    })()}

                    {detailItem.type === 'indicador' && (() => {
                        const i = detailItem.data as ConfigIndicador;
                        return (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bento-card static p-4">
                                        <label className="section-label text-text-dim mb-2">Código</label>
                                        <p className="text-sm font-bold text-text-main font-mono">{i.codigoIndicador}</p>
                                    </div>
                                    <div className="bento-card static p-4">
                                        <label className="section-label text-text-dim mb-2">Estado</label>
                                        {i.activo ? (
                                            <span className="badge-vercel badge-vercel-success"><CheckCircle size={10} /> Activo</span>
                                        ) : (
                                            <span className="badge-vercel badge-vercel-error"><XCircle size={10} /> Inactivo</span>
                                        )}
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="bento-card static p-4">
                                        <label className="section-label text-text-dim mb-2">Valor Referencia</label>
                                        <p className="text-lg font-bold text-text-main">{i.valorReferencia} {i.tipoDato === 'Porcentaje' ? '%' : i.tipoDato === 'Monto' ? '$' : ''}</p>
                                    </div>
                                    <div className="bento-card static p-4">
                                        <label className="section-label text-text-dim mb-2">Tipo de Dato</label>
                                        <span className="badge-vercel badge-vercel-brand">{i.tipoDato}</span>
                                    </div>
                                    <div className="bento-card static p-4">
                                        <label className="section-label text-text-dim mb-2">Año Normativa</label>
                                        <p className="text-sm font-bold text-text-main font-mono">{i.añoNormativa}</p>
                                    </div>
                                </div>
                                {i.descripcion && (
                                    <div className="bento-card static p-4 space-y-3">
                                        <label className="section-label text-text-main"><BarChart2 size={12} /> Descripción</label>
                                        <div className="divider-vercel !my-0" />
                                        <p className="text-sm text-text-main leading-relaxed">{i.descripcion}</p>
                                    </div>
                                )}
                            </>
                        );
                    })()}

                    {detailItem.type === 'calendario' && (() => {
                        const c = detailItem.data as EventoNormativo;
                        return (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bento-card static p-4">
                                        <label className="section-label text-text-dim mb-2">Hito Normativo</label>
                                        <p className="text-sm font-bold text-text-main">{c.titulo}</p>
                                    </div>
                                    <div className="bento-card static p-4">
                                        <label className="section-label text-text-dim mb-2">Estado</label>
                                        {c.activo ? (
                                            <span className="badge-vercel badge-vercel-success"><CheckCircle size={10} /> Activo</span>
                                        ) : (
                                            <span className="badge-vercel badge-vercel-error"><XCircle size={10} /> Inactivo</span>
                                        )}
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="bento-card static p-4">
                                        <label className="section-label text-text-dim mb-2">Fecha Inicio</label>
                                        <p className="text-sm font-bold text-text-main font-mono">{c.fechaInicio}</p>
                                    </div>
                                    <div className="bento-card static p-4">
                                        <label className="section-label text-text-dim mb-2">Tipo</label>
                                        <span className="badge-vercel badge-vercel-brand">{c.tipoEvento}</span>
                                    </div>
                                    <div className="bento-card static p-4">
                                        <label className="section-label text-text-dim mb-2">Recurrente</label>
                                        <p className="text-sm font-bold text-text-main">{c.recurrenciaAnual ? 'Sí (Anual)' : 'No'}</p>
                                    </div>
                                </div>
                                {c.descripcion && (
                                    <div className="bento-card static p-4 space-y-3">
                                        <label className="section-label text-text-main"><Calendar size={12} /> Descripción</label>
                                        <div className="divider-vercel !my-0" />
                                        <p className="text-sm text-text-main leading-relaxed">{c.descripcion}</p>
                                    </div>
                                )}
                            </>
                        );
                    })()}
                </div>

                <div className="modal-footer">
                    <button onClick={() => setDetailItem(null)} className="btn-vercel-secondary">Cerrar</button>
                    <button 
                        onClick={() => {
                            if (detailItem.type === 'linea') handleOpenLineaModal(detailItem.data as LineaInvestigacion);
                            if (detailItem.type === 'periodo') handleOpenPeriodoModal(detailItem.data as PeriodoAcademico);
                            if (detailItem.type === 'producto') handleOpenProductoModal(detailItem.data as TipoProducto);
                            if (detailItem.type === 'dominio') handleOpenDominioModal(detailItem.data as DominioAcademico);
                            if (detailItem.type === 'indicador') handleOpenIndicadorModal(detailItem.data as ConfigIndicador);
                            if (detailItem.type === 'calendario') handleOpenCalendarioModal(detailItem.data as EventoNormativo);
                            setDetailItem(null);
                        }}
                        className="btn-vercel-primary flex items-center gap-2"
                    >
                        <Edit2 size={14} /> Editar
                    </button>
                </div>
            </div>
        </div>
    );
};
