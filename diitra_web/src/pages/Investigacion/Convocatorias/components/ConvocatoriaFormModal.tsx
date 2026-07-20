import React from 'react';
import { createPortal } from 'react-dom';
import { X, Save, FileText } from 'lucide-react';
import type { Periodo, Catalogo, Convocatoria } from '../types';

interface FormData {
    codigo_convocatoria: string;
    titulo: string;
    id_periodo: string;
    anio: string;
    descripcion: string;
    url_bases: string;
    requisitos_minimos: string;
    id_tipo_convocatoria: number | undefined;
    fecha_apertura: string;
    fecha_cierre: string;
}

interface FormFieldErrors {
    codigo_convocatoria?: string;
    anio?: string;
}

interface ConvocatoriaFormModalProps {
    showModal: boolean;
    isEditing: boolean;
    formData: FormData;
    setFormData: React.Dispatch<React.SetStateAction<FormData>>;
    formFieldErrors: FormFieldErrors;
    setFormFieldErrors: React.Dispatch<React.SetStateAction<FormFieldErrors>>;
    periodos: Periodo[];
    tiposConv: Catalogo[];
    isDraftRestored: boolean;
    setIsDraftRestored: (val: boolean) => void;
    setPendingDraft: (val: any) => void;
    selectedUuid: string | null;
    convocatorias: Convocatoria[];
    handleCloseModal: () => void;
    handleSave: (e: React.FormEvent) => void;
}

