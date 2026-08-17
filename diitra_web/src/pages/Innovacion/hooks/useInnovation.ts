import { useState, useEffect, useCallback } from 'react';
import api from '../../../api/axios_config';
import type { InnovationAsset } from '../types';

export const useInnovation = () => {
    const [assets, setAssets] = useState<InnovationAsset[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadAssets = useCallback(async (isManual = false) => {
        if (isManual) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }
        setError(null);

        try {
            const res = await api.get('/ResearchProducts/catalogo-innovacion');
            const data = (res.data || []).map((item: any) => ({
                id_producto: item.id_producto ?? item.idProducto,
                uuid: item.uuid,
                id_proyecto: item.id_proyecto ?? item.idProyecto,
                id_tipo_producto: item.id_tipo_producto ?? item.idTipoProducto,
                titulo: item.titulo,
                cantidad: item.cantidad ?? 1,
                url_producto: item.url_producto ?? item.urlProducto,
                es_propiedad_intelectual: item.es_propiedad_intelectual ?? item.esPropiedadIntelectual,
                tipo_propiedad_intelectual: item.tipo_propiedad_intelectual ?? item.tipoPropiedadIntelectual,
                numero_registro: item.numero_registro ?? item.numeroRegistro,
                fecha_registro_senadi: item.fecha_registro_senadi ?? item.fechaRegistroSenadi,
                estado_senadi: item.estado_senadi ?? item.estadoSenadi,
                trl_actual: item.trl_actual ?? item.trlActual ?? 4,
                url_certificado_senadi: item.url_certificado_senadi ?? item.urlCertificadoSenadi,
                tipo_producto_nombre: item.tipo_producto_nombre ?? item.tipoProductoNombre,
                categoria_producto: item.categoria_producto ?? item.categoriaProducto,
                proyecto_titulo: item.proyecto_titulo ?? item.proyectoTitulo,
                proyecto_uuid: item.proyecto_uuid ?? item.proyectoUuid,
                total_transferencias: item.total_transferencias ?? item.totalTransferencias ?? 0,
                metadata_json: item.metadata_json ?? item.metadataJson
            }));
            setAssets(data);
        } catch (err: any) {
            console.error('[DIITRA Innovation] Error al cargar catálogo:', err);
            setError('No se pudo conectar con el catálogo de innovación.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadAssets();
    }, [loadAssets]);

    return {
        assets,
        loading,
        refreshing,
        error,
        reload: () => loadAssets(true)
    };
};
