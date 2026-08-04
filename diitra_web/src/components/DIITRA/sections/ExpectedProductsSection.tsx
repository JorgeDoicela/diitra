import React, { useContext } from 'react';
import { Award, Trash2, Target, Layers, Tag, CheckCircle2, FileCheck, Hash, Calendar, ShieldCheck, Gauge } from 'lucide-react';
import type { CoWorkHandle } from '../../../core/cowork/types';
import { SectionBlockGuard } from '../SectionBlockGuard';
import { SectionGuardContext } from '../../../core/documents/context/DocumentDataContext';

interface ExpectedProductsSectionProps {
    productosEsperados?: any[];
    tiposProducto?: any[];
    cowork: CoWorkHandle;
    onAddProducto?: () => void;
    onRemoveProducto?: (index: number) => void;
    onUpdateProducto?: (index: number, field: string, value: any) => void;
    formData?: any;
    readOnly?: boolean;
    config?: any;
}

const TRL_OPTIONS = [
    { value: 'TRL 1', label: 'TRL 1: Principios básicos observados' },
    { value: 'TRL 2', label: 'TRL 2: Concepto / Aplicación tecnológica formulada' },
    { value: 'TRL 3', label: 'TRL 3: Prueba de concepto analítica / experimental' },
    { value: 'TRL 4', label: 'TRL 4: Prototipo funcional validado en laboratorio' },
    { value: 'TRL 5', label: 'TRL 5: Prototipo validado en entorno relevante' },
    { value: 'TRL 6', label: 'TRL 6: Modelo / Prototipo probado en entorno operativo real' },
    { value: 'TRL 7', label: 'TRL 7: Demostración de sistema en entorno operacional' },
    { value: 'TRL 8', label: 'TRL 8: Sistema completo y calificado' },
    { value: 'TRL 9', label: 'TRL 9: Sistema probado y transferido al sector productivo' },
];

const DEFAULT_IST_CATEGORIES = [
    { id: 'cat_idi', name: 'I+D+i Aplicada (Prototipos Funcionales, Modelos de Utilidad, Plantas Piloto)', shortName: 'I+D+i Aplicada' },
    { id: 'cat_senadi', name: 'Desarrollo de Software y Registro SENADI (Aplicaciones, Algoritmos, Derechos de Autor)', shortName: 'Software & SENADI' },
    { id: 'cat_transferencia', name: 'Transferencia Tecnológica y Vinculación (Manuales Técnicos, Guías, Kits)', shortName: 'Transferencia & Vinculación' },
    { id: 'cat_divulgacion', name: 'Divulgación Técnica y Publicaciones (Ponencias, Artículos Latindex, Guías)', shortName: 'Divulgación Técnica' },
    { id: 'cat_titulacion', name: 'Titulación & PIS (Proyectos Integradores de Saberes, Trabajos Prácticos)', shortName: 'Titulación & PIS' },
];

const SUBTYPES_BY_CATEGORY: Record<string, string[]> = {
    'cat_idi': [
        'Prototipo Funcional / Operativo',
        'Modelo de Utilidad (SENADI)',
        'Planta Piloto / Banco de Pruebas',
        'Diseño Industrial / Maqueta Operativa'
    ],
    'cat_senadi': [
        'Aplicación Web / Móvil con Registro SENADI',
        'Algoritmo / Sistema de Gestión',
        'Base de Datos Especializada',
        'Derecho de Autor de Software'
    ],
    'cat_transferencia': [
        'Manual Técnico de Operación / Mantenimiento',
        'Guía Metodológica / de Transferencia',
        'Kit Tecnológico / Didáctico',
        'Capacitación al Sector Productivo / Comunidad'
    ],
    'cat_divulgacion': [
        'Ponencia en Evento / Congreso Técnico',
        'Artículo Científico / Técnico (Latindex/Regional)',
        'Guía de Prácticas de Laboratorio'
    ],
    'cat_titulacion': [
        'Proyecto Integrador de Saberes (PIS)',
        'Trabajo Práctico de Titulación / Caso Técnico'
    ]
};

