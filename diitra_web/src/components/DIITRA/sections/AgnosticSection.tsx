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
    type: 'text' | 'textarea' | 'select' | 'checkbox' | 'number' | 'rich-text' | 'list' | 'table';
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
    onUpdateItem?: (list: string, index: number, field: string, value: any) => void;
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
    onUpdateItem,
    config: configProp,    // <-- prop directo desde DocumentEditor (carga dinámica)
}) => {
    // Evitar errores de compilación por variables no leídas pero requeridas por la firma genérica
    void carreras; void convocatorias; void tiposProducto; void onAdd; void onRemove; void onUpdateItem;

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

        // A) MODO COLABORATIVO
        if (collaborative) {
            if (type === 'table') {
                // ── BUG RAÍZ (resuelto) ──────────────────────────────────────────────────────
                // El backend tiene la política global JsonNamingPolicy.SnakeCaseLower (Program.cs).
                // Esto significa que las propiedades camelCase del objeto Config retornado por
                // AdvancedTableBlockProvider se serializan a snake_case antes de llegar al frontend:
                //   allowDynamicRows → allow_dynamic_rows
                //   headerStyle      → header_style
                //   defaultRows      → default_rows
                //
                // El código original solo buscaba las versiones camelCase, por lo que:
                //   - defaultRowsFromConfig siempre era [] (las filas del template se "perdían")
                //   - El merge Math.max(userRows, templateRows) nunca aplicaba filas extra del template
                //   - El Workspace mostraba solo las filas guardadas por el investigador en Yjs,
                //     ignorando por completo las filas nuevas que el Admin agregó en la plantilla.
                //
                // SOLUCIÓN: Leer siempre camelCase || snake_case como fallback.
                // ─────────────────────────────────────────────────────────────────────────────
                const columns: string[] = (field as any).config?.columns || (field as any).config?.headers || [];
                const allowDynamicRows: boolean = !!(
                    (field as any).config?.allowDynamicRows ??
                    (field as any).config?.allow_dynamic_rows
                );
                const tableHeaderStyle =
                    (field as any).config?.headerStyle ||
                    (field as any).config?.header_style ||
                    'blue';
                const defaultRowsFromConfig =
                    (field as any).config?.defaultRows ||
                    (field as any).config?.default_rows ||
                    (field as any).config?.rows ||    // fallback: formato raw del editor Admin
                    [];
                const rawRowsData = Array.isArray(formData[name]) ? formData[name] : [];

                // Merge: Si hay filas explícitas guardadas en Yjs/formData por el usuario,
                // respetamos la cantidad real del arreglo para permitir eliminar filas.
                const hasExplicitUserRows = Array.isArray(formData[name]);
                const totalRowsCount = hasExplicitUserRows ? rawRowsData.length : defaultRowsFromConfig.length;

                const rowsData: any[] = [];
                for (let rIdx = 0; rIdx < totalRowsCount; rIdx++) {
                    const userRow = rawRowsData[rIdx];
                    const tplRow = defaultRowsFromConfig[rIdx];
                    rowsData.push(userRow || tplRow || {});
                }

                let thCls = "p-3 text-[9px] font-black uppercase tracking-wider ";
                let trHeaderCls = "border-b border-border-thin ";

                if (tableHeaderStyle === 'blue') {
                    trHeaderCls += "bg-[#1e2a4a] text-white";
                    thCls += "text-white";
                } else if (tableHeaderStyle === 'gold') {
                    trHeaderCls += "bg-[#b8912e] text-white";
                    thCls += "text-white";
                } else if (tableHeaderStyle === 'gray') {
                    trHeaderCls += "bg-slate-700 text-white";
                    thCls += "text-white";
                } else {
                    trHeaderCls += "bg-surface-hover/20";
                    thCls += "text-text-dim";
                }

                return (
                    <div key={name} className="p-5 bg-bg-deep border border-border-thin rounded-2xl space-y-4 shadow-sm">
                        <div className="flex justify-between items-center px-1">
                            <label className="text-[10px] font-black text-text-dim uppercase tracking-widest flex items-center gap-1.5">
                                {label} (Tabla Colaborativa)
                            </label>
                            {allowDynamicRows && !isDisabled && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        const tpl: any = {};
                                        columns.forEach((_, colIndex) => {
                                            tpl[colIndex.toString()] = "";
                                        });
                                        onAdd?.(name, tpl);
                                    }}
                                    className="px-2.5 py-1 bg-surface border border-border-thin hover:border-text-main/25 text-text-main rounded-lg text-[9px] font-black uppercase flex items-center gap-1 transition-all shadow-sm cursor-pointer"
                                >
                                    + Añadir Fila
                                </button>
                            )}
                        </div>

                        <div className="overflow-x-auto border border-border-thin rounded-xl">
                            <table className="w-full border-collapse text-left text-xs text-text-main bg-bg-deep">
                                <thead>
                                    <tr className={trHeaderCls}>
                                        {columns.map((col: string, colIdx: number) => (
                                            <th key={colIdx} className={thCls}>
                                                {col}
                                            </th>
                                        ))}
                                        {allowDynamicRows && !isDisabled && <th className="p-3 w-10"></th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {rowsData.length === 0 ? (
                                        <tr>
                                            <td colSpan={columns.length + (allowDynamicRows && !isDisabled ? 1 : 0)} className="p-6 text-center text-text-dim italic text-[10px]">
                                                No hay filas registradas. {allowDynamicRows && !isDisabled && "Haga clic en 'Añadir Fila' para empezar."}
                                            </td>
                                        </tr>
                                    ) : (
                                        rowsData.map((_: any, rIdx: number) => (
                                            <tr key={rIdx} className="border-b border-border-thin last:border-0 hover:bg-surface-hover/10 transition-colors">
                                                {columns.map((_: string, cIdx: number) => {
                                                    const cellFieldName = `${name}[${rIdx}].col_${cIdx}`;

                                                        return (
                                                            <td key={cIdx} className="p-2">
                                                                <CoWorkField
                                                                    name={cellFieldName}
                                                                    cowork={cowork}
                                                                    type="text"
                                                                    readOnly={isDisabled}
                                                                    placeholder="Escriba..."
                                                                    className="w-full bg-transparent hover:bg-surface-hover/25 focus:bg-surface border border-transparent focus:border-border-thin rounded-lg px-2 py-1.5 text-xs text-text-main transition-all outline-none"
                                                                    onValueChange={(val) => {
                                                                        onUpdateItem?.(name, rIdx, cIdx.toString(), val);
                                                                    }}
                                                                />
                                                            </td>
                                                        );
                                                    })}
                                                {allowDynamicRows && !isDisabled && (
                                                    <td className="p-2 text-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => onRemove?.(name, rIdx)}
                                                            className="p-1.5 rounded-lg hover:bg-error/10 text-text-dim hover:text-error transition-all cursor-pointer"
                                                            title="Eliminar fila"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            }

            if (type === 'rich-text') {
                const headerStyle = (field as any).headerStyle || 'none';
                const hasHeader = headerStyle !== 'none';

                let headerCls = "px-4 py-2 text-[10px] font-black uppercase tracking-wider block ";
                if (headerStyle === 'blue') headerCls += "bg-blue-600 dark:bg-blue-700 text-white border-b border-blue-800";
                else if (headerStyle === 'gold') headerCls += "bg-amber-500 dark:bg-amber-600 text-white border-b border-amber-700";
                else if (headerStyle === 'gray') headerCls += "bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-b border-border-thin";

                return (
                    <div key={name} className={hasHeader ? "border border-border-thin rounded-2xl overflow-hidden bg-bg-deep/40 shadow-sm" : "space-y-2"}>
                        {hasHeader ? (
                            <label className={headerCls}>{label}</label>
                        ) : (
                            <label className="block text-[9px] font-black text-text-dim uppercase tracking-widest ml-1">
                                {label} (Colaborativo)
                            </label>
                        )}
                        <div className={hasHeader ? "p-3 bg-surface" : "border border-border-thin rounded-2xl overflow-hidden bg-bg-deep focus-within:ring-2 focus-within:ring-text-main/15 transition-all"}>
                            <CoWorkEditor
                                field={name}
                                cowork={cowork}
                                toolbarMode={(field as any).toolbarMode || config?.toolbarMode || 'apa_full'}
                                onChange={(html, meta) => onUpdate(name, html, meta)}
                            />
                        </div>
                    </div>
                );
            }

            if (type === 'checkbox') {
                return (
                    <div key={name} className="p-5 bg-bg-deep border border-border-thin rounded-2xl flex items-center gap-3 relative group hover:border-text-main/10 transition-all">
                        <CoWorkField
                            name={name}
                            cowork={cowork}
                            type="checkbox"
                            label={`${label} • Colaborativo`}
                            onValueChange={(val) => onUpdate(name, val === 'true' || val === true)}
                        />
                    </div>
                );
            }

            if (type === 'select') {
                return (
                    <div key={name} className="p-5 bg-bg-deep border border-border-thin rounded-2xl flex flex-col gap-1.5 relative group hover:border-text-main/10 transition-all">
                        <CoWorkField
                            name={name}
                            cowork={cowork}
                            type="select"
                            label={`${label} • Colaborativo`}
                            placeholder={placeholder}
                            onValueChange={(val) => onUpdate(name, val)}
                            className="w-full bg-bg-deep border border-border-thin rounded-xl px-4 py-2.5 text-xs text-text-main outline-none"
                        >
                            <option value="">Seleccione opción...</option>
                            {options.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </CoWorkField>
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

                    <div className={config.layout === 'two-column' ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "grid grid-cols-1 gap-4"}>
                        {fields.map(field => renderField(field))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AgnosticSection;
