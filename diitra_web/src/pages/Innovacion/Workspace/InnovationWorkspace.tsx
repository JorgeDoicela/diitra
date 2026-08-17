import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import api from '../../../api/axios_config';
import { InnovationHeader } from './components/InnovationHeader';
import { InnovationStepper } from './components/InnovationStepper';
import { InnovationSignaturesPanel } from './components/InnovationSignaturesPanel';
import { InnovationActivityStream } from './components/InnovationActivityStream';

export const InnovationWorkspace: React.FC = () => {
    const { assetUuid } = useParams<{ assetUuid: string }>();
    const navigate = useNavigate();

    const [asset, setAsset] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadAssetDetail = useCallback(async () => {
        if (!assetUuid) return;
        setLoading(true);
        setError(null);
        try {
            const res = await api.get(`/ResearchProducts/asset/${assetUuid}`);
            const data = {
                id_producto: res.data.id_producto ?? res.data.idProducto,
                uuid: res.data.uuid,
                titulo: res.data.titulo,
                tipo_propiedad_intelectual: res.data.tipo_propiedad_intelectual ?? res.data.tipoPropiedadIntelectual,
                tipo_producto_nombre: res.data.tipo_producto_nombre ?? res.data.tipoProductoNombre,
                categoria_producto: res.data.categoria_producto ?? res.data.categoriaProducto,
                estado_senadi: res.data.estado_senadi ?? res.data.estadoSenadi,
                trl_actual: res.data.trl_actual ?? res.data.trlActual ?? 1,
                numero_registro: res.data.numero_registro ?? res.data.numeroRegistro,
                fecha_registro_senadi: res.data.fecha_registro_senadi ?? res.data.fechaRegistroSenadi,
                url_producto: res.data.url_producto ?? res.data.urlProducto,
                url_certificado_senadi: res.data.url_certificado_senadi ?? res.data.urlCertificadoSenadi,
                proyecto_id: res.data.proyecto_id ?? res.data.proyectoId,
                proyecto_uuid: res.data.proyecto_uuid ?? res.data.proyectoUuid,
                proyecto_titulo: res.data.proyecto_titulo ?? res.data.proyectoTitulo,
                proyecto_codigo: res.data.proyecto_codigo ?? res.data.proyectoCodigo,
                director_nombre: res.data.director_nombre ?? res.data.directorNombre,
                linea_investigacion: res.data.linea_investigacion ?? res.data.lineaInvestigacion,
                grupo_investigacion: res.data.grupo_investigacion ?? res.data.grupoInvestigacion,
                total_transferencias: res.data.transferencias ? res.data.transferencias.length : 0,
                transferencias: res.data.transferencias || []
            };
            setAsset(data);
        } catch (err: any) {
            console.error('[InnovationWorkspace] Error al cargar detalle del activo:', err);
            setError(err?.response?.data?.error || 'No se pudo cargar la información del activo tecnológico.');
        } finally {
            setLoading(false);
        }
    }, [assetUuid]);

    useEffect(() => {
        loadAssetDetail();
    }, [loadAssetDetail]);

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center p-12 bg-bg-deep">
                <Loader2 className="animate-spin text-text-dim" size={32} />
            </div>
        );
    }

    if (error || !asset) {
        return (
            <div className="flex-1 p-6 md:p-10 bg-bg-deep space-y-4">
                <button
                    onClick={() => navigate('/innovacion')}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-dim hover:text-text-main transition-colors"
                >
                    <ArrowLeft size={13} />
                    <span>Volver al Catálogo</span>
                </button>
                <div className="badge-vercel-error !rounded-xl !p-6 max-w-xl flex items-center gap-3">
                    <AlertCircle size={20} />
                    <span>{error || 'Activo no encontrado'}</span>
                </div>
            </div>
        );
    }

    return (
        <main className="flex-1 bg-bg-deep p-4 md:p-10 overflow-y-auto space-y-8 animate-fade-up">
            {/* Header del Activo */}
            <InnovationHeader asset={asset} />

            {/* Layout en 2 Columnas (Igual a Investigacion Workspace) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Columna Principal (2/3): Stepper de Maduración TRL y Fases */}
                <div className="lg:col-span-2 space-y-6">
                    <InnovationStepper 
                        asset={asset} 
                        onOpenTransferModal={() => {}} 
                    />
                </div>

                {/* Columna Lateral (1/3): Firmas y Actividad */}
                <div className="space-y-6">
                    <InnovationSignaturesPanel 
                        directorNombre={asset.director_nombre}
                        hasTransfer={(asset.total_transferencias ?? 0) > 0}
                    />

                    <InnovationActivityStream 
                        assetUuid={asset.uuid} 
                    />
                </div>
            </div>
        </main>
    );
};

export default InnovationWorkspace;
