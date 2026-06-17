import React from 'react';
import { CoWorkField } from '../../../core/cowork/components/CoWorkField';
import type { CoWorkHandle } from '../../../core/cowork/types';

interface GeneralSectionProps {
    formData: any;
    cowork: CoWorkHandle;
    convocatorias: any[];
    carreras: any[];
    onUpdate: (field: string, value: any, meta?: { source?: 'local' | 'remote' | 'system' }) => void;
}

const isPastDeadline = (fechaCierre: string) => {
    if (!fechaCierre) return false;
    const deadline = new Date(fechaCierre);
    const now = new Date();
    if (isNaN(deadline.getTime())) return false;
    if (fechaCierre.length <= 10) {
        const [year, month, day] = fechaCierre.split('-').map(Number);
        const localDeadline = new Date(year, month - 1, day, 23, 59, 59, 999);
        return now > localDeadline;
    }
    return now > deadline;
};

export const GeneralSection: React.FC<GeneralSectionProps> = ({
    formData,
    cowork,
    convocatorias,
    carreras,
    onUpdate
}) => {
    return (
        <div className="space-y-5 sm:space-y-8 animate-fade-in pb-6 sm:pb-10">
            {/* Título del Proyecto */}
            <div className="grid grid-cols-1 gap-4 sm:gap-6">
                <CoWorkField 
                    name="Titulo" 
                    cowork={cowork} 
                    label="TEMA / NOMBRE DEL PROYECTO (ESCRIBIR EN MAYÚSCULAS)" 
                    onValueChange={(v, meta) => onUpdate('Titulo', v, meta)}
                    className="w-full bg-bg-deep border border-border-thin rounded-xl sm:rounded-2xl px-4 py-3 sm:px-6 sm:py-5 text-sm sm:text-lg font-black text-text-main placeholder:text-text-dim/30 focus:border-text-main outline-none transition-all uppercase" 
                />
            </div>

            {/* Fila 1: Director y Programa */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <CoWorkField 
                    name="DirectorProyecto" 
                    cowork={cowork} 
                    label="Director del Proyecto (Título abreviado, Apellidos y Nombres)" 
                    onValueChange={(v, meta) => onUpdate('DirectorProyecto', v, meta)}
                    className="w-full bg-bg-deep border border-border-thin rounded-lg sm:rounded-xl px-3.5 py-3 sm:px-5 sm:py-4 text-xs sm:text-sm font-bold text-text-main placeholder:text-text-dim/30 focus:border-text-main outline-none transition-all" 
                />
                <CoWorkField 
                    name="Programa" 
                    cowork={cowork} 
                    label="Programa" 
                    onValueChange={(v, meta) => onUpdate('Programa', v, meta)}
                    className="w-full bg-bg-deep border border-border-thin rounded-lg sm:rounded-xl px-3.5 py-3 sm:px-5 sm:py-4 text-xs sm:text-sm font-bold text-text-main placeholder:text-text-dim/30 focus:border-text-main outline-none transition-all" 
                />
            </div>

            {/* Fila 2: Grupo de Investigación */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6">
                <div className="md:col-span-4 space-y-1.5 sm:space-y-3">
                    <label className="block text-[10px] font-black text-text-dim uppercase tracking-widest ml-2">¿Grupo de Investigación?</label>
                    <select 
                        value={formData.GrupoInvestigacionTipo || 'NO'}
                        onChange={(e) => {
                            const tipo = e.target.value;
                            onUpdate('GrupoInvestigacionTipo', tipo);
                            if (tipo === 'NO') {
                                onUpdate('GrupoInvestigacionNombre', '', { source: 'system' });
                                onUpdate('GrupoInvestigacionUuid', '', { source: 'system' });
                                onUpdate('TieneGrupoInvestigacion', false, { source: 'system' });
                            } else {
                                onUpdate('TieneGrupoInvestigacion', true, { source: 'system' });
                            }
                        }}
                        className="w-full bg-bg-deep border border-border-thin rounded-lg sm:rounded-xl px-3.5 py-3 sm:px-5 sm:py-4 text-xs sm:text-sm text-text-main font-bold outline-none"
                    >
                        <option value="NO">NO</option>
                        <option value="SI">SI</option>
                    </select>
                </div>
                {formData.GrupoInvestigacionTipo === 'SI' && (
                    <div className="md:col-span-8">
                        <CoWorkField 
                            name="GrupoInvestigacionNombre" 
                            cowork={cowork} 
                            label="Nombre del Grupo de Investigación" 
                            onValueChange={(v, meta) => onUpdate('GrupoInvestigacionNombre', v, meta)}
                            className="w-full bg-bg-deep border border-border-thin rounded-lg sm:rounded-xl px-3.5 py-3 sm:px-5 sm:py-4 text-xs sm:text-sm font-bold text-text-main placeholder:text-text-dim/30 focus:border-text-main outline-none transition-all" 
                        />
                    </div>
                )}
            </div>

            {/* Fila 3: Dominio, Línea y Sublínea */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                <CoWorkField 
                    name="Dominio" 
                    cowork={cowork} 
                    label="Dominio Académico" 
                    onValueChange={(v, meta) => onUpdate('Dominio', v, meta)}
                    className="w-full bg-bg-deep border border-border-thin rounded-lg sm:rounded-xl px-3.5 py-3 sm:px-5 sm:py-4 text-xs sm:text-sm font-bold text-text-main placeholder:text-text-dim/30 focus:border-text-main outline-none transition-all" 
                />
                <CoWorkField 
                    name="LineaInvestigacion" 
                    cowork={cowork} 
                    label="Línea de Investigación" 
                    onValueChange={(v, meta) => onUpdate('LineaInvestigacion', v, meta)}
                    className="w-full bg-bg-deep border border-border-thin rounded-lg sm:rounded-xl px-3.5 py-3 sm:px-5 sm:py-4 text-xs sm:text-sm font-bold text-text-main placeholder:text-text-dim/30 focus:border-text-main outline-none transition-all" 
                />
                <CoWorkField 
                    name="SublineaInvestigacion" 
                    cowork={cowork} 
                    label="Sublínea de Investigación" 
                    onValueChange={(v, meta) => onUpdate('SublineaInvestigacion', v, meta)}
                    className="w-full bg-bg-deep border border-border-thin rounded-lg sm:rounded-xl px-3.5 py-3 sm:px-5 sm:py-4 text-xs sm:text-sm font-bold text-text-main placeholder:text-text-dim/30 focus:border-text-main outline-none transition-all" 
                />
            </div>

            {/* Fila 4: Tipo de Investigación */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6">
                <div className="md:col-span-2 space-y-1.5 sm:space-y-3">
                    <label className="block text-[10px] font-black text-text-dim uppercase tracking-widest ml-2">Tipo de Investigación</label>
                    <select 
                        value={formData.TipoInvestigacion || 'APLICADA'}
                        onChange={(e) => onUpdate('TipoInvestigacion', e.target.value)}
                        className="w-full bg-bg-deep border border-border-thin rounded-lg sm:rounded-xl px-3.5 py-3 sm:px-5 sm:py-4 text-xs sm:text-sm text-text-main font-bold outline-none"
                    >
                        <option value="BÁSICA">BÁSICA</option>
                        <option value="APLICADA">APLICADA</option>
                        <option value="DESARROLLO EXPERIMENTAL">DESARROLLO EXPERIMENTAL</option>
                    </select>
                </div>
                <div className="md:col-span-2">
                    <CoWorkField 
                        name="CampoAmplio" 
                        cowork={cowork} 
                        label="Campo Amplio" 
                        onValueChange={(v, meta) => onUpdate('CampoAmplio', v, meta)}
                        className="w-full bg-bg-deep border border-border-thin rounded-lg sm:rounded-xl px-3.5 py-3 sm:px-5 sm:py-4 text-xs sm:text-sm font-bold text-text-main placeholder:text-text-dim/30 focus:border-text-main outline-none transition-all" 
                    />
                </div>
            </div>

            {/* Fila 5: Campo Específico y Detallado */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <CoWorkField 
                    name="CampoEspecifico" 
                    cowork={cowork} 
                    label="Campo Específico" 
                    onValueChange={(v, meta) => onUpdate('CampoEspecifico', v, meta)}
                    className="w-full bg-bg-deep border border-border-thin rounded-lg sm:rounded-xl px-3.5 py-3 sm:px-5 sm:py-4 text-xs sm:text-sm font-bold text-text-main placeholder:text-text-dim/30 focus:border-text-main outline-none transition-all" 
                />
                <CoWorkField 
                    name="CampoDetallado" 
                    cowork={cowork} 
                    label="Campo Detallado" 
                    onValueChange={(v, meta) => onUpdate('CampoDetallado', v, meta)}
                    className="w-full bg-bg-deep border border-border-thin rounded-lg sm:rounded-xl px-3.5 py-3 sm:px-5 sm:py-4 text-xs sm:text-sm font-bold text-text-main placeholder:text-text-dim/30 focus:border-text-main outline-none transition-all" 
                />
            </div>

            {/* Fila 6: Carrera, Convocatoria, Periodo, Tiempo de Ejecución */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-1.5 sm:space-y-3">
                    <label className="block text-[10px] font-black text-text-dim uppercase tracking-widest ml-2">Carrera / Unidad</label>
                    <select 
                        value={formData.IdCarrera || 0}
                        onChange={(e) => onUpdate('IdCarrera', Number(e.target.value))}
                        className="w-full bg-bg-deep border border-border-thin rounded-lg sm:rounded-xl px-3.5 py-3 sm:px-5 sm:py-4 text-xs sm:text-sm text-text-main font-bold outline-none"
                    >
                        <option value={0}>Seleccione una carrera...</option>
                        {carreras.map(c => (
                            <option key={c.id_carrera} value={c.id_carrera}>{c.nombre_carrera}</option>
                        ))}
                    </select>
                </div>

                <div className="space-y-1.5 sm:space-y-3">
                    <label className="block text-[10px] font-black text-text-dim uppercase tracking-widest ml-2">Convocatoria Activa</label>
                    <select 
                        value={formData.IdConvocatoria || 0}
                        onChange={(e) => onUpdate('IdConvocatoria', Number(e.target.value))}
                        className="w-full bg-bg-deep border border-border-thin rounded-lg sm:rounded-xl px-3.5 py-3 sm:px-5 sm:py-4 text-xs sm:text-sm text-text-main font-bold outline-none"
                    >
                        <option value={0}>Seleccione una convocatoria...</option>
                        {convocatorias.map(c => {
                            const isExpired = isPastDeadline(c.fecha_cierre || c.fechaCierre);
                            const isCurrent = Number(c.id_convocatoria ?? c.idConvocatoria) === Number(formData.IdConvocatoria);
                            if (isExpired && !isCurrent) {
                                return null;
                            }
                            return (
                                <option key={c.id_convocatoria ?? c.idConvocatoria} value={c.id_convocatoria ?? c.idConvocatoria}>
                                    {c.codigo_convocatoria ?? c.codigoConvocatoria} - {c.titulo} {isExpired ? '(CERRADA)' : ''}
                                </option>
                            );
                        })}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <CoWorkField 
                    name="Periodo" 
                    cowork={cowork} 
                    label="Periodo Académico (Ej: MARZO 2025 - SEPTIEMBRE 2025)" 
                    onValueChange={(v, meta) => onUpdate('Periodo', v, meta)}
                    className="w-full bg-bg-deep border border-border-thin rounded-lg sm:rounded-xl px-3.5 py-3 sm:px-5 sm:py-4 text-xs sm:text-sm font-bold text-text-main" 
                />
                <CoWorkField 
                    name="TiempoEjecucion" 
                    cowork={cowork} 
                    label="Tiempo Estimado de Ejecución (Meses / Semanas)" 
                    onValueChange={(v, meta) => onUpdate('TiempoEjecucion', v, meta)}
                    className="w-full bg-bg-deep border border-border-thin rounded-lg sm:rounded-xl px-3.5 py-3 sm:px-5 sm:py-4 text-xs sm:text-sm font-bold text-text-main" 
                />
            </div>

            {/* Fila 7: Fechas Previstas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                <CoWorkField 
                    name="FechaPresentacion" 
                    cowork={cowork} 
                    label="Fecha Presentación (día/mes/año)" 
                    onValueChange={(v, meta) => onUpdate('FechaPresentacion', v, meta)}
                    className="w-full bg-bg-deep border border-border-thin rounded-lg sm:rounded-xl px-3.5 py-3 sm:px-5 sm:py-4 text-xs sm:text-sm font-bold text-text-main" 
                    placeholder="dd/mm/aaaa"
                />
                <CoWorkField 
                    name="FechaInicio" 
                    cowork={cowork} 
                    label="Fecha Prevista Inicio (día/mes/año)" 
                    onValueChange={(v, meta) => onUpdate('FechaInicio', v, meta)}
                    className="w-full bg-bg-deep border border-border-thin rounded-lg sm:rounded-xl px-3.5 py-3 sm:px-5 sm:py-4 text-xs sm:text-sm font-bold text-text-main" 
                    placeholder="dd/mm/aaaa"
                />
                <CoWorkField 
                    name="FechaFin" 
                    cowork={cowork} 
                    label="Fecha Prevista Fin (día/mes/año)" 
                    onValueChange={(v, meta) => onUpdate('FechaFin', v, meta)}
                    className="w-full bg-bg-deep border border-border-thin rounded-lg sm:rounded-xl px-3.5 py-3 sm:px-5 sm:py-4 text-xs sm:text-sm font-bold text-text-main" 
                    placeholder="dd/mm/aaaa"
                />
            </div>
        </div>
    );
};
