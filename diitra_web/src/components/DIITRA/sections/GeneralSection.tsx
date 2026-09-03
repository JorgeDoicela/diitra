import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { CoWorkField } from '../../../core/cowork/components/CoWorkField';
import type { CoWorkHandle } from '../../../core/cowork/types';
import type { IdentificationField } from '../../../pages/Admin/Templates/types';

interface GeneralSectionProps {
    formData: any;
    cowork: CoWorkHandle;
    convocatorias: any[];
    carreras: any[];
    misCarreras?: any[];
    programas?: any[];
    groups?: any[];
    dominios?: any[];
    lineas?: any[];
    sublineas?: any[];
    customCatalogs?: Record<string, any[]>;
    onUpdate: (field: string, value: any, meta?: { source?: 'local' | 'remote' | 'system' }) => void;
    isAdmin?: boolean;
    config?: any;
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
    misCarreras: initialMisCarreras = [],
    programas: initialProgramas = [],
    groups = [],
    dominios = [],
    lineas = [],
    sublineas = [],
    customCatalogs = {},
    onUpdate,
    isAdmin = false,
    config
}) => {
    const [misCarreras, setMisCarreras] = React.useState<any[]>(initialMisCarreras);
    const [programas, setProgramas] = React.useState<any[]>(initialProgramas);

    React.useEffect(() => {
        setMisCarreras(initialMisCarreras);
    }, [initialMisCarreras]);

    React.useEffect(() => {
        setProgramas(initialProgramas);
    }, [initialProgramas]);

    const customFieldsList: IdentificationField[] = config?.customFields || [];

    const showTitulo = config?.showTitulo !== false;
    const showPrograma = config?.showPrograma !== false;
    const showGrupo = config?.showGrupo !== false;
    const showLinea = config?.showLinea !== false;
    const showTipo = config?.showTipo !== false;
    const showCaces = config?.showCaces !== false;
    const showCarrera = config?.showCarrera !== false;
    const showConvocatoria = config?.showConvocatoria !== false;
    const showFechas = config?.showFechas !== false;
    const showDirector = config?.showDirector !== false;

    const labelTitulo = config?.customLabel_showTitulo || "Nombre del Proyecto / Tema de Investigación";
    const labelPrograma = config?.customLabel_showPrograma || "Programa de Investigación";
    const labelGrupo = config?.customLabel_showGrupo || "Grupo de Investigación vinculante";
    const labelDirector = config?.customLabel_showDirector || "Director del Proyecto";
    const labelCarrera = config?.customLabel_showCarrera || "Carrera / Unidad Académica Vinculada";
    const labelConvocatoria = config?.customLabel_showConvocatoria || "Convocatoria Activa ISTT";
    const labelTipo = config?.customLabel_showTipo || "Tipo de Investigación";
    const labelFechas = config?.customLabel_showFechas || "Fecha de Presentación del Proyecto";

    const filteredCarreras = React.useMemo(() => {
        if (isAdmin) return carreras;
        const currentId = Number(formData.IdCarrera) || 0;
        const list = [...misCarreras];
        if (currentId > 0 && !list.some(c => (c.id_carrera ?? c.idCarrera ?? 0) === currentId)) {
            const currentCarreraObj = carreras.find(c => (c.id_carrera ?? c.idCarrera ?? 0) === currentId);
            if (currentCarreraObj) {
                list.push(currentCarreraObj);
            }
        } else if (formData.Carrera && !list.some(c => (c.nombre_carrera ?? c.carrera1 ?? c.carrera ?? '').toLowerCase() === String(formData.Carrera).toLowerCase())) {
            const currentCarreraObj = carreras.find(c => (c.nombre_carrera ?? c.carrera1 ?? c.carrera ?? '').toLowerCase() === String(formData.Carrera).toLowerCase());
            if (currentCarreraObj) {
                list.push(currentCarreraObj);
            }
        }
        return list;
    }, [isAdmin, carreras, misCarreras, formData.IdCarrera, formData.Carrera]);

    const resolvedCarreraId = React.useMemo(() => {
        const currentId = Number(formData.IdCarrera) || 0;
        if (currentId > 0) return currentId;
        if (formData.Carrera && carreras.length > 0) {
            const match = carreras.find(c => {
                const cname = (c.nombre_carrera ?? c.carrera1 ?? c.carrera ?? '').trim().toLowerCase();
                return cname === String(formData.Carrera).trim().toLowerCase();
            });
            if (match) return match.id_carrera ?? match.idCarrera ?? 0;
        }
        if (!isAdmin && misCarreras.length === 1) {
            return misCarreras[0].id_carrera ?? misCarreras[0].idCarrera ?? 0;
        }
        return 0;
    }, [formData.IdCarrera, formData.Carrera, carreras, misCarreras, isAdmin]);

    React.useEffect(() => {
        if (resolvedCarreraId > 0 && (!formData.IdCarrera || Number(formData.IdCarrera) === 0)) {
            onUpdate('IdCarrera', resolvedCarreraId, { source: 'system' });
            const selectedCarrera = carreras.find(c => (c.id_carrera ?? c.idCarrera ?? 0) === resolvedCarreraId);
            if (selectedCarrera && !formData.Carrera) {
                const cname = selectedCarrera.nombre_carrera ?? selectedCarrera.carrera1 ?? selectedCarrera.carrera ?? '';
                onUpdate('Carrera', cname, { source: 'system' });
            }
        }
    }, [resolvedCarreraId, formData.IdCarrera, formData.Carrera, carreras, onUpdate]);

    const coejecutoras = React.useMemo(() => {
        if (!formData.Investigadores || !Array.isArray(formData.Investigadores)) return [];
        const principalId = Number(formData.IdCarrera) || 0;
        const principalCarreraObj = carreras.find(c => (c.id_carrera ?? c.idCarrera ?? 0) === principalId);
        const principalName = (principalCarreraObj?.nombre_carrera 
                              ?? principalCarreraObj?.carrera1 
                              ?? principalCarreraObj?.carrera 
                              ?? '').trim().toLowerCase();

        const list = new Set<string>();
        formData.Investigadores.forEach((inv: any) => {
            if (inv.Activo === false) return;
            if (!inv.Carrera) return;
            const names = inv.Carrera.split(',').map((s: string) => s.trim());
            names.forEach((name: string) => {
                const lowerName = name.toLowerCase();
                if (name && lowerName !== principalName && lowerName !== 'docente' && lowerName !== 'estudiante') {
                    list.add(name.toUpperCase());
                }
            });
        });
        return Array.from(list);
    }, [formData.Investigadores, formData.IdCarrera, carreras]);

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

    // Función auxiliar para parsear formato dd/mm/aaaa o yyyy-mm-dd a Date en hora local
    const parseLocalDate = (dateStr: string): Date | null => {
        if (!dateStr || typeof dateStr !== 'string') return null;
        let day = 0, month = 0, year = 0;
        if (dateStr.includes('/')) {
            const parts = dateStr.split('/');
            if (parts.length !== 3) return null;
            day = parseInt(parts[0], 10);
            month = parseInt(parts[1], 10);
            year = parseInt(parts[2], 10);
        } else if (dateStr.includes('-')) {
            const parts = dateStr.split('-');
            if (parts.length !== 3) return null;
            if (parts[0].length === 4) {
                year = parseInt(parts[0], 10);
                month = parseInt(parts[1], 10);
                day = parseInt(parts[2], 10);
            } else {
                day = parseInt(parts[0], 10);
                month = parseInt(parts[1], 10);
                year = parseInt(parts[2], 10);
            }
        } else {
            return null;
        }
        
        if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
        if (year < 1000 || year > 9999) return null;
        if (month < 1 || month > 12) return null;

        const date = new Date(year, month - 1, day);
        date.setHours(0, 0, 0, 0);
        if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
            return null;
        }
        return date;
    };

    // Obtener convocatoria activa seleccionada
    const selectedConvocatoria = React.useMemo(() => {
        const id = Number(formData.IdConvocatoria) || 0;
        if (id <= 0) return null;
        return convocatorias.find(c => (c.id_convocatoria ?? c.idConvocatoria ?? c.id) === id) || null;
    }, [convocatorias, formData.IdConvocatoria]);

    const convAperturaStr = selectedConvocatoria?.fecha_apertura ?? selectedConvocatoria?.fechaApertura ?? selectedConvocatoria?.fecha_inicio ?? selectedConvocatoria?.fechaInicio ?? '';
    const convCierreStr = selectedConvocatoria?.fecha_cierre ?? selectedConvocatoria?.fechaCierre ?? selectedConvocatoria?.fecha_fin ?? selectedConvocatoria?.fechaFin ?? '';
    const convPeriodo = selectedConvocatoria?.periodo_nombre ?? selectedConvocatoria?.periodoNombre ?? selectedConvocatoria?.periodo ?? selectedConvocatoria?.id_periodo_navigation?.detalle ?? selectedConvocatoria?.idPeriodoNavigation?.detalle ?? '';

    // Sincronización automática del Periodo Académico de la Convocatoria
    React.useEffect(() => {
        if (convPeriodo && formData.Periodo !== convPeriodo) {
            onUpdate('Periodo', convPeriodo, { source: 'system' });
        }
    }, [convPeriodo, formData.Periodo, onUpdate]);

    const convAperturaDate = React.useMemo(() => convAperturaStr ? parseLocalDate(convAperturaStr) : null, [convAperturaStr]);
    const convCierreDate = React.useMemo(() => convCierreStr ? parseLocalDate(convCierreStr) : null, [convCierreStr]);

    // Límites dinámicos reactivos para los 3 calendarios
    const maxFechaPresentacion = React.useMemo(() => {
        if (convCierreStr && formData.FechaInicio) {
            const dCierre = parseLocalDate(convCierreStr);
            const dInicio = parseLocalDate(formData.FechaInicio);
            if (dCierre && dInicio) {
                return dInicio < dCierre ? formData.FechaInicio : convCierreStr;
            }
        }
        return convCierreStr || formData.FechaInicio || undefined;
    }, [convCierreStr, formData.FechaInicio]);

    const minFechaInicio = React.useMemo(() => {
        return formData.FechaPresentacion || convAperturaStr || (!isAdmin ? new Date().toISOString().split('T')[0] : undefined);
    }, [formData.FechaPresentacion, convAperturaStr, isAdmin]);

    const minFechaFin = React.useMemo(() => {
        return formData.FechaInicio || undefined;
    }, [formData.FechaInicio]);

    // Cálculo sugerido automático del tiempo de ejecución en base a las fechas de inicio y fin (meses, semanas y días)
    const suggestedExecutionTime = React.useMemo(() => {
        const inicioVal = (formData && formData.FechaInicio) || '';
        const finVal = (formData && formData.FechaFin) || '';
        if (inicioVal.length === 10 && finVal.length === 10) {
            const d1 = parseLocalDate(inicioVal);
            const d2 = parseLocalDate(finVal);
            if (d1 && d2 && d2 > d1) {
                const diffTime = d2.getTime() - d1.getTime();
                const totalDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

                if (totalDays <= 0) return null;
                if (totalDays < 7) {
                    return totalDays === 1 ? '1 día' : `${totalDays} días`;
                }

                // Cálculo de meses reales de calendario
                let months = (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth());
                let daysRemainder = d2.getDate() - d1.getDate();

                if (daysRemainder < 0) {
                    months -= 1;
                    const prevMonthDate = new Date(d2.getFullYear(), d2.getMonth(), 0);
                    daysRemainder += prevMonthDate.getDate();
                }

                // Si cubre mes completo de inicio a fin (ej: 01/03 a 31/08 = 6 meses)
                const isD1StartOfMonth = d1.getDate() === 1;
                const isD2EndOfMonth = new Date(d2.getFullYear(), d2.getMonth() + 1, 0).getDate() === d2.getDate();
                if (isD1StartOfMonth && isD2EndOfMonth) {
                    const fullMonths = (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth()) + 1;
                    return fullMonths === 1 ? '1 mes' : `${fullMonths} meses`;
                }

                // Si los meses son exactos o casi exactos (tolerancia de 2 días)
                if (months >= 1 && (daysRemainder <= 2 || daysRemainder >= 28)) {
                    const roundedMonths = daysRemainder >= 28 ? months + 1 : months;
                    return roundedMonths === 1 ? '1 mes' : `${roundedMonths} meses`;
                }

                // Meses con remanente de semanas o días
                if (months >= 1) {
                    const weeks = Math.floor(daysRemainder / 7);
                    const remDays = daysRemainder % 7;
                    const parts: string[] = [months === 1 ? '1 mes' : `${months} meses`];

                    if (weeks > 0) {
                        parts.push(weeks === 1 ? '1 semana' : `${weeks} semanas`);
                    }
                    if (remDays > 0 && weeks === 0) {
                        parts.push(remDays === 1 ? '1 día' : `${remDays} días`);
                    }
                    return parts.join(' y ');
                }

                // Menos de 1 mes: expresar en semanas y días
                const weeks = Math.floor(totalDays / 7);
                const days = totalDays % 7;
                if (days === 0) {
                    return weeks === 1 ? '1 semana' : `${weeks} semanas`;
                }
                if (weeks === 0) {
                    return days === 1 ? '1 día' : `${days} días`;
                }
                return `${weeks === 1 ? '1 semana' : `${weeks} semanas`} y ${days === 1 ? '1 día' : `${days} días`}`;
            }
        }
        return null;
    }, [formData?.FechaInicio, formData?.FechaFin]);

    // Validar fechas del proyecto en tiempo real (presentación, inicio, fin)
    const dateErrors = React.useMemo(() => {
        const errors: { FechaPresentacion?: string; FechaInicio?: string; FechaFin?: string } = {};
        
        // Obtener la fecha actual local a las 00:00:00
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const presVal = (formData && formData.FechaPresentacion) || '';
        const inicioVal = (formData && formData.FechaInicio) || '';
        const finVal = (formData && formData.FechaFin) || '';

        let parsedPres: Date | null = null;
        let parsedInicio: Date | null = null;
        let parsedFin: Date | null = null;

        // 1. Validar Fecha de Presentación
        if (presVal && presVal.trim() !== '') {
            if (presVal.length === 10) {
                parsedPres = parseLocalDate(presVal);
                if (!parsedPres) {
                    errors.FechaPresentacion = 'Fecha inválida';
                } else if (convAperturaDate && parsedPres < convAperturaDate) {
                    const dia = String(convAperturaDate.getDate()).padStart(2, '0');
                    const mes = String(convAperturaDate.getMonth() + 1).padStart(2, '0');
                    const anio = convAperturaDate.getFullYear();
                    errors.FechaPresentacion = `No puede ser anterior a la apertura de la convocatoria (${dia}/${mes}/${anio})`;
                } else if (convCierreDate && parsedPres > convCierreDate) {
                    const dia = String(convCierreDate.getDate()).padStart(2, '0');
                    const mes = String(convCierreDate.getMonth() + 1).padStart(2, '0');
                    const anio = convCierreDate.getFullYear();
                    errors.FechaPresentacion = `Supera el cierre de la convocatoria (${dia}/${mes}/${anio})`;
                }
            } else {
                errors.FechaPresentacion = 'Fecha incompleta (dd/mm/aaaa)';
            }
        }

        // 2. Validar Fecha de Inicio (En flujo digital debe ser futura)
        if (inicioVal && inicioVal.trim() !== '') {
            if (inicioVal.length === 10) {
                parsedInicio = parseLocalDate(inicioVal);
                if (!parsedInicio) {
                    errors.FechaInicio = 'Fecha inválida';
                } else if (!isAdmin && parsedInicio <= today) {
                    errors.FechaInicio = 'La fecha de inicio debe ser una fecha futura';
                }
            } else {
                errors.FechaInicio = 'Fecha incompleta (dd/mm/aaaa)';
            }
        }

        // 3. Cruce Presentación vs Inicio: Presentación debe ser anterior o igual a Inicio
        if (parsedPres && parsedInicio) {
            if (parsedPres > parsedInicio) {
                errors.FechaPresentacion = 'La fecha de presentación debe ser anterior o igual a la de inicio';
                if (!errors.FechaInicio) {
                    errors.FechaInicio = 'La fecha de inicio debe ser posterior o igual a la de presentación';
                }
            }
        }

        // 4. Validar Fecha de Fin
        if (finVal && finVal.trim() !== '') {
            if (finVal.length === 10) {
                parsedFin = parseLocalDate(finVal);
                if (!parsedFin) {
                    errors.FechaFin = 'Fecha inválida';
                } else if (parsedInicio) {
                    if (parsedFin <= parsedInicio) {
                        errors.FechaFin = 'La fecha de finalización debe ser posterior a la fecha de inicio';
                    } else {
                        const diffDays = Math.round((parsedFin.getTime() - parsedInicio.getTime()) / (1000 * 60 * 60 * 24));
                        if (diffDays < 28) {
                            errors.FechaFin = 'La duración mínima del proyecto debe ser de al menos 1 mes';
                        }
                    }
                } else if (inicioVal && inicioVal.length === 10) {
                    const backupInicio = parseLocalDate(inicioVal);
                    if (backupInicio && parsedFin <= backupInicio) {
                        errors.FechaFin = 'La fecha de finalización debe ser posterior a la fecha de inicio';
                    }
                }
            } else {
                errors.FechaFin = 'Fecha incompleta (dd/mm/aaaa)';
            }
        }

        return errors;
    }, [formData?.FechaPresentacion, formData?.FechaInicio, formData?.FechaFin, isAdmin, convAperturaDate, convCierreDate]);

    // Handler when the selected research group changes
    const handleGroupChange = (groupName: string, meta?: { source?: 'local' | 'remote' }) => {
        onUpdate('GrupoInvestigacionNombre', groupName, meta);
        onUpdate('GrupoInvestigacion', groupName, { source: 'system' });
        
        if (meta?.source !== 'local') return;

        if (!groupName) {
            onUpdate('GrupoInvestigacionUuid', '', { source: 'system' });
            onUpdate('GrupoInvestigacion', '', { source: 'system' });
            onUpdate('Dominio', '', { source: 'system' });
            onUpdate('LineaInvestigacion', '', { source: 'system' });
            onUpdate('SublineaInvestigacion', '', { source: 'system' });
            return;
        }

        const group = approvedGroups.find((g: any) => g.nombre === groupName);
        if (group) {
            onUpdate('GrupoInvestigacionUuid', group.uuid, { source: 'system' });

            const domId = group.id_dominio ?? group.idDominio;
            if (domId && dominios.length > 0) {
                const dom = dominios.find((d: any) => (d.id_dominio ?? d.idDominio) === domId);
                if (dom) {
                    onUpdate('Dominio', dom.nombre, { source: 'system' });
                }
            }

            const groupLineIds = group.lineas_ids || group.lineasIds || [];
            if (groupLineIds.length === 1 && lineas.length > 0) {
                const matchedLine = lineas.find((l: any) => (l.id ?? l.idLinea) === groupLineIds[0]);
                if (matchedLine) {
                    const lineName = matchedLine.nombre ?? matchedLine.nombreLinea;
                    onUpdate('LineaInvestigacion', lineName, { source: 'system' });

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

    const fieldsOrder: string[] = config?.fieldsOrder || [];
    const defaultCoreOrder = ['showTitulo', 'showPrograma', 'showGrupo', 'showLinea', 'showTipo', 'showCaces', 'showCarrera', 'showDirector', 'showFechas'];

    const activeOrder = fieldsOrder.length > 0
        ? fieldsOrder
        : defaultCoreOrder;

    const renderedCoreKeys = new Set<string>();

    const renderBlockByKey = (key: string) => {
        if (renderedCoreKeys.has(key)) return null;

        switch (key) {
            case 'showTitulo':
                renderedCoreKeys.add('showTitulo');
                return showTitulo ? (
                    <div key="showTitulo" className="grid grid-cols-1 gap-4 sm:gap-6">
                        <CoWorkField 
                            name="Titulo" 
                            cowork={cowork} 
                            label={labelTitulo} 
                            onValueChange={(v, meta) => onUpdate('Titulo', v, meta)}
                            className="w-full bg-bg-deep border border-border-thin rounded-xl sm:rounded-2xl px-4 py-3 sm:px-6 sm:py-5 text-sm sm:text-lg font-black text-text-main placeholder:text-text-dim/30 focus:border-text-main outline-none transition-all uppercase" 
                            uppercase={true}
                        />
                    </div>
                ) : null;

            case 'showPrograma':
                renderedCoreKeys.add('showPrograma');
                return showPrograma ? (
                    <div key="showPrograma" className="grid grid-cols-1 gap-4 sm:gap-6">
                        <CoWorkField 
                            name="Programa" 
                            cowork={cowork} 
                            type="select"
                            label={labelPrograma} 
                            onValueChange={(v, meta) => onUpdate('Programa', v, meta)}
                            className="w-full bg-bg-deep border border-border-thin rounded-lg sm:rounded-xl px-3.5 py-3 sm:px-5 sm:py-4 text-xs sm:text-sm font-bold text-text-main placeholder:text-text-dim/30 focus:border-text-main outline-none transition-all" 
                        >
                            <option value="">-- Seleccione un Programa de Investigación --</option>
                            {programas.map((p: any) => (
                                <option key={p.uuid || p.id_programa || p.idPrograma} value={p.nombre}>
                                    {p.nombre}
                                </option>
                            ))}
                            {/* Soporte para valor preexistente si no estuviera en el catálogo activo */}
                            {formData.Programa && !programas.some((p: any) => p.nombre === formData.Programa) && (
                                <option value={formData.Programa}>{formData.Programa}</option>
                            )}
                        </CoWorkField>
                    </div>
                ) : null;

            case 'showGrupo':
                renderedCoreKeys.add('showGrupo');
                return showGrupo ? (
                    <div key="showGrupo" className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6">
                        <div className="md:col-span-4">
                            <label className="block text-[10px] font-black text-text-dim uppercase tracking-widest ml-2 mb-1.5 sm:mb-2">¿Grupo de Investigación?</label>
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
                                    label={labelGrupo} 
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
                ) : null;

            case 'showLinea':
                renderedCoreKeys.add('showLinea');
                const isSublineaDisabled = !selectedLine && !formData.LineaInvestigacion && !formData.SublineaInvestigacion;
                return showLinea ? (
                    <div key="showLinea" className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 animate-fade-in">
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
                                    {formData.Dominio && !dominios.some((d: any) => d.nombre === formData.Dominio) && (
                                        <option value={formData.Dominio}>{formData.Dominio}</option>
                                    )}
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
                                {formData.LineaInvestigacion && !availableLines.some((l: any) => (l.nombre ?? l.nombreLinea) === formData.LineaInvestigacion) && (
                                    <option value={formData.LineaInvestigacion}>{formData.LineaInvestigacion}</option>
                                )}
                            </CoWorkField>
                        </div>
                        <div>
                            <CoWorkField 
                                name="SublineaInvestigacion" 
                                cowork={cowork} 
                                type="select"
                                label="Sublínea de Investigación" 
                                readOnly={isSublineaDisabled}
                                onValueChange={(v, meta) => onUpdate('SublineaInvestigacion', v, meta)}
                                className={`w-full border rounded-lg sm:rounded-xl px-3.5 py-3 sm:px-5 sm:py-4 text-xs sm:text-sm font-bold outline-none transition-all ${
                                    isSublineaDisabled 
                                        ? 'bg-bg-deep/50 border-border-thin/80 text-text-dim cursor-not-allowed opacity-50 select-none' 
                                        : 'bg-bg-deep border-border-thin text-text-main focus:border-text-main'
                                }`} 
                            >
                                {isSublineaDisabled ? (
                                    <option value="">-- Primero seleccione una Línea --</option>
                                ) : (
                                    <>
                                        <option value="">Seleccione Sublínea...</option>
                                        {availableSublines.map((s: any) => (
                                            <option key={s.idSublinea ?? s.id_sublinea} value={s.nombre}>
                                                {s.nombre}
                                            </option>
                                        ))}
                                        {formData.SublineaInvestigacion && !availableSublines.some((s: any) => s.nombre === formData.SublineaInvestigacion) && (
                                            <option value={formData.SublineaInvestigacion}>{formData.SublineaInvestigacion}</option>
                                        )}
                                    </>
                                )}
                            </CoWorkField>
                        </div>
                    </div>
                ) : null;

            case 'showTipo':
                renderedCoreKeys.add('showTipo');
                return showTipo ? (
                    <div key="showTipo" className="grid grid-cols-1 gap-4 sm:gap-6">
                        <div className="w-full">
                            <CoWorkField 
                                name="TipoInvestigacion"
                                type="select"
                                cowork={cowork}
                                label={labelTipo}
                                onValueChange={(val) => onUpdate('TipoInvestigacion', val)}
                                className="w-full bg-bg-deep border border-border-thin rounded-lg sm:rounded-xl px-3.5 py-3 sm:px-5 sm:py-4 text-xs sm:text-sm text-text-main font-bold"
                            >
                                <option value="BASICA">BÁSICA</option>
                                <option value="APLICADA">APLICADA</option>
                                <option value="DESARROLLO EXPERIMENTAL">DESARROLLO EXPERIMENTAL</option>
                            </CoWorkField>
                        </div>
                    </div>
                ) : null;

            case 'showCaces':
                renderedCoreKeys.add('showCaces');
                return showCaces ? (
                    <div key="showCaces" className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                        <CoWorkField 
                            name="CampoAmplio" 
                            cowork={cowork} 
                            label="Campo Amplio" 
                            onValueChange={(v, meta) => onUpdate('CampoAmplio', v, meta)}
                            className="w-full bg-bg-deep border border-border-thin rounded-lg sm:rounded-xl px-3.5 py-3 sm:px-5 sm:py-4 text-xs sm:text-sm font-bold text-text-main placeholder:text-text-dim/30 focus:border-text-main outline-none transition-all" 
                        />
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
                ) : null;

            case 'showCarrera':
            case 'showConvocatoria':
                renderedCoreKeys.add('showCarrera');
                renderedCoreKeys.add('showConvocatoria');
                const canShowConvocatoriaField = isAdmin && showConvocatoria;
                return (showCarrera || canShowConvocatoriaField) ? (
                    <div key="showCarrera" className={`grid grid-cols-1 ${canShowConvocatoriaField ? 'md:grid-cols-2' : ''} gap-4 sm:gap-6`}>
                        {showCarrera && (
                            <div className="w-full">
                                <CoWorkField 
                                    name="IdCarrera"
                                    type="select"
                                    cowork={cowork}
                                    label={labelCarrera}
                                    readOnly={!isAdmin && filteredCarreras.length <= 1}
                                    onValueChange={(val) => {
                                        const numVal = Number(val);
                                        onUpdate('IdCarrera', numVal);
                                        const selectedCarrera = carreras.find(c => (c.id_carrera ?? c.idCarrera ?? 0) === numVal);
                                        if (selectedCarrera) {
                                            const cname = selectedCarrera.nombre_carrera ?? selectedCarrera.carrera1 ?? selectedCarrera.carrera ?? '';
                                            onUpdate('Carrera', cname, { source: 'system' });
                                        } else {
                                            onUpdate('Carrera', '', { source: 'system' });
                                        }
                                    }}
                                    className="w-full bg-bg-deep border border-border-thin rounded-lg sm:rounded-xl px-3.5 py-3 sm:px-5 sm:py-4 text-xs sm:text-sm text-text-main font-bold"
                                >
                                    <option value={0}>Seleccione una carrera...</option>
                                    {filteredCarreras.map(c => {
                                        const cid = c.id_carrera ?? c.idCarrera ?? 0;
                                        const cname = c.nombre_carrera ?? c.carrera1 ?? c.carrera ?? 'Sin Nombre';
                                        return (
                                            <option key={cid} value={cid}>{cname}</option>
                                        );
                                    })}
                                </CoWorkField>
                                {!isAdmin && misCarreras.length > 1 && (
                                    <div className="mt-2.5 ml-2 text-[10px] text-warning font-semibold flex items-center gap-1.5 animate-fade-in">
                                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                                        <span>Perteneces a múltiples carreras. Por favor, selecciona una carrera principal para esta propuesta.</span>
                                    </div>
                                )}
                                {formData.GrupoInvestigacionTipo === 'SI' && coejecutoras.length > 0 && (
                                    <div className="mt-2.5 ml-2 animate-fade-in">
                                        <span className="text-[9px] font-black text-warning uppercase tracking-widest block mb-1.5">
                                            Carreras Co-ejecutoras (Asociativas)
                                        </span>
                                        <div className="flex flex-wrap gap-1.5">
                                            {coejecutoras.map((name, i) => (
                                                <span key={i} className="px-2.5 py-1 text-[9px] font-extrabold bg-warning/10 border border-warning/20 text-warning uppercase rounded-md tracking-wider">
                                                    {name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {canShowConvocatoriaField && (
                            <div className="w-full">
                                <label className="block text-[10px] font-black text-text-dim uppercase tracking-widest ml-2 mb-1.5 sm:mb-2">{labelConvocatoria}</label>
                                <div className="relative">
                                    <select 
                                        value={formData.IdConvocatoria || 0}
                                        onChange={(e) => onUpdate('IdConvocatoria', Number(e.target.value))}
                                        className="w-full bg-bg-deep border border-border-thin rounded-lg sm:rounded-xl px-3.5 py-3 sm:px-5 sm:py-4 text-xs sm:text-sm text-text-main font-bold outline-none cursor-pointer transition-all"
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
                        )}
                    </div>
                ) : null;

            case 'showDirector':
                renderedCoreKeys.add('showDirector');
                return showDirector ? (
                    <div key="showDirector" className="grid grid-cols-1 gap-4 sm:gap-6">
                        <CoWorkField 
                            name="DirectorProyecto" 
                            cowork={cowork} 
                            label={labelDirector} 
                            readOnly={!isAdmin}
                            onValueChange={(v, meta) => onUpdate('DirectorProyecto', v, meta)}
                            className="w-full bg-bg-deep border border-border-thin rounded-lg sm:rounded-xl px-3.5 py-3 sm:px-5 sm:py-4 text-xs sm:text-sm font-bold text-text-main placeholder:text-text-dim/30 focus:border-text-main outline-none transition-all" 
                        />
                    </div>
                ) : null;

            case 'showFechas':
                renderedCoreKeys.add('showFechas');
                return showFechas ? (
                    <React.Fragment key="showFechas">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                            <CoWorkField 
                                name="Periodo" 
                                cowork={cowork} 
                                label="Periodo Académico de Convocatoria" 
                                readOnly={!!selectedConvocatoria}
                                placeholder={convPeriodo || "Periodo Académico de Convocatoria"}
                                onValueChange={(v, meta) => onUpdate('Periodo', v, meta)}
                                className="w-full bg-bg-deep border border-border-thin rounded-lg sm:rounded-xl px-3.5 py-3 sm:px-5 sm:py-4 text-xs sm:text-sm font-bold text-text-main" 
                            />
                            <div className="w-full">
                                <CoWorkField 
                                    name="TiempoEjecucion" 
                                    cowork={cowork} 
                                    label="Tiempo Estimado de Ejecución" 
                                    placeholder="Ej: 6 meses"
                                    onValueChange={(v, meta) => onUpdate('TiempoEjecucion', v, meta)}
                                    className="w-full bg-bg-deep border border-border-thin rounded-lg sm:rounded-xl px-3.5 py-3 sm:px-5 sm:py-4 text-xs sm:text-sm font-bold text-text-main" 
                                />

                                {/* Sugerencia reactiva según FechaInicio y FechaFin */}
                                {suggestedExecutionTime && (formData.TiempoEjecucion || '').trim().toLowerCase() !== suggestedExecutionTime.toLowerCase() && (
                                    <div className="mt-2 px-2 flex items-center justify-between gap-2 text-[10px] sm:text-[11px] text-text-dim animate-fade-in">
                                        <span className="truncate">Sugerido por fechas: <strong className="text-text-main font-semibold">{suggestedExecutionTime}</strong></span>
                                        <button
                                            type="button"
                                            onClick={() => onUpdate('TiempoEjecucion', suggestedExecutionTime)}
                                            className="text-[10px] font-extrabold text-accent-vercel hover:text-text-main hover:underline transition-colors cursor-pointer uppercase tracking-wider shrink-0"
                                        >
                                            Aplicar
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                            <div>
                                <CoWorkField 
                                    name="FechaPresentacion" 
                                    cowork={cowork} 
                                    label={labelFechas} 
                                    onValueChange={(v, meta) => onUpdate('FechaPresentacion', v, meta)}
                                    className={`w-full bg-bg-deep border rounded-lg sm:rounded-xl px-3.5 py-3 sm:px-5 sm:py-4 text-xs sm:text-sm font-bold text-text-main ${
                                        dateErrors.FechaPresentacion 
                                            ? 'border-red-500/60 focus:border-red-500' 
                                            : 'border-border-thin'
                                    }`} 
                                    placeholder="dd/mm/aaaa"
                                    mask="date"
                                    minDate={convAperturaStr || undefined}
                                    maxDate={maxFechaPresentacion}
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
                                    label="Fecha Prevista de Inicio del Proyecto" 
                                    onValueChange={(v, meta) => onUpdate('FechaInicio', v, meta)}
                                    className={`w-full bg-bg-deep border rounded-lg sm:rounded-xl px-3.5 py-3 sm:px-5 sm:py-4 text-xs sm:text-sm font-bold text-text-main ${
                                        dateErrors.FechaInicio 
                                            ? 'border-red-500/60 focus:border-red-500' 
                                            : 'border-border-thin'
                                    }`} 
                                    placeholder="dd/mm/aaaa"
                                    mask="date"
                                    minDate={minFechaInicio}
                                    maxDate={formData.FechaFin || undefined}
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
                                    label="Fecha Prevista de Finalización del Proyecto" 
                                    onValueChange={(v, meta) => onUpdate('FechaFin', v, meta)}
                                    className={`w-full bg-bg-deep border rounded-lg sm:rounded-xl px-3.5 py-3 sm:px-5 sm:py-4 text-xs sm:text-sm font-bold text-text-main ${
                                        dateErrors.FechaFin 
                                            ? 'border-red-500/60 focus:border-red-500' 
                                            : 'border-border-thin'
                                    }`} 
                                    placeholder="dd/mm/aaaa"
                                    mask="date"
                                    minDate={minFechaFin}
                                />
                                {dateErrors.FechaFin && (
                                    <p className="text-[9px] font-black text-red-500 uppercase tracking-wider mt-1.5 ml-2 animate-fade-in">
                                        {dateErrors.FechaFin}
                                    </p>
                                )}
                            </div>
                        </div>
                    </React.Fragment>
                ) : null;

            default:
                return null;
        }
    };

    return (
        <div className="space-y-5 sm:space-y-8 animate-fade-in pb-6 sm:pb-10">
            {/* Renderizar según la secuencia activa */}
            {activeOrder.map(key => renderBlockByKey(key))}
            {defaultCoreOrder.map(key => renderBlockByKey(key))}

            {/* Campos Personalizados Adicionales y Banners Temáticos (Composición Unificada) */}
            {customFieldsList.length > 0 && (
                <div className="space-y-5 sm:space-y-8 pt-4 border-t border-border-thin/20">
                    {customFieldsList.map((field) => {
                        if (field.isGroupHeader) {
                            const isGold = field.variant === 'banner_gold';
                            const isNavy = field.variant === 'banner_navy';
                            const isEmerald = field.variant === 'banner_emerald';
                            const bannerBg = isGold ? 'bg-amber-500/10 border-amber-500/30 text-amber-600' : isNavy ? 'bg-blue-500/10 border-blue-500/30 text-blue-600' : isEmerald ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600' : 'bg-surface-hover border-border-thin text-text-main';

                            return (
                                <div key={field.fieldKey} className={`p-3.5 rounded-xl border ${bannerBg} flex items-center justify-between my-3 shadow-2xs`}>
                                    <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider">
                                        {field.label}
                                    </h4>
                                    {field.requirementText && (
                                        <span className="text-[10px] text-text-dim/80 italic font-medium">
                                            {field.requirementText}
                                        </span>
                                    )}
                                </div>
                            );
                        }

                        const options = field.fieldType === 'select_catalog'
                            ? (customCatalogs[field.catalogUrl!] || [])
                            : (field.options || []);

                        const labelKey = field.catalogLabelKey || 'nombre';
                        const valueKey = field.catalogValueKey || 'nombre';

                        const colSpanClass = field.colSpan === 2
                            ? 'grid-cols-1'
                            : 'grid-cols-1 md:grid-cols-2';

                        const fieldHelper = field.requirementText ? (
                            <p className="text-[10px] text-text-dim italic mt-1">{field.requirementText}</p>
                        ) : null;

                        if (field.fieldType === 'select_inline' || field.fieldType === 'select_catalog') {
                            return (
                                <div key={field.fieldKey} className={`grid ${colSpanClass} gap-4 sm:gap-6`}>
                                    <div>
                                        <CoWorkField
                                            name={field.fieldKey}
                                            cowork={cowork}
                                            type="select"
                                            label={field.label}
                                            onValueChange={(v, meta) => onUpdate(field.fieldKey, v, meta)}
                                            className="w-full bg-bg-deep border border-border-thin rounded-lg sm:rounded-xl px-3.5 py-3 sm:px-5 sm:py-4 text-xs sm:text-sm font-bold text-text-main placeholder:text-text-dim/30 focus:border-text-main outline-none transition-all"
                                        >
                                            <option value="">-- Seleccione {field.label} --</option>
                                            {options.map((opt: any, optIdx: number) => {
                                                const val = typeof opt === 'string' ? opt : (opt[valueKey] ?? opt[labelKey] ?? '');
                                                const lbl = typeof opt === 'string' ? opt : (opt[labelKey] ?? opt[valueKey] ?? '');
                                                return (
                                                    <option key={val || optIdx} value={val}>
                                                        {lbl}
                                                    </option>
                                                );
                                            })}
                                        </CoWorkField>
                                        {fieldHelper}
                                    </div>
                                </div>
                            );
                        }

                        if (field.fieldType === 'textarea') {
                            return (
                                <div key={field.fieldKey} className={`grid ${colSpanClass} gap-4 sm:gap-6`}>
                                    <div>
                                        <CoWorkField
                                            name={field.fieldKey}
                                            cowork={cowork}
                                            type="textarea"
                                            label={field.label}
                                            placeholder={field.placeholder}
                                            onValueChange={(v, meta) => onUpdate(field.fieldKey, v, meta)}
                                            className="w-full bg-bg-deep border border-border-thin rounded-lg sm:rounded-xl px-3.5 py-3 sm:px-5 sm:py-4 text-xs sm:text-sm font-bold text-text-main placeholder:text-text-dim/30 focus:border-text-main outline-none transition-all"
                                        />
                                        {fieldHelper}
                                    </div>
                                </div>
                            );
                        }

                        return (
                            <div key={field.fieldKey} className={`grid ${colSpanClass} gap-4 sm:gap-6`}>
                                <div>
                                    <CoWorkField
                                        name={field.fieldKey}
                                        cowork={cowork}
                                        label={field.label}
                                        placeholder={field.placeholder}
                                        uppercase={field.uppercase}
                                        mask={field.fieldType === 'date' ? 'date' : undefined}
                                        onValueChange={(v, meta) => onUpdate(field.fieldKey, v, meta)}
                                        className="w-full bg-bg-deep border border-border-thin rounded-lg sm:rounded-xl px-3.5 py-3 sm:px-5 sm:py-4 text-xs sm:text-sm font-bold text-text-main placeholder:text-text-dim/30 focus:border-text-main outline-none transition-all"
                                    />
                                    {fieldHelper}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
