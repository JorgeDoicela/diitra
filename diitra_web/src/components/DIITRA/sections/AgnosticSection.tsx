import React, { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import {
    Sliders,
    Eye,
    EyeOff,
    HelpCircle,
    Lock,
    Activity,
    BookOpen
} from 'lucide-react';
import api from '../../../api/axios_config';
import { CoWorkField } from '../../../core/cowork/components/CoWorkField';
import { CoWorkEditor } from '../../../core/cowork/components/CoWorkEditor';
import { DocumentTemplateRegistry } from '../../../core/documents/registry/DocumentTemplateRegistry';

/**
 * Limpia HTML del servidor antes de insertarlo en el DOM.
 * Previene ataques XSS en el Dossier de Referencia del modo Doble Ciego.
 */
const sanitize = (html: string): string =>
    DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });

interface FieldConfig {
    name: string;
    label: string;
    type: 'text' | 'textarea' | 'select' | 'checkbox' | 'number' | 'rich-text' | 'list';
    collaborative: boolean;
    placeholder?: string;
    min?: number;
    max?: number;
    options?: string[];
}

interface AgnosticSectionProps {
    formData: any;
    cowork: any;
    onUpdate: (field: string, value: any, meta?: { source?: 'local' | 'remote' }) => void;
    activeTab: string;
    templateCode: string;
    label?: string;           // Label de la sección (prop directo, opcional)
    config?: any;             // Prop directo para carga dinámica desde backend
    carreras?: any[];
    convocatorias?: any[];
    tiposProducto?: any[];
    onAdd?: (list: string, template: any) => void;
    onRemove?: (list: string, index: number) => void;
}

