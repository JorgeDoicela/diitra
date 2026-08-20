import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { PageHeader } from '../../components/Common/PageHeader';
import { ShieldCheck, ShieldAlert, FileText, Calendar, User, Loader2, Camera, Upload, X, RefreshCw, ScanLine } from 'lucide-react';
import api from '../../api/axios_config';
import jsQR from 'jsqr';

const VerifyDocument = () => {
    const { code } = useParams<{ code: string }>();
    const [loading, setLoading] = useState(!!code);
    const [inputCode, setInputCode] = useState(code || '');
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    // Estados para la Cámara y Fotografía
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
    const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
    const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
    
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const animationFrameId = useRef<number | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);

    /**
     * Retroalimentación sensorial al detectar el QR (Audio Beep sintético + Vibración)
     */
    const triggerScanSuccessFeedback = () => {
        try {
            // Vibración en dispositivos compatibles
            if (navigator.vibrate) {
                navigator.vibrate([30, 40, 30]);
            }
            // Bip sintético vía Web Audio API
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioCtx) {
                const ctx = new AudioCtx();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(880, ctx.currentTime); // La5
                osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.08); // Mi6
                gain.gain.setValueAtTime(0.12, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.1);
            }
        } catch {
            // Fallback silencioso si el navegador bloquea audio
        }
    };

    /**
     * Extrae el código limpio de verificación si el QR contiene una URL completa
     */
    const extractCodeFromUrlOrText = (rawText: string): string => {
        const text = rawText.trim();
        try {
            if (text.startsWith('http://') || text.startsWith('https://')) {
                const url = new URL(text);
                const pathParts = url.pathname.split('/').filter(Boolean);
                if (pathParts.length > 0) {
                    const lastPart = pathParts[pathParts.length - 1];
                    if (lastPart && lastPart.length >= 4) {
                        return decodeURIComponent(lastPart).toUpperCase();
                    }
                }
                const codeParam = url.searchParams.get('code') || url.searchParams.get('token') || url.searchParams.get('c');
                if (codeParam) return decodeURIComponent(codeParam).toUpperCase();
            }
        } catch {
            // Texto plano
        }
        return text.toUpperCase();
    };

    const handleVerify = async (verifyCode: string) => {
        const clean = extractCodeFromUrlOrText(verifyCode);
        if (!clean) return;
        
        stopCamera();
        setInputCode(clean);
        setLoading(true);
        setError(null);
        try {
            const response = await api.get(`/documents/verify/${clean}`);
            setResult(response.data);
        } catch (err: any) {
            setError(
                err.response?.data?.error || 
                (err.response?.status === 404 
                    ? "El código de verificación o firma no es válido o no ha sido registrado oficialmente." 
                    : "No se pudo conectar con el servicio de verificación. Intente de nuevo.")
            );
            setResult(null);
        } finally {
            setLoading(false);
        }
    };

    // ─────────────────────────────────────────────────────────────
    // Control de Cámara en Vivo con Detección QR (jsQR)
    // ─────────────────────────────────────────────────────────────
    const stopCamera = useCallback(() => {
        if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
            animationFrameId.current = null;
        }
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }
        setIsCameraOpen(false);
        setCameraError(null);
    }, []);

    const scanFrame = useCallback(() => {
        if (!videoRef.current || !canvasRef.current || !isCameraOpen) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
            // Downscale si la resolución de la cámara es muy alta para máximo rendimiento (60fps)
            const maxWidth = 800;
            const scale = video.videoWidth > maxWidth ? maxWidth / video.videoWidth : 1;
            canvas.width = video.videoWidth * scale;
            canvas.height = video.videoHeight * scale;
            
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'dontInvert'
            });

            if (qrCode && qrCode.data) {
                const detectedCode = extractCodeFromUrlOrText(qrCode.data);
                if (detectedCode) {
                    triggerScanSuccessFeedback();
                    stopCamera();
                    handleVerify(detectedCode);
                    return;
                }
            }
        }
        animationFrameId.current = requestAnimationFrame(scanFrame);
    }, [isCameraOpen, stopCamera]);

    const startCamera = async (overrideFacingMode?: 'environment' | 'user') => {
        setCameraError(null);
        setIsCameraOpen(true);
        const targetFacing = overrideFacingMode || facingMode;

        // Detener stream previo si existía
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(t => t.stop());
        }

        try {
            // Verificar dispositivos de video disponibles
            if (navigator.mediaDevices.enumerateDevices) {
                const devices = await navigator.mediaDevices.enumerateDevices();
                const videoDevices = devices.filter(d => d.kind === 'videoinput');
                setHasMultipleCameras(videoDevices.length > 1);
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: targetFacing,
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });
            mediaStreamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.setAttribute('playsinline', 'true');
                await videoRef.current.play();
                animationFrameId.current = requestAnimationFrame(scanFrame);
            }
        } catch (err: any) {
            console.error('[DIITRA] Error al iniciar cámara:', err);
            setCameraError(
                err.name === 'NotAllowedError'
                    ? 'Permiso de cámara denegado. Permita el acceso en su navegador o suba una fotografía.'
                    : 'No se pudo acceder a la cámara en este dispositivo. Puede tomar o subir una fotografía del código.'
            );
        }
    };

    const toggleFacingMode = () => {
        const nextMode = facingMode === 'environment' ? 'user' : 'environment';
        setFacingMode(nextMode);
        startCamera(nextMode);
    };

    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, [stopCamera]);

    // ─────────────────────────────────────────────────────────────
    // Procesamiento de Fotografía / Imagen de Alta Resolución
    // ─────────────────────────────────────────────────────────────
    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsProcessingPhoto(true);
        setError(null);

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                if (!ctx) {
                    setIsProcessingPhoto(false);
                    setError('No se pudo inicializar el procesador de imagen.');
                    return;
                }

                // Optimización: Redimensionar proporcionalmente a máx 1200px para decodificación ultra rápida
                const maxDim = 1200;
                let { width, height } = img;
                if (width > maxDim || height > maxDim) {
                    if (width > height) {
                        height = Math.round((height * maxDim) / width);
                        width = maxDim;
                    } else {
                        width = Math.round((width * maxDim) / height);
                        height = maxDim;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);

                const imageData = ctx.getImageData(0, 0, width, height);
                const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: 'attemptBoth'
                });

                setIsProcessingPhoto(false);

                if (qrCode && qrCode.data) {
                    const detectedCode = extractCodeFromUrlOrText(qrCode.data);
                    triggerScanSuccessFeedback();
                    handleVerify(detectedCode);
                } else {
                    setError('No se detectó un código QR nítido en la fotografía. Asegúrate de que el código esté enfocado y bien iluminado, o ingresa el código alfanumérico manualmente.');
                }
            };
            img.onerror = () => {
                setIsProcessingPhoto(false);
                setError('Error al procesar la fotografía seleccionada.');
            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);

        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    useEffect(() => {
        if (code) handleVerify(code);
    }, [code]);

    return (
        <main className="flex-1 bg-bg-deep p-4 md:p-10 overflow-y-auto">
            <PageHeader
                kicker="Verificador Documental y de Firmas"
                icon={ShieldCheck}
                title="Verificación de autenticidad"
                description="Ingrese el código de trazabilidad de documento o de firma (DFRM) impreso o escaneado vía QR para validar su autenticidad."
            />

            {/* Hidden canvas for video processing */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Hidden file input for Photo Capture */}
            <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                capture="environment"
                onChange={handlePhotoUpload}
                className="hidden"
            />

            <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-up [animation-delay:100ms]">
                {!result && !loading && (
                    <div className="lg:col-span-5 bento-card static p-6 md:p-8 text-center flex flex-col justify-between">
                        <div>
                            <div className="flex justify-center mb-4 text-brand">
                                <ShieldCheck size={36} strokeWidth={1.5} />
                            </div>
                            <h3 className="text-xl font-semibold text-text-main tracking-tight mb-1.5">Consultar Autenticidad</h3>
                            <p className="text-xs text-text-dim mb-6 leading-relaxed">
                                Ingrese el código impreso o tome una fotografía del código QR del documento.
                            </p>

                            {/* Modal / Visor de Cámara en vivo */}
                            {isCameraOpen ? (
                                <div className="mb-4 relative rounded-xl overflow-hidden border border-brand/40 bg-black shadow-lg animate-fade-in">
                                    <video
                                        ref={videoRef}
                                        className="w-full h-56 object-cover"
                                        playsInline
                                        muted
                                    />
                                    
                                    {/* Overlay de Escaneo Láser */}
                                    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4">
                                        <div className="w-40 h-40 border-2 border-dashed border-brand rounded-2xl relative flex items-center justify-center shadow-[0_0_20px_rgba(0,112,243,0.3)]">
                                            <div className="absolute top-0 left-0 right-0 h-0.5 bg-brand animate-pulse shadow-[0_0_10px_#0070f3]" style={{ animation: 'bounce 2s infinite' }} />
                                            <ScanLine className="text-brand/50 animate-pulse" size={28} />
                                        </div>
                                        <span className="text-[10px] font-medium text-white/90 bg-black/70 px-2.5 py-0.5 rounded-full mt-2.5 backdrop-blur-sm">
                                            Apunta al código QR del documento
                                        </span>
                                    </div>

                                    {/* Botones de control de cámara */}
                                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                                        {hasMultipleCameras && (
                                            <button
                                                type="button"
                                                onClick={toggleFacingMode}
                                                className="w-7 h-7 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center transition-colors"
                                                title="Alternar cámara frontal/trasera"
                                            >
                                                <RefreshCw size={13} />
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={stopCamera}
                                            className="w-7 h-7 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center transition-colors"
                                            title="Cerrar cámara"
                                        >
                                            <X size={15} />
                                        </button>
                                    </div>
                                </div>
                            ) : null}

                            {cameraError && (
                                <div className="p-3 mb-4 rounded-lg bg-warning/10 border border-warning/20 text-warning text-xs text-left animate-fade-in flex items-start gap-2">
                                    <ShieldAlert size={14} className="shrink-0 mt-0.5" />
                                    <span>{cameraError}</span>
                                </div>
                            )}

                            {/* Barra de Entrada Inteligente con Acciones Integradas */}
                            <div className="relative flex items-center bg-bg-deep border border-border-thin rounded-xl p-1.5 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20 transition-all shadow-sm">
                                <input
                                    type="text"
                                    placeholder="Ej: DFRM-2026-CBF1A7A8..."
                                    value={inputCode}
                                    onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                                    onKeyDown={(e) => e.key === 'Enter' && handleVerify(inputCode)}
                                    className="w-full bg-transparent border-0 outline-none px-3 py-2 text-sm sm:text-base font-mono text-text-main uppercase placeholder:text-text-dim/40 placeholder:font-sans"
                                />

                                {/* Acciones de Fotografía y Cámara integradas a la derecha */}
                                <div className="flex items-center gap-1 pr-1 shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => startCamera()}
                                        className={`p-2 rounded-lg text-text-dim hover:text-brand hover:bg-surface-hover transition-colors ${isCameraOpen ? 'text-brand bg-brand/10' : ''}`}
                                        title="Escanear con cámara en tiempo real"
                                    >
                                        <Camera size={17} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isProcessingPhoto}
                                        className="p-2 rounded-lg text-text-dim hover:text-brand hover:bg-surface-hover transition-colors disabled:opacity-50"
                                        title="Tomar o subir fotografía del QR"
                                    >
                                        {isProcessingPhoto ? (
                                            <Loader2 size={17} className="animate-spin text-brand" />
                                        ) : (
                                            <Upload size={17} />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => handleVerify(inputCode)}
                            disabled={!inputCode.trim()}
                            className="btn-brand mt-6 w-full py-3 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_4px_12px_rgba(0,112,243,0.15)]"
                        >
                            Validar Documento o Firma
                        </button>
                    </div>
                )}

                {loading && (
                    <div className="lg:col-span-5 flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="animate-spin text-brand" size={32} />
                        <p className="section-label text-text-dim">Consultando verificación...</p>
                    </div>
                )}

                {error && (
                    <div className="lg:col-span-5 bento-card static !bg-error-subtle !border-error/30 p-8 md:p-10 text-center animate-fade-in">
                        <ShieldAlert size={32} className="text-error mx-auto mb-6" />
                        <h3 className="text-xl font-semibold text-text-main mb-2">Validación Fallida</h3>
                        <p className="text-sm text-text-dim mb-8">{error}</p>
                        <button
                            onClick={() => { setResult(null); setError(null); }}
                            className="btn-vercel-secondary"
                        >
                            Intentar con otro código
                        </button>
                    </div>
                )}

                {result && (
                    <>
                        <div className="lg:col-span-5 bento-card static p-8 md:p-10 overflow-hidden animate-fade-in flex flex-col justify-between">
                            <div>
                                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border-thin">
                                    <ShieldCheck size={32} className="text-success shrink-0" />
                                    <div>
                                        <h3 className="text-xl font-semibold tracking-tighter text-text-main">
                                            {result.template_code === 'DFRM-VERIFY' || result.templateCode === 'DFRM-VERIFY' 
                                                ? 'Firma Auténtica Registrada' 
                                                : 'Documento Auténtico'}
                                        </h3>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            <div className="badge-vercel badge-vercel-success">
                                                <span className="dot dot-success" />
                                                Integridad verificada
                                            </div>
                                            {result.signatures && result.signatures.length > 0 && (
                                                <div className="badge-vercel badge-vercel-success bg-brand/10 border-brand/20 text-brand-light">
                                                    <span className="dot bg-brand animate-pulse" />
                                                    {result.signatures.length} {result.signatures.length === 1 ? 'Firma activa' : 'Firmas activas'}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 mb-6">
                                    <div>
                                        <label className="section-label text-text-dim mb-1">
                                            <FileText size={12} /> Tipo de Documento / Registro
                                        </label>
                                        <p className="text-sm font-semibold text-text-main">{result.template_name || result.templateName || 'Firma Institucional DIITRA'}</p>
                                    </div>
                                    <div>
                                        <label className="section-label text-text-dim mb-1">
                                            <User size={12} /> Emitido por / Firmante
                                        </label>
                                        <p className="text-sm font-semibold text-text-main">{result.generated_by || result.generatedBy || 'Sistema DIITRA'}</p>
                                    </div>
                                    <div>
                                        <label className="section-label text-text-dim mb-1">
                                            <Calendar size={12} /> Fecha de Registro / Emisión
                                        </label>
                                        <p className="text-sm font-semibold text-text-main">
                                            {new Date(result.generated_at || result.generatedAt).toLocaleDateString()} - {new Date(result.generated_at || result.generatedAt).toLocaleTimeString()}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="section-label text-text-dim mb-1">
                                            <ShieldCheck size={12} /> Hash de trazabilidad (SHA-256)
                                        </label>
                                        <p className="text-[10px] font-mono break-all text-text-dim">{result.file_hash || result.fileHash || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-center mt-6">
                                <button
                                    onClick={() => { setResult(null); setInputCode(''); }}
                                    className="btn-vercel-secondary w-full"
                                >
                                    Verificar otro código
                                </button>
                            </div>
                        </div>

                        {result.signatures && result.signatures.length > 0 && (
                            <div className="lg:col-span-7 bento-card static p-8 md:p-10 overflow-hidden animate-fade-in">
                                <h3 className="text-xl font-semibold tracking-tighter text-text-main mb-2">Cadena de Custodia Criptográfica</h3>
                                <p className="text-xs text-text-dim mb-6 leading-relaxed">
                                    DIITRA implementa un modelo de firmas digitales institucionales consecutivas (en cascada). Cada firmante sella el documento en su estado actual, estampando su bloque visual e incorporando la huella digital criptográfica (hash).
                                </p>
                                
                                <div className="space-y-6 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[2px] before:bg-border-thin">
                                    {result.signatures.map((sig: any, index: number) => {
                                        const firmaCode = sig.firmaCode || sig.firma_code;
                                        const firmanteNombre = sig.firmanteNombre || sig.firmante_nombre;
                                        const firmanteRol = sig.firmanteRol || sig.firmante_rol;
                                        const fechaFirma = sig.fechaFirma || sig.fecha_firma;
                                        const docHash = sig.docHash || sig.doc_hash;
                                        const esValida = sig.esValida !== undefined ? sig.esValida : (sig.es_valida !== undefined ? sig.es_valida : true);
                                        const motivoRevocacion = sig.motivoRevocacion || sig.motivo_revocacion;

                                        return (
                                            <div key={firmaCode || index} className="relative pl-8">
                                                <span className={`absolute left-1 top-1 w-4 h-4 rounded-full border-2 border-bg-deep flex items-center justify-center ${esValida ? 'bg-success' : 'bg-error'}`} />
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                                                    <div>
                                                        <span className="text-[10px] uppercase tracking-wider font-semibold text-brand-light">
                                                            {index + 1}ª Firma aplicada ({firmaCode})
                                                        </span>
                                                        <h4 className="text-sm font-semibold text-text-main mt-0.5">{firmanteNombre}</h4>
                                                        <p className="text-xs text-text-dim font-medium">{firmanteRol}</p>
                                                    </div>
                                                    <div className="text-left md:text-right shrink-0">
                                                        <span className="text-[10px] text-text-dim block">
                                                            {fechaFirma ? `${new Date(fechaFirma).toLocaleDateString()} - ${new Date(fechaFirma).toLocaleTimeString()}` : ''}
                                                        </span>
                                                        <span className={`inline-block text-[9px] font-semibold px-2 py-0.5 rounded mt-1 ${esValida ? 'bg-success/10 text-success border border-success/20' : 'bg-error/10 text-error border border-error/20'}`}>
                                                            {esValida ? 'Válida / Activa' : 'Revocada'}
                                                        </span>
                                                    </div>
                                                </div>
                                                {motivoRevocacion && (
                                                    <p className="text-xs text-error mt-1 italic">
                                                        Motivo de revocación: {motivoRevocacion}
                                                    </p>
                                                )}
                                                <div className="mt-2 p-2 bg-bg-deep rounded border border-border-thin">
                                                    <span className="text-[9px] uppercase tracking-wider text-text-dim block font-semibold mb-0.5">Hash del PDF Firmado (SHA-256)</span>
                                                    <span className="text-[9px] font-mono break-all text-text-main">{docHash}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </section>
        </main>
    );
};

export default VerifyDocument;
