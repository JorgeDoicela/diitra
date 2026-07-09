import api from '../api/axios_config';

// ─────────────────────────────────────────────────────────────
//  Tipos
// ─────────────────────────────────────────────────────────────

export interface UserSignatureProfileDto {
    idUsuario: number;
    esConfigurado: boolean;
    firmaImagenB64?: string;
    iniciales?: string;
    cargo?: string;
    departamento?: string;
    actualizadoEn?: string;
}

export interface UpdateSignatureProfileDto {
    firmaImagenB64?: string;
    iniciales?: string;
    cargo?: string;
    departamento?: string;
}

export interface SignDocumentDto {
    documentoUuid: string;
    password: string;
    rolFirmante?: string;
}

export interface SignatureResultDto {
    message: string;
    firmaCode: string;
    docHash: string;
    firmadoEn: string;
    verificationUrl: string;
}

export interface SignatureRecordDto {
    idFirma: number;
    firmaCode: string;
    firmanteNombre: string;
    firmanteRol: string;
    fechaFirma: string;
    estado: number; // 1=Valid, 2=Revoked
    docHash?: string;
    motivoRevocacion?: string;
    revocadaEn?: string;
}

export interface SignatureVerificationDto {
    esValida: boolean;
    firmaCode: string;
    firmanteNombre: string;
    firmanteRol: string;
    documentoUuid: string;
    fechaFirma: string;
    docHash: string;
    mensajeEstado: string;
}

export interface RevokeSignatureDto {
    firmaCode: string;
    motivoRevocacion: string;
}

// ─────────────────────────────────────────────────────────────
//  Llamadas API
// ─────────────────────────────────────────────────────────────

export const getSignatureProfile = (): Promise<UserSignatureProfileDto> =>
    api.get('/signatures/profile').then(r => r.data);

export const updateSignatureProfile = (dto: UpdateSignatureProfileDto): Promise<UserSignatureProfileDto> => {
    const payload = {
        cargo: dto.cargo,
        departamento: dto.departamento,
        iniciales: dto.iniciales,
        firma_imagen_b64: dto.firmaImagenB64
    };
    return api.put('/signatures/profile', payload).then(r => r.data);
};

export const signDocumentWithDiitra = (dto: SignDocumentDto): Promise<SignatureResultDto> =>
    api.post('/signatures/sign', dto).then(r => r.data);

export const getDocumentSignatures = (documentUuid: string): Promise<SignatureRecordDto[]> =>
    api.get(`/signatures/document/${documentUuid}`).then(r => r.data);

export const verifySignaturePublic = (firmaCode: string): Promise<SignatureVerificationDto> =>
    api.get(`/signatures/verify/${firmaCode}`).then(r => r.data);

export const revokeSignature = (dto: RevokeSignatureDto): Promise<{ message: string }> =>
    api.post('/signatures/revoke', dto).then(r => r.data);
