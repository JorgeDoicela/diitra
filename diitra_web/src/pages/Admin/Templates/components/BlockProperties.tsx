import React from 'react';
import { Settings, Palette, Layout, Plus, Trash2, Image as ImageIcon, Type, Sparkles, Upload } from 'lucide-react';
import { type DocumentBlock, type DocumentTemplateDto, BLOCK_METADATA } from '../types';
import { ColorPickerField } from './properties/SharedColorPicker';
import { RichTextEditor } from './properties/RichTextEditor';
import { MultiSectionTableProperties } from './properties/MultiSectionTableProperties';
import { SignaturesProperties } from './properties/SignaturesProperties';
import { TwoColumnProperties } from './properties/TwoColumnProperties';
import { GanttProperties } from './properties/GanttProperties';
import { ProjectGeneralProperties } from './properties/ProjectGeneralProperties';
import { ProjectTechnicalProperties } from './properties/ProjectTechnicalProperties';
import { ImpactsProperties } from './properties/ImpactsProperties';
import { ExpectedProductsProperties } from './properties/ExpectedProductsProperties';
import { ProgressHeaderProperties } from './properties/ProgressHeaderProperties';
import { ProgressActivityProperties } from './properties/ProgressActivityProperties';
import { ProgressStatusProperties } from './properties/ProgressStatusProperties';
import { ThemeEditorTab } from './ThemeEditorTab';
import { RubricTableProperties } from './properties/RubricTableProperties';
import { ArbitrationDictamenProperties } from './properties/ArbitrationDictamenProperties';
import { CoverProperties } from './properties/CoverProperties';

interface BlockPropertiesProps {
    selectedTemplate?: DocumentTemplateDto | null;
    activeBlock: DocumentBlock | undefined;
    onUpdateConfig: (blockId: string, key: string, value: any) => void;
    onCellChange: (blockId: string, rowIndex: number, cellIndex: number, val: string) => void;
    onAddRow: (blockId: string) => void;
    onRemoveRow: (blockId: string, rowIndex: number) => void;
    themeConfigJson: string | null | undefined;
    onUpdateThemeConfig: (newThemeJson: string) => void;
    headerCollapsed?: boolean;
}

const HEADER_STYLE_OPTIONS = [
    { value: 'blue', label: 'Azul Institucional' },
    { value: 'gold', label: 'Dorado Acreditación' },
    { value: 'gray', label: 'Gris Neutro' },
    { value: 'none', label: 'Sin fondo de encabezado' },
] as const;

const LabeledField: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div className="space-y-1.5">
        <label className="text-[11px] font-medium text-text-dim block">{label}</label>
        {children}
    </div>
);

const inputCls = "w-full text-[11px] bg-surface-hover/60 hover:bg-surface-hover/90 border border-border-thin rounded-md p-2 text-text-main focus:bg-surface focus:border-black dark:focus:border-white focus:ring-1 focus:ring-black dark:focus:ring-white transition-all focus:outline-none";
const selectCls = "w-full text-[11px] bg-surface-hover/60 hover:bg-surface-hover/90 border border-border-thin rounded-md p-2 text-text-main focus:bg-surface focus:border-black dark:focus:border-white focus:ring-1 focus:ring-black dark:focus:ring-white transition-all focus:outline-none";

