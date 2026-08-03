import React, { useContext } from 'react';
import { Award, Trash2, Shield, Link2, Target, Calendar } from 'lucide-react';
import { CoWorkField } from '../../../core/cowork/components/CoWorkField';
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
    const title = config?.productosTitle || '5. Productos Esperados';
    const { readOnly: blockReadOnly } = useContext(SectionGuardContext);
    const effectiveReadOnly = readOnly || blockReadOnly;

    // Obtener configuración de columnas desde la plantilla (con defaults CACES)
    const cols = config?.productColumns || {
        showCategory: true,
        showSubtype: true,
        showProductName: true,
        showIndicator: true,
        showVerificationMeans: true,
        showQuantity: true,
        showDeadline: false,
    };

    // Obtener categorías dinámicas de la plantilla
    const rawCategories = config?.productCategories || config?.categories;
    const categories: any[] = (Array.isArray(rawCategories) && rawCategories.length > 0)
        ? rawCategories.filter((cat: any) => cat.enabled !== false)
        : [
            { id: 'cat_cientifico', name: 'Productos Científico-Tecnológicos' },
            { id: 'cat_rrhh', name: 'Formación de Recursos Humanos' },
            { id: 'cat_divulgacion', name: 'Divulgación y Vinculación' },
            { id: 'cat_senadi', name: 'Propiedad Intelectual / SENADI' },
        ];

    const listToRender = (productosEsperados && productosEsperados.length > 0)
        ? productosEsperados
        : (formData?.ProductosEsperados || []);

    const isDetailedMode = cols.showProductName || cols.showIndicator || cols.showVerificationMeans || cols.showCategory;

    return (
        <SectionBlockGuard id="productos_esperados" title={title} showInlineLock={true}>
            <div className="space-y-6 animate-fade-in text-left">
                <div className="flex justify-between items-center px-2">
                    <div>
                        <h4 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-text-main">
                            <Award size={18} className="text-brand" /> {title}
                        </h4>
                        <p className="text-[10px] text-text-dim mt-0.5">
                            {isDetailedMode
                                ? 'Especifique los productos, entregables, indicadores y medios de verificación planificados.'
                                : 'Seleccione los tipos de producto y especifique la cantidad proyectada.'}
                        </p>
                    </div>
                    {!effectiveReadOnly && onAddProducto && (
                        <button
                            type="button"
                            onClick={onAddProducto}
                            className="px-4 py-2 bg-text-main text-bg-deep rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 shadow-md transition-all cursor-pointer shrink-0"
                        >
                            + Añadir Producto
                        </button>
                    )}
                </div>

                {listToRender.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-border-thin rounded-2xl bg-surface/30 space-y-2">
                        <Target size={24} className="mx-auto text-text-dim/40" />
                        <p className="text-xs font-bold text-text-dim">Sin productos esperados registrados</p>
                        <p className="text-[10px] text-text-dim/70 max-w-sm mx-auto">
                            Haga clic en "+ Añadir Producto" para agregar los entregables planificados para la evaluación de este proyecto.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {listToRender.map((_p: any, i: number) => {
                            const prodId = _p.id || i;
                            return (
                                <div key={prodId} className="p-4 bg-surface border border-border-thin rounded-2xl shadow-xs hover:border-border-hover transition-all relative group space-y-4">
                                    <div className="flex justify-between items-center border-b border-border-thin/30 pb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="w-5 h-5 rounded-full bg-brand/10 text-brand text-[10px] font-bold flex items-center justify-center font-mono">
                                                #{i + 1}
                                            </span>
                                            <span className="text-xs font-bold text-text-main">
                                                {_p.titulo || _p.nombre || _p.tipo || `Producto ${i + 1}`}
                                            </span>
                                        </div>
                                        {!effectiveReadOnly && onRemoveProducto && (
                                            <button
                                                type="button"
                                                onClick={() => onRemoveProducto(i)}
                                                className="text-text-dim hover:text-error p-1 rounded-lg transition-colors cursor-pointer"
                                                title="Eliminar producto"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        )}
                                    </div>

                                    {/* Fila 1: Categoría y Subtipo / Tipo de Producto */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {cols.showCategory !== false && (
                                            <div className="space-y-1">
                                                <label className="text-[9.5px] font-bold uppercase text-text-dim block">Categoría del Producto</label>
                                                <select
                                                    value={_p.categoria || ''}
                                                    onChange={(e) => onUpdateProducto && onUpdateProducto(i, 'categoria', e.target.value)}
                                                    disabled={effectiveReadOnly || cowork.session.readOnly}
                                                    className="w-full bg-bg-deep border border-border-thin rounded-xl px-3 py-2 text-xs text-text-main outline-none font-semibold focus:border-text-main transition-colors disabled:opacity-60"
                                                >
                                                    <option value="">Seleccione categoría...</option>
                                                    {categories.map((c: any) => (
                                                        <option key={c.id || c.name} value={c.name}>{c.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        {cols.showSubtype !== false && (
                                            <div className="space-y-1">
                                                <label className="text-[9.5px] font-bold uppercase text-text-dim block">Subtipo / Entregable</label>
                                                <select
                                                    value={_p.tipo || ''}
                                                    onChange={(e) => onUpdateProducto && onUpdateProducto(i, 'tipo', e.target.value)}
                                                    disabled={effectiveReadOnly || cowork.session.readOnly}
                                                    className="w-full bg-bg-deep border border-border-thin rounded-xl px-3 py-2 text-xs text-text-main outline-none font-semibold focus:border-text-main transition-colors disabled:opacity-60"
                                                >
                                                    <option value="">Seleccione tipo...</option>
                                                    {tiposProducto.map(t => (
                                                        <option key={t.id_tipo_producto || t.idTipoProducto || t.nombre} value={t.nombre}>{t.nombre}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </div>

                                    {/* Fila 2: Nombre del Producto (si está activo) */}
                                    {cols.showProductName !== false && (
                                        <div className="space-y-1">
                                            <CoWorkField
                                                name={`Prod_${prodId}_titulo`}
                                                cowork={cowork}
                                                label="Nombre / Título del Producto"
                                                onValueChange={(v) => onUpdateProducto && onUpdateProducto(i, 'titulo', v)}
                                                readOnly={effectiveReadOnly}
                                                placeholder="Ej: Análisis comparativo de algoritmos de Deep Learning en la nube..."
                                                className="w-full bg-bg-deep border border-border-thin rounded-xl px-3 py-2 text-xs text-text-main font-medium"
                                            />
                                        </div>
                                    )}

                                    {/* Fila 3: Indicador Verificable y Medio de Verificación */}
                                    {(cols.showIndicator !== false || cols.showVerificationMeans !== false) && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {cols.showIndicator !== false && (
                                                <CoWorkField
                                                    name={`Prod_${prodId}_indicador`}
                                                    cowork={cowork}
                                                    label="Indicador Verificable"
                                                    onValueChange={(v) => onUpdateProducto && onUpdateProducto(i, 'indicador', v)}
                                                    readOnly={effectiveReadOnly}
                                                    placeholder="Ej: 1 Artículo Aceptado en Revista Indexada Scopus Q1/Q2"
                                                    className="w-full bg-bg-deep border border-border-thin rounded-xl px-3 py-2 text-xs text-text-main font-medium"
                                                />
                                            )}

                                            {cols.showVerificationMeans !== false && (
                                                <CoWorkField
                                                    name={`Prod_${prodId}_medio_verificacion`}
                                                    cowork={cowork}
                                                    label="Medio de Verificación"
                                                    onValueChange={(v) => onUpdateProducto && onUpdateProducto(i, 'medio_verificacion', v)}
                                                    readOnly={effectiveReadOnly}
                                                    placeholder="Ej: Carta de Aceptación del Editor / Enlace DOI / Acta SENADI"
                                                    className="w-full bg-bg-deep border border-border-thin rounded-xl px-3 py-2 text-xs text-text-main font-medium"
                                                />
                                            )}
                                        </div>
                                    )}

                                    {/* Fila 4: Cantidad y Plazo */}
                                    <div className="flex flex-wrap items-center gap-4 pt-1 border-t border-border-thin/20">
                                        {cols.showQuantity !== false && (
                                            <div className="w-32">
                                                <CoWorkField
                                                    name={`Prod_${prodId}_cant`}
                                                    cowork={cowork}
                                                    label="Cantidad"
                                                    onValueChange={(v) => onUpdateProducto && onUpdateProducto(i, 'cantidad', v)}
                                                    readOnly={effectiveReadOnly}
                                                    className="w-full bg-bg-deep border border-border-thin rounded-xl px-3 py-2 text-xs font-bold text-center"
                                                />
                                            </div>
                                        )}

                                        {cols.showDeadline !== false && (
                                            <div className="flex-1 min-w-[140px]">
                                                <CoWorkField
                                                    name={`Prod_${prodId}_plazo`}
                                                    cowork={cowork}
                                                    label="Plazo / Trimestre"
                                                    onValueChange={(v) => onUpdateProducto && onUpdateProducto(i, 'plazo', v)}
                                                    readOnly={effectiveReadOnly}
                                                    placeholder="Ej: Trimestre 4 (Mes 12)"
                                                    className="w-full bg-bg-deep border border-border-thin rounded-xl px-3 py-2 text-xs font-medium"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </SectionBlockGuard>
    );
};

