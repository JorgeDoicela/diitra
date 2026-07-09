import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { getSignatureProfile, updateSignatureProfile } from '../../../services/signaturesService';
import type { UserSignatureProfileDto } from '../../../services/signaturesService';
import { SignaturePad } from './SignaturePad';
import { useAuth } from '../../../api/AuthContext';
import Compressor from 'compressorjs';
import ReactCrop from 'react-image-crop';
import type { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { X } from 'lucide-react';
import './SignatureProfileCard.css';

type SignatureMode = 'auto' | 'upload' | 'draw';

export const SignatureProfileCard: React.FC = () => {
    const { user } = useAuth();
    const [profile, setProfile] = useState<UserSignatureProfileDto | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [cargo, setCargo] = useState('');
    const [departamento, setDepartamento] = useState('');
    const [firmaImagenB64, setFirmaImagenB64] = useState<string | undefined>(undefined);
    const [firmaAutoB64, setFirmaAutoB64] = useState<string | undefined>(undefined);
    const [firmaUploadB64, setFirmaUploadB64] = useState<string | undefined>(undefined);
    const [firmaDrawB64, setFirmaDrawB64] = useState<string | undefined>(undefined);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    // Nuevas configuraciones de modalidad
    const [activeMode, setActiveMode] = useState<SignatureMode>('auto');
    const [autoText, setAutoText] = useState('');
    const [selectedFont, setSelectedFont] = useState('Caveat');
    const [isDragging, setIsDragging] = useState(false);

    // Estados para el visor de recorte interactivo (react-image-crop)
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
    const [rotation, setRotation] = useState(0);
    const [showCropper, setShowCropper] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);

    // Parámetros interactivos de limpieza adaptativa (vida real)
    const [threshold, setThreshold] = useState(14);
    const [inkMode, setInkMode] = useState<'blue' | 'black' | 'original'>('blue');
    const [aspectRatio, setAspectRatio] = useState<number | undefined>(2); // 2:1 por defecto, soporta undefined para libre
    const [previewBase64, setPreviewBase64] = useState<string>('');

    const toTitleCase = (str: string): string => {
        return str
            .toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    useEffect(() => {
        loadProfile();
    }, [user]); // recargar si cambia el usuario

    const loadProfile = async () => {
        try {
            setLoading(true);
            const data = await getSignatureProfile();
            setProfile(data);
            setCargo(data.cargo || '');
            setDepartamento(data.departamento || '');
            setFirmaImagenB64(data.firmaImagenB64);
            setFirmaUploadB64(data.firmaImagenB64);
            setFirmaDrawB64(data.firmaImagenB64);
 
            // Nombre por defecto para firma automática en Title Case
            const defaultName = toTitleCase(user?.nombre_completo || '');
            setAutoText(defaultName);
        } catch (err) {
            console.error('Error al cargar perfil de firma:', err);
        } finally {
            setLoading(false);
        }
    };

    // Renderizar la firma con tipografía manuscrita en un canvas en memoria y obtener el base64
    useEffect(() => {
        let active = true;
        if (isEditing && activeMode === 'auto' && autoText) {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const baseFontSize = 80; // Resolución balanceada y óptima
            const fontSpec = `italic ${baseFontSize}px "${selectedFont}"`;
            
            document.fonts.load(fontSpec).then(() => {
                if (!active) return;
                
                // Medir ancho del texto en un canvas temporal para calcular dimensiones precisas
                ctx.font = `italic ${baseFontSize}px "${selectedFont}", cursive`;
                const textWidth = ctx.measureText(autoText).width;
                
                // Dimensionar canvas al tamaño justo del texto + holgura para florituras
                const paddingX = 60;
                const canvasWidth = Math.max(300, Math.ceil(textWidth + paddingX));
                const canvasHeight = Math.ceil(baseFontSize * 1.6); // Reducido el factor para eliminar el "aire" vertical

                canvas.width = canvasWidth;
                canvas.height = canvasHeight;

                // Limpiar y configurar contexto del canvas definitivo
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = 'rgba(0,0,0,0)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Estilo del texto manuscrito
                ctx.fillStyle = '#0a3264'; // Azul institucional de la firma
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.font = `italic ${baseFontSize}px "${selectedFont}", cursive`;

                // Dibujar en el centro exacto del lienzo justo
                ctx.fillText(autoText, canvas.width / 2, canvas.height / 2);

                const base64 = canvas.toDataURL('image/png');
                setFirmaAutoB64(base64);
                setFirmaImagenB64(base64);
            }).catch((err) => {
                console.error("Error al precargar la tipografía cursiva:", err);
            });
        }

        return () => {
            active = false;
        };
    }, [isEditing, activeMode, autoText, selectedFont]);

    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const processFile = (file: File) => {
        if (!file.type.startsWith('image/')) {
            setMessage({ text: 'Por favor, seleccione un archivo de imagen válido (PNG, JPG).', type: 'error' });
            return;
        }

        // Corregir orientación EXIF y realizar compresión inicial
        new Compressor(file, {
            quality: 0.8,
            maxWidth: 1200,
            maxHeight: 1200,
            success(result) {
                const blobUrl = URL.createObjectURL(result as File);
                setImageSrc(blobUrl);
                setShowCropper(true);
            },
            error(err) {
                console.error('Error al comprimir/rotar la firma:', err);
                const rawUrl = URL.createObjectURL(file);
                setImageSrc(rawUrl);
                setShowCropper(true);
            }
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            processFile(file);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            processFile(file);
        }
    };

    const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const { width, height } = e.currentTarget;
        let initialCrop;
        if (aspectRatio) {
            let cropWidth = 100;
            let cropHeight = ((width / aspectRatio) / height) * 100;
            if (cropHeight > 100) {
                cropHeight = 100;
                cropWidth = ((height * aspectRatio) / width) * 100;
            }
            initialCrop = {
                unit: '%' as const,
                width: cropWidth,
                height: cropHeight,
                x: (100 - cropWidth) / 2,
                y: (100 - cropHeight) / 2
            };
        } else {
            initialCrop = {
                unit: '%' as const,
                width: 100,
                height: 100,
                x: 0,
                y: 0
            };
        }
        setCrop(initialCrop);
        
        const wPx = (initialCrop.width / 100) * width;
        const hPx = (initialCrop.height / 100) * height;
        setCompletedCrop({
            unit: 'px',
            x: (initialCrop.x / 100) * width,
            y: (initialCrop.y / 100) * height,
            width: wPx,
            height: hPx
        });
    };

    const handleAspectChange = (aspect: number | undefined) => {
        setAspectRatio(aspect);
        if (imgRef.current) {
            const { width, height } = imgRef.current;
            let newCrop;
            if (aspect) {
                let cropWidth = 100;
                let cropHeight = ((width / aspect) / height) * 100;
                if (cropHeight > 100) {
                    cropHeight = 100;
                    cropWidth = ((height * aspect) / width) * 100;
                }
                newCrop = {
                    unit: '%' as const,
                    width: cropWidth,
                    height: cropHeight,
                    x: (100 - cropWidth) / 2,
                    y: (100 - cropHeight) / 2
                };
            } else {
                newCrop = {
                    unit: '%' as const,
                    width: 100,
                    height: 100,
                    x: 0,
                    y: 0
                };
            }
            setCrop(newCrop);
            
            const wPx = (newCrop.width / 100) * width;
            const hPx = (newCrop.height / 100) * height;
            setCompletedCrop({
                unit: 'px',
                x: (newCrop.x / 100) * width,
                y: (newCrop.y / 100) * height,
                width: wPx,
                height: hPx
            });
        }
    };

    // Helper para recortar y rotar la firma usando canvas
    const getCroppedImg = (
        image: HTMLImageElement,
        pixelCrop: any,
        rotation = 0,
        ctx: CanvasRenderingContext2D
    ): Promise<void> => {
        return new Promise((resolve) => {
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            if (!tempCtx) {
                resolve();
                return;
            }

            const rotRad = (rotation * Math.PI) / 180;
            const maxLen = Math.sqrt(image.width * image.width + image.height * image.height);
            
            tempCanvas.width = maxLen;
            tempCanvas.height = maxLen;

            // Centrar y rotar la imagen original
            tempCtx.translate(maxLen / 2, maxLen / 2);
            tempCtx.rotate(rotRad);
            tempCtx.translate(-image.width / 2, -image.height / 2);
            tempCtx.drawImage(image, 0, 0);

            // Ajustar coordenadas para extraer la firma recortada
            const cropX = pixelCrop.x + (maxLen - image.width) / 2;
            const cropY = pixelCrop.y + (maxLen - image.height) / 2;

            ctx.drawImage(
                tempCanvas,
                cropX,
                cropY,
                pixelCrop.width,
                pixelCrop.height,
                0,
                0,
                pixelCrop.width,
                pixelCrop.height
            );
            resolve();
        });
    };

    // Algoritmo de Umbralización Adaptativa Local (0 dependencias pesadas, elimina sombras de la vida real)
    const applyAdaptiveThreshold = (
        canvas: HTMLCanvasElement,
        ctx: CanvasRenderingContext2D,
        thresholdValue: number,
        inkColorMode: 'blue' | 'black' | 'original'
    ) => {
        const width = canvas.width;
        const height = canvas.height;
        const imgData = ctx.getImageData(0, 0, width, height);
        const pixels = imgData.data;

        const output = ctx.createImageData(width, height);
        const outPixels = output.data;

        const radius = 8;
        const c = thresholdValue; // Controlado por el usuario en tiempo real

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;

                let sum = 0;
                let count = 0;
                const step = 4; // Optimización de rendimiento

                for (let dy = -radius; dy <= radius; dy += step) {
                    for (let dx = -radius; dx <= radius; dx += step) {
                        const nx = x + dx;
                        const ny = y + dy;

                        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                            const nIdx = (ny * width + nx) * 4;
                            const r = pixels[nIdx];
                            const g = pixels[nIdx + 1];
                            const b = pixels[nIdx + 2];
                            const luma = 0.299 * r + 0.587 * g + 0.114 * b;
                            sum += luma;
                            count++;
                        }
                    }
                }

                const localAverage = sum / count;
                const r = pixels[idx];
                const g = pixels[idx + 1];
                const b = pixels[idx + 2];
                const currentLuma = 0.299 * r + 0.587 * g + 0.114 * b;

                // Si es más brillante que el promedio local o cercano a blanco puro, es papel
                if (currentLuma > localAverage - c || currentLuma > 215) {
                    outPixels[idx] = 255;
                    outPixels[idx + 1] = 255;
                    outPixels[idx + 2] = 255;
                    outPixels[idx + 3] = 0; // Transparente
                } else {
                    // Modo de color de tinta elegido
                    if (inkColorMode === 'blue') {
                        outPixels[idx] = 10;
                        outPixels[idx + 1] = 50;
                        outPixels[idx + 2] = 100;
                        outPixels[idx + 3] = 255;
                    } else if (inkColorMode === 'black') {
                        outPixels[idx] = 0;
                        outPixels[idx + 1] = 0;
                        outPixels[idx + 2] = 0;
                        outPixels[idx + 3] = 255;
                    } else {
                        // Conservar color original de la pluma de la foto pero realzar el contraste
                        const factor = 1.6;
                        outPixels[idx] = Math.max(0, Math.min(255, (r - 128) * factor + 128));
                        outPixels[idx + 1] = Math.max(0, Math.min(255, (g - 128) * factor + 128));
                        outPixels[idx + 2] = Math.max(0, Math.min(255, (b - 128) * factor + 128));
                        outPixels[idx + 3] = pixels[idx + 3]; // Preservar alpha original
                    }
                }
            }
        }

        ctx.putImageData(output, 0, 0);
    };

    const applyCropAndFilters = async () => {
        if (!imageSrc || !completedCrop || !imgRef.current) return;

        try {
            const image = new Image();
            image.src = imageSrc;
            await new Promise((resolve, reject) => {
                image.onload = resolve;
                image.onerror = reject;
            });

            const imgElement = imgRef.current;
            const scaleX = image.naturalWidth / imgElement.width;
            const scaleY = image.naturalHeight / imgElement.height;

            const scaledCropPixels = {
                x: completedCrop.x * scaleX,
                y: completedCrop.y * scaleY,
                width: completedCrop.width * scaleX,
                height: completedCrop.height * scaleY
            };

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // Limitar dimensiones del canvas final recortado para optimizar base64
            const targetWidth = Math.min(scaledCropPixels.width, 800);
            const targetHeight = Math.round((scaledCropPixels.height * targetWidth) / scaledCropPixels.width);

            canvas.width = targetWidth;
            canvas.height = targetHeight;

            const drawCanvas = document.createElement('canvas');
            drawCanvas.width = scaledCropPixels.width;
            drawCanvas.height = scaledCropPixels.height;
            const drawCtx = drawCanvas.getContext('2d');
            if (!drawCtx) return;

            await getCroppedImg(image, scaledCropPixels, rotation, drawCtx);

            // Dibujar escalado en el canvas final
            ctx.drawImage(drawCanvas, 0, 0, targetWidth, targetHeight);

            // Limpiar fondo con umbralización adaptativa local parametrizada
            applyAdaptiveThreshold(canvas, ctx, threshold, inkMode);

            const finalBase64 = canvas.toDataURL('image/png');
            setFirmaUploadB64(finalBase64);
            setFirmaImagenB64(finalBase64);
            setShowCropper(false);
            setImageSrc(null);
        } catch (e) {
            console.error('Error al procesar la imagen de firma:', e);
            setMessage({ text: 'Ocurrió un error al procesar y recortar la firma.', type: 'error' });
        }
    };

    // Efecto asíncrono para generar previsualización del filtro en tiempo real con debounce
    useEffect(() => {
        if (!imageSrc || !completedCrop) return;

        let active = true;

        const generatePreview = async () => {
            try {
                const image = new Image();
                image.src = imageSrc;
                await new Promise((resolve, reject) => {
                    image.onload = resolve;
                    image.onerror = reject;
                });

                if (!active || !imgRef.current) return;

                const imgElement = imgRef.current;
                const scaleX = image.naturalWidth / imgElement.width;
                const scaleY = image.naturalHeight / imgElement.height;

                const scaledCropPixels = {
                    x: completedCrop.x * scaleX,
                    y: completedCrop.y * scaleY,
                    width: completedCrop.width * scaleX,
                    height: completedCrop.height * scaleY
                };

                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) return;

                // Ancho de previsualización pequeño para rendimiento fluido en tiempo real
                const previewWidth = 280;
                const previewHeight = Math.round((scaledCropPixels.height * previewWidth) / scaledCropPixels.width);

                canvas.width = previewWidth;
                canvas.height = previewHeight;

                const drawCanvas = document.createElement('canvas');
                drawCanvas.width = scaledCropPixels.width;
                drawCanvas.height = scaledCropPixels.height;
                const drawCtx = drawCanvas.getContext('2d');
                if (!drawCtx) return;

                await getCroppedImg(image, scaledCropPixels, rotation, drawCtx);

                if (!active) return;

                // Dibujar escalado a la previsualización
                ctx.drawImage(drawCanvas, 0, 0, previewWidth, previewHeight);

                // Aplicar el algoritmo adaptativo parametrizado
                applyAdaptiveThreshold(canvas, ctx, threshold, inkMode);

                if (!active) return;

                setPreviewBase64(canvas.toDataURL('image/png'));
            } catch (err) {
                // Falla silenciosa de previsualización
            }
        };

        const timer = setTimeout(generatePreview, 150);

        return () => {
            active = false;
            clearTimeout(timer);
        };
    }, [imageSrc, completedCrop, rotation, threshold, inkMode]);

    const handleSaveProfile = (e: React.FormEvent) => {
        e.preventDefault();
        if (!cargo.trim()) {
            setMessage({ text: 'Por favor, ingrese su Cargo Institucional.', type: 'error' });
            return;
        }
        if (!departamento.trim()) {
            setMessage({ text: 'Por favor, ingrese su Departamento o Unidad Académica.', type: 'error' });
            return;
        }
        if (!firmaImagenB64) {
            setMessage({ text: 'Por favor, establezca su firma digital.', type: 'error' });
            return;
        }

        setShowConfirmModal(true);
    };

    const executeSaveProfile = async () => {
        setShowConfirmModal(false);
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
                    <h3>Firma Digital Institucional</h3>
                    <p>Configure su perfil y trazo digital oficial para firmar documentos internos.</p>
                </div>
                {!isEditing && profile?.esConfigurado && (
                    <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="btn-vercel-secondary text-xs"
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
                <div 
                    className="sig-profile-empty"
                    onClick={() => setIsEditing(true)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setIsEditing(true);
                        }
                    }}
                    aria-label="Configurar firma digital"
                >
                    <div className="empty-icon"></div>
                    <h4>Su firma no está configurada</h4>
                    <p>Para poder firmar protocolos de investigación, informes de avance u actas oficiales, debe configurar su trazo y cargo institucional.</p>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsEditing(true);
                        }}
                        className="btn-vercel-primary text-xs"
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
                            <label htmlFor="sig-cargo">Cargo Institucional <span style={{ color: '#ef4444' }}>*</span></label>
                            <input
                                id="sig-cargo"
                                type="text"
                                value={cargo}
                                onChange={(e) => setCargo(e.target.value)}
                                placeholder="Ej: Director de Proyecto"
                            />
                        </div>
                        <div className="sig-form-group">
                            <label htmlFor="sig-dept">Departamento o Unidad Académica <span style={{ color: '#ef4444' }}>*</span></label>
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
                                    if (activeMode !== 'auto') {
                                        setActiveMode('auto');
                                        setFirmaImagenB64(firmaAutoB64);
                                    }
                                }}
                            >
                                Generación Automática
                            </button>
                            <button
                                type="button"
                                className={`sig-mode-btn ${activeMode === 'upload' ? 'active' : ''}`}
                                onClick={() => {
                                    if (activeMode !== 'upload') {
                                        setActiveMode('upload');
                                        setFirmaImagenB64(firmaUploadB64);
                                    }
                                }}
                            >
                                Cargar Imagen (Foto)
                            </button>
                            <button
                                type="button"
                                className={`sig-mode-btn ${activeMode === 'draw' ? 'active' : ''}`}
                                onClick={() => {
                                    if (activeMode !== 'draw') {
                                        setActiveMode('draw');
                                        setFirmaImagenB64(firmaDrawB64);
                                    }
                                }}
                            >
                                Dibujo Manual (Lienzo)
                            </button>
                        </div>
                    </div>

                    {/* RENDER SEGÚN MODO SELECCIONADO */}
                    <div className="sig-mode-workspace">
                        {activeMode === 'auto' && (
                            <div className="sig-auto-layout">
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

                                    <div className="sig-preview-section">
                                        <span className="sig-label">Vista Previa Automática:</span>
                                        <div className="sig-preview-box auto-signature-preview">
                                            {firmaImagenB64 ? (
                                                <img src={firmaImagenB64} alt="Previsualización de firma cursiva" />
                                            ) : (
                                                <span className="no-image">Escriba su nombre para generar</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="sig-form-group font-styles-panel">
                                    <label>Estilo de Letra Manuscrita</label>
                                    <div className="sig-fonts-grid">
                                        {[
                                            { id: 'Caveat', label: 'Casual', fontClass: 'font-caveat' },
                                            { id: 'Dancing Script', label: 'Moderna', fontClass: 'font-dancing' },
                                            { id: 'Sacramento', label: 'Fina', fontClass: 'font-sacramento' },
                                            { id: 'Alex Brush', label: 'Elegante', fontClass: 'font-alex' },
                                            { id: 'Great Vibes', label: 'Caligráfica', fontClass: 'font-vibes' },
                                            { id: 'Allura', label: 'Fluida', fontClass: 'font-allura' },
                                            { id: 'Pinyon Script', label: 'Formal', fontClass: 'font-pinyon' },
                                            { id: 'Mrs Saint Delafield', label: 'Artística', fontClass: 'font-delafield' }
                                        ].map((font) => (
                                            <button
                                                key={font.id}
                                                type="button"
                                                className={`sig-font-option-btn ${selectedFont === font.id ? 'active' : ''}`}
                                                onClick={() => setSelectedFont(font.id)}
                                            >
                                                <span className="sig-font-option-label">{font.label}</span>
                                                <span className={`sig-font-option-preview ${font.fontClass}`}>
                                                    {autoText.split(' ')[0] || 'Firma'}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeMode === 'upload' && (
                            <div className="sig-mode-upload-workspace">
                                {imageSrc && showCropper ? (
                                    <div className="sig-cropper-container">
                                        {/* Columna Izquierda: Visor del Cropper */}
                                        <div className="sig-cropper-wrapper">
                                            <ReactCrop
                                                crop={crop}
                                                onChange={(c) => setCrop(c)}
                                                onComplete={(c) => setCompletedCrop(c)}
                                                aspect={aspectRatio}
                                            >
                                                <img
                                                    ref={imgRef}
                                                    src={imageSrc}
                                                    alt="Foto para recortar"
                                                    style={{
                                                        maxHeight: '460px',
                                                        maxWidth: '100%',
                                                        transform: `rotate(${rotation}deg)`,
                                                        transformOrigin: 'center center',
                                                        display: 'block'
                                                    }}
                                                    onLoad={onImageLoad}
                                                />
                                            </ReactCrop>
                                         </div>

                                        {/* Columna Derecha: Panel de Control Vertical */}
                                        <div className="sig-cropper-controls">
                                            <input
                                                id="sig-file-upload-change"
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                                style={{ display: 'none' }}
                                            />
                                            <div className="sig-control-grid-layout" style={{ gridTemplateColumns: '1fr' }}>
                                                <div className="sig-control-group">
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                                        <span className="sig-control-label">
                                                            Girar Ángulo
                                                        </span>
                                                        <span className="sig-value-indicator">{rotation}°</span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        value={rotation}
                                                        min={0}
                                                        max={360}
                                                        step={1}
                                                        onChange={(e) => setRotation(Number(e.target.value))}
                                                        className="sig-rotation-range"
                                                    />
                                                </div>
                                            </div>

                                             <div className="sig-control-group" style={{ borderTop: '1px dashed var(--border)', paddingTop: '10px', marginTop: '4px' }}>
                                                 <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                                     <span className="sig-control-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                         Limpieza de Fondo (Filtro)
                                                         <span className="sig-tooltip-trigger" data-tooltip="Borra sombras y suciedad del papel para dejar solo la firma transparente.">
                                                             <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="sig-info-icon">
                                                                 <circle cx="12" cy="12" r="10" />
                                                                 <line x1="12" y1="16" x2="12" y2="12" />
                                                                 <line x1="12" y1="8" x2="12.01" y2="8" />
                                                             </svg>
                                                         </span>
                                                     </span>
                                                     <span className="sig-value-indicator">{threshold}</span>
                                                 </div>
                                                 <input
                                                     type="range"
                                                     value={threshold}
                                                     min={5}
                                                     max={40}
                                                     step={1}
                                                     onChange={(e) => setThreshold(Number(e.target.value))}
                                                     className="sig-zoom-range"
                                                 />
                                             </div>

                                            <div className="sig-control-group sig-control-segmented-group" style={{ borderTop: '1px dashed var(--border)', paddingTop: '10px', marginTop: '4px' }}>
                                                <span className="sig-control-label">
                                                    Formato de Caja
                                                </span>
                                                <div className="sig-segmented-control sig-segmented-control-grid" style={{ marginTop: '4px' }}>
                                                    <button
                                                        type="button"
                                                        className={`sig-segment-btn ${aspectRatio === 3 ? 'active' : ''}`}
                                                        onClick={() => handleAspectChange(3)}
                                                    >
                                                        <span className="sig-segment-icon">
                                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.8">
                                                                <rect x="2" y="6" width="20" height="12" rx="1.5" />
                                                            </svg>
                                                        </span>
                                                        Horizontal (3:1)
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className={`sig-segment-btn ${aspectRatio === 2 ? 'active' : ''}`}
                                                        onClick={() => handleAspectChange(2)}
                                                    >
                                                        <span className="sig-segment-icon">
                                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.8">
                                                                <rect x="3" y="5" width="18" height="14" rx="1.5" />
                                                            </svg>
                                                        </span>
                                                        Estándar (2:1)
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className={`sig-segment-btn ${aspectRatio === 1.2 ? 'active' : ''}`}
                                                        onClick={() => handleAspectChange(1.2)}
                                                    >
                                                        <span className="sig-segment-icon">
                                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.8">
                                                                <rect x="5" y="4" width="14" height="16" rx="1.5" />
                                                            </svg>
                                                        </span>
                                                        Compacto
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className={`sig-segment-btn ${aspectRatio === undefined ? 'active' : ''}`}
                                                        onClick={() => handleAspectChange(undefined)}
                                                        title="Recorte libre sin proporciones fijas"
                                                    >
                                                        <span className="sig-segment-icon">
                                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                                                <path d="M6.13 1L6 16a2 2 0 0 0 2 2h15" />
                                                                <path d="M1 6.13L16 6a2 2 0 0 1 2 2v15" />
                                                            </svg>
                                                        </span>
                                                        Libre
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="sig-control-group sig-control-segmented-group" style={{ borderTop: '1px dashed var(--border)', paddingTop: '10px', marginTop: '4px' }}>
                                                <span className="sig-control-label">
                                                    Tinta de Salida
                                                </span>
                                                <div className="sig-segmented-control" style={{ marginTop: '4px' }}>
                                                    <button
                                                        type="button"
                                                        className={`sig-segment-btn ${inkMode === 'blue' ? 'active' : ''}`}
                                                        onClick={() => setInkMode('blue')}
                                                    >
                                                        <span className="sig-color-dot dot-blue"></span>
                                                        Azul
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className={`sig-segment-btn ${inkMode === 'black' ? 'active' : ''}`}
                                                        onClick={() => setInkMode('black')}
                                                    >
                                                        <span className="sig-color-dot dot-black"></span>
                                                        Negro
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className={`sig-segment-btn ${inkMode === 'original' ? 'active' : ''}`}
                                                        onClick={() => setInkMode('original')}
                                                    >
                                                        <span className="sig-color-dot dot-original"></span>
                                                        Original
                                                    </button>
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
                                                 <button
                                                     type="button"
                                                     className="btn-sig btn-sig-link btn-sig-back"
                                                     onClick={() => {
                                                         setShowCropper(false);
                                                         setImageSrc(null);
                                                     }}
                                                 >
                                                     Atrás
                                                 </button>
                                                 <div className="sig-cropper-right-actions">
                                                     <button
                                                         type="button"
                                                         className="btn-sig btn-sig-secondary"
                                                         onClick={() => document.getElementById('sig-file-upload-change')?.click()}
                                                         title="Seleccionar otro archivo de imagen"
                                                     >
                                                         Elegir otra foto
                                                     </button>
                                                     <button
                                                         type="button"
                                                         className="btn-sig btn-sig-primary"
                                                         onClick={applyCropAndFilters}
                                                     >
                                                         Limpiar y Aplicar
                                                     </button>
                                                 </div>
                                             </div>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div
                                            className={`sig-upload-dropzone ${isDragging ? 'dragging' : ''} ${firmaImagenB64 ? 'sig-upload-dropzone-compact' : ''}`}
                                            onDragOver={handleDragOver}
                                            onDragLeave={handleDragLeave}
                                            onDrop={handleDrop}
                                            onClick={() => document.getElementById('sig-file-upload')?.click()}
                                        >
                                            <input
                                                id="sig-file-upload"
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                                style={{ display: 'none' }}
                                            />
                                            <div className="sig-upload-icon">
                                                <svg width={firmaImagenB64 ? "20" : "36"} height={firmaImagenB64 ? "20" : "36"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                    <polyline points="17 8 12 3 7 8" />
                                                    <line x1="12" y1="3" x2="12" y2="15" />
                                                </svg>
                                            </div>
                                            <div className="sig-upload-text">
                                                {firmaImagenB64 ? (
                                                    <>Arrastra otra foto aquí o <span>explora archivos</span> para cambiarla</>
                                                ) : (
                                                    <>Arrastra tu foto de firma aquí o <span>explora archivos</span></>
                                                )}
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
                                )}
                            </div>
                        )}

                        {activeMode === 'draw' && (
                            <div className="sig-mode-draw-workspace">
                                <SignaturePad
                                    defaultValue={firmaDrawB64}
                                    onSave={(base64) => {
                                        setFirmaDrawB64(base64);
                                        setFirmaImagenB64(base64);
                                    }}
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
                                setCargo(profile?.cargo || '');
                                setDepartamento(profile?.departamento || '');
                                setFirmaImagenB64(profile?.firmaImagenB64);
                                setFirmaUploadB64(profile?.firmaImagenB64);
                                setFirmaDrawB64(profile?.firmaImagenB64);
                                setActiveMode('auto');
                                setImageSrc(null);
                                setShowCropper(false);
                            }}
                            className="btn-vercel-secondary text-xs"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={saving || !firmaImagenB64}
                            className="btn-vercel-primary text-xs"
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

            {showConfirmModal && createPortal(
                <div className="fixed inset-0 z-[9999] flex justify-end">
                    <div
                        className="absolute inset-0 bg-bg-deep/90 backdrop-blur-sm cursor-pointer"
                        onClick={() => setShowConfirmModal(false)}
                    />

                    <div className="relative w-full max-w-lg h-full bg-surface border-l border-border-thin flex flex-col z-10 animate-fade-up">
                        <div className="flex items-center justify-between px-8 py-6 border-b border-border-thin bg-surface">
                            <div className="flex items-center gap-3">
                                <span className="px-2.5 py-1 bg-bg-deep text-text-dim border border-border-thin text-[10px] font-mono uppercase rounded-md">
                                    FIRMA-DIGITAL
                                </span>
                                <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider">
                                    <span className="dot dot-pulse dot-success" />
                                    <span className="text-success">
                                        Configuración Activa
                                    </span>
                                </div>
                            </div>
                            <button
                                type="button"
                                className="p-2 rounded-lg text-text-dim hover:text-text-main hover:bg-surface-hover transition-colors"
                                onClick={() => setShowConfirmModal(false)}
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-surface">
                            <div className="space-y-4">
                                <h2 className="text-3xl font-bold tracking-tight text-text-main leading-tight font-sans">
                                    Confirmar Firma Digital
                                </h2>
                                <p className="text-sm text-text-dim leading-relaxed font-medium">
                                    Esta información se incrustará de manera oficial al estampar su firma en los documentos.
                                </p>
                            </div>
                            <div className="space-y-6">
                                <p className="text-xs text-text-dim leading-relaxed font-medium">
                                    ¿Está seguro de que desea guardar y activar su perfil de firma digital con los siguientes datos?
                                </p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bento-card static p-5 space-y-1.5 col-span-2">
                                        <div className="text-[10px] font-bold text-text-dim uppercase tracking-widest flex items-center gap-1.5">
                                            Nombre de la Firma
                                        </div>
                                        <div className="text-sm font-bold text-text-main font-mono">
                                            {autoText || toTitleCase(user?.nombre_completo || '')}
                                        </div>
                                    </div>
                                    <div className="bento-card static p-5 space-y-1.5">
                                        <div className="text-[10px] font-bold text-text-dim uppercase tracking-widest flex items-center gap-1.5">
                                            Cargo
                                        </div>
                                        <div className="text-sm font-bold text-text-main font-mono">
                                            {cargo.trim()}
                                        </div>
                                    </div>
                                    <div className="bento-card static p-5 space-y-1.5">
                                        <div className="text-[10px] font-bold text-text-dim uppercase tracking-widest flex items-center gap-1.5">
                                            Departamento / Área
                                        </div>
                                        <div className="text-sm font-bold text-text-main font-mono">
                                            {departamento.trim()}
                                        </div>
                                    </div>
                                    <div className="bento-card static p-5 space-y-1.5 col-span-2">
                                        <div className="text-[10px] font-bold text-text-dim uppercase tracking-widest flex items-center gap-1.5">
                                            Firma Oficial
                                        </div>
                                        <div className="sig-preview-paper" style={{ height: '90px', marginTop: '6px' }}>
                                            <div className="sig-paper-watermark" style={{ fontSize: '2.2rem' }}>DIITRA</div>
                                            <div className="sig-paper-content">
                                                <img src={firmaImagenB64} alt="Firma a guardar" className="sig-paper-signature" style={{ maxHeight: '95%', maxWidth: '95%' }} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-8 border-t border-border-thin bg-surface flex gap-4">
                            <button
                                type="button"
                                className="btn-vercel-secondary flex-1"
                                onClick={() => setShowConfirmModal(false)}
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                className="btn-vercel-primary flex-1"
                                onClick={executeSaveProfile}
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
