import { useState, useEffect, useCallback } from 'react';
import api from '../../../../api/axios_config';
import type {
    EmailTemplate, EmailHistorial, Carrera, Proyecto, Convocatoria, PeerReview
} from '../emailEngineTypes';

export const mapTemplateToCamelCase = (t: any): EmailTemplate => {
    if (!t) return t;
    return {
        idEmailTemplate: t.id_email_template !== undefined ? t.id_email_template : t.idEmailTemplate,
        uuid: t.uuid,
        codigo: t.codigo,
        nombre: t.nombre,
        descripcion: t.descripcion,
        asunto: t.asunto,
        cuerpoHtml: t.cuerpo_html !== undefined ? t.cuerpo_html : t.cuerpoHtml,
        activo: t.activo === true || t.activo === 1 || t.activo === '1',
        fechaCreado: t.fecha_creado !== undefined ? t.fecha_creado : t.fechaCreado,
        fechaActualizado: t.fecha_actualizado !== undefined ? t.fecha_actualizado : t.fechaActualizado
    };
};

export const mapHistorialToCamelCase = (h: any): EmailHistorial => {
    if (!h) return h;
    return {
        idEmailHistorial: h.id_email_historial !== undefined ? h.id_email_historial : h.idEmailHistorial,
        uuid: h.uuid,
        destinatario: h.destinatario,
        idUsuarioDestinatario: h.id_usuario_destinatario !== undefined ? h.id_usuario_destinatario : h.idUsuarioDestinatario,
        nombreDestinatario: h.nombre_destinatario !== undefined ? h.nombre_destinatario : h.nombreDestinatario,
        asunto: h.asunto,
        cuerpo: h.cuerpo,
        estado: h.estado,
        errorMensaje: h.error_mensaje !== undefined ? h.error_mensaje : h.errorMensaje,
        fechaEnvio: h.fecha_envio !== undefined ? h.fecha_envio : h.fechaEnvio,
        adjuntosJson: h.adjuntos_json !== undefined ? h.adjuntos_json : h.adjuntosJson,
        metadataJson: h.metadata_json !== undefined ? h.metadata_json : h.metadataJson
    };
};

export const mapConvocatoriaToCamelCase = (c: any): Convocatoria => {
    if (!c) return c;
    return {
        uuid: c.uuid,
        titulo: c.titulo,
        codigoConvocatoria: c.codigo_convocatoria !== undefined ? c.codigo_convocatoria : c.codigoConvocatoria,
        anio: c.anio,
        presupuestoTotal: c.presupuesto_total !== undefined ? c.presupuesto_total : c.presupuestoTotal,
        montoMaximoProyecto: c.monto_maximo_proyecto !== undefined ? c.monto_maximo_proyecto : c.montoMaximoProyecto,
        fechaApertura: c.fecha_apertura !== undefined ? c.fecha_apertura : c.fechaApertura,
        fechaCierre: c.fecha_cierre !== undefined ? c.fecha_cierre : c.fechaCierre,
        urlBases: c.url_bases !== undefined ? c.url_bases : c.urlBases,
        estado: c.estado
    };
};

export const mapCarreraToCamelCase = (c: any): Carrera => {
    if (!c) return c;
    return {
        idCarrera: c.id_carrera !== undefined ? c.id_carrera : c.idCarrera,
        carrera1: c.carrera1,
        aliasCarrera: c.alias_carrera !== undefined ? c.alias_carrera : c.aliasCarrera
    };
};

export interface UseEmailEngineDataResult {
    templates: EmailTemplate[];
    setTemplates: React.Dispatch<React.SetStateAction<EmailTemplate[]>>;
    carreras: Carrera[];
    projects: Proyecto[];
    convocatorias: Convocatoria[];
    peerReviews: PeerReview[];
    loading: boolean;
    reloadCatalogs: () => Promise<void>;
}

export const useEmailEngineData = (): UseEmailEngineDataResult => {
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [carreras, setCarreras] = useState<Carrera[]>([]);
    const [projects, setProjects] = useState<Proyecto[]>([]);
    const [convocatorias, setConvocatorias] = useState<Convocatoria[]>([]);
    const [peerReviews, setPeerReviews] = useState<PeerReview[]>([]);
    const [loading, setLoading] = useState(false);

    const loadInitialData = useCallback(async () => {
        setLoading(true);
        try {
            const [templatesRes, carrerasRes, projectsRes, convocatoriasRes, arbitrajesRes] = await Promise.all([
                api.get<any[]>('/Admin/email-engine/templates'),
                api.get<Carrera[]>('/catalogs/carreras'),
                api.get<Proyecto[]>('/projects'),
                api.get<any[]>('/Convocatorias'),
                api.get<any[]>('/PeerReviews/arbitraje')
            ]);
            setTemplates(templatesRes.data.map(mapTemplateToCamelCase));
            setCarreras(carrerasRes.data.map(mapCarreraToCamelCase));
            setProjects(projectsRes.data);
            setConvocatorias(convocatoriasRes.data.map(mapConvocatoriaToCamelCase));

            const allReviews: PeerReview[] = [];
            if (Array.isArray(arbitrajesRes.data)) {
                arbitrajesRes.data.forEach((p: any) => {
                    const proyectoTitulo = p.proyecto_titulo || p.proyectoTitulo || 'Sin título';
                    if (Array.isArray(p.revisiones)) {
                        p.revisiones.forEach((r: any) => {
                            allReviews.push({
                                uuid: r.uuid,
                                proyectoTitulo: proyectoTitulo,
                                revisorNombre: r.revisor_nombre || r.revisorNombre || 'Revisor Externo',
                                revisorEmail: r.revisor_email || r.revisorEmail || '',
                                estado: r.estado || 'Pendiente',
                                dictamenRevisor: r.dictamen_revisor || r.dictamenRevisor || 'Pendiente',
                                fechaLimite: r.fecha_limite || r.fechaLimite,
                                puntajeTotal: r.puntaje_total || r.puntajeTotal,
                                observacionesGral: r.observaciones_gral || r.observacionesGral,
                                esExterno: r.es_externo ?? r.esExterno,
                                esDobleCiego: r.es_doble_ciego ?? r.esDobleCiego
                            });
                        });
                    }
                });
            }
            setPeerReviews(allReviews);
        } catch (e) {
            console.error('[DIITRA EMAIL ENGINE] Error loading catalogs:', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadInitialData();
    }, [loadInitialData]);

    return {
        templates,
        setTemplates,
        carreras,
        projects,
        convocatorias,
        peerReviews,
        loading,
        reloadCatalogs: loadInitialData
    };
};