export const BlockProperties: React.FC<BlockPropertiesProps> = ({
    selectedTemplate,
    activeBlock,
    onUpdateConfig,
    onCellChange,
    onAddRow,
    onRemoveRow,
    themeConfigJson,
    onUpdateThemeConfig,
    headerCollapsed,
}) => {
    const [activeTab, setActiveTab] = React.useState<'properties' | 'theme'>('properties');

    // Cambiar automáticamente a la pestaña de propiedades al seleccionar un bloque
    React.useEffect(() => {
        if (activeBlock) {
            setActiveTab('properties');
        }
    }, [activeBlock?.id]);

    return (
        <div className="w-96 border border-border-thin rounded-md bg-surface flex flex-col overflow-hidden shrink-0 h-full">
            {/* Cabecera con Pestañas */}
            <div className="flex border-b border-border-thin bg-surface shrink-0 select-none items-stretch h-11">
                <button
                    type="button"
                    onClick={() => setActiveTab('properties')}
                    className={`py-2 text-center text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 border-b-2 cursor-pointer ${headerCollapsed ? 'px-6' : 'flex-1'
                        } ${activeTab === 'properties'
                            ? 'border-text-main text-text-main bg-surface'
                            : 'border-transparent text-text-dim hover:text-text-main hover:bg-surface-hover/10'
                        }`}
                >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Propiedades</span>
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('theme')}
                    className={`py-2 text-center text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 border-b-2 cursor-pointer ${headerCollapsed ? 'px-6' : 'flex-1'
                        } ${activeTab === 'theme'
                            ? 'border-text-main text-text-main bg-surface'
                            : 'border-transparent text-text-dim hover:text-text-main hover:bg-surface-hover/10'
                        }`}
                >
                    <Palette className="w-3.5 h-3.5" />
                    <span>Estilos</span>
                </button>

                {/* Espacio derecho vacío cuando el header está colapsado para no tapar los textos */}
                {headerCollapsed && <div className="w-24 border-b-2 border-transparent" />}
            </div>

            {/* CUERPO DEL PANEL: PESTAÑA ESTILOS */}
            {activeTab === 'theme' && (
                <ThemeEditorTab
                    themeConfigJson={themeConfigJson}
                    onUpdateThemeConfig={onUpdateThemeConfig}
                    activeBlockId={activeBlock?.id}
                    activeBlockType={activeBlock?.type}
                    onUpdateConfig={onUpdateConfig}
                />
            )}

            {/* CUERPO DEL PANEL: PESTAÑA PROPIEDADES */}
            {activeTab === 'properties' && (
                <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
                    {!selectedTemplate ? (
                        <div className="flex flex-col items-center justify-start pt-[220px] flex-1 p-6 text-center select-none bg-surface-hover/5">
                            <Settings className="w-10 h-10 text-text-dim/30 mb-3 animate-pulse" />
                            <h4 className="text-xs font-bold text-text-main uppercase tracking-wider">Sin formato seleccionado</h4>
                            <p className="text-[10px] text-text-dim/80 max-w-xs mt-1 leading-normal">
                                Selecciona un documento del <strong>Catálogo (izquierda)</strong> para cargar sus bloques y propiedades, o cambia a la pestaña de <strong>Estilos</strong> para editar el diseño visual general.
                            </p>
                        </div>
                    ) : !activeBlock ? (
                        <div className="flex flex-col items-center justify-start pt-[220px] flex-1 p-6 text-center select-none bg-surface-hover/5">
                            <Settings className="w-10 h-10 text-text-dim/30 mb-3 animate-pulse" />
                            <h4 className="text-xs font-bold text-text-main uppercase tracking-wider">Ningún bloque seleccionado</h4>
                            <p className="text-[10px] text-text-dim/80 max-w-xs mt-1 leading-normal">
                                Haz clic sobre cualquier bloque en el lienzo A4 para configurar sus propiedades específicas, o cambia a la pestaña de <strong>Estilos</strong> para editar el diseño general de la hoja.
                            </p>
                        </div>
                    ) : (
                        <div className="flex-1 p-4 space-y-5">
                            {(() => {
                                const meta = BLOCK_METADATA[activeBlock.type];
                                const displayTitle = activeBlock.config?.title || activeBlock.title || meta?.defaultTitle || 'Configuración del Bloque';

                                return (
                                    <div className="pb-3 border-b border-border-thin">
                                        <h4 className="font-bold text-xs text-text-main leading-snug">
                                            {displayTitle}
                                        </h4>
                                    </div>
                                );
                            })()}

                            {activeBlock.type === 'cover' && (
                                <CoverProperties
                                    activeBlock={activeBlock}
                                    onUpdateConfig={onUpdateConfig}
                                    inputCls={inputCls}
                                    selectCls={selectCls}
                                />
                            )}

                            {/* ── TÍTULO ──────────────────────────────────────────────────── */}
                            {activeBlock.type === 'title' && (
                                <div className="space-y-4 border-t border-border-thin/20 pt-4">
                                    <LabeledField label="Texto del Título">
                                        <input type="text" className={inputCls}
                                            value={activeBlock.config.text || ''}
                                            onChange={e => onUpdateConfig(activeBlock.id, 'text', e.target.value)}
                                            placeholder="Ej: 1. IDENTIFICACIÓN DEL PROYECTO" />
                                    </LabeledField>
                                    <LabeledField label="Tamaño de Fuente">
                                        <select className={selectCls}
                                            value={activeBlock.config.fontSize || 'H2'}
                                            onChange={e => onUpdateConfig(activeBlock.id, 'fontSize', e.target.value)}>
                                            <option value="H1">Título H1 (Grande con Línea)</option>
                                            <option value="H2">Título H2 (Barra de Sección con Fondo)</option>
                                            <option value="H3">Título H3 (Mediano de Subsección)</option>
                                        </select>
                                    </LabeledField>
                                    <LabeledField label="Alineación del Texto">
                                        <select className={selectCls}
                                            value={activeBlock.config.alignment || 'left'}
                                            onChange={e => onUpdateConfig(activeBlock.id, 'alignment', e.target.value)}>
                                            <option value="left">Izquierda</option>
                                            <option value="center">Centrado</option>
                                            <option value="right">Derecha</option>
                                        </select>
                                    </LabeledField>
                                </div>
                            )}

                            {/* ── TEXTO ENRIQUECIDO ────────────────────────────────────────── */}
                            {activeBlock.type === 'rich_text' && (
                                <div className="space-y-4 border-t border-border-thin/20 pt-4">
                                    <div className="p-3 bg-surface-hover/30 border border-border-thin rounded-xl space-y-3">
                                        <h5 className="text-[9px] font-black text-text-main uppercase tracking-widest flex items-center gap-1.5">
                                            Comportamiento en Workspace
                                        </h5>
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1 pr-2">
                                                <label className="text-[10px] font-bold text-text-main block">¿Editable en Workspace?</label>
                                                <span className="text-[8.5px] text-text-dim block mt-0.5 leading-tight">
                                                    Habilita pestaña de redacción colaborativa. Si se desactiva, será puramente estático (ej: instrucciones).
                                                </span>
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={activeBlock.config.isEditableWorkspace !== false}
                                                onChange={e => onUpdateConfig(activeBlock.id, 'isEditableWorkspace', e.target.checked)}
                                                className="w-4 h-4 text-text-main accent-text-main bg-surface border-border-thin rounded focus:ring-text-main cursor-pointer"
                                            />
                                        </div>

                                        {activeBlock.config.isEditableWorkspace !== false && (
                                            <div className="border-t border-border-thin/15 pt-2.5 space-y-1.5">
                                                <label className="text-[9.5px] font-black text-text-main uppercase tracking-wider block">
                                                    Herramientas del Editor
                                                </label>
                                                <select
                                                    className={selectCls}
                                                    value={activeBlock.config.toolbarMode || 'apa_full'}
                                                    onChange={e => onUpdateConfig(activeBlock.id, 'toolbarMode', e.target.value)}
                                                >
                                                    <option value="apa_full">Completo APA 7 (Niveles, Tablas, Figuras, Citas y Refs)</option>
                                                    <option value="standard">Redacción Estándar (Formato, Listas y Citas en Bloque)</option>
                                                    <option value="compact">Compacto / Texto Directo (Solo Negrita, Cursiva y Listas)</option>
                                                </select>
                                                <span className="text-[8px] text-text-dim block leading-tight">
                                                    {activeBlock.config.toolbarMode === 'compact'
                                                        ? 'Solo herramientas esenciales de redacción para textos cortos o justificaciones.'
                                                        : activeBlock.config.toolbarMode === 'standard'
                                                            ? 'Formato enriquecido y listas sin componentes complejos de tablas o citas.'
                                                            : 'Suite académica completa: Niveles APA, tablas con numeración, figuras, citas y referencias.'}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-[9px] text-text-dim leading-relaxed">
                                        Editor con soporte de <strong>negritas</strong>, <em>cursiva</em>, listas, alineación y <u>tablas internas</u>.
                                        Inserta variables dinámicas con los botones de abajo.
                                    </p>
                                    <RichTextEditor
                                        block={activeBlock}
                                        fieldKey="html"
                                        onUpdateConfig={onUpdateConfig}
                                    />
                                </div>
                            )}

                            {/* ── TABLA AVANZADA ──────────────────────────────────────────── */}
                            {activeBlock.type === 'advanced_table' && (
                                <div className="space-y-4 border-t border-border-thin/20 pt-4">
                                    <div className="p-3 bg-surface-hover/30 border border-border-thin rounded-xl space-y-3">
                                        <h5 className="text-[9px] font-black text-text-main uppercase tracking-widest flex items-center gap-1.5">
                                            Comportamiento en Workspace
                                        </h5>
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1 pr-2">
                                                <label className="text-[10px] font-bold text-text-main block">¿Editable en Workspace?</label>
                                                <span className="text-[8.5px] text-text-dim block mt-0.5 leading-tight">
                                                    Habilita pestaña interactiva en el Workspace del investigador.
                                                </span>
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={activeBlock.config.isEditableWorkspace !== false}
                                                onChange={e => onUpdateConfig(activeBlock.id, 'isEditableWorkspace', e.target.checked)}
                                                className="w-4 h-4 text-text-main accent-text-main bg-surface border-border-thin rounded focus:ring-text-main cursor-pointer"
                                            />
                                        </div>
                                        {activeBlock.config.isEditableWorkspace !== false && (
                                            <div className="flex items-center justify-between border-t border-border-thin/10 pt-2.5">
                                                <div className="flex-1 pr-2">
                                                    <label className="text-[10px] font-bold text-text-main block">Permitir Filas Dinámicas</label>
                                                    <span className="text-[8.5px] text-text-dim block mt-0.5 leading-tight">
                                                        Permite a los investigadores añadir/eliminar filas en tiempo real.
                                                    </span>
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    checked={activeBlock.config.allowDynamicRows || false}
                                                    onChange={e => onUpdateConfig(activeBlock.id, 'allowDynamicRows', e.target.checked)}
                                                    className="w-4 h-4 text-text-main accent-text-main bg-surface border-border-thin rounded focus:ring-text-main cursor-pointer"
                                                />
                                            </div>
                                        )}
                                    </div>
                                    <ColorPickerField
                                        label="Color de Encabezado"
                                        value={activeBlock.config.headerStyle || '#1e2a4a'}
                                        onChange={v => onUpdateConfig(activeBlock.id, 'headerStyle', v)}
                                    />

                                    {/* Encabezados de columna */}
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between items-center">
                                            <label className="text-[10px] font-black text-text-dim uppercase tracking-wider">
                                                Encabezados ({activeBlock.config.headers?.length ?? 0} cols)
                                            </label>
                                            <button
                                                onClick={() => {
                                                    const h = [...(activeBlock.config.headers ?? []), `Col ${(activeBlock.config.headers?.length ?? 0) + 1}`];
                                                    const w = Array(h.length).fill(`${Math.floor(100 / h.length)}%`);
                                                    const r = (activeBlock.config.rows ?? []).map((row: any) => {
                                                        const cells = Array.isArray(row) ? [...row] : [...(row?.cells || [])];
                                                        return Array.isArray(row) ? [...cells, ''] : { ...row, cells: [...cells, ''] };
                                                    });
                                                    onUpdateConfig(activeBlock.id, 'headers', h);
                                                    onUpdateConfig(activeBlock.id, 'colWidths', w);
                                                    onUpdateConfig(activeBlock.id, 'rows', r);
                                                }}
                                                className="flex items-center gap-1 px-2 py-1 border border-border-thin rounded-md text-[9px] font-semibold text-text-main bg-surface hover:bg-surface-hover transition-colors cursor-pointer"
                                            >
                                                <Plus className="w-3 h-3" /> Col
                                            </button>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {(activeBlock.config.headers ?? []).map((h, hIdx) => (
                                                <div key={hIdx} className="flex items-center gap-1 flex-1 min-w-0 bg-surface border border-border-thin/25 rounded-lg px-2 py-1">
                                                    <input
                                                        value={h}
                                                        onChange={e => {
                                                            const next = [...(activeBlock.config.headers ?? [])];
                                                            next[hIdx] = e.target.value;
                                                            onUpdateConfig(activeBlock.id, 'headers', next);
                                                        }}
                                                        className="flex-1 min-w-0 bg-transparent text-[10px] text-text-main focus:outline-none"
                                                        placeholder={`Col ${hIdx + 1}`}
                                                    />
                                                    {(activeBlock.config.headers?.length ?? 0) > 1 && (
                                                        <button
                                                            onClick={() => {
                                                                const h = (activeBlock.config.headers ?? []).filter((_, i) => i !== hIdx);
                                                                const w = Array(h.length).fill(`${Math.floor(100 / h.length)}%`);
                                                                const r = (activeBlock.config.rows ?? []).map((row: any) => {
                                                                    const cells = (Array.isArray(row) ? row : (row?.cells || [])).filter((_: any, i: number) => i !== hIdx);
                                                                    return Array.isArray(row) ? cells : { ...row, cells };
                                                                });
                                                                onUpdateConfig(activeBlock.id, 'headers', h);
                                                                onUpdateConfig(activeBlock.id, 'colWidths', w);
                                                                onUpdateConfig(activeBlock.id, 'rows', r);
                                                            }}
                                                            className="text-text-dim hover:text-error transition-colors"
                                                        >
                                                            <Trash2 className="w-2.5 h-2.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Filas */}
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-[10px] font-black text-text-dim uppercase tracking-wider">
                                                Filas ({activeBlock.config.rows?.length ?? 0})
                                            </span>
                                            <button
                                                onClick={() => onAddRow(activeBlock.id)}
                                                className="flex items-center gap-1 px-2 py-1 border border-border-thin rounded-md text-[9px] font-semibold text-text-main bg-surface hover:bg-surface-hover transition-colors cursor-pointer"
                                            >
                                                <Plus className="w-3 h-3" /> Añadir Fila
                                            </button>
                                        </div>
                                        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                                            {activeBlock.config.rows?.map((row: any, rIdx: number) => {
                                                const cells: string[] = Array.isArray(row) ? row : (row?.cells || []);
                                                return (
                                                    <div key={rIdx} className="flex gap-1 items-center group/row">
                                                        {cells.map((cell: string, cIdx: number) => (
                                                            <input
                                                                key={cIdx}
                                                                value={cell}
                                                                onChange={e => onCellChange(activeBlock.id, rIdx, cIdx, e.target.value)}
                                                                className="flex-1 min-w-0 text-[10px] bg-surface border border-border-thin rounded-md px-1.5 py-1 text-text-main focus:outline-none"
                                                                placeholder={`Celda ${cIdx + 1}`}
                                                            />
                                                        ))}
                                                        <button
                                                            onClick={() => onRemoveRow(activeBlock.id, rIdx)}
                                                            className="p-1 rounded hover:bg-error/10 text-text-dim hover:text-error opacity-0 group-hover/row:opacity-100 transition-all"
                                                        >
                                                            <Trash2 className="w-2.5 h-2.5" />
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ── TABLA MULTI-SECCIÓN ─────────────────────────────────────── */}
                            {activeBlock.type === 'multi_section_table' && (
                                <MultiSectionTableProperties block={activeBlock} onUpdateConfig={onUpdateConfig} />
                            )}

                            {/* ── DOS COLUMNAS ────────────────────────────────────────────── */}
                            {activeBlock.type === 'two_column' && (
                                <TwoColumnProperties block={activeBlock} onUpdateConfig={onUpdateConfig} />
                            )}

                            {/* ── SALTO DE PÁGINA ─────────────────────────────────────────── */}
                            {activeBlock.type === 'page_break' && (
                                <div className="border-t border-border-thin/20 pt-4">
                                    <div className="p-3 rounded-lg bg-surface-hover/40 border border-border-thin/20 text-center">
                                        <p className="text-xs font-semibold text-text-dim">Salto de Página</p>
                                        <p className="text-[10px] text-text-dim/60 mt-1 leading-relaxed">
                                            Inserta un corte de página en el PDF. El contenido posterior al corte comenzará en una página nueva.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* ── GANTT ───────────────────────────────────────────────────── */}
                            {activeBlock.type === 'gantt' && (
                                <GanttProperties block={activeBlock} onUpdateConfig={onUpdateConfig} />
                            )}

                            {/* ── TABLA DE INVESTIGADORES ─────────────────────────────────── */}
                            {/* ── EQUIPO DE INVESTIGADORES ────────────────────────────────── */}
                            {activeBlock.type === 'researchers_table' && (
                                <div className="space-y-3 border-t border-border-thin/20 pt-4">
                                    {[
                                        { key: 'mostrarCedula', label: 'Mostrar Cédula de Identidad', desc: 'Añade la cédula en la segunda columna.' },
                                        { key: 'mostrarEmail', label: 'Mostrar Email Institucional', desc: 'Muestra el email del investigador.' },
                                        { key: 'mostrarTelefono', label: 'Mostrar Teléfono de Contacto', desc: 'Muestra el número de contacto.' },
                                        { key: 'mostrarNivelAcademico', label: 'Mostrar Nivel Académico', desc: 'Título más alto registrado en Senescyt.' },
                                        { key: 'mostrarHoras', label: 'Mostrar Carga Horaria', desc: 'Horas semanales asignadas al proyecto.' },
                                    ].map(({ key, label, desc }) => (
                                        <div key={key} className="flex items-center justify-between border-b border-border-thin/10 pb-3 last:border-0 last:pb-0">
                                            <div>
                                                <label className="text-xs font-semibold text-text-main block">{label}</label>
                                                <span className="text-[9px] text-text-dim block mt-0.5 leading-tight">{desc}</span>
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={(activeBlock.config as any)[key] || false}
                                                onChange={e => onUpdateConfig(activeBlock.id, key, e.target.checked)}
                                                className="w-4 h-4 text-text-main accent-text-main bg-surface border-border-thin rounded focus:ring-text-main"
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* ── TABLA DE RÚBRICA ────────────────────────────────────────── */}
                            {activeBlock.type === 'rubric_table' && (
                                <RubricTableProperties block={activeBlock} onUpdateConfig={onUpdateConfig} />
                            )}

                            {/* ── ACTA DE DICTAMEN DE ARBITRAJE ────────────────────────────── */}
                            {activeBlock.type === 'arbitration_dictamen_section' && (
                                <ArbitrationDictamenProperties block={activeBlock} onUpdateConfig={onUpdateConfig} />
                            )}

                            {/* ── FIRMAS ──────────────────────────────────────────────────── */}
                            {activeBlock.type === 'signatures' && (
                                <SignaturesProperties block={activeBlock} onUpdateConfig={onUpdateConfig} />
                            )}

                            {/* ── FICHA DE IDENTIFICACIÓN ─────────────────────────────────── */}
                            {activeBlock.type === 'project_general_section' && (
                                <ProjectGeneralProperties block={activeBlock} onUpdateConfig={onUpdateConfig} />
                            )}

                            {/* ── PLAN TÉCNICO ────────────────────────────────────────────── */}
                            {activeBlock.type === 'project_technical_section' && (
                                <ProjectTechnicalProperties block={activeBlock} onUpdateConfig={onUpdateConfig} />
                            )}

                            {/* ── RECURSOS Y PRESUPUESTO ──────────────────────────────────── */}
                            {(activeBlock.type === 'project_budget_section' || activeBlock.type === 'resources') && (
                                <div className="space-y-3 border-t border-border-thin/20 pt-4">
                                    <p className="text-[10px] text-text-dim leading-relaxed">
                                        Activa o desactiva las tablas de recursos y financiamiento:
                                    </p>
                                    {[
                                        { key: 'showRecursosDisponibles', label: 'Mostrar Recursos Disponibles', desc: 'Bienes, infraestructura o equipos ya provistos.' },
                                        { key: 'showRecursosNecesarios', label: 'Mostrar Recursos Necesarios', desc: 'Tabla de presupuesto detallado para adquisiciones.' },
                                        { key: 'showFinanciamiento', label: 'Mostrar Financiamiento', desc: 'Origen de recursos (ISTPET / Otras Fuentes).' },
                                    ].map(({ key, label, desc }) => (
                                        <div key={key} className="flex items-center justify-between border-b border-border-thin/10 pb-3 last:border-0 last:pb-0">
                                            <div>
                                                <label className="text-xs font-semibold text-text-main block">{label}</label>
                                                <span className="text-[9px] text-text-dim block mt-0.5 leading-tight">{desc}</span>
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={(activeBlock.config as any)[key] !== false}
                                                onChange={e => onUpdateConfig(activeBlock.id, key, e.target.checked)}
                                                className="w-4 h-4 text-text-main accent-text-main bg-surface border-border-thin rounded focus:ring-text-main"
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* ── PRODUCTOS ESPERADOS ─────────────────────────────────────── */}
                            {activeBlock.type === 'expected_products' && (
                                <ExpectedProductsProperties block={activeBlock} onUpdateConfig={onUpdateConfig} />
                            )}

                            {/* ── MATRIZ DE IMPACTO ───────────────────────────────────────── */}
                            {activeBlock.type === 'impacts' && (
                                <ImpactsProperties block={activeBlock} onUpdateConfig={onUpdateConfig} />
                            )}

                            {activeBlock.type === 'progress_header_section' && (
                                <ProgressHeaderProperties block={activeBlock} onUpdateConfig={onUpdateConfig} />
                            )}

                            {activeBlock.type === 'progress_activity_section' && (
                                <ProgressActivityProperties block={activeBlock} onUpdateConfig={onUpdateConfig} />
                            )}

                            {activeBlock.type === 'progress_status_section' && (
                                <ProgressStatusProperties block={activeBlock} onUpdateConfig={onUpdateConfig} />
                            )}

                            {activeBlock.type === 'final_report_header_section' && (
                                <div className="space-y-4 border-t border-border-thin/20 pt-4">
                                    <div>
                                        <label className="text-[10px] font-semibold text-text-dim uppercase tracking-wider block mb-1">Título del Encabezado</label>
                                        <input
                                            type="text"
                                            value={activeBlock.config.finalReportTitle || 'DATOS DEL PROYECTO DE INVESTIGACIÓN'}
                                            onChange={(e) => onUpdateConfig(activeBlock.id, 'finalReportTitle', e.target.value)}
                                            className="w-full text-xs p-2 bg-bg-main border border-border-thin rounded-lg text-text-main"
                                        />
                                    </div>
                                    <ColorPickerField
                                        label="Color del Tema"
                                        value={activeBlock.config.finalReportHeaderColor || '#1e2a4a'}
                                        onChange={val => onUpdateConfig(activeBlock.id, 'finalReportHeaderColor', val)}
                                    />
                                    <div className="space-y-2 pt-2 border-t border-border-thin/10">
                                        {[
                                            { key: 'showTipoInvestigacion', label: 'Mostrar Tipo de Investigación', desc: 'Básica, Aplicada, Desarrollo Experimental (X)' },
                                            { key: 'showAlcanceProyecto', label: 'Mostrar Alcance del Proyecto', desc: 'Institucional, Parroquial, Cantonal, Provincial, Nacional (X)' },
                                            { key: 'showFechasProyecto', label: 'Mostrar Cuadro de Fechas', desc: 'Presentación, Inicio, Fin Presentada y Fin Real' },
                                            { key: 'showTablaInvestigadores', label: 'Mostrar Tabla de Investigadores', desc: 'Nombre, Cédula, Email, Teléfono y Rol' }
                                        ].map(({ key, label, desc }) => (
                                            <div key={key} className="flex items-center justify-between border-b border-border-thin/10 pb-2">
                                                <div>
                                                    <p className="text-xs font-medium text-text-main">{label}</p>
                                                    <p className="text-[10px] text-text-dim">{desc}</p>
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    checked={(activeBlock.config as any)[key] !== false}
                                                    onChange={(e) => onUpdateConfig(activeBlock.id, key, e.target.checked)}
                                                    className="rounded text-indigo-600"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeBlock.type === 'final_report_writing_section' && (
                                <div className="space-y-4 border-t border-border-thin/20 pt-4">
                                    <ColorPickerField
                                        label="Color del Tema de Encabezados"
                                        value={activeBlock.config.writingHeaderColor || '#1e2a4a'}
                                        onChange={val => onUpdateConfig(activeBlock.id, 'writingHeaderColor', val)}
                                    />
                                    <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                                        <p className="text-xs font-semibold text-indigo-400">Sub-Secciones de Redacción Pre-Cargadas (15)</p>
                                        <p className="text-[10px] text-text-dim mt-1">Este bloque unificado administra automáticamente las 15 sub-secciones científicas con editores Tiptap colaborativos en tiempo real.</p>
                                    </div>
                                </div>
                            )}

                            {/* ── BLOQUES DE PLAN DE APRENDIZAJE & EVALUACIÓN ─────────── */}
                            {activeBlock.type === 'learning_plan_header_section' && (
                                <div className="space-y-4 border-t border-border-thin/20 pt-4">
                                    <ColorPickerField
                                        label="Color del Encabezado"
                                        value={activeBlock.config.learningPlanHeaderColor || '#1e2a4a'}
                                        onChange={val => onUpdateConfig(activeBlock.id, 'learningPlanHeaderColor', val)}
                                    />
                                    <div className="flex items-center justify-between border-b border-border-thin/10 pb-3">
                                        <div>
                                            <label className="text-xs font-semibold text-text-main block">Mostrar Objetivo General</label>
                                            <span className="text-[9px] text-text-dim block mt-0.5">Extraer e imprimir el Objetivo General del proyecto.</span>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={activeBlock.config.showObjetivoGeneral !== false}
                                            onChange={(e) => onUpdateConfig(activeBlock.id, 'showObjetivoGeneral', e.target.checked)}
                                            className="rounded border-border-thin text-brand focus:ring-0 cursor-pointer"
                                        />
                                    </div>
                                </div>
                            )}

                            {activeBlock.type === 'learning_plan_eval_parameters_section' && (
                                <div className="space-y-4 border-t border-border-thin/20 pt-4">
                                    <ColorPickerField
                                        label="Color del Encabezado"
                                        value={activeBlock.config.learningPlanHeaderColor || '#1e2a4a'}
                                        onChange={val => onUpdateConfig(activeBlock.id, 'learningPlanHeaderColor', val)}
                                    />
                                    <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg text-[10px] text-text-dim space-y-1">
                                        <p className="font-bold text-purple-600 dark:text-purple-400">Escala Cualitativa ISTPET:</p>
                                        <p>Muestra automáticamente los 4 niveles oficiales (4 Muy Adecuado, 3 Adecuado, 2 Poco Adecuado, 1 No Adecuado) con sus descriptores oficiales.</p>
                                    </div>
                                </div>
                            )}

                            {activeBlock.type === 'learning_plan_prerequisites_section' && (
                                <div className="space-y-4 border-t border-border-thin/20 pt-4">
                                    <div>
                                        <label className="text-[10px] font-semibold text-text-dim uppercase tracking-wider block mb-1">Modo del Bloque</label>
                                        <select
                                            value={activeBlock.config.learningPlanMode || 'plan'}
                                            onChange={(e) => onUpdateConfig(activeBlock.id, 'learningPlanMode', e.target.value)}
                                            className="w-full text-xs p-2 bg-bg-main border border-border-thin rounded-lg text-text-main font-semibold"
                                        >
                                            <option value="plan">Planificación (Definición de Prerrequisitos)</option>
                                            <option value="evaluacion">Evaluación (Cuadrícula 4 Columnas de Cumplimiento)</option>
                                        </select>
                                    </div>
                                    <ColorPickerField
                                        label="Color del Encabezado"
                                        value={activeBlock.config.learningPlanHeaderColor || '#1e2a4a'}
                                        onChange={val => onUpdateConfig(activeBlock.id, 'learningPlanHeaderColor', val)}
                                    />
                                    <div className="p-3 bg-teal-500/10 border border-teal-500/20 rounded-lg text-[10px] text-text-dim space-y-1">
                                        <p className="font-bold text-teal-600 dark:text-teal-400">Reglas CACES / ISTPET:</p>
                                        <p>• Mínimo 3 prerrequisitos Cognitivos requeridos.</p>
                                        <p>• Mínimo 5 prerrequisitos Procedimentales requeridos.</p>
                                    </div>
                                </div>
                            )}

                            {activeBlock.type === 'learning_plan_activities_section' && (
                                <div className="space-y-4 border-t border-border-thin/20 pt-4">
                                    <div>
                                        <label className="text-[10px] font-semibold text-text-dim uppercase tracking-wider block mb-1">Modo del Bloque</label>
                                        <select
                                            value={activeBlock.config.learningPlanMode || 'plan'}
                                            onChange={(e) => onUpdateConfig(activeBlock.id, 'learningPlanMode', e.target.value)}
                                            className="w-full text-xs p-2 bg-bg-main border border-border-thin rounded-lg text-text-main font-semibold"
                                        >
                                            <option value="plan">Planificación (Con Horas de Trabajo)</option>
                                            <option value="evaluacion">Evaluación (Con 4 Columnas de Cumplimiento)</option>
                                        </select>
                                    </div>
                                    <ColorPickerField
                                        label="Color del Encabezado"
                                        value={activeBlock.config.learningPlanHeaderColor || '#1e2a4a'}
                                        onChange={val => onUpdateConfig(activeBlock.id, 'learningPlanHeaderColor', val)}
                                    />
                                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-[10px] text-text-dim space-y-1">
                                        <p className="font-bold text-blue-600 dark:text-blue-400">Matriz APE:</p>
                                        <p>Articula cada actividad con los Resultados de Aprendizaje (RdA), horas o nivel de desempeño cualitativo.</p>
                                    </div>
                                </div>
                            )}

                            {activeBlock.type === 'learning_plan_evaluation_table' && (
                                <div className="space-y-4 border-t border-border-thin/20 pt-4">
                                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[10px] text-text-dim space-y-1">
                                        <p className="font-bold text-amber-600 dark:text-amber-400">5. Resultados Generales (Admin):</p>
                                        <p>Tabla consolidada de promedios para Cognitivos, Procedimentales y Actividades de Aprendizaje con dictamen cualitativo.</p>
                                    </div>
                                </div>
                            )}

                            {/* ── AVANCE DE EJECUCIÓN ──────────────────────────────────────── */}
                            {activeBlock.type === 'project_progress_report' && (
                                <div className="space-y-3 border-t border-border-thin/20 pt-4">
                                    <p className="text-[10px] text-text-dim leading-relaxed">
                                        Activa o desactiva los apartados del informe de avance / bitácora:
                                    </p>
                                    {[
                                        { key: 'showHitosCompletados', label: 'Mostrar Monitoreo de Hitos', desc: 'Seguimiento porcentual de las actividades programadas.' },
                                        { key: 'showEvidencias', label: 'Mostrar Bitácoras y Evidencias', desc: 'Carga de archivos o links de evidencia física.' },
                                        { key: 'showPresupuestoEjecutado', label: 'Mostrar Libro de Presupuesto Ejecutado', desc: 'Control de montos de gastos devengados.' },
                                    ].map(({ key, label, desc }) => (
                                        <div key={key} className="flex items-center justify-between border-b border-border-thin/10 pb-3 last:border-0 last:pb-0">
                                            <div>
                                                <label className="text-xs font-semibold text-text-main block">{label}</label>
                                                <span className="text-[9px] text-text-dim block mt-0.5 leading-tight">{desc}</span>
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={(activeBlock.config as any)[key] !== false}
                                                onChange={e => onUpdateConfig(activeBlock.id, key, e.target.checked)}
                                                className="w-4 h-4 text-text-main accent-text-main bg-surface border-border-thin rounded focus:ring-text-main"
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* ── OFICIO DE APROBACIÓN DE PROYECTO ─────────────────────────── */}
                            {activeBlock.type === 'project_approval_notice' && (
                                <div className="space-y-4 border-t border-border-thin/20 pt-4">
                                    <h5 className="text-[10px] font-black text-text-dim uppercase tracking-wider">Opciones de Visibilidad y Estructura</h5>

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between border-b border-border-thin/10 pb-3">
                                            <div>
                                                <label className="text-xs font-semibold text-text-main block">Mostrar Logo en Encabezado</label>
                                                <span className="text-[9px] text-text-dim block mt-0.5 leading-tight">Desactivar si el papel membretado de fondo ya incluye el logo.</span>
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={activeBlock.config.mostrarLogoHeader === true}
                                                onChange={e => onUpdateConfig(activeBlock.id, 'mostrarLogoHeader', e.target.checked)}
                                                className="w-4 h-4 text-text-main accent-text-main bg-surface border-border-thin rounded focus:ring-text-main cursor-pointer"
                                            />
                                        </div>

                                        <div className="flex items-center justify-between border-b border-border-thin/10 pb-3">
                                            <div>
                                                <label className="text-xs font-semibold text-text-main block">Mostrar Compromisos CACES</label>
                                                <span className="text-[9px] text-text-dim block mt-0.5 leading-tight">Incluye o remueve el recuadro normativo del oficio.</span>
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={activeBlock.config.mostrarCompromisosCACES !== false}
                                                onChange={e => onUpdateConfig(activeBlock.id, 'mostrarCompromisosCACES', e.target.checked)}
                                                className="w-4 h-4 text-text-main accent-text-main bg-surface border-border-thin rounded focus:ring-text-main cursor-pointer"
                                            />
                                        </div>

                                        <div className="flex items-center justify-between border-b border-border-thin/10 pb-3">
                                            <div>
                                                <label className="text-xs font-semibold text-text-main block">Mostrar Fila de Fechas</label>
                                                <span className="text-[9px] text-text-dim block mt-0.5 leading-tight">Muestra presentación, inicio y finalización en la tabla.</span>
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={activeBlock.config.mostrarTablaFechas !== false}
                                                onChange={e => onUpdateConfig(activeBlock.id, 'mostrarTablaFechas', e.target.checked)}
                                                className="w-4 h-4 text-text-main accent-text-main bg-surface border-border-thin rounded focus:ring-text-main cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ── ENCABEZADO DE CERTIFICADO ─────────────────────────────────── */}
                            {activeBlock.type === 'certificate_header' && (
                                <div className="space-y-4 border-t border-border-thin/20 pt-4">
                                    <h5 className="text-[10px] font-black text-text-dim uppercase tracking-wider">Configuración del Encabezado</h5>
                                    <div className="space-y-3">
                                        <LabeledField label="Título Principal del Certificado">
                                            <input
                                                type="text"
                                                value={(activeBlock.config as any)?.certificateTitle || ''}
                                                onChange={e => onUpdateConfig(activeBlock.id, 'certificateTitle', e.target.value)}
                                                className={inputCls}
                                                placeholder="CERTIFICADO DE COMPLETACIÓN"
                                            />
                                        </LabeledField>

                                        <LabeledField label="Subtítulo / Unidad Emisora">
                                            <input
                                                type="text"
                                                value={(activeBlock.config as any)?.certificateSubtitle || ''}
                                                onChange={e => onUpdateConfig(activeBlock.id, 'certificateSubtitle', e.target.value)}
                                                className={inputCls}
                                                placeholder="DIRECCIÓN DE INVESTIGACIÓN, DESARROLLO E INNOVACIÓN (DIITRA)"
                                            />
                                        </LabeledField>
                                    </div>
                                </div>
                            )}

                            {/* ── DESTINATARIO Y ROL DE CERTIFICADO ─────────────────────────── */}
                            {activeBlock.type === 'certificate_recipient_badge' && (
                                <div className="space-y-4 border-t border-border-thin/20 pt-4">
                                    <h5 className="text-[10px] font-black text-text-dim uppercase tracking-wider">Campos de Destinatario</h5>
                                    <p className="text-[10px] text-text-dim leading-relaxed">
                                        Estos campos se pueblan automáticamente desde la base de datos de docentes, estudiantes o miembros del grupo al emitir el certificado.
                                    </p>
                                </div>
                            )}

                            {/* ── CUERPO DEL CERTIFICADO ─────────────────────────────────────── */}
                            {activeBlock.type === 'certificate_body' && (
                                <div className="space-y-4 border-t border-border-thin/20 pt-4">
                                    <h5 className="text-[10px] font-black text-text-dim uppercase tracking-wider">Texto y Redacción del Logro</h5>
                                    <div className="space-y-3">
                                        <LabeledField label="Texto de Concesión / Logro">
                                            <textarea
                                                rows={3}
                                                value={(activeBlock.config as any)?.textAchievement || ''}
                                                onChange={e => onUpdateConfig(activeBlock.id, 'textAchievement', e.target.value)}
                                                className={inputCls}
                                                placeholder="Por haber culminado con éxito su participación..."
                                            />
                                        </LabeledField>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
