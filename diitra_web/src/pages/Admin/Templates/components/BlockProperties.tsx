import React from 'react';
import { Settings, Palette, Layout, Plus, Trash2 } from 'lucide-react';
import type { DocumentBlock, DocumentTemplateDto } from '../types';
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
                            <div>
                                <h4 className="font-bold text-xs text-text-main">{activeBlock.title}</h4>
                                <p className="text-[10px] text-text-dim mt-0.5 leading-normal capitalize">
                                    Tipo: <span className="text-text-main font-semibold">{activeBlock.type.replace('_', ' ')}</span>
                                </p>
                            </div>

                            {activeBlock.type === 'cover' && (() => {
                                const isFreeForm = activeBlock.config.coverLayoutMode !== 'zones';
                                const DEFAULT_POS: Record<string, { x: number; y: number }> = {
                                    institution: { x: 10, y: 4 },
                                    title: { x: 10, y: 35 },
                                    carrera: { x: 10, y: 70 },
                                    periodo: { x: 10, y: 80 },
                                };

                                const renderElementPanel = (
                                    label: string,
                                    showKey: string,
                                    xKey: string,
                                    yKey: string,
                                    alignKey: string,
                                    textKey: string,
                                    textPlaceholder: string,
                                    defPos: { x: number; y: number },
                                    colorKey?: string
                                ) => {
                                    const isVisible = (activeBlock.config as any)[showKey] !== false;
                                    const xVal: number = (activeBlock.config as any)[xKey] ?? defPos.x;
                                    const yVal: number = (activeBlock.config as any)[yKey] ?? defPos.y;
                                    const alignVal: string = (activeBlock.config as any)[alignKey] || 'center';
                                    const textVal: string = (activeBlock.config as any)[textKey] || '';
                                    const colorVal: string = colorKey ? ((activeBlock.config as any)[colorKey] || '#ffffff') : '#ffffff';

                                    return (
                                        <div key={showKey} className="border border-border-thin/40 rounded-lg p-3 bg-surface-hover/20 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[11px] font-bold text-text-main">{label}</span>
                                                <input
                                                    type="checkbox"
                                                    checked={isVisible}
                                                    onChange={e => onUpdateConfig(activeBlock.id, showKey, e.target.checked)}
                                                    className="w-4 h-4 accent-text-main rounded cursor-pointer"
                                                />
                                            </div>
                                            {isVisible && (
                                                <div className="space-y-2.5 pt-1 border-t border-border-thin/15">
                                                    <LabeledField label="Texto">
                                                        <input
                                                            type="text"
                                                            className={inputCls}
                                                            value={textVal}
                                                            onChange={e => onUpdateConfig(activeBlock.id, textKey, e.target.value)}
                                                            placeholder={textPlaceholder}
                                                        />
                                                    </LabeledField>
                                                    <LabeledField label="Alineacion">
                                                        <select
                                                            className={selectCls}
                                                            value={alignVal}
                                                            onChange={e => onUpdateConfig(activeBlock.id, alignKey, e.target.value)}
                                                        >
                                                            <option value="left">Izquierda</option>
                                                            <option value="center">Centro</option>
                                                            <option value="right">Derecha</option>
                                                        </select>
                                                    </LabeledField>
                                                    {colorKey && (
                                                        <LabeledField label="Color de Texto">
                                                            <div className="flex items-center gap-2">
                                                                <input
                                                                    type="color"
                                                                    value={colorVal.startsWith('#') ? colorVal : '#ffffff'}
                                                                    onChange={e => onUpdateConfig(activeBlock.id, colorKey, e.target.value)}
                                                                    className="w-7 h-7 rounded border border-border-thin p-0 cursor-pointer bg-transparent"
                                                                />
                                                                <input
                                                                    type="text"
                                                                    className={`${inputCls} font-mono text-[10px] uppercase w-24`}
                                                                    value={colorVal}
                                                                    onChange={e => onUpdateConfig(activeBlock.id, colorKey, e.target.value)}
                                                                    placeholder="#ffffff"
                                                                />
                                                                <div className="flex items-center gap-1 ml-auto">
                                                                    {['#ffffff', '#facc15', '#b8912e', '#1e2a4a', '#000000'].map(preset => (
                                                                        <button
                                                                            key={preset}
                                                                            type="button"
                                                                            onClick={() => onUpdateConfig(activeBlock.id, colorKey, preset)}
                                                                            className="w-4 h-4 rounded-full border border-black/20 transition-transform hover:scale-110 cursor-pointer"
                                                                            style={{ backgroundColor: preset }}
                                                                            title={preset}
                                                                        />
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </LabeledField>
                                                    )}
                                                    {isFreeForm && (
                                                        <div>
                                                            <div className="flex items-center justify-between mb-1.5">
                                                                <span className="text-[10px] font-bold text-text-dim uppercase tracking-wider">Posicion en Canvas</span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        onUpdateConfig(activeBlock.id, xKey, defPos.x);
                                                                        onUpdateConfig(activeBlock.id, yKey, defPos.y);
                                                                    }}
                                                                    className="text-[9px] text-indigo-500 hover:text-indigo-700 font-bold uppercase tracking-wide px-1.5 py-0.5 rounded hover:bg-indigo-50 transition-all cursor-pointer"
                                                                    title="Restablecer posicion por defecto"
                                                                >
                                                                    Reset
                                                                </button>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <div>
                                                                    <label className="text-[9px] text-text-dim font-mono block mb-0.5">X  {xVal.toFixed(1)}%</label>
                                                                    <input
                                                                        type="range"
                                                                        min={0} max={95} step={0.5}
                                                                        value={xVal}
                                                                        onChange={e => onUpdateConfig(activeBlock.id, xKey, parseFloat(e.target.value))}
                                                                        className="w-full h-1.5 rounded accent-indigo-600 cursor-pointer"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="text-[9px] text-text-dim font-mono block mb-0.5">Y  {yVal.toFixed(1)}%</label>
                                                                    <input
                                                                        type="range"
                                                                        min={0} max={97} step={0.5}
                                                                        value={yVal}
                                                                        onChange={e => onUpdateConfig(activeBlock.id, yKey, parseFloat(e.target.value))}
                                                                        className="w-full h-1.5 rounded accent-indigo-600 cursor-pointer"
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-2 mt-1.5">
                                                                <input
                                                                    type="number"
                                                                    min={0} max={95} step={0.5}
                                                                    value={xVal}
                                                                    onChange={e => onUpdateConfig(activeBlock.id, xKey, parseFloat(e.target.value))}
                                                                    className="text-[10px] font-mono border border-border-thin rounded px-1.5 py-0.5 bg-surface-hover text-text-main focus:outline-none w-full"
                                                                />
                                                                <input
                                                                    type="number"
                                                                    min={0} max={97} step={0.5}
                                                                    value={yVal}
                                                                    onChange={e => onUpdateConfig(activeBlock.id, yKey, parseFloat(e.target.value))}
                                                                    className="text-[10px] font-mono border border-border-thin rounded px-1.5 py-0.5 bg-surface-hover text-text-main focus:outline-none w-full"
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                };

                                return (
                                    <div className="space-y-5 border-t border-border-thin/20 pt-4">
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-bold text-text-main flex items-center gap-1.5 uppercase tracking-wider">
                                                <Layout className="w-3.5 h-3.5" />
                                                Modo de Composicion
                                            </label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {[
                                                    { value: 'freeform', label: 'Canvas Libre', desc: 'Arrastra a cualquier posicion' },
                                                    { value: 'zones', label: 'Zonas Fijas', desc: 'Superior / Medio / Inferior' },
                                                ].map(opt => (
                                                    <button
                                                        key={opt.value}
                                                        type="button"
                                                        onClick={() => onUpdateConfig(activeBlock.id, 'coverLayoutMode', opt.value)}
                                                        className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${(isFreeForm ? 'freeform' : 'zones') === opt.value
                                                            ? 'border-indigo-500 bg-indigo-50/30 text-text-main'
                                                            : 'border-border-thin/40 bg-surface-hover/10 text-text-dim hover:border-border-thin'
                                                            }`}
                                                    >
                                                        <div className="text-[10px] font-bold">{opt.label}</div>
                                                        <div className="text-[9px] opacity-70 mt-0.5">{opt.desc}</div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-bold text-text-main flex items-center gap-1.5 uppercase tracking-wider">
                                                <Palette className="w-3.5 h-3.5" />
                                                Color del Tema Visual
                                            </label>
                                            <div className="flex items-center gap-3 bg-surface border border-border-thin rounded-md p-2 w-max">
                                                {[
                                                    { name: 'Azul Traversari', hex: '#1e2a4a' },
                                                    { name: 'Dorado Acreditacion', hex: '#b8912e' },
                                                    { name: 'Gris Oscuro', hex: '#334155' },
                                                ].map(color => {
                                                    const isSel = activeBlock.config.colorTema === color.hex;
                                                    return (
                                                        <button
                                                            key={color.hex}
                                                            type="button"
                                                            onClick={() => onUpdateConfig(activeBlock.id, 'colorTema', color.hex)}
                                                            className={`relative w-6 h-6 rounded-full transition-all flex items-center justify-center cursor-pointer ${isSel
                                                                ? 'ring-2 ring-black dark:ring-white ring-offset-2 ring-offset-surface scale-105'
                                                                : 'hover:scale-105 opacity-80 hover:opacity-100'
                                                                }`}
                                                            title={color.name}
                                                        >
                                                            <div className="w-full h-full rounded-full border border-black/10" style={{ backgroundColor: color.hex }} />
                                                            {isSel && <span className="absolute w-1.5 h-1.5 rounded-full bg-white shadow-sm" />}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                        <div className="space-y-3 pt-2 border-t border-border-thin/20">
                                            <LabeledField label="Tipo de Documento (Titulo Superior)">
                                                <select
                                                    className={selectCls}
                                                    value={activeBlock.config.tituloSuperior || 'INFORME FINAL DEL PROYECTO DE INVESTIGACIÓN'}
                                                    onChange={e => {
                                                        const val = e.target.value;
                                                        onUpdateConfig(activeBlock.id, 'tituloSuperior', val);
                                                        if (val.includes('INFORME FINAL')) {
                                                            onUpdateConfig(activeBlock.id, 'colorTituloSuperior', 'gold');
                                                        }
                                                    }}
                                                >
                                                    <option value="INFORME FINAL DEL PROYECTO DE INVESTIGACIÓN">Informe Final del Proyecto de Investigación (Dorado / CACES)</option>
                                                    <option value="PROYECTO DE INVESTIGACIÓN">Proyecto de Investigación (Protocolo)</option>
                                                    <option value="INFORME DE AVANCE DE INVESTIGACIÓN">Informe de Avance de Investigación</option>
                                                    <option value="ACTA DE DICTAMEN DE ARBITRAJE">Acta de Dictamen de Arbitraje</option>
                                                    <option value="REPORTE DE ANALÍTICAS DE INVESTIGACIÓN">Reporte de Analíticas de Investigación</option>
                                                </select>
                                            </LabeledField>

                                            <LabeledField label="Color del Título Documental">
                                                <select
                                                    className={selectCls}
                                                    value={activeBlock.config.colorTituloSuperior || 'gold'}
                                                    onChange={e => onUpdateConfig(activeBlock.id, 'colorTituloSuperior', e.target.value)}
                                                >
                                                    <option value="gold">Dorado Acreditación (#b8912e / Itálica)</option>
                                                    <option value="white">Blanco Pulcro (#ffffff)</option>
                                                    <option value="navy">Azul Institucional (#1e2a4a)</option>
                                                    <option value="slate">Gris Neutro (#475569)</option>
                                                </select>
                                            </LabeledField>
                                        </div>

                                        <div className="space-y-3">
                                            <h5 className="text-[10px] font-black text-text-dim uppercase tracking-wider">Elementos de la Portada</h5>
                                            {renderElementPanel('Institución / Logo', 'showInstitution', 'xInstitution', 'yInstitution', 'alignInstitution', 'textoInstitucion', 'INSTITUTO TECNOLÓGICO SUPERIOR TRAVERSARI', DEFAULT_POS.institution, 'colorInstitution')}
                                            {renderElementPanel('Título de Portada (Edición Libre)', 'showTitle', 'xTitle', 'yTitle', 'alignTitle', 'tituloSuperior', 'INFORME FINAL DEL PROYECTO DE INVESTIGACIÓN', DEFAULT_POS.title, 'colorTituloSuperior')}
                                            {renderElementPanel('Carrera / Unidad', 'showCarrera', 'xCarrera', 'yCarrera', 'alignCarrera', 'carreraPorDefecto', 'TECNOLOGÍA SUPERIOR EN DESARROLLO DE SOFTWARE', DEFAULT_POS.carrera, 'colorCarrera')}
                                            {renderElementPanel('Periodo Académico', 'showPeriodo', 'xPeriodo', 'yPeriodo', 'alignPeriodo', 'periodoPorDefecto', 'PERIODO ACADÉMICO MARZO 2025 – SEPTIEMBRE 2025', DEFAULT_POS.periodo, 'colorPeriodo')}
                                        </div>
                                    </div>
                                );
                            })()}

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
                                    <LabeledField label="Estilo de Encabezado">
                                        <select className={selectCls}
                                            value={activeBlock.config.headerStyle || 'blue'}
                                            onChange={e => onUpdateConfig(activeBlock.id, 'headerStyle', e.target.value)}>
                                            {HEADER_STYLE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                        </select>
                                    </LabeledField>

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
                                                    const r = (activeBlock.config.rows ?? []).map(row => ({ cells: [...row.cells, ''] }));
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
                                                                const r = (activeBlock.config.rows ?? []).map(row => ({ cells: row.cells.filter((_, i) => i !== hIdx) }));
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
                                            {activeBlock.config.rows?.map((row, rIdx) => (
                                                <div key={rIdx} className="flex gap-1 items-center group/row">
                                                    {row.cells.map((cell, cIdx) => (
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
                                            ))}
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
                                    <div>
                                        <label className="text-[10px] font-semibold text-text-dim uppercase tracking-wider block mb-1">Color del Tema</label>
                                        <select
                                            value={activeBlock.config.finalReportHeaderColor || 'navy'}
                                            onChange={(e) => onUpdateConfig(activeBlock.id, 'finalReportHeaderColor', e.target.value)}
                                            className="w-full text-xs p-2 bg-bg-main border border-border-thin rounded-lg text-text-main"
                                        >
                                            <option value="navy">Azul Marino (Oficial ISTPET)</option>
                                            <option value="gold">Dorado Institucional</option>
                                            <option value="slate">Gris Oscuro</option>
                                        </select>
                                    </div>
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
                                    <div>
                                        <label className="text-[10px] font-semibold text-text-dim uppercase tracking-wider block mb-1">Color del Tema de Encabezados</label>
                                        <select
                                            value={activeBlock.config.writingHeaderColor || 'navy'}
                                            onChange={(e) => onUpdateConfig(activeBlock.id, 'writingHeaderColor', e.target.value)}
                                            className="w-full text-xs p-2 bg-bg-main border border-border-thin rounded-lg text-text-main"
                                        >
                                            <option value="navy">Azul Marino (Oficial ISTPET)</option>
                                            <option value="gold">Dorado Institucional</option>
                                            <option value="slate">Gris Oscuro</option>
                                            <option value="emerald">Verde Esmeralda</option>
                                        </select>
                                    </div>
                                    <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                                        <p className="text-xs font-semibold text-indigo-400">Sub-Secciones de Redacción Pre-Cargadas (15)</p>
                                        <p className="text-[10px] text-text-dim mt-1">Este bloque unificado administra automáticamente las 15 sub-secciones científicas con editores Tiptap colaborativos en tiempo real.</p>
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
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
