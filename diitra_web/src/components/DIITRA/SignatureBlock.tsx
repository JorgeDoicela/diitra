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
                {signatures.map((sig) => (
                    <div 
                        key={sig.idFirma} 
                        className={`sig-card-item ${sig.estado === 2 ? 'sig-revoked' : ''}`}
                    >
                        <div className="sig-card-header">
                            <span className="sig-signer-name">{sig.firmanteNombre}</span>
                            <span className={`sig-card-badge ${sig.estado === 2 ? 'badge-revoked' : 'badge-valid'}`}>
                                {sig.estado === 2 ? 'Revocada' : 'Firma Válida'}
                            </span>
                        </div>

                        <div className="sig-card-meta">
                            <div className="sig-meta-row">
                                <span className="meta-label">Rol:</span>
                                <span className="meta-val">{sig.firmanteRol}</span>
                            </div>
                            <div className="sig-meta-row">
                                <span className="meta-label">Fecha:</span>
                                <span className="meta-val">
                                    {new Date(sig.fechaFirma).toLocaleString()}
                                </span>
                            </div>
                            <div className="sig-meta-row">
                                <span className="meta-label">Código:</span>
                                <span className="meta-val code-text">{sig.firmaCode}</span>
                            </div>
                            {sig.docHash && (
                                <div className="sig-meta-row flex-column">
                                    <span className="meta-label">SHA-256 (Integridad):</span>
                                    <span className="meta-val hash-text" title={sig.docHash}>
                                        {sig.docHash}
                                    </span>
                                </div>
                            )}
                            {sig.estado === 2 && sig.motivoRevocacion && (
                                <div className="sig-meta-row flex-column revocation-reason">
                                    <span className="meta-label text-error">Motivo de Anulación:</span>
                                    <span className="meta-val text-error-dark">{sig.motivoRevocacion}</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
