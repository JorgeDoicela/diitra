import React, { useEffect, useState } from 'react';
import { getDocumentSignatures } from '../../services/signaturesService';
import type { SignatureRecordDto } from '../../services/signaturesService';
import './SignatureBlock.css';

interface SignatureBlockProps {
    documentoUuid: string;
    refreshTrigger?: number; // Para forzar recarga tras firmar
}

export const SignatureBlock: React.FC<SignatureBlockProps> = ({ 
    documentoUuid, 
    refreshTrigger = 0 
}) => {
    const [signatures, setSignatures] = useState<SignatureRecordDto[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSignatures();
    }, [documentoUuid, refreshTrigger]);

    const loadSignatures = async () => {
        try {
            setLoading(true);
            const data = await getDocumentSignatures(documentoUuid);
            setSignatures(data);
        } catch (err) {
            console.error('Error al cargar firmas del documento:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="sig-block-loading">
                <span className="sig-spinner"></span>
                <span>Cargando registro de firmas...</span>
            </div>
        );
    }

    if (signatures.length === 0) {
        return (
            <div className="sig-block-empty">
                <p>Este documento no cuenta con firmas DIITRA registradas.</p>
            </div>
        );
    }

    return (
        <div className="sig-block-container">
            <h4 className="sig-block-title">Firmas del Documento ({signatures.length})</h4>
            <div className="sig-block-list">
                {signatures.map((sig: any) => {
                    const idFirma = sig.idFirma ?? sig.id_firma;
                    const firmanteNombre = sig.firmanteNombre ?? sig.firmante_nombre ?? sig.firmanteId ?? sig.firmante_id ?? 'Firmante';
                    const firmanteRol = sig.firmanteRol ?? sig.firmante_rol ?? 'Firmante';
                    const fechaFirma = sig.fechaFirma ?? sig.fecha_firma;
                    const firmaCode = sig.firmaCode ?? sig.firma_code ?? '';
                    const estado = sig.estado ?? 1;
                    const docHash = sig.docHash ?? sig.doc_hash;
                    const motivoRevocacion = sig.motivoRevocacion ?? sig.motivo_revocacion;

                    return (
                        <div 
                            key={idFirma || firmaCode} 
                            className={`sig-card-item ${estado === 2 ? 'sig-revoked' : ''}`}
                        >
                            <div className="sig-card-header">
                                <span className="sig-signer-name">{firmanteNombre}</span>
                                <span className={`sig-card-badge ${estado === 2 ? 'badge-revoked' : 'badge-valid'}`}>
                                    {estado === 2 ? 'Revocada' : 'Firma Válida'}
                                </span>
                            </div>

                            <div className="sig-card-meta">
                                <div className="sig-meta-row">
                                    <span className="meta-label">Rol:</span>
                                    <span className="meta-val">{firmanteRol}</span>
                                </div>
                                {fechaFirma && (
                                    <div className="sig-meta-row">
                                        <span className="meta-label">Fecha:</span>
                                        <span className="meta-val">
                                            {new Date(fechaFirma).toLocaleString()}
                                        </span>
                                    </div>
                                )}
                                <div className="sig-meta-row">
                                    <span className="meta-label">Código:</span>
                                    <span className="meta-val code-text">{firmaCode}</span>
                                </div>
                                {docHash && (
                                    <div className="sig-meta-row flex-column">
                                        <span className="meta-label">SHA-256 (Integridad):</span>
                                        <span className="meta-val hash-text" title={docHash}>
                                            {docHash}
                                        </span>
                                    </div>
                                )}
                                {estado === 2 && motivoRevocacion && (
                                    <div className="sig-meta-row flex-column revocation-reason">
                                        <span className="meta-label text-error">Motivo de Anulación:</span>
                                        <span className="meta-val text-error-dark">{motivoRevocacion}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