export const ExpectedProductsSection: React.FC<ExpectedProductsSectionProps> = ({
    productosEsperados = [],
    tiposProducto = [],
    cowork,
    onAddProducto,
    onRemoveProducto,
    onUpdateProducto,
    formData,
    readOnly = false,
    config
}) => {
    const title = config?.productosTitle || '5. Productos y Entregables Esperados';
    const { readOnly: blockReadOnly } = useContext(SectionGuardContext);
    const effectiveReadOnly = readOnly || blockReadOnly || cowork.session.readOnly;

    // Configuración de columnas activas en la plantilla
    const cols = config?.productColumns || {
        showCategory: true,
        showSubtype: true,
        showProductName: true,
        showSenadi: true,
        showTrl: true,
        showIndicator: true,
        showVerificationMeans: true,
        showQuantity: true,
        showDeadline: false,
    };

    // Categorías dinámicas o predeterminadas para IST
    const rawCategories = config?.productCategories || config?.categories;
    const categories: any[] = (Array.isArray(rawCategories) && rawCategories.length > 0)
        ? rawCategories.filter((cat: any) => cat.enabled !== false)
        : DEFAULT_IST_CATEGORIES;

    const listToRender: any[] = (productosEsperados && productosEsperados.length > 0)
        ? productosEsperados
        : (formData?.ProductosEsperados || []);

    const findCategoryObj = (catVal: string) => {
        if (!catVal) return DEFAULT_IST_CATEGORIES[0];
        const match = categories.find((c: any) => c.name === catVal || c.id === catVal || c.shortName === catVal);
        if (match) return match;
        if (catVal.includes('Científico') || catVal.includes('I+D') || catVal.includes('Prototipo')) return DEFAULT_IST_CATEGORIES[0];
        if (catVal.includes('Software') || catVal.includes('SENADI')) return DEFAULT_IST_CATEGORIES[1];
        if (catVal.includes('Vinculación') || catVal.includes('Transferencia')) return DEFAULT_IST_CATEGORIES[2];
        if (catVal.includes('Divulgación') || catVal.includes('Ponencia')) return DEFAULT_IST_CATEGORIES[3];
        if (catVal.includes('Titulación') || catVal.includes('PIS')) return DEFAULT_IST_CATEGORIES[4];
        return DEFAULT_IST_CATEGORIES[0];
    };

    const getAvailableSubtypes = (catObj: any) => {
        if (Array.isArray(catObj?.subtypes) && catObj.subtypes.length > 0) {
            return catObj.subtypes;
        }
        const catId = catObj?.id || '';
        const listFromCat = SUBTYPES_BY_CATEGORY[catId];
        if (listFromCat && listFromCat.length > 0) {
            return listFromCat;
        }
        return SUBTYPES_BY_CATEGORY['cat_idi'];
    };

    return (
        <SectionBlockGuard id="productos_esperados" title={title} showInlineLock={true}>
            <div className="space-y-6 animate-fade-in text-left">
                {/* Cabecera de Sección */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-thin/40">
                    <div>
                        <h4 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-text-main">
                            <Award size={16} className="text-brand" />
                            <span>{title}</span>
                        </h4>
                        <p className="text-[10px] text-text-dim mt-1 leading-relaxed">
                            Registre los entregables tecnológicos, prototipos, software, manuales e indicadores auditables para el CACES.
                        </p>
                    </div>
                    {!effectiveReadOnly && onAddProducto && (
                        <button
                            type="button"
                            onClick={onAddProducto}
                            className="px-4 py-2 bg-text-main text-bg-deep rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 shadow-md transition-all cursor-pointer shrink-0 flex items-center justify-center gap-1.5"
                        >
                            <span>+ Añadir Entregable</span>
                        </button>
                    )}
                </div>

                {/* Lista de Productos o Estado Vacío */}
                {listToRender.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-border-thin rounded-2xl bg-surface/30 space-y-3">
                        <Target size={28} className="mx-auto text-text-dim/40" />
                        <p className="text-xs font-bold text-text-main">Sin entregables registrados</p>
                        <p className="text-[10px] text-text-dim/70 max-w-sm mx-auto leading-relaxed">
                            Haga clic en "+ Añadir Entregable" para registrar los resultados de investigación aplicada del IST.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {listToRender.map((item: any, idx: number) => {
                            const rawCatVal = item.categoria || item.Category || '';
                            const catObj = findCategoryObj(rawCatVal);
                            const availableSubtypes = getAvailableSubtypes(catObj);

                            const subTypeName = item.tipo || item.subtipo || item.Tipo || availableSubtypes[0];
                            const nombreProd = item.titulo || item.nombre || item.Nombre || '';
                            const requiereSenadi = item.requiere_senadi ?? item.requiereSenadi ?? (catObj.id === 'cat_senadi');
                            const registroSenadi = item.registro_senadi || item.registroSenadi || '';
                            const trlLevel = item.trl || item.Trl || '';
                            const indicadorVal = item.indicador || item.Indicador || '';
                            const medioVal = item.medio_verificacion || item.medioVerificacion || item.MedioVerificacion || '';
                            const cantVal = item.cantidad ?? item.Cantidad ?? 1;
                            const plazoVal = item.plazo || item.Plazo || '';

                            // Determinar dinámicamente si aplica TRL y SENADI según la categoría
                            const isTechnicalOrSoftware = catObj.id === 'cat_idi' || catObj.id === 'cat_senadi';
                            const showTrlCond = cols.showTrl !== false && isTechnicalOrSoftware;
                            const showSenadiCond = cols.showSenadi !== false && (isTechnicalOrSoftware || requiereSenadi);

                            // Placeholders inteligentes según subtipo elegido
                            let indicadorPlaceholder = "Ej: 1 Prototipo funcional validado en taller o laboratorio";
                            let medioPlaceholder = "Ej: Certificado SENADI / Acta de entrega a comunidad / Enlace DSpace";

                            if (catObj.id === 'cat_senadi' || subTypeName.includes('Software') || subTypeName.includes('Web')) {
                                indicadorPlaceholder = "Ej: 1 Sistema de software operativo con Registro de Derecho de Autor SENADI";
                                medioPlaceholder = "Ej: Certificado de Depósito Legal SENADI / Repositorio Git Institucional";
                            } else if (catObj.id === 'cat_transferencia' || subTypeName.includes('Manual') || subTypeName.includes('Guía')) {
                                indicadorPlaceholder = "Ej: 1 Manual técnico de operación y mantenimiento aprobado";
                                medioPlaceholder = "Ej: Manual publicado en Repositorio DSpace / Acta de capacitación";
                            } else if (catObj.id === 'cat_titulacion' || subTypeName.includes('PIS')) {
                                indicadorPlaceholder = "Ej: 1 Informe final de Proyecto Integrador de Saberes sustentado";
                                medioPlaceholder = "Ej: Acta de defensa técnica / Archivo en Repositorio DSpace";
                            } else if (catObj.id === 'cat_divulgacion') {
                                indicadorPlaceholder = "Ej: 1 Ponencia presentada en congreso técnico nacional";
                                medioPlaceholder = "Ej: Certificado de ponente / Memoria digital del congreso";
                            }

                            return (
                                <div
                                    key={item.id || item.uuid || `prod_${idx}`}
                                    className="p-4 bg-surface border border-border-thin rounded-2xl shadow-xs hover:border-border-hover/80 transition-all space-y-4 relative group text-left"
                                >
                                    {/* Fila Superior: Badge # y Acción Eliminar */}
                                    <div className="flex items-center justify-between pb-2 border-b border-border-thin/30">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="w-5 h-5 rounded-full bg-brand/10 text-brand text-[10px] font-bold flex items-center justify-center font-mono shrink-0">
                                                #{idx + 1}
                                            </span>
                                            <span className="text-xs font-bold text-text-main truncate max-w-sm">
                                                {nombreProd || subTypeName || `Entregable Tecnológico #${idx + 1}`}
                                            </span>
                                            {showTrlCond && trlLevel && (
                                                <span className="px-2 py-0.5 rounded-full text-[8.5px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 font-mono">
                                                    {trlLevel}
                                                </span>
                                            )}
                                            {showSenadiCond && requiereSenadi && (
                                                <span className="px-2 py-0.5 rounded-full text-[8.5px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-1">
                                                    <ShieldCheck size={10} />
                                                    <span>SENADI</span>
                                                </span>
                                            )}
                                        </div>
                                        {!effectiveReadOnly && onRemoveProducto && (
                                            <button
                                                type="button"
                                                onClick={() => onRemoveProducto(idx)}
                                                className="text-text-dim hover:text-error p-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
                                                title="Eliminar entregable"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>

                                    {/* Categoría e Subtipo Contextual Filtrado */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {cols.showCategory !== false && (
                                            <div className="space-y-1">
                                                <label className="text-[9.5px] font-bold uppercase text-text-dim flex items-center gap-1">
                                                    <Layers size={11} className="text-brand-light" />
                                                    Familia / Categoría IST
                                                </label>
                                                <select
                                                    value={catObj.name}
                                                    onChange={(e) => {
                                                        if (!onUpdateProducto) return;
                                                        const newCatName = e.target.value;
                                                        onUpdateProducto(idx, 'categoria', newCatName);
                                                        const newCatObj = findCategoryObj(newCatName);
                                                        const newSubtypes = getAvailableSubtypes(newCatObj);
                                                        if (newSubtypes.length > 0) {
                                                            onUpdateProducto(idx, 'tipo', newSubtypes[0]);
                                                        }
                                                    }}
                                                    disabled={effectiveReadOnly}
                                                    className="w-full bg-bg-deep border border-border-thin rounded-xl px-3 py-2 text-xs text-text-main outline-none font-semibold focus:border-text-main transition-colors disabled:opacity-60 cursor-pointer"
                                                >
                                                    {categories.map((c: any) => (
                                                        <option key={c.id || c.name} value={c.name}>{c.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        {cols.showSubtype !== false && (
                                            <div className="space-y-1">
                                                <label className="text-[9.5px] font-bold uppercase text-text-dim flex items-center gap-1">
                                                    <Tag size={11} className="text-brand-light" />
                                                    Subtipo de Entregable
                                                </label>
                                                <select
                                                    value={subTypeName}
                                                    onChange={(e) => onUpdateProducto && onUpdateProducto(idx, 'tipo', e.target.value)}
                                                    disabled={effectiveReadOnly}
                                                    className="w-full bg-bg-deep border border-border-thin rounded-xl px-3 py-2 text-xs text-text-main outline-none font-semibold focus:border-text-main transition-colors disabled:opacity-60 cursor-pointer"
                                                >
                                                    {availableSubtypes.map(sub => (
                                                        <option key={sub} value={sub}>{sub}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </div>

                                    {/* Nombre o Descripción del Entregable */}
                                    {cols.showProductName !== false && (
                                        <div className="space-y-1">
                                            <label className="text-[9.5px] font-bold uppercase text-text-dim block">Nombre / Descripción del Entregable</label>
                                            <input
                                                type="text"
                                                value={nombreProd}
                                                onChange={(e) => onUpdateProducto && onUpdateProducto(idx, 'titulo', e.target.value)}
                                                disabled={effectiveReadOnly}
                                                placeholder={`Ej: ${subTypeName} aplicado a...`}
                                                className="w-full bg-bg-deep border border-border-thin rounded-xl px-3 py-2 text-xs text-text-main font-medium outline-none focus:border-text-main transition-colors disabled:opacity-60"
                                            />
                                        </div>
                                    )}

                                    {/* Propiedad Intelectual SENADI & Nivel TRL (MOSTRAR SOLO SI APLICA) */}
                                    {(showSenadiCond || showTrlCond) && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-surface-hover/30 border border-border-thin/40 rounded-xl">
                                            {showSenadiCond && (
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="checkbox"
                                                            id={`senadi_chk_${idx}`}
                                                            checked={requiereSenadi}
                                                            onChange={(e) => onUpdateProducto && onUpdateProducto(idx, 'requiere_senadi', e.target.checked)}
                                                            disabled={effectiveReadOnly}
                                                            className="w-3.5 h-3.5 text-text-main accent-text-main bg-surface border-border-thin rounded focus:ring-text-main cursor-pointer"
                                                        />
                                                        <label htmlFor={`senadi_chk_${idx}`} className="text-[10px] font-bold uppercase text-text-main cursor-pointer flex items-center gap-1">
                                                            <ShieldCheck size={12} className="text-emerald-500" />
                                                            Requiere Registro SENADI
                                                        </label>
                                                    </div>
                                                    {requiereSenadi && (
                                                        <input
                                                            type="text"
                                                            value={registroSenadi}
                                                            onChange={(e) => onUpdateProducto && onUpdateProducto(idx, 'registro_senadi', e.target.value)}
                                                            disabled={effectiveReadOnly}
                                                            placeholder="Nro. Trámite SENADI / Depósito Legal..."
                                                            className="w-full bg-bg-deep border border-border-thin rounded-lg px-2.5 py-1.5 text-[11px] text-text-main font-mono outline-none focus:border-text-main"
                                                        />
                                                    )}
                                                </div>
                                            )}

                                            {showTrlCond && (
                                                <div className="space-y-1">
                                                    <label className="text-[9.5px] font-bold uppercase text-text-dim flex items-center gap-1">
                                                        <Gauge size={11} className="text-amber-500" />
                                                        Madurez Tecnológica (TRL)
                                                    </label>
                                                    <select
                                                        value={trlLevel}
                                                        onChange={(e) => onUpdateProducto && onUpdateProducto(idx, 'trl', e.target.value)}
                                                        disabled={effectiveReadOnly}
                                                        className="w-full bg-bg-deep border border-border-thin rounded-xl px-2.5 py-1.5 text-[11px] text-text-main outline-none font-semibold focus:border-text-main transition-colors disabled:opacity-60 cursor-pointer"
                                                    >
                                                        <option value="">Seleccione nivel TRL...</option>
                                                        {TRL_OPTIONS.map(opt => (
                                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Indicadores CACES y Medios de Verificación */}
                                    {(cols.showIndicator !== false || cols.showVerificationMeans !== false) && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {cols.showIndicator !== false && (
                                                <div className="space-y-1">
                                                    <label className="text-[9.5px] font-bold uppercase text-text-dim flex items-center gap-1">
                                                        <CheckCircle2 size={11} className="text-emerald-500" />
                                                        Indicador Verificable CACES
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={indicadorVal}
                                                        onChange={(e) => onUpdateProducto && onUpdateProducto(idx, 'indicador', e.target.value)}
                                                        disabled={effectiveReadOnly}
                                                        placeholder={indicadorPlaceholder}
                                                        className="w-full bg-bg-deep border border-border-thin rounded-xl px-3 py-2 text-xs text-text-main font-medium outline-none focus:border-text-main transition-colors disabled:opacity-60"
                                                    />
                                                </div>
                                            )}

                                            {cols.showVerificationMeans !== false && (
                                                <div className="space-y-1">
                                                    <label className="text-[9.5px] font-bold uppercase text-text-dim flex items-center gap-1">
                                                        <FileCheck size={11} className="text-blue-500" />
                                                        Medio de Verificación Auditable
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={medioVal}
                                                        onChange={(e) => onUpdateProducto && onUpdateProducto(idx, 'medio_verificacion', e.target.value)}
                                                        disabled={effectiveReadOnly}
                                                        placeholder={medioPlaceholder}
                                                        className="w-full bg-bg-deep border border-border-thin rounded-xl px-3 py-2 text-xs text-text-main font-medium outline-none focus:border-text-main transition-colors disabled:opacity-60"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Cantidad y Plazo */}
                                    {(cols.showQuantity !== false || cols.showDeadline !== false) && (
                                        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-border-thin/20">
                                            {cols.showQuantity !== false && (
                                                <div className="w-32 space-y-1">
                                                    <label className="text-[9.5px] font-bold uppercase text-text-dim flex items-center gap-1">
                                                        <Hash size={11} className="text-text-dim" />
                                                        Cantidad
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        value={cantVal}
                                                        onChange={(e) => onUpdateProducto && onUpdateProducto(idx, 'cantidad', parseInt(e.target.value, 10) || 1)}
                                                        disabled={effectiveReadOnly}
                                                        className="w-full bg-bg-deep border border-border-thin rounded-xl px-3 py-2 text-xs text-text-main font-bold text-center outline-none focus:border-text-main transition-colors disabled:opacity-60"
                                                    />
                                                </div>
                                            )}

                                            {cols.showDeadline !== false && (
                                                <div className="flex-1 min-w-[160px] space-y-1">
                                                    <label className="text-[9.5px] font-bold uppercase text-text-dim flex items-center gap-1">
                                                        <Calendar size={11} className="text-text-dim" />
                                                        Plazo / Trimestre
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={plazoVal}
                                                        onChange={(e) => onUpdateProducto && onUpdateProducto(idx, 'plazo', e.target.value)}
                                                        disabled={effectiveReadOnly}
                                                        placeholder="Ej: Trimestre 4 (Mes 12)"
                                                        className="w-full bg-bg-deep border border-border-thin rounded-xl px-3 py-2 text-xs text-text-main font-medium outline-none focus:border-text-main transition-colors disabled:opacity-60"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </SectionBlockGuard>
    );
};
