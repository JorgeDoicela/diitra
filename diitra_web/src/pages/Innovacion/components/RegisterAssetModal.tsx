import React, { useState, useEffect } from 'react';
import { X, Loader2, Sparkles, ShieldCheck } from 'lucide-react';
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
    const [idTipoProducto, setIdTipoProducto] = useState<number>(3); // 3 = Software
    const [tipoPropiedad, setTipoPropiedad] = useState<TipoPropiedadIntelectual>('Software');
    const [esPropiedadIntelectual, setEsPropiedadIntelectual] = useState(true);
    const [trlActual, setTrlActual] = useState<number>(4);
    const [estadoSenadi, setEstadoSenadi] = useState<EstadoSenadi>('Solicitado');
    const [numeroRegistro, setNumeroRegistro] = useState('');
    const [fechaRegistroSenadi, setFechaRegistroSenadi] = useState('');
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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-surface border border-border-thin rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border-thin">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-black/5 dark:bg-white/5 border border-border-thin flex items-center justify-center">
                            <Sparkles size={16} className="text-text-main" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-text-main tracking-tight">
                                Registrar Activo / Prototipo Tecnológico
                            </h2>
                            <p className="text-xs text-text-dim">
                                Incorpora un nuevo desarrollo a la vitrina CTT y ventanilla SENADI
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-text-dim hover:text-text-main hover:bg-surface-hover transition-colors border-0 bg-transparent cursor-pointer"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Formulario */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
                    {/* Proyecto Asociado */}
                    <div>
                        <label className="block text-xs font-semibold text-text-main mb-1.5">
                            Proyecto de Investigación de Origen
                        </label>
                        {loadingProjects ? (
                            <div className="flex items-center gap-2 text-xs text-text-dim py-2">
                                <Loader2 size={13} className="animate-spin" />
                                <span>Cargando proyectos...</span>
                            </div>
                        ) : (
                            <select
                                value={projectUuid}
                                onChange={(e) => setProjectUuid(e.target.value)}
                                className="w-full px-3 py-2 text-xs rounded-lg bg-surface border border-border-thin text-text-main focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                            >
                                {projects.map((p) => (
                                    <option key={p.uuid} value={p.uuid}>
                                        {p.codigo_institucional ? `[${p.codigo_institucional}] ` : ''}{p.titulo}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Título del Activo */}
                    <div>
                        <label className="block text-xs font-semibold text-text-main mb-1.5">
                            Nombre del Activo / Prototipo / Software *
                        </label>
                        <input
                            type="text"
                            value={titulo}
                            onChange={(e) => setTitulo(e.target.value)}
                            placeholder="Ej: Sistema Inteligente de Detección de Plagas..."
                            className="w-full px-3 py-2 text-xs rounded-lg bg-surface border border-border-thin text-text-main placeholder:text-text-dim/40 focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                            required
                        />
                    </div>

                    {/* Tipo de Protección y TRL */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-text-main mb-1.5">
                                Tipo de Activo Intelectual
                            </label>
                            <select
                                value={tipoPropiedad}
                                onChange={(e) => setTipoPropiedad(e.target.value as TipoPropiedadIntelectual)}
                                className="w-full px-3 py-2 text-xs rounded-lg bg-surface border border-border-thin text-text-main focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                            >
                                <option value="Software">Software / Soporte Lógico</option>
                                <option value="ModeloUtilidad">Modelo de Utilidad</option>
                                <option value="DisenoIndustrial">Diseño Industrial</option>
                                <option value="Patente">Patente de Invención</option>
                                <option value="Marca">Signo Distintivo / Marca</option>
                                <option value="SecretoIndustrial">Secreto Industrial</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-text-main mb-1.5">
                                Nivel de Madurez Tecnológica (TRL)
                            </label>
                            <select
                                value={trlActual}
                                onChange={(e) => setTrlActual(Number(e.target.value))}
                                className="w-full px-3 py-2 text-xs rounded-lg bg-surface border border-border-thin text-text-main focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                            >
                                <option value={1}>TRL 1 - Principios básicos observados</option>
                                <option value={2}>TRL 2 - Concepto tecnológico formulado</option>
                                <option value={3}>TRL 3 - Prueba de concepto experimental</option>
                                <option value={4}>TRL 4 - Validación en laboratorio (Prototipo)</option>
                                <option value={5}>TRL 5 - Validación en entorno relevante</option>
                                <option value={6}>TRL 6 - Demostración de prototipo en entorno real</option>
                                <option value={7}>TRL 7 - Prototipo operativo en entorno real</option>
                                <option value={8}>TRL 8 - Sistema completo y cualificado</option>
                                <option value={9}>TRL 9 - Sistema probado y desplegado comercialmente</option>
                            </select>
                        </div>
                    </div>

                    {/* Sección SENADI */}
                    <div className="p-3.5 rounded-xl bg-surface-hover/40 border border-border-thin space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-text-main flex items-center gap-1.5">
                                <ShieldCheck size={14} className="text-text-main" />
                                Ventanilla SENADI (Propiedad Intelectual)
                            </span>
                            <label className="inline-flex items-center gap-1.5 text-xs text-text-dim cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={esPropiedadIntelectual}
                                    onChange={(e) => setEsPropiedadIntelectual(e.target.checked)}
                                    className="rounded border-border-thin text-primary focus:ring-0"
                                />
                                Requiere Registro
                            </label>
                        </div>

                        {esPropiedadIntelectual && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                <div>
                                    <label className="block text-[11px] font-medium text-text-dim mb-1">
                                        Estado del Trámite
                                    </label>
                                    <select
                                        value={estadoSenadi}
                                        onChange={(e) => setEstadoSenadi(e.target.value as EstadoSenadi)}
                                        className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-surface border border-border-thin text-text-main focus:outline-none"
                                    >
                                        <option value="Solicitado">Trámite Iniciado / Solicitado</option>
                                        <option value="EnExamen">En Examen Formal / Fondo</option>
                                        <option value="Concedido">Título / Registro Concedido</option>
                                        <option value="Denegado">Observado / Denegado</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-medium text-text-dim mb-1">
                                        N° Solicitud o Registro SENADI
                                    </label>
                                    <input
                                        type="text"
                                        value={numeroRegistro}
                                        onChange={(e) => setNumeroRegistro(e.target.value)}
                                        placeholder="Ej: SENADI-2026-0045"
                                        className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-surface border border-border-thin text-text-main focus:outline-none"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* URL del Producto o Repositorio */}
                    <div>
                        <label className="block text-xs font-semibold text-text-main mb-1.5">
                            Enlace al Repositorio / Demo / Ficha Técnica (Opcional)
                        </label>
                        <input
                            type="url"
                            value={urlProducto}
                            onChange={(e) => setUrlProducto(e.target.value)}
                            placeholder="https://github.com/... o https://isttraversari.edu.ec/..."
                            className="w-full px-3 py-2 text-xs rounded-lg bg-surface border border-border-thin text-text-main placeholder:text-text-dim/40 focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                        />
                    </div>

                    {/* Botones de Acción */}
                    <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border-thin">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="px-3.5 py-1.5 text-xs font-medium rounded-lg text-text-dim hover:text-text-main hover:bg-surface-hover transition-colors border border-border-thin bg-transparent cursor-pointer"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-black text-white dark:bg-white dark:text-black hover:opacity-90 transition-opacity flex items-center gap-1.5 border-0 cursor-pointer"
                        >
                            {submitting && <Loader2 size={13} className="animate-spin" />}
                            <span>Guardar Activo</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
