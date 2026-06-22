import React from 'react';
import { CoWorkField } from '../../../core/cowork/components/CoWorkField';
import type { CoWorkHandle } from '../../../core/cowork/types';

interface GeneralSectionProps {
    formData: any;
    cowork: CoWorkHandle;
    convocatorias: any[];
    carreras: any[];
    groups?: any[];
    dominios?: any[];
    lineas?: any[];
    sublineas?: any[];
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
    groups = [],
    dominios = [],
    lineas = [],
    sublineas = [],
    onUpdate
}) => {
    // Filter active and approved research groups
    const approvedGroups = React.useMemo(() => {
        return groups.filter((g: any) => g.activo && g.estado === 'Aprobado');
    }, [groups]);

    // Find the currently selected group object in the list
    const selectedGroup = React.useMemo(() => {
        if (formData.GrupoInvestigacionTipo !== 'SI') return null;
        return approvedGroups.find((g: any) => 
            (g.uuid && g.uuid === formData.GrupoInvestigacionUuid) ||
            (g.nombre && g.nombre === formData.GrupoInvestigacionNombre)
        ) || null;
    }, [formData.GrupoInvestigacionUuid, formData.GrupoInvestigacionNombre, formData.GrupoInvestigacionTipo, approvedGroups]);

    // Available lines of investigation based on selected group or global lines
    const availableLines = React.useMemo(() => {
        if (formData.GrupoInvestigacionTipo === 'SI' && selectedGroup) {
            const groupLineIds = selectedGroup.lineas_ids || selectedGroup.lineasIds || [];
            return lineas.filter((l: any) => groupLineIds.includes(l.id ?? l.idLinea));
        }
        return lineas;
    }, [formData.GrupoInvestigacionTipo, selectedGroup, lineas]);

    // Find currently selected research line object in the list
    const selectedLine = React.useMemo(() => {
        return lineas.find((l: any) => 
            l.nombre === formData.LineaInvestigacion || 
            l.nombreLinea === formData.LineaInvestigacion
        ) || null;
    }, [formData.LineaInvestigacion, lineas]);

    // Available sublines of investigation based on the selected research line
    const availableSublines = React.useMemo(() => {
        if (!selectedLine) return [];
        const lineId = selectedLine.id ?? selectedLine.idLinea;
        return sublineas.filter((s: any) => (s.id_linea ?? s.idLinea) === lineId);
    }, [selectedLine, sublineas]);

    // Validar fechas del proyecto en tiempo real (presentación, inicio, fin)
    const dateErrors = React.useMemo(() => {
        const errors: { FechaPresentacion?: string; FechaInicio?: string; FechaFin?: string } = {};
        
        // Obtener la fecha actual local a las 00:00:00
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const presVal = (formData && formData.FechaPresentacion) || '';
        const inicioVal = (formData && formData.FechaInicio) || '';
        const finVal = (formData && formData.FechaFin) || '';

        // Función auxiliar para parsear formato dd/mm/aaaa a Date en hora local
        const parseLocalDate = (dateStr: string): Date | null => {
            if (!dateStr) return null;
            const normalized = dateStr.replace(/-/g, '/');
            const parts = normalized.split('/');
            if (parts.length !== 3) return null;
            
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10);
            const year = parseInt(parts[2], 10);
            
            if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
            if (year < 1000 || year > 9999) return null;
            if (month < 1 || month > 12) return null;

            const date = new Date(year, month - 1, day);
            if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
                return null;
            }
            return date;
        };

        // 1. Validar Fecha de Presentación
        if (presVal && presVal.trim() !== '') {
            if (presVal.length === 10) {
                const parsed = parseLocalDate(presVal);
                if (!parsed) {
                    errors.FechaPresentacion = 'Fecha inválida';
                }
            } else {
                errors.FechaPresentacion = 'Fecha incompleta (dd/mm/aaaa)';
            }
        }

        // 2. Validar Fecha de Inicio
        let parsedInicio: Date | null = null;
        if (inicioVal && inicioVal.trim() !== '') {
            if (inicioVal.length === 10) {
                parsedInicio = parseLocalDate(inicioVal);
                if (!parsedInicio) {
                    errors.FechaInicio = 'Fecha inválida';
                } else if (parsedInicio < today) {
                    errors.FechaInicio = 'La fecha de inicio no puede ser anterior a la fecha actual';
                }
            } else {
                errors.FechaInicio = 'Fecha incompleta (dd/mm/aaaa)';
            }
        }

        // 3. Validar Fecha de Fin
        if (finVal && finVal.trim() !== '') {
            if (finVal.length === 10) {
                const parsedFin = parseLocalDate(finVal);
                if (!parsedFin) {
                    errors.FechaFin = 'Fecha inválida';
                } else if (parsedInicio) {
                    if (parsedFin <= parsedInicio) {
                        errors.FechaFin = 'La fecha de fin debe ser posterior a la fecha de inicio';
                    }
                } else if (inicioVal && inicioVal.length === 10) {
                    const backupInicio = parseLocalDate(inicioVal);
                    if (backupInicio && parsedFin <= backupInicio) {
                        errors.FechaFin = 'La fecha de fin debe ser posterior a la fecha de inicio';
                    }
                }
            } else {
                errors.FechaFin = 'Fecha incompleta (dd/mm/aaaa)';
            }
        }

        return errors;
    }, [formData?.FechaPresentacion, formData?.FechaInicio, formData?.FechaFin]);

    // Handler when the selected research group changes
    const handleGroupChange = (groupName: string, meta?: { source?: 'local' | 'remote' }) => {
        onUpdate('GrupoInvestigacionNombre', groupName, meta);
        onUpdate('GrupoInvestigacion', groupName, { source: 'system' });
        
        // Only run auto-population for local user interactions
        if (meta?.source !== 'local') return;

        if (!groupName) {
            onUpdate('GrupoInvestigacionUuid', '', { source: 'system' });
            onUpdate('GrupoInvestigacion', '', { source: 'system' });
            // Clear auto-populated fields
            onUpdate('Dominio', '', { source: 'system' });
            onUpdate('LineaInvestigacion', '', { source: 'system' });
            onUpdate('SublineaInvestigacion', '', { source: 'system' });
            return;
        }

        const group = approvedGroups.find((g: any) => g.nombre === groupName);
        if (group) {
            onUpdate('GrupoInvestigacionUuid', group.uuid, { source: 'system' });

            // Auto-populate academic domain
            const domId = group.id_dominio ?? group.idDominio;
            if (domId && dominios.length > 0) {
                const dom = dominios.find((d: any) => (d.id_dominio ?? d.idDominio) === domId);
                if (dom) {
                    onUpdate('Dominio', dom.nombre, { source: 'system' });
                }
            }

            // Auto-populate lines of investigation
            const groupLineIds = group.lineas_ids || group.lineasIds || [];
            if (groupLineIds.length === 1 && lineas.length > 0) {
                const matchedLine = lineas.find((l: any) => (l.id ?? l.idLinea) === groupLineIds[0]);
                if (matchedLine) {
                    const lineName = matchedLine.nombre ?? matchedLine.nombreLinea;
                    onUpdate('LineaInvestigacion', lineName, { source: 'system' });

                    // Auto-populate subline
                    const subId = matchedLine.id ?? matchedLine.idLinea;
                    const matchedSublines = sublineas.filter((s: any) => (s.id_linea ?? s.idLinea) === subId);
                    if (matchedSublines.length === 1) {
                        onUpdate('SublineaInvestigacion', matchedSublines[0].nombre, { source: 'system' });
                    } else {
                        onUpdate('SublineaInvestigacion', '', { source: 'system' });
                    }
                }
            } else {
                onUpdate('LineaInvestigacion', '', { source: 'system' });
                onUpdate('SublineaInvestigacion', '', { source: 'system' });
            }
        }
    };

    // Handler when the selected research line changes
    const handleLineChange = (lineName: string, meta?: { source?: 'local' | 'remote' }) => {
        onUpdate('LineaInvestigacion', lineName, meta);

        if (meta?.source !== 'local') return;

        if (!lineName) {
            onUpdate('SublineaInvestigacion', '', { source: 'system' });
            return;
        }

        const line = lineas.find((l: any) => (l.nombre ?? l.nombreLinea) === lineName);
        if (line) {
            const lineId = line.id ?? line.idLinea;
            const matchedSublines = sublineas.filter((s: any) => (s.id_linea ?? s.idLinea) === lineId);
            if (matchedSublines.length === 1) {
                onUpdate('SublineaInvestigacion', matchedSublines[0].nombre, { source: 'system' });
            } else {
                onUpdate('SublineaInvestigacion', '', { source: 'system' });
            }
        }
    };

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
                        disabled={true}
                        value={formData.GrupoInvestigacionTipo || 'NO'}
                        className="w-full bg-bg-deep/50 border border-border-thin/80 rounded-lg sm:rounded-xl px-3.5 py-3 sm:px-5 sm:py-4 text-xs sm:text-sm text-text-dim font-bold cursor-not-allowed outline-none animate-fade-in"
                    >
                        <option value="NO">NO</option>
                        <option value="SI">SI</option>
                    </select>
                </div>
                {formData.GrupoInvestigacionTipo === 'SI' && (
                    <div className="md:col-span-8 animate-fade-in">
                        <CoWorkField 
                            name="GrupoInvestigacionNombre" 
                            cowork={cowork} 
                            type="select"
                            label="Nombre del Grupo de Investigación" 
                            onValueChange={handleGroupChange}
                            readOnly={true}
                            className="w-full bg-bg-deep/50 border border-border-thin/80 rounded-lg sm:rounded-xl px-3.5 py-3 sm:px-5 sm:py-4 text-xs sm:text-sm text-text-dim font-bold cursor-not-allowed outline-none transition-all" 
                        >
                            <option value="">-- Seleccione un Grupo Aprobado --</option>
                            {approvedGroups.map((g: any) => (
                                <option key={g.uuid} value={g.nombre}>
                                    {g.nombre} ({g.siglas})
                                </option>
                            ))}
                        </CoWorkField>
                    </div>
                )}
            </div>

            {/* Fila 3: Dominio, Línea y Sublínea */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 animate-fade-in">
                <div>
                    {formData.GrupoInvestigacionTipo === 'SI' ? (
                        <CoWorkField 
                            name="Dominio" 
                            cowork={cowork} 
                            label="Dominio Académico" 
                            readOnly={true}
                            className="w-full bg-bg-deep/50 border border-border-thin/80 rounded-lg sm:rounded-xl px-3.5 py-3 sm:px-5 sm:py-4 text-xs sm:text-sm font-bold text-text-dim cursor-not-allowed outline-none" 
                        />
                    ) : (
                        <CoWorkField 
                            name="Dominio" 
                            cowork={cowork} 
                            type="select"
                            label="Dominio Académico" 
                            onValueChange={(v, meta) => onUpdate('Dominio', v, meta)}
                            className="w-full bg-bg-deep border border-border-thin rounded-lg sm:rounded-xl px-3.5 py-3 sm:px-5 sm:py-4 text-xs sm:text-sm font-bold text-text-main placeholder:text-text-dim/30 focus:border-text-main outline-none transition-all" 
                        >
                            <option value="">Seleccione Dominio...</option>
                            {dominios.map((d: any) => (
                                <option key={d.id_dominio ?? d.idDominio} value={d.nombre}>{d.nombre}</option>
                            ))}
                        </CoWorkField>
                    )}
                </div>
                
                <div>
                    <CoWorkField 
                        name="LineaInvestigacion" 
                        cowork={cowork} 
                        type="select"
                        label="Línea de Investigación" 
                        onValueChange={handleLineChange}
                        className="w-full bg-bg-deep border border-border-thin rounded-lg sm:rounded-xl px-3.5 py-3 sm:px-5 sm:py-4 text-xs sm:text-sm font-bold text-text-main placeholder:text-text-dim/30 focus:border-text-main outline-none transition-all" 
                    >
                        <option value="">Seleccione Línea...</option>
                        {availableLines.map((l: any) => {
                            const lineName = l.nombre ?? l.nombreLinea;
                            return (
                                <option key={l.id ?? l.idLinea} value={lineName}>
                                    {lineName}
                                </option>
                            );
                        })}
                    </CoWorkField>
                </div>
                
                <div>
                    <CoWorkField 
                        name="SublineaInvestigacion" 
                        cowork={cowork} 
                        type="select"
                        label="Sublínea de Investigación" 
                        onValueChange={(v, meta) => onUpdate('SublineaInvestigacion', v, meta)}
                        className="w-full bg-bg-deep border border-border-thin rounded-lg sm:rounded-xl px-3.5 py-3 sm:px-5 sm:py-4 text-xs sm:text-sm font-bold text-text-main placeholder:text-text-dim/30 focus:border-text-main outline-none transition-all" 
                    >
                        <option value="">Seleccione Sublínea...</option>
                        {availableSublines.map((s: any) => (
                            <option key={s.idSublinea ?? s.id_sublinea} value={s.nombre}>
                                {s.nombre}
                            </option>
                        ))}
                    </CoWorkField>
                </div>
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
                        value={Number(formData.IdCarrera) || 0}
                        onChange={(e) => {
                            const val = Number(e.target.value);
                            onUpdate('IdCarrera', val);
                            const selectedCarrera = carreras.find(c => (c.id_carrera ?? c.idCarrera ?? 0) === val);
                            if (selectedCarrera) {
                                const cname = selectedCarrera.nombre_carrera ?? selectedCarrera.carrera1 ?? selectedCarrera.carrera ?? '';
                                onUpdate('Carrera', cname, { source: 'system' });
                            } else {
                                onUpdate('Carrera', '', { source: 'system' });
                            }
                        }}
                        className="w-full bg-bg-deep border border-border-thin rounded-lg sm:rounded-xl px-3.5 py-3 sm:px-5 sm:py-4 text-xs sm:text-sm text-text-main font-bold outline-none"
                    >
                        <option value={0}>Seleccione una carrera...</option>
                        {carreras.map(c => {
                            const cid = c.id_carrera ?? c.idCarrera ?? 0;
                            const cname = c.nombre_carrera ?? c.carrera1 ?? c.carrera ?? 'Sin Nombre';
                            return (
                                <option key={cid} value={cid}>{cname}</option>
                            );
                        })}
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
                <div>
                    <CoWorkField 
                        name="FechaPresentacion" 
                        cowork={cowork} 
                        label="Fecha Presentación (día/mes/año)" 
                        onValueChange={(v, meta) => onUpdate('FechaPresentacion', v, meta)}
                        className={`w-full bg-bg-deep border rounded-lg sm:rounded-xl px-3.5 py-3 sm:px-5 sm:py-4 text-xs sm:text-sm font-bold text-text-main ${
                            dateErrors.FechaPresentacion 
                                ? 'border-red-500/60 focus:border-red-500' 
                                : 'border-border-thin'
                        }`} 
                        placeholder="dd/mm/aaaa"
                        mask="date"
                    />
                    {dateErrors.FechaPresentacion && (
                        <p className="text-[9px] font-black text-red-500 uppercase tracking-wider mt-1.5 ml-2 animate-fade-in">
                            {dateErrors.FechaPresentacion}
                        </p>
                    )}
                </div>
                <div>
                    <CoWorkField 
                        name="FechaInicio" 
                        cowork={cowork} 
                        label="Fecha Prevista Inicio (día/mes/año)" 
                        onValueChange={(v, meta) => onUpdate('FechaInicio', v, meta)}
                        className={`w-full bg-bg-deep border rounded-lg sm:rounded-xl px-3.5 py-3 sm:px-5 sm:py-4 text-xs sm:text-sm font-bold text-text-main ${
                            dateErrors.FechaInicio 
                                ? 'border-red-500/60 focus:border-red-500' 
                                : 'border-border-thin'
                        }`} 
                        placeholder="dd/mm/aaaa"
                        mask="date"
                    />
                    {dateErrors.FechaInicio && (
                        <p className="text-[9px] font-black text-red-500 uppercase tracking-wider mt-1.5 ml-2 animate-fade-in">
                            {dateErrors.FechaInicio}
                        </p>
                    )}
                </div>
                <div>
                    <CoWorkField 
                        name="FechaFin" 
                        cowork={cowork} 
                        label="Fecha Prevista Fin (día/mes/año)" 
                        onValueChange={(v, meta) => onUpdate('FechaFin', v, meta)}
                        className={`w-full bg-bg-deep border rounded-lg sm:rounded-xl px-3.5 py-3 sm:px-5 sm:py-4 text-xs sm:text-sm font-bold text-text-main ${
                            dateErrors.FechaFin 
                                ? 'border-red-500/60 focus:border-red-500' 
                                : 'border-border-thin'
                        }`} 
                        placeholder="dd/mm/aaaa"
                        mask="date"
                    />
                    {dateErrors.FechaFin && (
                        <p className="text-[9px] font-black text-red-500 uppercase tracking-wider mt-1.5 ml-2 animate-fade-in">
                            {dateErrors.FechaFin}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};
