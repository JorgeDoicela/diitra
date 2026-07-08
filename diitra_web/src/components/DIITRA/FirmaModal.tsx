import React, { useEffect, useState } from 'react';
import { getSignatureProfile, signDocumentWithDiitra } from '../../services/signaturesService';
import type { UserSignatureProfileDto } from '../../services/signaturesService';
import './FirmaModal.css';

interface FirmaModalProps {
    documentoUuid: string;
    rolFirmante: string;
    onSuccess: (code: string) => void;
    onClose: () => void;
}

export const FirmaModal: React.FC<FirmaModalProps> = ({ 
    documentoUuid, 
    rolFirmante, 
    onSuccess, 
    onClose 
}) => {
    const [profile, setProfile] = useState<UserSignatureProfileDto | null>(null);
    const [password, setPassword] = useState('');
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [signing, setSigning] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            setLoadingProfile(true);
            const data = await getSignatureProfile();
            setProfile(data);
        } catch (err) {
            console.error('Error al cargar perfil de firma:', err);
            setError('No se pudo verificar su perfil de firma institucional.');
        } finally {
            setLoadingProfile(false);
        }
    };

    const handleSign = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password) return;

        try {
            setSigning(true);
            setError(null);
            const result = await signDocumentWithDiitra({
                documentoUuid,
                password,
                rolFirmante
            });
            onSuccess(result.firmaCode);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Contraseña incorrecta o error al estampar la firma.');
        } finally {
            setSigning(false);
        }
    };

    return (
        <div className="firma-modal-overlay">
            <div className="firma-modal-content">
                <div className="firma-modal-header">
                    <h3>Firmar Documento Oficial</h3>
                    <button type="button" onClick={onClose} className="btn-close-modal">×</button>
                </div>

                {loadingProfile ? (
                    <div className="firma-modal-loading">
                        <div className="spinner"></div>
                        <p>Verificando credenciales de firma...</p>
                    </div>
                ) : !profile?.esConfigurado ? (
                    <div className="firma-modal-body no-profile">
                        <div className="sig-warning-icon"></div>
                        <h4>Perfil de firma incompleto</h4>
                        <p>No ha configurado su cargo o su trazo de firma manuscrita. Debe hacerlo en la sección de configuración de perfil antes de firmar.</p>
                        <div className="firma-modal-actions">
                            <button type="button" onClick={onClose} className="btn-sig btn-sig-secondary">Cancelar</button>
                            <a href="/perfil" className="btn-sig btn-sig-primary text-center-link">
                                Ir a Configuración
                            </a>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSign} className="firma-modal-body">
                        <p className="firma-info-text">
                            Usted está aplicando su <strong>Firma Digital Institucional</strong> como <strong>{profile.cargo || rolFirmante}</strong> en este documento.
                        </p>

                        <div className="firma-preview-wrapper">
                            <span className="preview-label">Trazo a estampar:</span>
                            <div className="preview-box">
                                {profile.firmaImagenB64 ? (
                                    <img src={profile.firmaImagenB64} alt="Trazo de firma" />
                                ) : (
                                    <span className="no-image">Sin trazo</span>
                                )}
                            </div>
                        </div>

                        {error && <div className="sig-alert sig-alert-error">{error}</div>}

                        <div className="sig-form-group">
                            <label htmlFor="modal-sig-pwd">Confirme su identidad con su contraseña de DIITRA</label>
                            <input 
                                id="modal-sig-pwd"
                                type="password" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="Ingrese su contraseña institucional"
                                disabled={signing}
                            />
                            <span className="input-tip">
                                Al ingresar su contraseña, certifica el contenido del documento bajo firma de no repudio.
                            </span>
                        </div>

                        <div className="firma-modal-actions">
                            <button 
                                type="button" 
                                onClick={onClose} 
                                className="btn-sig btn-sig-secondary"
                                disabled={signing}
                            >
                                Cancelar
                            </button>
                            <button 
                                type="submit" 
                                className="btn-sig btn-sig-primary"
                                disabled={signing || !password}
                            >
                                {signing ? 'Firmando y Estampando...' : 'Confirmar y Firmar'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};
