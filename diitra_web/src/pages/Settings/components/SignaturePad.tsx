import React, { useRef, useState, useEffect } from 'react';
import './SignaturePad.css';

interface SignaturePadProps {
    onSave: (base64Image: string) => void;
    onCancel?: () => void;
    defaultValue?: string;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({ onSave, onCancel, defaultValue }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasDrawn, setHasDrawn] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Configuración inicial del canvas para dibujo suave y de alta definición
        ctx.strokeStyle = '#0a3264'; // Azul institucional de la firma
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Si hay una firma previa, dibujarla en el fondo como preview
        if (defaultValue) {
            const img = new Image();
            img.onload = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                setHasDrawn(true);
            };
            img.src = defaultValue;
        }
    }, [defaultValue]);

    // Obtener las coordenadas del cursor/toque relativas al canvas
    const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };

        const rect = canvas.getBoundingClientRect();
        
        // Manejar eventos touch o mouse
        if ('touches' in e) {
            if (e.touches.length === 0) return { x: 0, y: 0 };
            return {
                x: e.touches[0].clientX - rect.left,
                y: e.touches[0].clientY - rect.top
            };
        } else {
            return {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
        }
    };

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const { x, y } = getCoordinates(e);
        ctx.beginPath();
        ctx.moveTo(x, y);
        setIsDrawing(true);
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        e.preventDefault();

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const { x, y } = getCoordinates(e);
        ctx.lineTo(x, y);
        ctx.stroke();
        setHasDrawn(true);
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasDrawn(false);
    };

    const saveSignature = () => {
        const canvas = canvasRef.current;
        if (!canvas || !hasDrawn) return;

        // Exportar a PNG Base64
        const dataUrl = canvas.toDataURL('image/png');
        onSave(dataUrl);
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
                        width={500}
                        height={200}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        className="signature-canvas"
                    />
                </div>

                <div className="signature-pad-actions">
                    <button 
                        type="button" 
                        onClick={clearCanvas} 
                        className="btn-pad btn-pad-secondary"
                    >
                        Limpiar Lienzo
                    </button>
                    
                    <div className="signature-pad-right-actions">
                        {onCancel && (
                            <button 
                                type="button" 
                                onClick={onCancel} 
                                className="btn-pad btn-pad-link"
                            >
                                Cancelar
                            </button>
                        )}
                        <button 
                            type="button" 
                            onClick={saveSignature} 
                            disabled={!hasDrawn}
                            className="btn-pad btn-pad-primary"
                        >
                            Confirmar Trazo
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
