import React, { useRef, useState, useEffect } from 'react';
import SignaturePadLib from 'signature_pad';
import './SignaturePad.css';

interface SignaturePadProps {
    onSave: (base64Image: string) => void;
    onCancel?: () => void;
    defaultValue?: string;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({ onSave, defaultValue }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const signaturePadRef = useRef<SignaturePadLib | null>(null);

    // Opciones profesionales de trazo
    const [penColor, setPenColor] = useState('#0a3264');
    const [penWidth, setPenWidth] = useState<'fine' | 'medium' | 'thick'>('medium');

    // Mantener callbacks actualizados para evitar stale closures
    const onSaveRef = useRef(onSave);
    onSaveRef.current = onSave;

    // Referencias persistentes para conservar el trazo y tamaño original sin pérdidas de escala acumulativas
    const strokeDataRef = useRef<any[]>([]);
    const lastStrokeSizeRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 });

    // Inicializar el lienzo una única vez al montar
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Inicializar SignaturePad
        const signaturePad = new SignaturePadLib(canvas, {
            minWidth: 1.2,
            maxWidth: 3.2,
            penColor: penColor,
            velocityFilterWeight: 0.7
        });

        signaturePadRef.current = signaturePad;

        const wrapper = canvas.parentElement;

        // Escuchar el final del trazo para sincronizar en tiempo real y fijar el tamaño base del trazo
        signaturePad.addEventListener('endStroke', () => {
            const isEmpty = signaturePad.isEmpty();
            if (!isEmpty) {
                const currentWidth = wrapper ? wrapper.clientWidth : canvas.clientWidth;
                const currentHeight = wrapper ? wrapper.clientHeight : canvas.clientHeight;
                lastStrokeSizeRef.current = { width: currentWidth, height: currentHeight };
                strokeDataRef.current = signaturePad.toData();
                onSaveRef.current(signaturePad.toDataURL('image/png'));
            } else {
                strokeDataRef.current = [];
                onSaveRef.current('');
            }
        });

        const initialWidth = wrapper ? wrapper.clientWidth : canvas.clientWidth;
        const initialHeight = wrapper ? wrapper.clientHeight : canvas.clientHeight;
        lastStrokeSizeRef.current = { width: initialWidth, height: initialHeight };
        strokeDataRef.current = [];

        // Ajustar el tamaño del canvas al tamaño real del contenedor antes de cargar defaultValue
        if (initialWidth > 0 && initialHeight > 0) {
            const ratio = Math.max(window.devicePixelRatio || 1, 1);
            canvas.width = Math.floor(initialWidth * ratio);
            canvas.height = Math.floor(initialHeight * ratio);
            canvas.getContext('2d')?.scale(ratio, ratio);
        }

        // Cargar firma inicial si existe
        if (defaultValue) {
            signaturePad.fromDataURL(defaultValue);
            setTimeout(() => {
                strokeDataRef.current = signaturePad.toData();
            }, 50);
        }

        // Redimensionamiento dinámico y autocurativo con ResizeObserver
        const resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                const { width, height } = entry.contentRect;
                if (width === 0 || height === 0) return;

                const ratio = Math.max(window.devicePixelRatio || 1, 1);
                const targetWidth = Math.floor(width * ratio);
                const targetHeight = Math.floor(height * ratio);

                if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
                    const data = strokeDataRef.current;
                    const refSize = lastStrokeSizeRef.current;
                    
                    // Calcular factores de escala con respecto a la pantalla original donde se dibujó
                    const scaleX = refSize.width > 0 ? (width / refSize.width) : 1;
                    const scaleY = refSize.height > 0 ? (height / refSize.height) : 1;
                    const scale = Math.min(scaleX, scaleY);

                    // Desplazamiento de centrado automático
                    const offsetX = (width - refSize.width * scale) / 2;
                    const offsetY = (height - refSize.height * scale) / 2;

                    canvas.width = targetWidth;
                    canvas.height = targetHeight;
                    canvas.getContext('2d')?.scale(ratio, ratio);
                    
                    signaturePad.clear();
                    if (data.length > 0) {
                        // Escalar y centrar uniformemente cada coordenada del trazo original
                        const scaledData = data.map(group => ({
                            ...group,
                            points: group.points.map(point => ({
                                ...point,
                                x: point.x * scale + offsetX,
                                y: point.y * scale + offsetY
                            }))
                        }));
                        signaturePad.fromData(scaledData);
                        
                        // Sincronizar el trazo escalado con el estado del componente padre
                        onSaveRef.current(signaturePad.toDataURL('image/png'));
                    } else if (defaultValue) {
                        signaturePad.fromDataURL(defaultValue);
                    }
                }
            }
        });

        if (wrapper) {
            resizeObserver.observe(wrapper);
        }

        return () => {
            resizeObserver.disconnect();
            signaturePad.off();
        };
    }, []);

    // Actualizar propiedades del trazo dinámicamente
    useEffect(() => {
        const signaturePad = signaturePadRef.current;
        if (!signaturePad) return;

        signaturePad.penColor = penColor;

        if (penWidth === 'fine') {
            signaturePad.minWidth = 0.6;
            signaturePad.maxWidth = 1.6;
        } else if (penWidth === 'medium') {
            signaturePad.minWidth = 1.2;
            signaturePad.maxWidth = 3.2;
        } else if (penWidth === 'thick') {
            signaturePad.minWidth = 2.0;
            signaturePad.maxWidth = 5.5;
        }
    }, [penColor, penWidth]);

    // Permitir cargar defaultValue si cambia externamente (ej: reseteo del padre)
    useEffect(() => {
        const signaturePad = signaturePadRef.current;
        if (!signaturePad) return;
        
        if (!defaultValue) {
            signaturePad.clear();
        } else if (signaturePad.isEmpty() && defaultValue !== signaturePad.toDataURL('image/png')) {
            signaturePad.fromDataURL(defaultValue);
        }
    }, [defaultValue]);

    const clearCanvas = () => {
        if (!signaturePadRef.current) return;
        signaturePadRef.current.clear();
        strokeDataRef.current = [];
        onSaveRef.current('');
    };

    return (
        <div className="signature-pad-container">
            <div className="signature-pad-card">
                <div className="signature-pad-header">
                    <h4>Dibujar Firma Digital</h4>
                    <p>Utilice su mouse, panel táctil o lápiz óptico para registrar su trazo de firma.</p>
                </div>

                <div className="canvas-wrapper">
                    <canvas
                        ref={canvasRef}
                        className="signature-canvas"
                    />
                </div>

                {/* Panel de configuraciones avanzadas del trazo */}
                <div className="signature-pad-options">
                    <div className="sig-option-group">
                        <span className="sig-option-title">Color de Tinta</span>
                        <div className="sig-color-options">
                            <button
                                type="button"
                                className={`sig-color-btn color-blue ${penColor === '#0a3264' ? 'active' : ''}`}
                                onClick={() => setPenColor('#0a3264')}
                                title="Azul Institucional"
                            />
                            <button
                                type="button"
                                className={`sig-color-btn color-black ${penColor === '#000000' ? 'active' : ''}`}
                                onClick={() => setPenColor('#000000')}
                                title="Negro Legal"
                            />
                        </div>
                    </div>

                    <div className="sig-option-group">
                        <span className="sig-option-title">Grosor de Trazo</span>
                        <div className="sig-width-options">
                            <button
                                type="button"
                                className={`sig-width-btn ${penWidth === 'fine' ? 'active' : ''}`}
                                onClick={() => setPenWidth('fine')}
                            >
                                Fino
                            </button>
                            <button
                                type="button"
                                className={`sig-width-btn ${penWidth === 'medium' ? 'active' : ''}`}
                                onClick={() => setPenWidth('medium')}
                            >
                                Medio
                            </button>
                            <button
                                type="button"
                                className={`sig-width-btn ${penWidth === 'thick' ? 'active' : ''}`}
                                onClick={() => setPenWidth('thick')}
                            >
                                Grueso
                            </button>
                        </div>
                    </div>

                    <div className="sig-option-group" style={{ marginLeft: 'auto' }}>
                        <span className="sig-option-title">Lienzo</span>
                        <button 
                            type="button" 
                            onClick={clearCanvas} 
                            className="sig-width-btn"
                            style={{ height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            Limpiar Lienzo
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
