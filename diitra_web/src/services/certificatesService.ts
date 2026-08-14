import api from '../api/axios_config';

export interface IssuedCertificateDto {
    document_uuid: string;
    documentUuid?: string;
    recipient_name: string;
    recipientName?: string;
    recipient_role: string;
    recipientRole?: string;
    recipient_cedula?: string;
    title: string;
    issue_date: string;
    traceability_code: string;
    file_name: string;
}

export interface CertificateVerificationDto {
    is_valid: boolean;
    isValid?: boolean;
    recipient_name: string;
    recipient_role: string;
    recipient_cedula?: string;
    certificate_type: string;
    title: string;
    issue_date: string;
    traceability_code: string;
    template_version: number;
    issuer: string;
}

export interface IndividualCertificateRequest {
    user_cedula: string;
    recipient_role: string;
    title: string;
    description?: string;
    template_code?: string;
}

export const certificatesService = {
    /**
     * Emite certificados de completación desacoplados para todos los participantes de un proyecto.
     */
    async issueProjectCertificates(projectId: number): Promise<{ message: string; count: number; certificates: IssuedCertificateDto[] }> {
        const response = await api.post(`/api/certificates/issue/project/${projectId}`);
        return response.data;
    },

    /**
     * Emite certificados de grupo a los integrantes de un Grupo de Investigación.
     */
    async issueGroupCertificates(groupId: number, milestoneTitle?: string): Promise<{ message: string; count: number; certificates: IssuedCertificateDto[] }> {
        const response = await api.post(`/api/certificates/issue/group/${groupId}`, null, {
            params: { milestoneTitle }
        });
        return response.data;
    },

    /**
     * Emite un certificado individual a una persona por su cédula y rol.
     */
    async issueIndividualCertificate(req: IndividualCertificateRequest): Promise<IssuedCertificateDto> {
        const response = await api.post('/api/certificates/issue/individual', req);
        return response.data;
    },

    /**
     * Endpoint PÚBLICO para verificar la autenticidad y trazabilidad de un certificado por QR / UUID.
     */
    async verifyCertificate(uuid: string): Promise<CertificateVerificationDto> {
        const response = await api.get(`/api/certificates/verify/${uuid}`);
        return response.data;
    },

    /**
     * Obtiene todos los certificados otorgados al usuario autenticado.
     */
    async getMyCertificates(): Promise<IssuedCertificateDto[]> {
        const response = await api.get('/api/certificates/my-certificates');
        return response.data;
    },

    /**
     * Obtiene el URL de descarga directa del PDF del certificado.
     */
    getDownloadUrl(uuid: string): string {
        const baseUrl = api.defaults.baseURL || '';
        return `${baseUrl}/api/certificates/download/${uuid}`;
    }
};

export default certificatesService;
