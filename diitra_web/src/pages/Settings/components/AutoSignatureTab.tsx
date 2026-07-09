import React, { useEffect } from 'react';

const FONTS = [
    { id: 'Caveat',              label: 'Casual',      fontClass: 'font-caveat'     },
    { id: 'Dancing Script',      label: 'Moderna',     fontClass: 'font-dancing'    },
    { id: 'Sacramento',          label: 'Fina',        fontClass: 'font-sacramento' },
    { id: 'Alex Brush',          label: 'Elegante',    fontClass: 'font-alex'       },
    { id: 'Great Vibes',         label: 'Caligráfica', fontClass: 'font-vibes'      },
    { id: 'Allura',              label: 'Fluida',      fontClass: 'font-allura'     },
    { id: 'Pinyon Script',       label: 'Formal',      fontClass: 'font-pinyon'     },
    { id: 'Mrs Saint Delafield', label: 'Artística',   fontClass: 'font-delafield'  },
];

interface AutoSignatureTabProps {
    autoText: string;
    selectedFont: string;
    firmaImagenB64: string | undefined;
    onAutoTextChange: (v: string) => void;
    onFontChange: (v: string) => void;
    onSignatureGenerated: (b64: string) => void;
}

export const AutoSignatureTab: React.FC<AutoSignatureTabProps> = ({
    autoText, selectedFont, firmaImagenB64,
    onAutoTextChange, onFontChange, onSignatureGenerated,
}) => {

    useEffect(() => {
        let active = true;
        if (!autoText) return;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const baseFontSize = 80;
        const fontSpec = `italic ${baseFontSize}px "${selectedFont}"`;

        document.fonts.load(fontSpec).then(() => {
            if (!active) return;
            ctx.font = `italic ${baseFontSize}px "${selectedFont}", cursive`;
            const textWidth = ctx.measureText(autoText).width;
            const paddingX  = 60;
            canvas.width  = Math.max(300, Math.ceil(textWidth + paddingX));
            canvas.height = Math.ceil(baseFontSize * 1.6);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'rgba(0,0,0,0)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#0a3264';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = `italic ${baseFontSize}px "${selectedFont}", cursive`;
            ctx.fillText(autoText, canvas.width / 2, canvas.height / 2);
            onSignatureGenerated(canvas.toDataURL('image/png'));
        }).catch(() => {});

        return () => { active = false; };
    }, [autoText, selectedFont]);

    return (
        <div className="sig-auto-layout">
            <div className="sig-mode-auto-workspace">
                <div className="sig-form-group">
                    <label htmlFor="sig-auto-text">Nombre a transformar en Firma</label>
                    <input
                        id="sig-auto-text"
                        type="text"
                        value={autoText}
                        onChange={(e) => onAutoTextChange(e.target.value)}
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
                    {FONTS.map((font) => (
                        <button
                            key={font.id}
                            type="button"
                            className={`sig-font-option-btn ${selectedFont === font.id ? 'active' : ''}`}
                            onClick={() => onFontChange(font.id)}
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
    );
};
