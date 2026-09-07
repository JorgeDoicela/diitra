import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import api from '../../../../api/axios_config';

export interface DocenteDistributivoMetrics {
    cedula: string;
    horasDisponibles: number;
    horasAsignadasOtros: number;
    cupoLibre: number;
    horasPropuestas: number;
    hasNoDistributivo: boolean;
    exceedsLimit: boolean;
    isInvalidHours: boolean;
    excesoHoras: number;
    isLoading: boolean;
}

export interface UseDocenteDistributivoReturn {
    metricsByCedula: Record<string, DocenteDistributivoMetrics>;
    hasAnyExceededDocente: boolean;
    docentesConExcesoCount: number;
    registerMemberHours: (cedula: string, disponibles: number, asignadas: number) => void;
}

export const isStudentMember = (inv: any): boolean => {
    const rol = (inv?.Rol || inv?.rol || '').toLowerCase();
    const nivel = (inv?.NivelAcademico || inv?.nivelAcademico || '').toLowerCase();
    return rol.includes('semillerista') ||
           rol.includes('estudiante') ||
           rol.includes('alumno') ||
           nivel === 'pregrado';
};

export const useDocenteDistributivo = (
    investigadores: any[] = [],
    isAssociative: boolean = false,
    investigadoresReales: any[] = []
): UseDocenteDistributivoReturn => {
    // Caché en memoria para evitar llamadas redundantes a la API de SIGAFI/Admin
    const [cache, setCache] = useState<Record<string, { disponibles: number; asignadas: number }>>({});
    const fetchingRef = useRef<Set<string>>(new Set());

    // Permite registrar horas conocidas de forma síncrona (ej. al seleccionar en MemberSearchSelector)
    const registerMemberHours = useCallback((cedula: string, disponibles: number, asignadas: number) => {
        if (!cedula) return;
        const key = cedula.trim().toLowerCase();
        setCache(prev => {
            if (prev[key] && prev[key].disponibles === disponibles && prev[key].asignadas === asignadas) {
                return prev;
            }
            return {
                ...prev,
                [key]: { disponibles: Number(disponibles || 0), asignadas: Number(asignadas || 0) }
            };
        });
    }, []);

    // Consulta reactiva a la API para docentes que no tengan horas cargadas en el snapshot inicial
    useEffect(() => {
        if (!investigadores || investigadores.length === 0) return;

        const toFetch: string[] = [];

        investigadores.forEach(inv => {
            if (isStudentMember(inv)) return;

            const rawCed = (inv.Cedula || inv.cedula || '').trim();
            if (!rawCed) return;
            const key = rawCed.toLowerCase();

            // Verificar si ya viene en el objeto
            const hasDirectDisponibles = inv.HorasDisponibles !== undefined || inv.horas_disponibles !== undefined || inv.horasDisponibles !== undefined;
            const hasDirectAsignadas = inv.HorasAsignadas !== undefined || inv.horas_asignadas !== undefined || inv.horasAsignadas !== undefined;

            // Verificar si viene en investigadoresReales
            const real = investigadoresReales.find(r => ((r.Cedula || r.cedula || '').trim().toLowerCase() === key));
            const hasReal = real && (real.HorasDisponibles !== undefined || real.horas_disponibles !== undefined);

            if (!hasDirectDisponibles && !hasDirectAsignadas && !hasReal && !cache[key] && !fetchingRef.current.has(key)) {
                toFetch.push(rawCed);
            }
        });

        if (toFetch.length === 0) return;

        toFetch.forEach(c => fetchingRef.current.add(c.toLowerCase()));

        let isMounted = true;
        Promise.all(
            toFetch.map(async (ced) => {
                try {
                    const res = await api.get(`/Admin/users?type=DOCENTE&search=${encodeURIComponent(ced)}&pageSize=5`);
                    const items = res.data?.items || [];
                    const found = items.find((u: any) => (u.id_profesor || u.id_sigafi || '').trim().toLowerCase() === ced.toLowerCase());
                    if (found) {
                        return {
                            cedKey: ced.toLowerCase(),
                            disponibles: Number(found.horas_investigacion ?? 0),
                            asignadas: Number(found.horas_asignadas ?? 0)
                        };
                    }
                } catch (err) {
                    console.error(`[DIITRA] Error consultando distributivo docente (C.I. ${ced}):`, err);
                } finally {
                    fetchingRef.current.delete(ced.toLowerCase());
                }
                return null;
            })
        ).then(results => {
            if (!isMounted) return;
            const updates: Record<string, { disponibles: number; asignadas: number }> = {};
            results.forEach(r => {
                if (r) updates[r.cedKey] = { disponibles: r.disponibles, asignadas: r.asignadas };
            });

            if (Object.keys(updates).length > 0) {
                setCache(prev => ({ ...prev, ...updates }));
            }
        });

        return () => { isMounted = false; };
    }, [investigadores, investigadoresReales, cache]);

    // Cálculo puro y memoizado de las métricas por integrante
    const { metricsByCedula, hasAnyExceededDocente, docentesConExcesoCount } = useMemo(() => {
        const metrics: Record<string, DocenteDistributivoMetrics> = {};
        let exceededCount = 0;

        investigadores.forEach(inv => {
            const rawCed = (inv.Cedula || inv.cedula || '').trim();
            const cedKey = rawCed.toLowerCase();
            const isStudent = isStudentMember(inv);

            if (isStudent) {
                metrics[cedKey] = {
                    cedula: rawCed,
                    horasDisponibles: 0,
                    horasAsignadasOtros: 0,
                    cupoLibre: 0,
                    horasPropuestas: Number(inv.HorasSemanales || 0),
                    hasNoDistributivo: false,
                    exceedsLimit: false,
                    isInvalidHours: false,
                    excesoHoras: 0,
                    isLoading: false
                };
                return;
            }

            const real = investigadoresReales.find(r => ((r.Cedula || r.cedula || '').trim().toLowerCase() === cedKey));
            const cached = cache[cedKey];

            const horasDisponibles = Number(
                inv.HorasDisponibles ?? inv.horas_disponibles ?? inv.horasDisponibles ??
                real?.HorasDisponibles ?? real?.horas_disponibles ?? real?.horasDisponibles ??
                cached?.disponibles ?? 0
            );

            const horasAsignadasOtros = Number(
                inv.HorasAsignadas ?? inv.horas_asignadas ?? inv.horasAsignadas ??
                real?.HorasAsignadas ?? real?.horas_asignadas ?? real?.horasAsignadas ??
                cached?.asignadas ?? 0
            );

            const cupoLibre = Math.max(0, horasDisponibles - horasAsignadasOtros);
            const horasPropuestas = Number(inv.HorasSemanales !== undefined && inv.HorasSemanales !== null ? inv.HorasSemanales : 0);

            // Reglas de gobernanza institucional DIITRA:
            // 1. Docente en proyecto no asociativo sin horas en período activo
            const hasNoDistributivo = !isAssociative && horasDisponibles <= 0;
            // 2. Suma propuesta + asignada excede el techo institucional
            const exceedsLimit = (horasAsignadasOtros + horasPropuestas) > horasDisponibles;
            const isInvalidHours = hasNoDistributivo || exceedsLimit;
            const excesoHoras = (horasAsignadasOtros + horasPropuestas) - horasDisponibles;

            if (isInvalidHours) {
                exceededCount++;
            }

            metrics[cedKey] = {
                cedula: rawCed,
                horasDisponibles,
                horasAsignadasOtros,
                cupoLibre,
                horasPropuestas,
                hasNoDistributivo,
                exceedsLimit,
                isInvalidHours,
                excesoHoras,
                isLoading: !cached && (inv.HorasDisponibles === undefined && real?.HorasDisponibles === undefined)
            };
        });

        return {
            metricsByCedula: metrics,
            hasAnyExceededDocente: exceededCount > 0,
            docentesConExcesoCount: exceededCount
        };
    }, [investigadores, isAssociative, investigadoresReales, cache]);

    return {
        metricsByCedula,
        hasAnyExceededDocente,
        docentesConExcesoCount,
        registerMemberHours
    };
};
