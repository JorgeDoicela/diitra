import React from 'react';
import { BookOpen, Calendar, Users, Target, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import type { CoWorkHandle } from '../../../core/cowork/types';

interface FinalReportHeaderSectionProps {
    formData: any;
    cowork?: CoWorkHandle;
    onUpdate: (field: string, value: any, meta?: { source?: 'local' | 'remote' | 'system' }) => void;
    onAdd?: (listName: string, template: any) => void;
    onRemove?: (listName: string, index: number) => void;
    onUpdateItem?: (listName: string, index: number, field: string, value: any) => void;
    carreras?: any[];
    dominios?: any[];
    lineas?: any[];
    sublineas?: any[];
    config?: any;
    isAdmin?: boolean;
}

export const FinalReportHeaderSection: React.FC<FinalReportHeaderSectionProps> = ({
    formData = {},
    cowork,
    onUpdate,
    onAdd,
    onRemove,
    onUpdateItem,
    config = {}
}) => {
    const isReadOnly = cowork?.session?.readOnly;

    const showTipoInvestigacion = config?.showTipoInvestigacion !== false;
    const showAlcanceProyecto = config?.showAlcanceProyecto !== false;
    const showFechasProyecto = config?.showFechasProyecto !== false;
    const showTablaInvestigadores = config?.showTablaInvestigadores !== false;

    const investigadoresList = formData.Investigadores || formData.investigadores || [];

    const handleAddInvestigador = () => {
        if (onAdd) {
            onAdd('Investigadores', {
                Nombre: '',
                Cedula: '',
                Email: '',
                Telefono: '',
                Rol: 'INVESTIGADOR'
            });
        }
    };

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            {/* Cabecera de la Ficha Técnica */}
            <div className="bg-bg-card p-6 rounded-2xl text-text-main shadow-xs border border-border-thin relative overflow-hidden">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-500/10 text-indigo-500 rounded-xl border border-indigo-500/20">
                        <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-text-main">DATOS DEL PROYECTO DE INVESTIGACIÓN</h2>
                        <p className="text-xs text-text-dim">Ficha técnica institucional oficial para el Informe Final (ISTPET CACES 2026)</p>
                    </div>
                </div>
            </div>

            {/* 1. INFORMACIÓN GENERAL Y CLASIFICACIÓN */}
            <div className="bg-bg-card p-6 rounded-2xl border border-border-thin shadow-xs space-y-6">
                <h3 className="text-sm font-bold text-text-main uppercase tracking-wider flex items-center gap-2 border-b border-border-thin pb-3">
                    <BookOpen className="w-4 h-4 text-indigo-500" />
                    1. Identificación y Clasificación Institucional
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* TÍTULO DEL PROYECTO */}
                    <div className="md:col-span-2 space-y-1.5">
                        <label className="text-xs font-semibold text-text-dim">NOMBRE DEL PROYECTO:</label>
                        <input
                            type="text"
                            value={formData.Titulo || formData.titulo || ''}
                            onChange={(e) => onUpdate('Titulo', e.target.value)}
                            disabled={isReadOnly}
                            placeholder="Escribir o corregir nombre del proyecto..."
                            className="w-full text-xs p-3 bg-bg-main border border-border-thin rounded-xl text-text-main focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                        />
                    </div>

                    {/* PROGRAMA DE INVESTIGACIÓN */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-text-dim">PROGRAMA DE INVESTIGACIÓN:</label>
                        <input
                            type="text"
                            value={formData.Programa || formData.programa || ''}
                            onChange={(e) => onUpdate('Programa', e.target.value)}
                            disabled={isReadOnly}
                            placeholder="Escribir programa de investigación..."
                            className="w-full text-xs p-3 bg-bg-main border border-border-thin rounded-xl text-text-main focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        />
                    </div>

                    {/* GRUPO DE INVESTIGACIÓN */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-text-dim">GRUPO DE INVESTIGACIÓN:</label>
                        <input
                            type="text"
                            value={formData.GrupoInvestigacionNombre || formData.grupo_investigacion_nombre || ''}
                            onChange={(e) => onUpdate('GrupoInvestigacionNombre', e.target.value)}
                            disabled={isReadOnly}
                            placeholder="Nombre del grupo de investigación..."
                            className="w-full text-xs p-3 bg-bg-main border border-border-thin rounded-xl text-text-main focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        />
                    </div>

                    {/* DOMINIO ACADÉMICO */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-text-dim">DOMINIO INSTITUCIONAL:</label>
                        <input
                            type="text"
                            value={formData.Dominio || formData.dominio || ''}
                            onChange={(e) => onUpdate('Dominio', e.target.value)}
                            disabled={isReadOnly}
                            placeholder="Dominio de investigación..."
                            className="w-full text-xs p-3 bg-bg-main border border-border-thin rounded-xl text-text-main focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        />
                    </div>

                    {/* LÍNEA DE INVESTIGACIÓN */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-text-dim">LÍNEA DE INVESTIGACIÓN:</label>
                        <input
                            type="text"
                            value={formData.LineaInvestigacion || formData.linea_investigacion || ''}
                            onChange={(e) => onUpdate('LineaInvestigacion', e.target.value)}
                            disabled={isReadOnly}
                            placeholder="Línea de investigación principal..."
                            className="w-full text-xs p-3 bg-bg-main border border-border-thin rounded-xl text-text-main focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        />
                    </div>

                    {/* SUBLÍNEA DE INVESTIGACIÓN */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-text-dim">SUBLÍNEA DE INVESTIGACIÓN:</label>
                        <input
                            type="text"
                            value={formData.SublineaInvestigacion || formData.sublinea_investigacion || ''}
                            onChange={(e) => onUpdate('SublineaInvestigacion', e.target.value)}
                            disabled={isReadOnly}
                            placeholder="Sublínea específica..."
                            className="w-full text-xs p-3 bg-bg-main border border-border-thin rounded-xl text-text-main focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        />
                    </div>

                    {/* CARRERA VINCULADA */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-text-dim">CARRERA / UNIDAD ACADÉMICA:</label>
                        <input
                            type="text"
                            value={formData.Carrera || formData.carrera || ''}
                            onChange={(e) => onUpdate('Carrera', e.target.value)}
                            disabled={isReadOnly}
                            placeholder="Tecnología Superior en..."
                            className="w-full text-xs p-3 bg-bg-main border border-border-thin rounded-xl text-text-main focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        />
                    </div>

                    {/* PERÍODO ACADÉMICO */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-text-dim">PERÍODO ACADÉMICO:</label>
                        <input
                            type="text"
                            value={formData.Periodo || formData.periodo || ''}
                            onChange={(e) => onUpdate('Periodo', e.target.value)}
                            disabled={isReadOnly}
                            placeholder="Ej: MARZO 2025 - SEPTIEMBRE 2025"
                            className="w-full text-xs p-3 bg-bg-main border border-border-thin rounded-xl text-text-main focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        />
                    </div>

                    {/* CAMPOS CACES */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-text-dim">CAMPO AMPLIO CACES:</label>
                        <input
                            type="text"
                            value={formData.CampoAmplio || formData.campo_amplio || ''}
                            onChange={(e) => onUpdate('CampoAmplio', e.target.value)}
                            disabled={isReadOnly}
                            placeholder="Campo amplio CACES..."
                            className="w-full text-xs p-3 bg-bg-main border border-border-thin rounded-xl text-text-main focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-text-dim">CAMPO ESPECÍFICO CACES:</label>
                        <input
                            type="text"
                            value={formData.CampoEspecifico || formData.campo_especifico || ''}
                            onChange={(e) => onUpdate('CampoEspecifico', e.target.value)}
                            disabled={isReadOnly}
                            placeholder="Campo específico CACES..."
                            className="w-full text-xs p-3 bg-bg-main border border-border-thin rounded-xl text-text-main focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        />
                    </div>

                    <div className="md:col-span-2 space-y-1.5">
                        <label className="text-xs font-semibold text-text-dim">CAMPO DETALLADO CACES:</label>
                        <input
                            type="text"
                            value={formData.CampoDetallado || formData.campo_detallado || ''}
                            onChange={(e) => onUpdate('CampoDetallado', e.target.value)}
                            disabled={isReadOnly}
                            placeholder="Campo detallado CACES..."
                            className="w-full text-xs p-3 bg-bg-main border border-border-thin rounded-xl text-text-main focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        />
                    </div>

                    {/* TIPO DE INVESTIGACIÓN (BÁSICA / APLICADA / EXPERIMENTAL) */}
                    {showTipoInvestigacion && (
                        <div className="md:col-span-2 space-y-2 pt-3 border-t border-border-thin/20">
                            <label className="text-xs font-semibold text-text-dim">TIPO DE INVESTIGACIÓN (X):</label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {[
                                    { value: 'BASICA', label: 'BÁSICA ()' },
                                    { value: 'APLICADA', label: 'APLICADA (X)' },
                                    { value: 'DESARROLLO_EXPERIMENTAL', label: 'DESARROLLO EXPERIMENTAL ()' }
                                ].map((item) => {
                                    const selected = (formData.TipoInvestigacion || formData.tipo_investigacion || 'APLICADA') === item.value;
                                    return (
                                        <button
                                            type="button"
                                            key={item.value}
                                            disabled={isReadOnly}
                                            onClick={() => onUpdate('TipoInvestigacion', item.value)}
                                            className={`p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                                                selected
                                                    ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400 shadow-xs'
                                                    : 'bg-bg-main border-border-thin text-text-dim hover:border-indigo-500/40'
                                            }`}
                                        >
                                            <span>{item.label}</span>
                                            {selected && <CheckCircle2 className="w-4 h-4 text-indigo-500" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 2. ALCANCE DEL PROYECTO (X) */}
            {showAlcanceProyecto && (
                <div className="bg-bg-card p-6 rounded-2xl border border-border-thin shadow-xs space-y-4">
                    <h3 className="text-sm font-bold text-text-main uppercase tracking-wider flex items-center gap-2 border-b border-border-thin pb-3">
                        <Target className="w-4 h-4 text-indigo-500" />
                        2. Alcance del Proyecto (X)
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        {[
                            { value: 'INSTITUCIONAL', label: 'INSTITUCIONAL' },
                            { value: 'PARROQUIAL', label: 'PARROQUIAL' },
                            { value: 'CANTONAL', label: 'CANTONAL' },
                            { value: 'PROVINCIAL_NACIONAL', label: 'PROVINCIAL / NACIONAL' }
                        ].map((item) => {
                            const selected = (formData.AlcanceProyecto || formData.alcance_proyecto || 'INSTITUCIONAL') === item.value;
                            return (
                                <button
                                    type="button"
                                    key={item.value}
                                    disabled={isReadOnly}
                                    onClick={() => onUpdate('AlcanceProyecto', item.value)}
                                    className={`p-3 rounded-xl border text-xs font-bold text-center transition-all flex items-center justify-between cursor-pointer ${
                                        selected
                                            ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400 shadow-xs'
                                            : 'bg-bg-main border-border-thin text-text-dim hover:border-indigo-500/40'
                                    }`}
                                >
                                    <span>{item.label}</span>
                                    {selected && <CheckCircle2 className="w-4 h-4 text-indigo-500" />}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* 3. FECHAS Y PLAZOS DEL PROYECTO */}
            {showFechasProyecto && (
                <div className="bg-bg-card p-6 rounded-2xl border border-border-thin shadow-xs space-y-4">
                    <h3 className="text-sm font-bold text-text-main uppercase tracking-wider flex items-center gap-2 border-b border-border-thin pb-3">
                        <Calendar className="w-4 h-4 text-indigo-500" />
                        3. Cuadro de Fechas y Plazos
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-semibold text-text-dim uppercase">FECHA PRESENTACIÓN:</label>
                            <input
                                type="text"
                                value={formData.FechaPresentacion || formData.fecha_presentacion || ''}
                                onChange={(e) => onUpdate('FechaPresentacion', e.target.value)}
                                disabled={isReadOnly}
                                placeholder="DD/MM/AAAA"
                                className="w-full text-xs p-3 bg-bg-main border border-border-thin rounded-xl text-text-main focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-semibold text-text-dim uppercase">FECHA INICIO:</label>
                            <input
                                type="text"
                                value={formData.FechaInicio || formData.fecha_inicio || ''}
                                onChange={(e) => onUpdate('FechaInicio', e.target.value)}
                                disabled={isReadOnly}
                                placeholder="DD/MM/AAAA"
                                className="w-full text-xs p-3 bg-bg-main border border-border-thin rounded-xl text-text-main focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-semibold text-text-dim uppercase">FECHA FIN PRESENTADA:</label>
                            <input
                                type="text"
                                value={formData.FechaFinPresentada || formData.fecha_fin_presentada || ''}
                                onChange={(e) => onUpdate('FechaFinPresentada', e.target.value)}
                                disabled={isReadOnly}
                                placeholder="DD/MM/AAAA"
                                className="w-full text-xs p-3 bg-bg-main border border-border-thin rounded-xl text-text-main focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-semibold text-text-dim uppercase">FECHA FIN REAL:</label>
                            <input
                                type="text"
                                value={formData.FechaFinReal || formData.fecha_fin_real || ''}
                                onChange={(e) => onUpdate('FechaFinReal', e.target.value)}
                                disabled={isReadOnly}
                                placeholder="DD/MM/AAAA"
                                className="w-full text-xs p-3 bg-bg-main border border-border-thin rounded-xl text-text-main focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* 4. INVESTIGADORES ACTIVOS EN EL PERÍODO */}
            {showTablaInvestigadores && (
                <div className="bg-bg-card p-6 rounded-2xl border border-border-thin shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-border-thin pb-3">
                        <h3 className="text-sm font-bold text-text-main uppercase tracking-wider flex items-center gap-2">
                            <Users className="w-4 h-4 text-indigo-500" />
                            4. Equipo de Investigadores Activos
                        </h3>
                        {!isReadOnly && onAdd && (
                            <button
                                type="button"
                                onClick={handleAddInvestigador}
                                className="px-3 py-1.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl text-xs font-bold hover:bg-indigo-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Agregar Investigador
                            </button>
                        )}
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-xs">
                            <thead>
                                <tr className="bg-bg-main border-b border-border-thin text-text-dim font-bold text-left uppercase text-[10px]">
                                    <th className="p-3">Nombre</th>
                                    <th className="p-3">Cédula</th>
                                    <th className="p-3">Email</th>
                                    <th className="p-3">Teléfono</th>
                                    <th className="p-3">Rol</th>
                                    {!isReadOnly && <th className="p-3 w-10 text-center">Acciones</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {investigadoresList.length > 0 ? (
                                    investigadoresList.map((inv: any, idx: number) => (
                                        <tr key={idx} className="border-b border-border-thin/20 hover:bg-bg-main/50 transition-colors">
                                            <td className="p-2">
                                                <input
                                                    type="text"
                                                    value={inv.Nombre || inv.nombre || ''}
                                                    onChange={(e) => onUpdateItem && onUpdateItem('Investigadores', idx, 'Nombre', e.target.value)}
                                                    disabled={isReadOnly}
                                                    placeholder="Nombre completo"
                                                    className="w-full p-2 bg-bg-main border border-border-thin rounded-lg text-xs"
                                                />
                                            </td>
                                            <td className="p-2">
                                                <input
                                                    type="text"
                                                    value={inv.Cedula || inv.cedula || ''}
                                                    onChange={(e) => onUpdateItem && onUpdateItem('Investigadores', idx, 'Cedula', e.target.value)}
                                                    disabled={isReadOnly}
                                                    placeholder="Cédula"
                                                    className="w-full p-2 bg-bg-main border border-border-thin rounded-lg text-xs"
                                                />
                                            </td>
                                            <td className="p-2">
                                                <input
                                                    type="text"
                                                    value={inv.Email || inv.email || ''}
                                                    onChange={(e) => onUpdateItem && onUpdateItem('Investigadores', idx, 'Email', e.target.value)}
                                                    disabled={isReadOnly}
                                                    placeholder="correo@istpet.edu.ec"
                                                    className="w-full p-2 bg-bg-main border border-border-thin rounded-lg text-xs"
                                                />
                                            </td>
                                            <td className="p-2">
                                                <input
                                                    type="text"
                                                    value={inv.Telefono || inv.telefono || ''}
                                                    onChange={(e) => onUpdateItem && onUpdateItem('Investigadores', idx, 'Telefono', e.target.value)}
                                                    disabled={isReadOnly}
                                                    placeholder="099..."
                                                    className="w-full p-2 bg-bg-main border border-border-thin rounded-lg text-xs"
                                                />
                                            </td>
                                            <td className="p-2">
                                                <select
                                                    value={inv.Rol || inv.rol || 'INVESTIGADOR'}
                                                    onChange={(e) => onUpdateItem && onUpdateItem('Investigadores', idx, 'Rol', e.target.value)}
                                                    disabled={isReadOnly}
                                                    className="w-full p-2 bg-bg-main border border-border-thin rounded-lg text-xs font-medium"
                                                >
                                                    <option value="DIRECTOR">DIRECTOR DE PROYECTO</option>
                                                    <option value="INVESTIGADOR">INVESTIGADOR DOCENTE</option>
                                                    <option value="COINVESTIGADOR">CO-INVESTIGADOR</option>
                                                </select>
                                            </td>
                                            {!isReadOnly && onRemove && (
                                                <td className="p-2 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => onRemove('Investigadores', idx)}
                                                        className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                                                        title="Eliminar fila"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="p-4 text-center text-text-dim italic">
                                            No hay investigadores agregados en esta ficha. Presiona "Agregar Investigador".
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};
