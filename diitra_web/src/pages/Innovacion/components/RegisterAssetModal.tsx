import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, Sparkles, ShieldCheck, Layers, Link as LinkIcon, Save } from 'lucide-react';
import api from '../../../api/axios_config';
import { useNotifications } from '../../../api/NotificationsContext';
import type { TipoPropiedadIntelectual, EstadoSenadi } from '../types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface ProjectOption {
    uuid: string;
    titulo: string;
    codigo_institucional?: string;
}

export const RegisterAssetModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
    const { addToast } = useNotifications();
    const [submitting, setSubmitting] = useState(false);
    const [projects, setProjects] = useState<ProjectOption[]>([]);
    const [loadingProjects, setLoadingProjects] = useState(false);

    const [projectUuid, setProjectUuid] = useState('');
    const [titulo, setTitulo] = useState('');
    const [idTipoProducto] = useState<number>(3); // 3 = Software
    const [tipoPropiedad, setTipoPropiedad] = useState<TipoPropiedadIntelectual>('Software');
    const [esPropiedadIntelectual, setEsPropiedadIntelectual] = useState(true);
    const [trlActual, setTrlActual] = useState<number>(4);
    const [estadoSenadi, setEstadoSenadi] = useState<EstadoSenadi>('Solicitado');
    const [numeroRegistro, setNumeroRegistro] = useState('');
    const [fechaRegistroSenadi] = useState('');
    const [urlProducto, setUrlProducto] = useState('');

    useEffect(() => {
        if (!isOpen) return;
        const fetchProjects = async () => {
            setLoadingProjects(true);
            try {
                const res = await api.get('/projects');
                setProjects(res.data || []);
                if (res.data?.length > 0) {
                    setProjectUuid(res.data[0].uuid);
                }
            } catch (err) {
                console.error('[RegisterAssetModal] Error al cargar proyectos:', err);
            } finally {
                setLoadingProjects(false);
            }
        };
        fetchProjects();
    }, [isOpen]);

    // Cerrar con tecla Escape
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen && !submitting) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, submitting, onClose]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!titulo.trim()) {
            addToast('El título del activo o prototipo es obligatorio', 'warning');
            return;
        }
        if (!projectUuid) {
            addToast('Debes asociar el activo a un proyecto de investigación', 'warning');
            return;
        }

        setSubmitting(true);
        try {
            await api.post('/ResearchProducts', {
                projectUuid,
                idTipoProducto,
                titulo: titulo.trim(),
                cantidad: 1,
                urlProducto: urlProducto.trim() || null,
                esPropiedadIntelectual,
                tipoPropiedadIntelectual: tipoPropiedad,
                numeroRegistro: numeroRegistro.trim() || null,
                fechaRegistroSenadi: fechaRegistroSenadi || null,
                estadoSenadi: esPropiedadIntelectual ? estadoSenadi : 'NoAplica',
                trlActual
            });

            addToast('Activo tecnológico registrado con éxito', 'success');
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('[RegisterAssetModal] Error al guardar activo:', err);
            addToast(err?.response?.data?.message || 'Error al registrar el activo de innovación', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex justify-end">
            {/* Backdrop global con blur suave sobre toda la ventana */}
            <div
                className="absolute inset-0 bg-bg-deep/90 backdrop-blur-sm cursor-pointer animate-fade-in"
                onClick={onClose}
            />

            {/* Panel Lateral Drawer (Estilo Vercel Geist DIITRA) */}
            <div className="relative w-full max-w-2xl h-full bg-surface border-l border-border-thin flex flex-col z-10 animate-fade-up overflow-hidden shadow-2xl">
                {/* Header Superior */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-border-thin bg-surface shrink-0">
                    <div className="flex items-center gap-3">
                        <span className="px-2.5 py-1 bg-bg-deep text-text-dim border border-border-thin text-[10px] font-mono uppercase rounded-md">
                            Innovación & CTT
                        </span>
                        <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider">
                            <span className="dot dot-pulse dot-brand" />
                            <span className="text-brand">Nuevo Activo Intelectual</span>
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

                {/* Cuerpo del Formulario con Scroll */}
                <form id="form-register-asset" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 bg-surface custom-scrollbar">
                    {/* Título Principal */}
                    <div className="space-y-2">
                        <h2 className="text-3xl font-bold tracking-tight text-text-main leading-tight font-sans">
                            Registrar Activo Tecnológico
                        </h2>
                        <p className="text-sm text-text-dim leading-relaxed font-medium">
                            Incorpora un nuevo prototipo, software o invención a la vitrina de transferencia y ventanilla SENADI.
                        </p>
                    </div>

                    {/* Campos del Formulario */}
                    <div className="space-y-6">
                        {/* Proyecto de Origen */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest ml-1 flex items-center gap-1.5">
                                <Layers size={12} /> Proyecto de Investigación de Origen *
                            </label>
                            {loadingProjects ? (
                                <div className="flex items-center gap-2 text-xs text-text-dim py-2.5 px-3 bg-surface border border-border-thin rounded-lg">
                                    <Loader2 size={14} className="animate-spin text-brand" />
                                    <span>Cargando proyectos vinculados...</span>
                                </div>
                            ) : (
                                <select
                                    value={projectUuid}
                                    onChange={(e) => setProjectUuid(e.target.value)}
                                    className="input-vercel w-full"
                                    required
                                >
                                    {projects.map((p) => (
                                        <option key={p.uuid} value={p.uuid}>
                                            {p.codigo_institucional ? `[${p.codigo_institucional}] ` : ''}{p.titulo}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {/* Nombre del Activo */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest ml-1 flex items-center gap-1.5">
                                <Sparkles size={12} /> Nombre del Activo / Prototipo / Software *
                            </label>
                            <input
                                type="text"
                                value={titulo}
                                onChange={(e) => setTitulo(e.target.value)}
                                placeholder="Ej: Sistema Inteligente de Detección de Plagas..."
                                className="input-vercel w-full font-medium"
                                required
                            />
                        </div>

                        {/* Grid: Tipo y TRL */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest ml-1">
                                    Tipo de Activo Intelectual
                                </label>
                                <select
                                    value={tipoPropiedad}
                                    onChange={(e) => setTipoPropiedad(e.target.value as TipoPropiedadIntelectual)}
                                    className="input-vercel w-full"
                                >
                                    <option value="Software">Software / Soporte Lógico</option>
                                    <option value="ModeloUtilidad">Modelo de Utilidad</option>
                                    <option value="DisenoIndustrial">Diseño Industrial</option>
                                    <option value="Patente">Patente de Invención</option>
                                    <option value="Marca">Signo Distintivo / Marca</option>
                                    <option value="SecretoIndustrial">Secreto Industrial</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest ml-1">
                                    Nivel de Madurez Tecnológica (TRL)
                                </label>
                                <select
                                    value={trlActual}
                                    onChange={(e) => setTrlActual(Number(e.target.value))}
                                    className="input-vercel w-full"
                                >
                                    <option value={1}>TRL 1 - Principios básicos observados</option>
                                    <option value={2}>TRL 2 - Concepto tecnológico formulado</option>
                                    <option value={3}>TRL 3 - Prueba de concepto experimental</option>
                                    <option value={4}>TRL 4 - Validación en laboratorio (Prototipo)</option>
                                    <option value={5}>TRL 5 - Validación en entorno relevante</option>
                                    <option value={6}>TRL 6 - Demostración de prototipo en entorno real</option>
                                    <option value={7}>TRL 7 - Prototipo operativo en entorno real</option>
                                    <option value={8}>TRL 8 - Sistema completo y cualificado</option>
                                    <option value={9}>TRL 9 - Sistema probado y desplegado</option>
                                </select>
                            </div>
                        </div>

                        {/* Bento Card: SENADI */}
                        <div className="bento-card static p-5 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-text-main uppercase tracking-wider flex items-center gap-1.5">
                                    <ShieldCheck size={14} className="text-brand" />
                                    Ventanilla SENADI (Propiedad Intelectual)
                                </span>
                                <label className="inline-flex items-center gap-2 text-xs text-text-dim hover:text-text-main cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={esPropiedadIntelectual}
                                        onChange={(e) => setEsPropiedadIntelectual(e.target.checked)}
                                        className="rounded border-border-thin text-brand focus:ring-0 cursor-pointer"
                                    />
                                    <span className="font-medium">Requiere Registro</span>
                                </label>
                            </div>

                            <div className="divider-vercel !my-0" />

                            {esPropiedadIntelectual ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest">
                                            Estado del Trámite
                                        </label>
                                        <select
                                            value={estadoSenadi}
                                            onChange={(e) => setEstadoSenadi(e.target.value as EstadoSenadi)}
                                            className="input-vercel w-full text-xs"
                                        >
                                            <option value="Solicitado">Trámite Iniciado / Solicitado</option>
                                            <option value="EnExamen">En Examen Formal / Fondo</option>
                                            <option value="Concedido">Título / Registro Concedido</option>
                                            <option value="Denegado">Observado / Denegado</option>
                                        </select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest">
                                            N° Solicitud o Registro SENADI
                                        </label>
                                        <input
                                            type="text"
                                            value={numeroRegistro}
                                            onChange={(e) => setNumeroRegistro(e.target.value)}
                                            placeholder="Ej: SENADI-2026-0045"
                                            className="input-vercel w-full text-xs font-mono"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <p className="text-xs text-text-dim">
                                    El activo quedará catalogado internamente sin iniciar trámite de protección formal ante el SENADI.
                                </p>
                            )}
                        </div>

                        {/* Enlace al Repositorio o Demo */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest ml-1 flex items-center gap-1.5">
                                <LinkIcon size={12} /> Enlace al Repositorio / Demo / Ficha Técnica (Opcional)
                            </label>
                            <input
                                type="url"
                                value={urlProducto}
                                onChange={(e) => setUrlProducto(e.target.value)}
                                placeholder="https://github.com/... o https://isttraversari.edu.ec/..."
                                className="input-vercel w-full font-mono text-xs"
                            />
                        </div>
                    </div>
                </form>

                {/* Footer Inferior */}
                <div className="p-8 border-t border-border-thin bg-surface flex gap-4 shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        className="btn-vercel-secondary px-6"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        form="form-register-asset"
                        disabled={submitting}
                        className="btn-vercel-primary flex-1 py-3 flex items-center justify-center gap-2"
                    >
                        {submitting ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        <span>{submitting ? 'Guardando...' : 'Guardar Activo Tecnológico'}</span>
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
