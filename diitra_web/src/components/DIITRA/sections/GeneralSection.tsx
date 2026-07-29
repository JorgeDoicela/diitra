import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { CoWorkField } from '../../../core/cowork/components/CoWorkField';
import type { CoWorkHandle } from '../../../core/cowork/types';
import type { IdentificationField } from '../../../pages/Admin/Templates/types';
import api from '../../../api/axios_config';

interface GeneralSectionProps {
    formData: any;
    cowork: CoWorkHandle;
    convocatorias: any[];
    carreras: any[];
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
    groups = [],
    dominios = [],
    lineas = [],
    sublineas = [],
    customCatalogs = {},
    onUpdate,
    isAdmin = false,
    config
}) => {
    const [misCarreras, setMisCarreras] = React.useState<any[]>([]);
    React.useEffect(() => {
        if (!isAdmin) {
            api.get('/catalogs/mi-carrera')
                .then(res => setMisCarreras(res.data || []))
                .catch(err => console.error("Error al cargar carreras del docente:", err));
        }
    }, [isAdmin]);

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
    const labelFechas = config?.customLabel_showFechas || "Fechas y Plazos";

    const filteredCarreras = React.useMemo(() => {
        if (isAdmin) return carreras;
        const currentId = Number(formData.IdCarrera) || 0;
        const list = [...misCarreras];
        if (currentId > 0 && !list.some(c => (c.id_carrera ?? c.idCarrera ?? 0) === currentId)) {
            const currentCarreraObj = carreras.find(c => (c.id_carrera ?? c.idCarrera ?? 0) === currentId);
            if (currentCarreraObj) {
                list.push(currentCarreraObj);
            }
        }
        return list;
    }, [isAdmin, carreras, misCarreras, formData.IdCarrera]);

    React.useEffect(() => {
        if (!isAdmin && misCarreras.length === 1) {
            const unica = misCarreras[0];
            const unicaId = unica.id_carrera ?? unica.idCarrera ?? 0;
            if (!formData.IdCarrera || Number(formData.IdCarrera) === 0) {
                onUpdate('IdCarrera', unicaId);
                const cname = unica.nombre_carrera ?? unica.carrera1 ?? unica.carrera ?? '';
                onUpdate('Carrera', cname, { source: 'system' });
            }
        }
    }, [misCarreras, formData.IdCarrera, isAdmin, onUpdate]);

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
                            label={labelPrograma} 
                            onValueChange={(v, meta) => onUpdate('Programa', v, meta)}
                            className="w-full bg-bg-deep border border-border-thin rounded-lg sm:rounded-xl px-3.5 py-3 sm:px-5 sm:py-4 text-xs sm:text-sm font-bold text-text-main placeholder:text-text-dim/30 focus:border-text-main outline-none transition-all" 
                        />
                    </div>
                ) : null;

            case 'showGrupo':
                renderedCoreKeys.add('showGrupo');
                return showGrupo ? (
                    <div key="showGrupo" className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6">
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
                ) : null;

            case 'showTipo':
                renderedCoreKeys.add('showTipo');
                return showTipo ? (
                    <div key="showTipo" className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6">
                        <div className="md:col-span-2 space-y-1.5 sm:space-y-3">
                            <label className="block text-[10px] font-black text-text-dim uppercase tracking-widest ml-2">{labelTipo}</label>
                            <select 
                                value={(() => {
                                    const raw = formData.TipoInvestigacion || 'APLICADA';
                                    const upper = raw.trim().toUpperCase();
                                    if (upper === 'BÁSICA' || upper === 'BASICA') return 'BASICA';
                                    if (upper === 'APLICADA') return 'APLICADA';
                                    return 'DESARROLLO EXPERIMENTAL';
                                })()}
                                onChange={(e) => onUpdate('TipoInvestigacion', e.target.value)}
                                className="w-full bg-bg-deep border border-border-thin rounded-lg sm:rounded-xl px-3.5 py-3 sm:px-5 sm:py-4 text-xs sm:text-sm text-text-main font-bold outline-none"
                            >
                                <option value="BASICA">BÁSICA</option>
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
                ) : null;

            case 'showCaces':
                renderedCoreKeys.add('showCaces');
                return showCaces ? (
                    <div key="showCaces" className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
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
                return (showCarrera || showConvocatoria) ? (
                    <div key="showCarrera" className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        {showCarrera && (
                            <div className="space-y-1.5 sm:space-y-3">
                                <label className="block text-[10px] font-black text-text-dim uppercase tracking-widest ml-2">{labelCarrera}</label>
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
                                    disabled={!isAdmin && filteredCarreras.length <= 1}
                                    className="w-full bg-bg-deep border border-border-thin rounded-lg sm:rounded-xl px-3.5 py-3 sm:px-5 sm:py-4 text-xs sm:text-sm text-text-main font-bold outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <option value={0}>Seleccione una carrera...</option>
                                    {filteredCarreras.map(c => {
                                        const cid = c.id_carrera ?? c.idCarrera ?? 0;
                                        const cname = c.nombre_carrera ?? c.carrera1 ?? c.carrera ?? 'Sin Nombre';
                                        return (
                                            <option key={cid} value={cid}>{cname}</option>
                                        );
                                    })}
                                </select>
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

                        {showConvocatoria && (
                            <div className="space-y-1.5 sm:space-y-3">
                                <label className="block text-[10px] font-black text-text-dim uppercase tracking-widest ml-2">{labelConvocatoria}</label>
                                <select 
                                    value={formData.IdConvocatoria || 0}
                                    onChange={(e) => onUpdate('IdConvocatoria', Number(e.target.value))}
                                    disabled={!!formData.IdConvocatoria}
                                    className="w-full bg-bg-deep border border-border-thin rounded-lg sm:rounded-xl px-3.5 py-3 sm:px-5 sm:py-4 text-xs sm:text-sm text-text-main font-bold outline-none disabled:opacity-50 disabled:cursor-not-allowed"
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
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                            <div>
                                <CoWorkField 
                                    name="FechaPresentacion" 
                                    cowork={cowork} 
                                    label={`${labelFechas} (Presentación)`} 
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

            {/* Campos Personalizados Adicionales (Composición Unificada) */}
            {customFieldsList.length > 0 && (
                <div className="space-y-5 sm:space-y-8 pt-4 border-t border-border-thin/20">
                    {customFieldsList.map((field) => {
                        const options = field.fieldType === 'select_catalog'
                            ? (customCatalogs[field.catalogUrl!] || [])
                            : (field.options || []);

                        const labelKey = field.catalogLabelKey || 'nombre';
                        const valueKey = field.catalogValueKey || 'nombre';

                        const colSpanClass = field.colSpan === 2
                            ? 'grid-cols-1'
                            : 'grid-cols-1 md:grid-cols-2';

                        if (field.fieldType === 'select_inline' || field.fieldType === 'select_catalog') {
                            return (
                                <div key={field.fieldKey} className={`grid ${colSpanClass} gap-4 sm:gap-6`}>
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
                                </div>
                            );
                        }

                        if (field.fieldType === 'textarea') {
                            return (
                                <div key={field.fieldKey} className={`grid ${colSpanClass} gap-4 sm:gap-6`}>
                                    <CoWorkField
                                        name={field.fieldKey}
                                        cowork={cowork}
                                        type="textarea"
                                        label={field.label}
                                        placeholder={field.placeholder}
                                        onValueChange={(v, meta) => onUpdate(field.fieldKey, v, meta)}
                                        className="w-full bg-bg-deep border border-border-thin rounded-lg sm:rounded-xl px-3.5 py-3 sm:px-5 sm:py-4 text-xs sm:text-sm font-bold text-text-main placeholder:text-text-dim/30 focus:border-text-main outline-none transition-all"
                                    />
                                </div>
                            );
                        }

                        return (
                            <div key={field.fieldKey} className={`grid ${colSpanClass} gap-4 sm:gap-6`}>
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
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
