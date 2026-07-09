import React from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import type { ImageCropperState } from './useImageCropper';

interface UploadSignatureTabProps extends ImageCropperState {
    firmaImagenB64: string | undefined;
    onSuccess: (b64: string) => void;
    onError: (msg: string) => void;
}

export const UploadSignatureTab: React.FC<UploadSignatureTabProps> = ({
    imageSrc, crop, rotation, showCropper,
    threshold, inkMode, aspectRatio, previewBase64, isDragging, imgRef,
    setCrop, setCompletedCrop, setRotation, setThreshold, setInkMode,
    handleAspectChange, handleFileChange, handleDragOver, handleDragLeave,
    handleDrop, onImageLoad, applyCropAndFilters, cancelCrop,
    firmaImagenB64, onSuccess, onError,
}) => {

    if (imageSrc && showCropper) {
        return (
            <div className="sig-cropper-container">
                {/* Visor del Cropper */}
                <div className="sig-cropper-wrapper">
                    <ReactCrop crop={crop} onChange={(c) => setCrop(c)} onComplete={(c) => setCompletedCrop(c)} aspect={aspectRatio}>
                        <img
                            ref={imgRef}
                            src={imageSrc}
                            alt="Foto para recortar"
                            style={{ maxHeight: '460px', maxWidth: '100%', transform: `rotate(${rotation}deg)`, transformOrigin: 'center center', display: 'block' }}
                            onLoad={onImageLoad}
                        />
                    </ReactCrop>
                </div>

                {/* Panel de Control */}
                <div className="sig-cropper-controls">
                    <input id="sig-file-upload-change" type="file" accept="image/*" onChange={(e) => handleFileChange(e, onError)} style={{ display: 'none' }} />

                    <div className="sig-control-grid-layout" style={{ gridTemplateColumns: '1fr' }}>
                        <div className="sig-control-group">
                            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                <span className="sig-control-label">Girar Ángulo</span>
                                <span className="sig-value-indicator">{rotation}°</span>
                            </div>
                            <input type="range" value={rotation} min={0} max={360} step={1} onChange={(e) => setRotation(Number(e.target.value))} className="sig-rotation-range" />
                        </div>
                    </div>

                    <div className="sig-control-group" style={{ borderTop: '1px dashed var(--border)', paddingTop: '10px', marginTop: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                            <span className="sig-control-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                Limpieza de Fondo (Filtro)
                                <span className="sig-tooltip-trigger" data-tooltip="Borra sombras y suciedad del papel para dejar solo la firma transparente.">
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="sig-info-icon">
                                        <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
                                    </svg>
                                </span>
                            </span>
                            <span className="sig-value-indicator">{threshold}</span>
                        </div>
                        <input type="range" value={threshold} min={5} max={40} step={1} onChange={(e) => setThreshold(Number(e.target.value))} className="sig-zoom-range" />
                    </div>

                    {/* Formato de caja */}
                    <div className="sig-control-group sig-control-segmented-group" style={{ borderTop: '1px dashed var(--border)', paddingTop: '10px', marginTop: '4px' }}>
                        <span className="sig-control-label">Formato de Caja</span>
                        <div className="sig-segmented-control sig-segmented-control-grid" style={{ marginTop: '4px' }}>
                            {[
                                { value: 3,         label: 'Horizontal (3:1)', icon: <rect x="2" y="6" width="20" height="12" rx="1.5" /> },
                                { value: 2,         label: 'Estándar (2:1)',   icon: <rect x="3" y="5" width="18" height="14" rx="1.5" /> },
                                { value: 1.2,       label: 'Compacto',         icon: <rect x="5" y="4" width="14" height="16" rx="1.5" /> },
                                { value: undefined, label: 'Libre',            icon: <><path d="M6.13 1L6 16a2 2 0 0 0 2 2h15" /><path d="M1 6.13L16 6a2 2 0 0 1 2 2v15" /></> },
                            ].map((btn) => (
                                <button key={String(btn.value)} type="button" className={`sig-segment-btn ${aspectRatio === btn.value ? 'active' : ''}`} onClick={() => handleAspectChange(btn.value)}>
                                    <span className="sig-segment-icon">
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill={btn.value !== undefined ? 'currentColor' : 'none'} fillOpacity={btn.value !== undefined ? '0.15' : undefined} stroke="currentColor" strokeWidth="1.8">{btn.icon}</svg>
                                    </span>
                                    {btn.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tinta de salida */}
                    <div className="sig-control-group sig-control-segmented-group" style={{ borderTop: '1px dashed var(--border)', paddingTop: '10px', marginTop: '4px' }}>
                        <span className="sig-control-label">Tinta de Salida</span>
                        <div className="sig-segmented-control" style={{ marginTop: '4px' }}>
                            {(['blue', 'black', 'original'] as const).map((mode) => (
                                <button key={mode} type="button" className={`sig-segment-btn ${inkMode === mode ? 'active' : ''}`} onClick={() => setInkMode(mode)}>
                                    <span className={`sig-color-dot dot-${mode}`} />
                                    {mode === 'blue' ? 'Azul' : mode === 'black' ? 'Negro' : 'Original'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {previewBase64 && (
                        <div className="sig-preview-section" style={{ marginTop: '4px', borderTop: '1px dashed var(--border)', paddingTop: '10px' }}>
                            <span className="sig-control-label">Vista Previa en Documento</span>
                            <div className="sig-preview-paper">
                                <div className="sig-paper-watermark">DIITRA</div>
                                <div className="sig-paper-content">
                                    <img src={previewBase64} alt="Previsualización adaptativa" className="sig-paper-signature" style={{ maxHeight: '90%', maxWidth: '90%' }} />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="sig-cropper-actions">
                        <button type="button" className="btn-sig btn-sig-link btn-sig-back" onClick={cancelCrop}>Atrás</button>
                        <div className="sig-cropper-right-actions">
                            <button type="button" className="btn-sig btn-sig-secondary" onClick={() => document.getElementById('sig-file-upload-change')?.click()}>
                                Elegir otra foto
                            </button>
                            <button type="button" className="btn-sig btn-sig-primary" onClick={() => applyCropAndFilters(onSuccess, onError)}>
                                Limpiar y Aplicar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Vista de zona de carga (dropzone)
    return (
        <>
            <div
                className={`sig-upload-dropzone ${isDragging ? 'dragging' : ''} ${firmaImagenB64 ? 'sig-upload-dropzone-compact' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, onError)}
                onClick={() => document.getElementById('sig-file-upload')?.click()}
            >
                <input id="sig-file-upload" type="file" accept="image/*" onChange={(e) => handleFileChange(e, onError)} style={{ display: 'none' }} />
                <div className="sig-upload-icon">
                    <svg width={firmaImagenB64 ? '20' : '36'} height={firmaImagenB64 ? '20' : '36'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                </div>
                <div className="sig-upload-text">
                    {firmaImagenB64
                        ? <>Arrastra otra foto aquí o <span>explora archivos</span> para cambiarla</>
                        : <>Arrastra tu foto de firma aquí o <span>explora archivos</span></>}
                </div>
                {!firmaImagenB64 && (
                    <div className="sig-upload-limit-text">
                        Recomendado: Papel liso y tinta oscura. Se limpia el fondo automáticamente.
                    </div>
                )}
            </div>

            {firmaImagenB64 && (
                <div className="sig-preview-section" style={{ marginTop: '16px' }}>
                    <span className="sig-label">Imagen optimizada y limpia (Vista Previa en Documento):</span>
                    <div className="sig-preview-paper" style={{ height: '220px' }}>
                        <div className="sig-paper-watermark" style={{ fontSize: '4.5rem' }}>DIITRA</div>
                        <div className="sig-paper-content">
                            <img src={firmaImagenB64} alt="Firma subida" className="sig-paper-signature" style={{ maxHeight: '96%', maxWidth: '96%' }} />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
