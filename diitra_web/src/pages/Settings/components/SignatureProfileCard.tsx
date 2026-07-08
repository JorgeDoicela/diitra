import React, { useEffect, useState, useRef } from 'react';
import { getSignatureProfile, updateSignatureProfile } from '../../../services/signaturesService';
import type { UserSignatureProfileDto } from '../../../services/signaturesService';
import { SignaturePad } from './SignaturePad';
import './SignatureProfileCard.css';

type SignatureMode = 'auto' | 'upload' | 'draw';

export const SignatureProfileCard: React.FC = () => {
    const [profile, setProfile] = useState<UserSignatureProfileDto | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [cargo, setCargo] = useState('');
    const [departamento, setDepartamento] = useState('');
    const [firmaImagenB64, setFirmaImagenB64] = useState<string | undefined>(undefined);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    // Nuevas configuraciones de modalidad
    const [activeMode, setActiveMode] = useState<SignatureMode>('auto');
    const [autoText, setAutoText] = useState('');
    const [selectedFont, setSelectedFont] = useState('Caveat');
    const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            setLoading(true);
            const data = await getSignatureProfile();
            setProfile(data);
            setCargo(data.cargo || '');
            setDepartamento(data.departamento || '');
            setFirmaImagenB64(data.firmaImagenB64);
            
            // Nombre por defecto para firma automática
            const defaultName = localStorage.getItem('user_name') || '';
            setAutoText(defaultName);
        } catch (err) {
            console.error('Error al cargar perfil de firma:', err);
        } finally {
            setLoading(false);
        }
    };

    // Renderizar la firma con tipografía manuscrita en un canvas oculto y obtener el base64
    useEffect(() => {
        if (isEditing && activeMode === 'auto' && autoText) {
            const canvas = previewCanvasRef.current;
            if (!canvas) return;

            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // Cargar la fuente de Google Fonts de forma asíncrona en memoria antes de dibujar
            const fontSpec = `italic 42px "${selectedFont}"`;
            document.fonts.load(fontSpec).then(() => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                // Fondo transparente
                ctx.fillStyle = 'rgba(0,0,0,0)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Estilo del texto manuscrito
                ctx.fillStyle = '#0a3264'; // Azul institucional de la firma
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                // Aplicar la fuente seleccionada
                ctx.font = `italic 42px "${selectedFont}", cursive`;
                ctx.fillText(autoText, canvas.width / 2, canvas.height / 2);

                const base64 = canvas.toDataURL('image/png');
                setFirmaImagenB64(base64);
            }).catch((err) => {
                console.error("Error al precargar la tipografía cursiva:", err);
            });
        }
    }, [isEditing, activeMode, autoText, selectedFont]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setMessage({ text: 'Por favor, seleccione un archivo de imagen válido (PNG, JPG).', type: 'error' });
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const base64 = event.target?.result as string;
            setFirmaImagenB64(base64);
        };
        reader.readAsDataURL(file);
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firmaImagenB64) {
            setMessage({ text: 'Por favor, establezca su firma digital.', type: 'error' });
            return;
        }

        try {
            setSaving(true);
            setMessage(null);
            const updated = await updateSignatureProfile({
                cargo: cargo.trim() || undefined,
                departamento: departamento.trim() || undefined,
                firmaImagenB64
            });
            setProfile(updated);
            setIsEditing(false);
            setMessage({ text: 'Perfil de firma institucional guardado con éxito.', type: 'success' });
        } catch (err: any) {
            setMessage({ text: err.response?.data?.error || 'No se pudo guardar el perfil de firma.', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="signature-profile-loading">
                <div className="spinner"></div>
                <p>Cargando configuración de firma institucional...</p>
            </div>
        );
    }

    return (
        <div className="signature-profile-card">
            <div className="signature-profile-header">
                <div className="signature-profile-title-area">
                    <span className="badge-signature-status">DIITRA FIRMA</span>
                    <h3>Firma Digital Institucional</h3>
                    <p>Configure su perfil y trazo digital oficial para firmar documentos internos.</p>
                </div>
                {!isEditing && profile?.esConfigurado && (
                    <button 
                        type="button" 
                        onClick={() => setIsEditing(true)} 
                        className="btn-sig btn-sig-secondary"
                    >
                        Editar Perfil de Firma
                    </button>
                )}
            </div>

            {message && (
                <div className={`sig-alert sig-alert-${message.type}`}>
                    {message.text}
                </div>
            )}

            {!isEditing && !profile?.esConfigurado ? (
                <div className="sig-profile-empty">
                    <div className="empty-icon"></div>
                    <h4>Su firma no está configurada</h4>
                    <p>Para poder firmar protocolos de investigación, informes de avance u actas oficiales, debe configurar su trazo y cargo institucional.</p>
                    <button 
                        type="button" 
                        onClick={() => setIsEditing(true)} 
                        className="btn-sig btn-sig-primary"
                    >
                        Configurar Ahora
                    </button>
                </div>
            ) : !isEditing ? (
                <div className="sig-profile-details">
                    <div className="sig-details-grid">
                        <div className="sig-detail-item">
                            <span className="sig-label">Cargo Institucional:</span>
                            <span className="sig-value">{profile?.cargo || 'No asignado'}</span>
                        </div>
                        <div className="sig-detail-item">
                            <span className="sig-label">Departamento / Área:</span>
                            <span className="sig-value">{profile?.departamento || 'No asignado'}</span>
                        </div>
                        <div className="sig-detail-item">
                            <span className="sig-label">Estado del Perfil:</span>
                            <span className="sig-value text-success">● Listo para Firmar</span>
                        </div>
                        {profile?.actualizadoEn && (
                            <div className="sig-detail-item">
                                <span className="sig-label">Última Actualización:</span>
                                <span className="sig-value">
                                    {new Date(profile.actualizadoEn).toLocaleDateString()}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="sig-preview-section">
                        <span className="sig-label">Vista Previa de Trazo Oficial:</span>
                        <div className="sig-preview-box">
                            {profile?.firmaImagenB64 ? (
                                <img src={profile.firmaImagenB64} alt="Firma registrada" />
                            ) : (
                                <div className="no-image">No hay trazo registrado</div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSaveProfile} className="sig-profile-form">
                    <div className="sig-form-row">
                        <div className="sig-form-group">
                            <label htmlFor="sig-cargo">Cargo Institucional (opcional)</label>
                            <input 
                                id="sig-cargo"
                                type="text" 
                                value={cargo} 
                                onChange={(e) => setCargo(e.target.value)} 
                                placeholder="Ej: Director de Proyecto"
                            />
                        </div>
                        <div className="sig-form-group">
                            <label htmlFor="sig-dept">Departamento o Unidad Académica (opcional)</label>
                            <input 
                                id="sig-dept"
                                type="text" 
                                value={departamento} 
                                onChange={(e) => setDepartamento(e.target.value)} 
                                placeholder="Ej: Departamento de Investigación"
                            />
                        </div>
                    </div>

                    <div className="sig-mode-selector-wrapper">
                        <label className="sig-section-title-label">Seleccione el Método de Firma</label>
                        <div className="sig-mode-buttons">
                            <button
                                type="button"
                                className={`sig-mode-btn ${activeMode === 'auto' ? 'active' : ''}`}
                                onClick={() => {
                                    setActiveMode('auto');
                                    setFirmaImagenB64(undefined);
                                }}
                            >
                                Generación Automática
                            </button>
                            <button
                                type="button"
                                className={`sig-mode-btn ${activeMode === 'upload' ? 'active' : ''}`}
                                onClick={() => {
                                    setActiveMode('upload');
                                    setFirmaImagenB64(undefined);
                                }}
                            >
                                Cargar Imagen (Foto)
                            </button>
                            <button
                                type="button"
                                className={`sig-mode-btn ${activeMode === 'draw' ? 'active' : ''}`}
                                onClick={() => {
                                    setActiveMode('draw');
                                    setFirmaImagenB64(undefined);
                                }}
                            >
                                Dibujo Manual (Lienzo)
                            </button>
                        </div>
                    </div>

                    {/* RENDER SEGÚN MODO SELECCIONADO */}
                    <div className="sig-mode-workspace">
                        {activeMode === 'auto' && (
                            <div className="sig-mode-auto-workspace">
                                <div className="sig-form-group">
                                    <label htmlFor="sig-auto-text">Nombre a transformar en Firma</label>
                                    <input 
                                        id="sig-auto-text"
                                        type="text" 
                                        value={autoText} 
                                        onChange={(e) => setAutoText(e.target.value)}
                                        placeholder="Ingrese el texto de la firma"
                                    />
                                </div>
                                <div className="sig-form-group font-family-select">
                                    <label htmlFor="sig-font-select">Estilo de Letra Manuscrita</label>
                                    <select
                                        id="sig-font-select"
                                        value={selectedFont}
                                        onChange={(e) => setSelectedFont(e.target.value)}
                                    >
                                        <option value="Caveat">Estilo Casual (Caveat)</option>
                                        <option value="Dancing Script">Estilo Moderno (Dancing Script)</option>
                                        <option value="Sacramento">Estilo Delgado (Sacramento)</option>
                                        <option value="Alex Brush">Estilo Elegante (Alex Brush)</option>
                                        <option value="Great Vibes">Estilo Caligráfico (Great Vibes)</option>
                                        <option value="Pinyon Script">Estilo Formal (Pinyon Script)</option>
                                        <option value="Mrs Saint Delafield">Estilo Artístico (Mrs Saint Delafield)</option>
                                    </select>
                                </div>

                                <div className="sig-preview-section">
                                    <span className="sig-label">Vista Previa Automática:</span>
                                    <div className="sig-preview-box auto-signature-preview">
                                        <canvas 
                                            ref={previewCanvasRef} 
                                            width={500} 
                                            height={100}
                                            style={{ display: 'none' }}
                                        />
                                        {firmaImagenB64 ? (
                                            <img src={firmaImagenB64} alt="Previsualización de firma cursiva" />
                                        ) : (
                                            <span className="no-image">Escriba su nombre para generar</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeMode === 'upload' && (
                            <div className="sig-mode-upload-workspace">
                                <div className="sig-form-group">
                                    <label htmlFor="sig-file-upload">Subir Foto o Escaneo de Firma</label>
                                    <input 
                                        id="sig-file-upload"
                                        type="file" 
                                        accept="image/*"
                                        onChange={handleFileChange}
                                    />
                                    <span className="input-tip">
                                        Se recomienda usar un papel blanco liso con tinta azul o negra y buena iluminación.
                                    </span>
                                </div>
                                {firmaImagenB64 && (
                                    <div className="sig-preview-section">
                                        <span className="sig-label">Imagen cargada:</span>
                                        <div className="sig-preview-box">
                                            <img src={firmaImagenB64} alt="Firma subida" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeMode === 'draw' && (
                            <div className="sig-mode-draw-workspace">
                                <SignaturePad 
                                    defaultValue={firmaImagenB64}
                                    onSave={(base64) => setFirmaImagenB64(base64)}
                                />
                            </div>
                        )}
                    </div>

                    <div className="sig-form-actions">
                        <button 
                            type="button" 
                            onClick={() => {
                                setIsEditing(false);
                                setMessage(null);
                            }} 
                            className="btn-sig btn-sig-link"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit" 
                            disabled={saving || !firmaImagenB64}
                            className="btn-sig btn-sig-primary"
                        >
                            {saving ? 'Guardando...' : 'Guardar y Activar Firma'}
                        </button>
                    </div>
                </form>
            )}
            
            {/* Contenedor invisible para forzar la precarga en caché de todas las tipografías cursivas en el navegador */}
            <div style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', height: 0, overflow: 'hidden' }}>
                <span style={{ fontFamily: 'Caveat' }}>preload</span>
                <span style={{ fontFamily: 'Dancing Script' }}>preload</span>
                <span style={{ fontFamily: 'Sacramento' }}>preload</span>
                <span style={{ fontFamily: 'Alex Brush' }}>preload</span>
                <span style={{ fontFamily: 'Great Vibes' }}>preload</span>
                <span style={{ fontFamily: 'Pinyon Script' }}>preload</span>
                <span style={{ fontFamily: 'Mrs Saint Delafield' }}>preload</span>
            </div>
        </div>
    );
};
