export type EstadoSenadi = 'NoAplica' | 'Solicitado' | 'EnExamen' | 'Concedido' | 'Denegado';

export type TipoPropiedadIntelectual = 'Software' | 'ModeloUtilidad' | 'DisenoIndustrial' | 'Marca' | 'SecretoIndustrial' | 'Patente';

export type ModalidadTransferencia = 'Licencia' | 'Cesion' | 'ConvenioCooperacion' | 'AsistenciaTecnica' | 'Donacion';

export interface InnovationAsset {
    id_producto: number;
    uuid: string;
    id_proyecto: number;
    id_tipo_producto: number;
    titulo: string;
    cantidad: number;
    url_producto?: string;
    es_propiedad_intelectual?: boolean;
    tipo_propiedad_intelectual?: TipoPropiedadIntelectual;
    numero_registro?: string;
    fecha_registro_senadi?: string;
    estado_senadi?: EstadoSenadi;
    trl_actual?: number;
    url_certificado_senadi?: string;
    tipo_producto_nombre?: string;
    categoria_producto?: string;
    proyecto_titulo?: string;
    proyecto_uuid?: string;
    total_transferencias?: number;
    metadata_json?: string;
}

export interface TransferenciaItem {
    id_transferencia: number;
    uuid: string;
    id_proyecto: number;
    id_producto?: number;
    entidad_receptora: string;
    ruc_entidad?: string;
    numero_convenio?: string;
    fecha_convenio?: string;
    modalidad: ModalidadTransferencia;
    valor_monetario?: number;
    beneficiarios_directos?: number;
    url_acta_firmada?: string;
    descripcion?: string;
    producto_titulo?: string;
}