export const AgnosticSection: React.FC<AgnosticSectionProps> = ({
    formData,
    cowork,
    onUpdate,
    activeTab,
    templateCode,
    label: labelProp,
    carreras = [],
    convocatorias = [],
    tiposProducto = [],
    onAdd,
    onRemove,
    config: configProp,    // <-- prop directo desde DocumentEditor (carga dinámica)
}) => {
    // Evitar errores de compilación por variables no leídas pero requeridas por la firma genérica
    void carreras; void convocatorias; void tiposProducto; void onAdd; void onRemove;

    const [collapsed, setCollapsed] = useState(false);
    const [referenceData, setReferenceData] = useState<any>(null);
    const [isLoadingRef, setIsLoadingRef] = useState(false);

    // 1. Obtener la configuración del Registry de forma agnóstica
    //    Prioridad: prop 'config' (carga dinámica del backend) > Registry local
    const templateConfig = DocumentTemplateRegistry[templateCode];
    const sectionConfig = templateConfig?.sections?.find((s: any) => s.id === activeTab);
    const config = configProp || sectionConfig?.config;

    // 2. Efecto de carga asíncrona de documentos vinculados (Dossier de Referencia)
    useEffect(() => {
        const fetchReference = async () => {
            const refUuid = formData.EntityUuid || formData.entityUuid;
            if (refUuid && refUuid !== 'GLOBAL' && config?.referenceTemplateCode) {
                setIsLoadingRef(true);
                try {
                    const response = await api.get(`/documents/instances/${refUuid}`);
                    // FALLBACK PATTERN: Se tolera cualquier casing del backend (snake_case, camelCase, PascalCase)
                    // para evitar roturas si la serialización de snapshots varía o si la propiedad viene de un DTO mapeado.
                    const snapshotStr = response.data?.data_snapshot_json || response.data?.dataSnapshotJson || response.data?.DataSnapshotJson;
                    if (snapshotStr) {
                        setReferenceData(JSON.parse(snapshotStr));
                    } else if (response.data) {
                        setReferenceData(response.data);
                    }
                } catch (err) {
                    console.error("[AgnosticSection] Error al cargar referencia:", err);
                } finally {
                    setIsLoadingRef(false);
                }
            }
        };
        fetchReference();
    }, [formData.EntityUuid, formData.entityUuid, config?.referenceTemplateCode]);

    if (!config?.fields) {
        return (
            <div className="p-8 bg-bg-deep border border-border-thin rounded-2xl text-center">
                <HelpCircle size={32} className="mx-auto text-text-dim mb-2 opacity-50" />
                <p className="text-xs font-bold text-text-dim uppercase tracking-wider">
                    Sección sin esquema configurado
                </p>
                <p className="text-[10px] text-text-dim/60 mt-1">
                    Define la lista de "fields" en el DocumentTemplateRegistry para este ID: "{activeTab}".
                </p>
            </div>
        );
    }

    const fields: FieldConfig[] = config.fields;

    // ── RENDER COMPONENTES DINÁMICOS ─────────────────────────────────
    const renderField = (field: FieldConfig) => {
        const { name, label, type, collaborative, placeholder, min = 0, max = 25, options = [] } = field;
        const isDisabled = cowork?.session?.readOnly;

        // A) MODO COLABORATIVO (SignalR + Yjs)
        if (collaborative) {
            if (type === 'rich-text') {
                return (
                    <div key={name} className="space-y-2">
                        <label className="block text-[9px] font-black text-text-dim uppercase tracking-widest ml-1">
                            {label} (Colaborativo)
                        </label>
                        <div className="border border-border-thin rounded-2xl overflow-hidden bg-bg-deep focus-within:ring-2 focus-within:ring-text-main/15 transition-all">
                            <CoWorkEditor
                                field={name}
                                cowork={cowork}
                                onChange={(html, meta) => onUpdate(name, html, meta)}
                            />
                        </div>
                    </div>
                );
            }

            return (
                <div key={name} className="p-5 bg-bg-deep border border-border-thin rounded-2xl flex flex-col gap-1.5 relative group hover:border-text-main/10 transition-all">
                    <CoWorkField
                        name={name}
                        cowork={cowork}
                        type={type === 'number' ? 'text' : type as any}
                        label={`${label} • Colaborativo`}
                        placeholder={placeholder}
                        onValueChange={(val) => {
                            const parsed = type === 'number' ? (Number(val) || 0) : val;
                            onUpdate(name, parsed);
                        }}
                        className="w-full bg-bg-deep border border-border-thin rounded-xl px-4 py-2.5 text-xs text-text-main"
                    />
                </div>
            );
        }

        // B) MODO CONFIDENCIAL / INDEPENDIENTE (No Colaborativo - Formulario Privado)
        const val = formData[name] ?? (type === 'checkbox' ? false : type === 'number' ? 0 : '');

        const handlePrivateChange = (newVal: any) => {
            onUpdate(name, newVal);
        };

        const commonInputProps = {
            id: name,
            disabled: isDisabled,
            placeholder,
            className: "w-full bg-bg-deep border border-border-thin rounded-xl px-4 py-2.5 text-xs text-text-main outline-none focus:ring-2 focus:ring-text-main/20 transition-all"
        };

        return (
            <div key={name} className="p-5 bg-bg-deep/50 border border-border-thin rounded-2xl space-y-3 relative group hover:border-text-main/10 transition-all">
                <div className="flex justify-between items-center px-1">
                    <label htmlFor={name} className="text-[9px] font-black text-text-dim uppercase tracking-widest flex items-center gap-1.5">
                        <Lock size={10} className="text-text-dim opacity-70" /> {label} (Privado)
                    </label>
                    {type === 'number' && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-text-main/10 text-text-main">
                            {val} / {max} pts
                        </span>
                    )}
                </div>

                {type === 'text' && (
                    <input
                        {...commonInputProps}
                        type="text"
                        value={val}
                        onChange={(e) => handlePrivateChange(e.target.value)}
                    />
                )}

                {type === 'textarea' && (
                    <textarea
                        {...commonInputProps}
                        rows={3}
                        value={val}
                        onChange={(e) => handlePrivateChange(e.target.value)}
                    />
                )}

                {type === 'select' && (
                    <select
                        {...commonInputProps}
                        value={val}
                        onChange={(e) => handlePrivateChange(e.target.value)}
                    >
                        <option value="">Seleccione opción...</option>
                        {options.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                )}

                {type === 'checkbox' && (
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            checked={!!val}
                            disabled={isDisabled}
                            onChange={(e) => handlePrivateChange(e.target.checked)}
                            className="w-5 h-5 rounded border-border-thin text-text-main focus:ring-text-main/20 cursor-pointer bg-bg-deep"
                        />
                        <span className="text-[10px] font-bold text-text-main uppercase tracking-tight">Activar/Validar indicador</span>
                    </div>
                )}

                {type === 'number' && (
                    <div className="space-y-2">
                        <input
                            type="range"
                            min={min}
                            max={max}
                            value={Number(val) || 0}
                            disabled={isDisabled}
                            onChange={(e) => handlePrivateChange(Number(e.target.value))}
                            className="w-full accent-text-main h-1.5 bg-bg-deep rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-[8px] font-bold text-text-dim px-1">
                            <span>{min} PTS</span>
                            <span>MITAD</span>
                            <span>{max} PTS MAX</span>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // ── ESTRUCTURA DUAL PANE (VISTA PARTIDA DE REFERENCIA) ───────────────────
    const showDualPane = !!config.referenceTemplateCode;

    return (
        <div className="space-y-6">
            {showDualPane && (
                <div className="flex justify-between items-center px-1">
                    <div className="flex items-center gap-2">
                        <Activity size={14} className="text-text-main animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-text-main">
                            Evaluación anónima (arbitraje)
                        </span>
                    </div>
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="px-3 py-1.5 bg-bg-deep border border-border-thin hover:border-text-main/25 text-text-main rounded-lg text-[9px] font-black uppercase flex items-center gap-1.5 transition-all shadow-sm"
                    >
                        {collapsed ? <Eye size={12} /> : <EyeOff size={12} />}
                        {collapsed ? "Mostrar Propuesta" : "Maximizar Calificación"}
                    </button>
                </div>
            )}

            <div className={`grid grid-cols-1 ${showDualPane && !collapsed ? 'lg:grid-cols-2' : 'grid-cols-1'} gap-6 transition-all duration-300`}>

                {/* A) PANEL IZQUIERDO: VISUALIZADOR DE REFERENCIA (DOSSIER CACES) */}
                {showDualPane && !collapsed && (
                    <div className="bg-bg-deep border border-border-thin rounded-2xl p-6 space-y-6 overflow-y-auto max-h-[70vh] shadow-xl animate-slide-right">
                        <div className="flex items-center gap-2 border-b border-border-thin pb-4">
                            <BookOpen size={18} className="text-text-main" />
                            <div>
                                <h5 className="text-[10px] font-black uppercase tracking-widest text-text-main">
                                    Documento de referencia
                                </h5>
                                <p className="text-[8px] text-text-dim uppercase mt-0.5">
                                    Protocolo de Investigación Original
                                </p>
                            </div>
                        </div>

                        {isLoadingRef ? (
                            <div className="py-20 text-center space-y-3">
                                <div className="w-6 h-6 border-2 border-text-main border-t-transparent rounded-full animate-spin mx-auto" />
                                <p className="text-[9px] font-black text-text-dim uppercase tracking-wider">Cargando propuesta del servidor...</p>
                            </div>
                        ) : referenceData ? (
                            <div className="space-y-6 text-xs text-text-main leading-relaxed">
                                <div className="p-4 bg-bg-deep border border-border-thin rounded-xl">
                                    <span className="text-[8px] font-black text-text-dim uppercase block mb-1">Título del Proyecto</span>
                                    <p className="font-bold text-xs text-text-main">{referenceData.Titulo || "Sin Título"}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 bg-bg-deep border border-border-thin rounded-xl">
                                        <span className="text-[8px] font-black text-text-dim uppercase block">Presupuesto</span>
                                        <p className="font-black text-text-main mt-0.5">${referenceData.CostoTotal ?? 0}</p>
                                    </div>
                                    <div className="p-3 bg-bg-deep border border-border-thin rounded-xl">
                                        <span className="text-[8px] font-black text-text-dim uppercase block">Periodo</span>
                                        <p className="font-black text-text-main mt-0.5">{referenceData.Periodo || "N/A"}</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <span className="text-[8px] font-black text-text-dim uppercase block mb-1">Antecedentes y Justificación</span>
                                        <div
                                            className="p-4 bg-bg-deep/50 border border-border-thin rounded-xl prose prose-invert max-w-none text-[11px]"
                                            dangerouslySetInnerHTML={{ __html: sanitize(referenceData.Antecedentes || "<i>No se cargaron antecedentes.</i>") }}
                                        />
                                    </div>

                                    <div>
                                        <span className="text-[8px] font-black text-text-dim uppercase block mb-1">Objetivo General</span>
                                        <div
                                            className="p-4 bg-bg-deep/50 border border-border-thin rounded-xl prose prose-invert max-w-none text-[11px]"
                                            dangerouslySetInnerHTML={{ __html: sanitize(referenceData.ObjetivoGeneral || "<i>No se cargó objetivo general.</i>") }}
                                        />
                                    </div>

                                    {referenceData.Impacto && (
                                        <div>
                                            <span className="text-[8px] font-black text-text-dim uppercase block mb-2">Matriz de Impactos</span>
                                            <div className="grid grid-cols-1 gap-2">
                                                {Object.entries(referenceData.Impacto).map(([key, val]: any) => (
                                                    <div key={key} className="p-2.5 bg-bg-deep/40 rounded-lg flex justify-between gap-4 text-[10px]">
                                                        <strong className="uppercase text-[8px] text-text-dim w-16">{key}</strong>
                                                        <span className="flex-1 text-right">{val || "Sin descripción"}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="py-20 text-center space-y-2">
                                <HelpCircle size={24} className="mx-auto text-text-dim opacity-40" />
                                <p className="text-[9px] font-black text-text-dim uppercase tracking-wider">No se encontró propuesta vinculada</p>
                                <p className="text-[8px] text-text-dim/60">Verifique el EntityUuid en la instancia de base de datos.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* B) PANEL DERECHO / ÚNICO: FORMULARIO DINÁMICO COLABORATIVO */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 px-1">
                        <Sliders size={16} className="text-text-main" />
                        <div>
                            <h5 className="text-[10px] font-black uppercase tracking-widest text-text-main">
                                {labelProp || sectionConfig?.label || activeTab}
                            </h5>
                            <p className="text-[8px] text-text-dim uppercase mt-0.5">
                                Formulario de Carga Dinámica
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {fields.map(field => renderField(field))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AgnosticSection;