export const ConvocatoriaFormModal = ({
    showModal,
    isEditing,
    formData,
    setFormData,
    formFieldErrors,
    setFormFieldErrors,
    periodos,
    tiposConv,
    isDraftRestored,
    setIsDraftRestored,
    setPendingDraft,
    selectedUuid,
    convocatorias,
    handleCloseModal,
    handleSave
}: ConvocatoriaFormModalProps) => {
    if (!showModal) return null;

    const handleDiscardDraftAction = () => {
        if (isEditing && selectedUuid) {
            const conv = convocatorias.find(c => c.uuid === selectedUuid);
            if (conv) {
                setFormData({
                    codigo_convocatoria: conv.codigo_convocatoria,
                    titulo: conv.titulo,
                    id_periodo: conv.id_periodo,
                    anio: conv.anio,
                    descripcion: conv.descripcion || '',
                    url_bases: conv.url_bases || '',
                    requisitos_minimos: conv.requisitos_minimos || '',
                    id_tipo_convocatoria: conv.id_tipo_convocatoria,
                    fecha_apertura: conv.fecha_apertura,
                    fecha_cierre: conv.fecha_cierre
                });
            }
        } else {
            setFormData({
                codigo_convocatoria: '',
                titulo: '',
                id_periodo: periodos[0]?.id_periodo || '',
                anio: new Date().getFullYear().toString(),
                descripcion: '',
                url_bases: '',
                requisitos_minimos: '',
                id_tipo_convocatoria: undefined,
                fecha_apertura: '',
                fecha_cierre: ''
            });
        }
        localStorage.removeItem('new_convocatoria_form_draft');
        localStorage.removeItem('convocatoria_draft_metadata');
        if (selectedUuid) {
            localStorage.removeItem(`edit_convocatoria_form_draft_${selectedUuid}`);
        }
        setIsDraftRestored(false);
        setPendingDraft(null);
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex justify-end">
            <div
                className="absolute inset-0 bg-bg-deep/90 backdrop-blur-sm cursor-pointer"
                onClick={handleCloseModal}
            />
            <div className="relative w-full max-w-2xl h-full bg-surface border-l border-border-thin flex flex-col z-10 animate-fade-up">
                <div className="modal-header">
                    <div>
                        <h3 className="text-xl font-bold tracking-tighter text-text-main uppercase">
                            {isEditing ? 'Editar Convocatoria' : 'Nueva Convocatoria'}
                        </h3>
                        <p className="text-[10px] text-text-dim font-mono uppercase tracking-widest">Registro de Ciclo de Investigación</p>
                    </div>
                    <button onClick={handleCloseModal} className="p-2 text-text-dim hover:text-text-main transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSave} className="modal-body space-y-6">
                    {isDraftRestored && (
                        <div className="border border-border-thin bg-surface-hover rounded-lg p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 animate-fade-in mb-6">
                            <div className="flex items-center gap-3">
                                <FileText size={16} className="text-text-main shrink-0" />
                                <p className="text-xs text-text-dim">
                                    <span className="text-text-main font-semibold">Borrador restaurado:</span> Se han recuperado tus datos no guardados localmente.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={handleDiscardDraftAction}
                                className="text-xs font-medium text-brand hover:underline cursor-pointer shrink-0"
                            >
                                Descartar borrador
                            </button>
                        </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest ml-1">Código Identificador</label>
                            <input
                                required
                                className={`input-vercel ${formFieldErrors.codigo_convocatoria ? 'border-error focus:border-error' : ''}`}
                                placeholder="EJ: CONV-2024-TEC"
                                value={formData.codigo_convocatoria}
                                onChange={e => {
                                    setFormFieldErrors(prev => ({ ...prev, codigo_convocatoria: undefined }));
                                    setFormData({ ...formData, codigo_convocatoria: e.target.value });
                                }}
                                aria-invalid={!!formFieldErrors.codigo_convocatoria}
                            />
                            {formFieldErrors.codigo_convocatoria && (
                                <p className="text-[10px] text-error ml-1">{formFieldErrors.codigo_convocatoria}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest ml-1">Año Calendario</label>
                            <input
                                type="text"
                                required
                                className={`input-vercel ${formFieldErrors.anio ? 'border-error focus:border-error' : ''}`}
                                placeholder="EJ: 2026 o 2026 - 2027"
                                value={formData.anio}
                                onChange={e => {
                                    const val = e.target.value;
                                    setFormData({ ...formData, anio: val });
                                    
                                    const anioRegex = /^(?:19|20|21)\d{2}(?:\s*[-\/]\s*(?:19|20|21)\d{2})?$/;
                                    if (val.trim() && !anioRegex.test(val.trim())) {
                                        setFormFieldErrors(prev => ({ 
                                            ...prev, 
                                            anio: 'Formato inválido. Ejemplos válidos: 2026, 2026 - 2027, 2026/2027.' 
                                        }));
                                    } else {
                                        setFormFieldErrors(prev => ({ 
                                            ...prev, 
                                            anio: undefined 
                                        }));
                                    }
                                }}
                                aria-invalid={!!formFieldErrors.anio}
                            />
                            {formFieldErrors.anio && (
                                <p className="text-[10px] text-error ml-1 mt-1">{formFieldErrors.anio}</p>
                            )}
                            {formData.fecha_apertura && formData.fecha_cierre && (() => {
                                try {
                                    const startYear = new Date(formData.fecha_apertura).getFullYear();
                                    const endYear = new Date(formData.fecha_cierre).getFullYear();
                                    if (!Number.isNaN(startYear) && !Number.isNaN(endYear) && startYear !== endYear) {
                                        return (
                                            <p className="text-[10px] text-brand ml-1 mt-1 font-medium animate-fade-in">
                                                Vigencia detectada: {startYear} - {endYear} (Plurianual)
                                            </p>
                                        );
                                    }
                                } catch (e) {}
                                return null;
                            })()}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest ml-1">Título de la Convocatoria</label>
                        <input
                            required
                            className="input-vercel"
                            placeholder="Nombre oficial de la convocatoria..."
                            value={formData.titulo}
                            onChange={e => setFormData({ ...formData, titulo: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest ml-1">Periodo SIGAFI (Inicio)</label>
                            <select
                                className="input-vercel"
                                value={formData.id_periodo}
                                onChange={e => setFormData({ ...formData, id_periodo: e.target.value })}
                            >
                                {periodos.map(p => (
                                    <option key={p.id_periodo} value={p.id_periodo}>{p.detalle}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest ml-1">Tipo de Convocatoria</label>
                            <select
                                className="input-vercel"
                                required
                                value={formData.id_tipo_convocatoria || ''}
                                onChange={e => setFormData({ ...formData, id_tipo_convocatoria: e.target.value ? parseInt(e.target.value) : undefined })}
                            >
                                <option value="">Seleccionar Tipo...</option>
                                {tiposConv.map(t => (
                                    <option key={t.id} value={t.id}>{t.nombre}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest ml-1">Fecha Apertura</label>
                            <input
                                type="date"
                                required
                                className="input-vercel"
                                value={formData.fecha_apertura}
                                onChange={e => setFormData({ ...formData, fecha_apertura: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest ml-1">Fecha Cierre</label>
                            <input
                                type="date"
                                required
                                className="input-vercel"
                                value={formData.fecha_cierre}
                                onChange={e => setFormData({ ...formData, fecha_cierre: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button
                            type="button"
                            onClick={handleCloseModal}
                            className="btn-vercel-secondary"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="btn-vercel-primary"
                        >
                            <Save size={14} />
                            {isEditing ? 'Actualizar Convocatoria' : 'Guardar Convocatoria'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};
