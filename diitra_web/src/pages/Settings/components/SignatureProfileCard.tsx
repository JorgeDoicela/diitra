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
    const sig = useSignatureProfile();
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
                {['Caveat', 'Dancing Script', 'Sacramento', 'Alex Brush', 'Great Vibes', 'Pinyon Script', 'Mrs Saint Delafield'].map(f => (
                    <span key={f} style={{ fontFamily: f }}>preload</span>
                ))}
            </div>

            {/* ── MODAL DE CONFIRMACIÓN ─────────────────────────────────── */}
            {showConfirmModal && createPortal(
                <div className="sig-modal-overlay">
                    <div className="sig-modal-backdrop" onClick={() => setShowConfirmModal(false)} />

                    <div className="relative w-full max-w-2xl h-full bg-surface border-l border-border-thin flex flex-col z-10 animate-fade-up">
                        {/* Cabecera idéntica a Convocatoria */}
                        <div className="flex items-center justify-between px-8 py-6 border-b border-border-thin bg-surface">
                            <div className="flex items-center gap-3">
                                <span className="px-2.5 py-1 bg-bg-deep text-text-dim border border-border-thin text-[10px] font-mono uppercase rounded-md">
                                    FIRMA-DIGITAL
                                </span>
                                <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-brand">
                                    <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
                                    <span>Configuración Activa</span>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowConfirmModal(false)}
                                className="p-2 rounded-lg text-text-dim hover:text-text-main hover:bg-surface-hover transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Contenido (Scrollable) con Bento Cards de dos columnas */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-surface text-left">
                            <div className="space-y-4">
                                <h2 className="text-3xl font-bold tracking-tight text-text-main leading-tight font-sans">
                                    Confirmar Firma Digital
                                </h2>
                                <p className="text-sm text-text-dim leading-relaxed font-medium">
                                    Esta información se incrustará de manera oficial al estampar su firma en los documentos. ¿Está seguro de que desea guardar y activar su perfil con los siguientes datos?
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bento-card static p-5 space-y-1.5 col-span-2">
                                    <div className="text-[10px] font-bold text-text-dim uppercase tracking-widest">
                                        Nombre de la Firma
                                    </div>
                                    <div className="text-sm font-bold text-text-main font-sans">
                                        {sig.autoText || sig.toTitleCase(sig.cargo)}
                                    </div>
                                </div>
                                <div className="bento-card static p-5 space-y-1.5">
                                    <div className="text-[10px] font-bold text-text-dim uppercase tracking-widest">
                                        Cargo
                                    </div>
                                    <div className="text-sm font-bold text-text-main font-sans">
                                        {sig.cargo.trim()}
                                    </div>
                                </div>
                                <div className="bento-card static p-5 space-y-1.5">
                                    <div className="text-[10px] font-bold text-text-dim uppercase tracking-widest">
                                        Departamento / Área
                                    </div>
                                    <div className="text-sm font-bold text-text-main font-sans">
                                        {sig.departamento.trim()}
                                    </div>
                                </div>
                                <div className="bento-card static p-5 space-y-3 col-span-2">
                                    <div className="text-[10px] font-bold text-text-dim uppercase tracking-widest">
                                        Firma Oficial
                                    </div>
                                    <div className="sig-modal-preview-box">
                                        <img src={sig.firmaImagenB64} alt="Firma a guardar" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Pie de página con botones fluidos y borde superior */}
                        <div className="p-8 border-t border-border-thin bg-surface flex gap-4">
                            <button
                                type="button"
                                onClick={() => setShowConfirmModal(false)}
                                className="btn-vercel-secondary flex-1"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmSave}
                                className="btn-vercel-primary flex-1"
                            >
                                Confirmar y Activar
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};
