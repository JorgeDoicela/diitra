import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useSignatureProfile } from './useSignatureProfile';
import { useImageCropper } from './useImageCropper';
import { AutoSignatureTab } from './AutoSignatureTab';
import { UploadSignatureTab } from './UploadSignatureTab';
import { DrawSignatureTab } from './DrawSignatureTab';
import './SignatureProfileCard.css';

export const SignatureProfileCard: React.FC = () => {
    const sig     = useSignatureProfile();
    const cropper = useImageCropper();
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const handleSaveProfile = (e: React.FormEvent) => {
        e.preventDefault();
        if (!sig.cargo.trim()) {
            sig.setMessage({ text: 'Por favor, ingrese su Cargo Institucional.', type: 'error' });
            return;
        }
        if (!sig.departamento.trim()) {
            sig.setMessage({ text: 'Por favor, ingrese su Departamento o Unidad Académica.', type: 'error' });
            return;
        }
        if (!sig.firmaImagenB64) {
            sig.setMessage({ text: 'Por favor, establezca su firma digital.', type: 'error' });
            return;
        }
        setShowConfirmModal(true);
    };

    const handleConfirmSave = async () => {
        setShowConfirmModal(false);
        await sig.executeSaveProfile();
    };

    if (sig.loading) {
        return (
            <div className="signature-profile-loading">
                <div className="spinner" />
                <p>Cargando configuración de firma institucional...</p>
            </div>
        );
    }

    return (
        <div className="signature-profile-card">
            <div className="signature-profile-header">
                <div className="signature-profile-title-area">
                    <h3>Firma Digital Institucional</h3>
                    <p>Configure su perfil y trazo digital oficial para firmar documentos internos.</p>
                </div>
                {!sig.isEditing && sig.profile?.esConfigurado && (
                    <button type="button" onClick={() => sig.setIsEditing(true)} className="btn-vercel-secondary text-xs">
                        Editar Perfil de Firma
                    </button>
                )}
            </div>

            {sig.message && (
                <div className={`sig-alert sig-alert-${sig.message.type}`}>{sig.message.text}</div>
            )}

            {/* ── VISTA VACÍA ───────────────────────────────────────────── */}
            {!sig.isEditing && !sig.profile?.esConfigurado && (
                <div className="sig-profile-empty" onClick={() => sig.setIsEditing(true)} role="button" tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); sig.setIsEditing(true); } }}
                    aria-label="Configurar firma digital">
                    <div className="empty-icon" />
                    <h4>Su firma no está configurada</h4>
                    <p>Para poder firmar protocolos de investigación, informes de avance u actas oficiales, debe configurar su trazo y cargo institucional.</p>
                    <button type="button" onClick={(e) => { e.stopPropagation(); sig.setIsEditing(true); }} className="btn-vercel-primary text-xs">
                        Configurar Ahora
                    </button>
                </div>
            )}

            {/* ── VISTA DE DETALLE (READ-ONLY) ─────────────────────────── */}
            {!sig.isEditing && sig.profile?.esConfigurado && (
                <div className="sig-profile-details">
                    <div className="sig-details-grid">
                        <div className="sig-detail-item">
                            <span className="sig-label">Cargo Institucional:</span>
                            <span className="sig-value">{sig.profile?.cargo || 'No asignado'}</span>
                        </div>
                        <div className="sig-detail-item">
                            <span className="sig-label">Departamento / Área:</span>
                            <span className="sig-value">{sig.profile?.departamento || 'No asignado'}</span>
                        </div>
                        <div className="sig-detail-item">
                            <span className="sig-label">Estado del Perfil:</span>
                            <span className="sig-value text-success">● Listo para Firmar</span>
                        </div>
                        {sig.profile?.actualizadoEn && (
                            <div className="sig-detail-item">
                                <span className="sig-label">Última Actualización:</span>
                                <span className="sig-value">{new Date(sig.profile.actualizadoEn).toLocaleDateString()}</span>
                            </div>
                        )}
                    </div>
                    <div className="sig-preview-section">
                        <span className="sig-label">Vista Previa de Trazo Oficial:</span>
                        <div className="sig-preview-box">
                            {sig.profile?.firmaImagenB64
                                ? <img src={sig.profile.firmaImagenB64} alt="Firma registrada" />
                                : <div className="no-image">No hay trazo registrado</div>}
                        </div>
                    </div>
                </div>
            )}

            {/* ── FORMULARIO DE EDICIÓN ─────────────────────────────────── */}
            {sig.isEditing && (
                <form onSubmit={handleSaveProfile} className="sig-profile-form">
                    <div className="sig-form-row">
                        <div className="sig-form-group">
                            <label htmlFor="sig-cargo">Cargo Institucional <span style={{ color: '#ef4444' }}>*</span></label>
                            <input id="sig-cargo" type="text" value={sig.cargo} onChange={(e) => sig.setCargo(e.target.value)} placeholder="Ej: Director de Proyecto" />
                        </div>
                        <div className="sig-form-group">
                            <label htmlFor="sig-dept">Departamento o Unidad Académica <span style={{ color: '#ef4444' }}>*</span></label>
                            <input id="sig-dept" type="text" value={sig.departamento} onChange={(e) => sig.setDepartamento(e.target.value)} placeholder="Ej: Departamento de Investigación" />
                        </div>
                    </div>

                    {/* Selector de modo */}
                    <div className="sig-mode-selector-wrapper">
                        <label className="sig-section-title-label">Seleccione el Método de Firma</label>
                        <div className="sig-mode-buttons">
                            {(['auto', 'upload', 'draw'] as const).map((mode) => (
                                <button key={mode} type="button" className={`sig-mode-btn ${sig.activeMode === mode ? 'active' : ''}`} onClick={() => sig.selectMode(mode)}>
                                    {mode === 'auto' ? 'Generación Automática' : mode === 'upload' ? 'Cargar Imagen (Foto)' : 'Dibujo Manual (Lienzo)'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Workspace del modo activo */}
                    <div className="sig-mode-workspace">
                        {sig.activeMode === 'auto' && (
                            <AutoSignatureTab
                                autoText={sig.autoText}
                                selectedFont={sig.selectedFont}
                                firmaImagenB64={sig.firmaImagenB64}
                                onAutoTextChange={sig.setAutoText}
                                onFontChange={sig.setSelectedFont}
                                onSignatureGenerated={sig.updateFirmaAuto}
                            />
                        )}
                        {sig.activeMode === 'upload' && (
                            <UploadSignatureTab
                                {...cropper}
                                firmaImagenB64={sig.firmaImagenB64}
                                onSuccess={sig.updateFirmaUpload}
                                onError={(msg) => sig.setMessage({ text: msg, type: 'error' })}
                            />
                        )}
                        {sig.activeMode === 'draw' && (
                            <DrawSignatureTab
                                firmaDrawB64={sig.firmaDrawB64}
                                onSignatureChange={sig.updateFirmaDraw}
                            />
                        )}
                    </div>

                    <div className="sig-form-actions">
                        <button type="button" onClick={sig.cancelEdit} className="btn-vercel-secondary text-xs">Cancelar</button>
                        <button type="submit" disabled={sig.saving || !sig.firmaImagenB64} className="btn-vercel-primary text-xs">
                            {sig.saving ? 'Guardando...' : 'Guardar y Activar Firma'}
                        </button>
                    </div>
                </form>
            )}

            {/* Precarga de tipografías cursivas */}
            <div style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', height: 0, overflow: 'hidden' }}>
                {['Caveat','Dancing Script','Sacramento','Alex Brush','Great Vibes','Pinyon Script','Mrs Saint Delafield'].map(f => (
                    <span key={f} style={{ fontFamily: f }}>preload</span>
                ))}
            </div>

            {/* ── MODAL DE CONFIRMACIÓN ─────────────────────────────────── */}
            {showConfirmModal && createPortal(
                <div className="sig-modal-overlay">
                    <div className="sig-modal-backdrop" onClick={() => setShowConfirmModal(false)} />
                    <div className="sig-modal-content">
                        <div className="sig-modal-header">
                            <div className="sig-modal-badge-container">
                                <span className="sig-modal-badge-id">FIRMA-DIGITAL</span>
                                <div className="sig-modal-badge-status">
                                    <span className="status-dot" />
                                    <span>Configuración Activa</span>
                                </div>
                            </div>
                            <button type="button" className="sig-modal-close-btn" onClick={() => setShowConfirmModal(false)}>
                                <X size={18} />
                            </button>
                        </div>
                        <div className="sig-modal-title-area">
                            <h2>Confirmar Firma Digital</h2>
                            <p>Esta información se incrustará de manera oficial al estampar su firma en los documentos.</p>
                        </div>
                        <div className="sig-modal-body">
                            <p>¿Está seguro de que desea guardar y activar su perfil de firma digital con los siguientes datos?</p>
                            <div className="sig-modal-summary-card">
                                <div className="sig-modal-summary-item">
                                    <span className="sig-modal-summary-label">Nombre de la Firma</span>
                                    <span className="sig-modal-summary-value">{sig.autoText || sig.toTitleCase(sig.cargo)}</span>
                                </div>
                                <div className="sig-modal-summary-item">
                                    <span className="sig-modal-summary-label">Cargo</span>
                                    <span className="sig-modal-summary-value">{sig.cargo.trim()}</span>
                                </div>
                                <div className="sig-modal-summary-item">
                                    <span className="sig-modal-summary-label">Departamento / Área</span>
                                    <span className="sig-modal-summary-value">{sig.departamento.trim()}</span>
                                </div>
                                <div className="sig-modal-summary-item sig-modal-summary-preview">
                                    <span className="sig-modal-summary-label">Firma Oficial</span>
                                    <div className="sig-modal-preview-box">
                                        <img src={sig.firmaImagenB64} alt="Firma a guardar" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="sig-modal-footer">
                            <button type="button" className="btn-sig btn-sig-secondary" onClick={() => setShowConfirmModal(false)}>Cancelar</button>
                            <button type="button" className="btn-sig btn-sig-primary" onClick={handleConfirmSave}>Confirmar y Activar</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};
