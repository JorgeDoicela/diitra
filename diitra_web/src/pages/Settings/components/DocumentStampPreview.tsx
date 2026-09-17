import React from 'react';
import './DocumentStampPreview.css';

export interface DocumentStampPreviewProps {
    nombreFirmante?: string;
    cargo?: string;
    departamento?: string;
    cedula?: string;
    firmaImagenB64?: string;
    firmaCode?: string;
    firmadoEn?: string;
    className?: string;
}

export const DocumentStampPreview: React.FC<DocumentStampPreviewProps> = ({
    nombreFirmante = 'Usuario Institucional',
    cargo = 'Cargo no definido',
    departamento = 'Unidad Académica',
    cedula = '17XXXXXXXX',
    firmaImagenB64,
    firmaCode = 'SIG-ISTPET-2026-OFIC',
    firmadoEn,
    className = '',
}) => {
    // Formatear nombre a 2 líneas si es largo
    const formatMultiLineName = (name: string) => {
        if (!name) return 'Nombre del Firmante';
        const parts = name.trim().split(/\s+/);
        if (parts.length <= 2) return name;
        const half = parts.length === 3 ? 1 : Math.ceil(parts.length / 2);
        return `${parts.slice(0, half).join(' ')}\n${parts.slice(half).join(' ')}`;
    };

    // Iniciales en caso de no tener imagen aún
    const getInitials = (name: string) => {
        const parts = name.trim().split(/\s+/).filter(Boolean);
        if (parts.length === 0) return 'DI';
        return parts.slice(0, 2).map(p => p[0].toUpperCase()).join('');
    };

    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const defaultDate = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())} UTC`;
    const formattedDate = firmadoEn || defaultDate;

    return (
        <div className={`doc-stamp-preview-container ${className}`}>
            <div className="doc-stamp-display-wrapper">
                <div className="diitra-official-stamp" role="region" aria-label="Sello Institucional DIITRA">
                    {/* Encabezado Azul Institucional */}
                    <div className="stamp-header">
                        <span>FIRMA INSTITUCIONAL DIITRA</span>
                    </div>

                    {/* Cuerpo de 3 Columnas */}
                    <div className="stamp-body-grid">
                        {/* Columna 1: Trazo Manuscrito */}
                        <div className="stamp-col-stroke">
                            {firmaImagenB64 ? (
                                <img
                                    src={firmaImagenB64}
                                    alt="Trazo de firma digital"
                                    className="stamp-stroke-img"
                                />
                            ) : (
                                <div className="stamp-initials-box">
                                    {getInitials(nombreFirmante)}
                                </div>
                            )}
                        </div>

                        {/* Columna 2: Datos Institucionales */}
                        <div className="stamp-col-data">
                            <div className="stamp-signer-name whitespace-pre-line">
                                {formatMultiLineName(nombreFirmante)}
                            </div>

                            <div className="stamp-data-row">
                                <span className="stamp-data-label">Cargo:</span>
                                <span className="stamp-data-val" title={cargo}>{cargo || 'Docente Investigador'}</span>
                            </div>

                            <div className="stamp-data-row">
                                <span className="stamp-data-label">Departamento:</span>
                                <span className="stamp-data-val" title={departamento}>{departamento || 'Investigación'}</span>
                            </div>

                            {cedula && (
                                <div className="stamp-data-row">
                                    <span className="stamp-data-label">C.I.:</span>
                                    <span className="stamp-data-val">{cedula}</span>
                                </div>
                            )}

                            <div className="stamp-data-row">
                                <span className="stamp-data-label">Firmado:</span>
                                <span className="stamp-data-val">{formattedDate}</span>
                            </div>

                            <div className="stamp-data-row">
                                <span className="stamp-data-label">Código:</span>
                                <span className="stamp-data-val code">{firmaCode}</span>
                            </div>
                        </div>

                        {/* Columna 3: QR de Verificación y Seguridad */}
                        <div className="stamp-col-qr">
                            <div className="stamp-qr-matrix">
                                <svg viewBox="0 0 33 33" width="34" height="34" fill="#0f172a">
                                    <rect x="0" y="0" width="10" height="10" fill="#0a3264" />
                                    <rect x="2" y="2" width="6" height="6" fill="#ffffff" />
                                    <rect x="3.5" y="3.5" width="3" height="3" fill="#0a3264" />

                                    <rect x="23" y="0" width="10" height="10" fill="#0a3264" />
                                    <rect x="25" y="2" width="6" height="6" fill="#ffffff" />
                                    <rect x="26.5" y="3.5" width="3" height="3" fill="#0a3264" />

                                    <rect x="0" y="23" width="10" height="10" fill="#0a3264" />
                                    <rect x="2" y="25" width="6" height="6" fill="#ffffff" />
                                    <rect x="3.5" y="26.5" width="3" height="3" fill="#0a3264" />

                                    <rect x="12" y="2" width="3" height="3" />
                                    <rect x="17" y="2" width="3" height="3" />
                                    <rect x="14" y="6" width="3" height="3" />
                                    <rect x="12" y="12" width="4" height="4" />
                                    <rect x="18" y="13" width="3" height="3" />
                                    <rect x="2" y="14" width="3" height="3" />
                                    <rect x="6" y="17" width="3" height="3" />
                                    <rect x="24" y="13" width="3" height="3" />
                                    <rect x="28" y="16" width="3" height="3" />
                                    <rect x="13" y="24" width="4" height="4" />
                                    <rect x="19" y="27" width="3" height="3" />
                                    <rect x="25" y="23" width="4" height="4" />
                                </svg>
                            </div>
                            <span className="stamp-qr-label">Verificar</span>
                        </div>
                    </div>

                    {/* Footer Legal Idéntico al Backend */}
                    <div className="stamp-footer">
                        Firma institucional DIITRA · Departamento de Investigación e Innovación Traversari · Verificar en: https://diitra.istpet.edu.ec
                    </div>
                </div>
            </div>
        </div>
    );
};
