import React, { useState, useRef, useEffect } from 'react';
import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import ImageExtension from '@tiptap/extension-image';
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import api from '../../../api/axios_config';
import { 
    AlignLeft, 
    AlignCenter, 
    AlignRight, 
    Trash2, 
    Maximize2,
    Crop as CropIcon,
    Settings,
    RotateCcw
} from 'lucide-react';

const getCroppedImg = (image: HTMLImageElement, crop: PixelCrop): Promise<Blob> => {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        return Promise.reject(new Error('No 2D context available'));
    }

    ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        crop.width,
        crop.height
    );

    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (!blob) {
                reject(new Error('Canvas conversion failed'));
                return;
            }
            resolve(blob);
        }, 'image/png');
    });
};

const ImageNodeView: React.FC<NodeViewProps> = ({ node, updateAttributes, selected, editor }) => {
    const isEditable = editor.isEditable;
    const { src, alt, width, alignment, shadow, border, caption } = node.attrs;
    
    const containerRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    
    const [isResizing, setIsResizing] = useState(false);
    const [showToolbar, setShowToolbar] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    
    // Crop states
    const [isCropping, setIsCropping] = useState(false);
    const [crop, setCrop] = useState<Crop>({
        unit: '%',
        x: 10,
        y: 10,
        width: 80,
        height: 80
    });
    const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);

    // Toggle toolbar based on selection
    useEffect(() => {
        setShowToolbar(selected && isEditable);
        if (!selected) {
            setShowSettings(false);
        }
    }, [selected, isEditable]);

    const handleAlign = (align: 'left' | 'center' | 'right') => {
        updateAttributes({ alignment: align });
    };

    const handleSize = (w: string) => {
        updateAttributes({ width: w });
    };

    const handleDelete = () => {
        const pos = node.type.name === 'image' ? editor.state.selection.from : -1;
        if (pos >= 0) {
            editor.commands.deleteRange({ from: pos, to: pos + node.nodeSize });
        } else {
            editor.commands.deleteSelection();
        }
    };

    // Generic resize handler from any handle (corner or sides)
    const handleResizeStart = (e: React.MouseEvent, direction: 'left' | 'right' | 'corner') => {
        if (!isEditable) return;
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(true);

        const startX = e.clientX;
        const startWidth = imageRef.current ? imageRef.current.clientWidth : 300;
        const parentWidth = containerRef.current?.parentElement?.clientWidth || 800;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const currentX = moveEvent.clientX;
            const diffX = currentX - startX;
            let newWidthPx = startWidth;

            if (direction === 'right' || direction === 'corner') {
                newWidthPx = startWidth + diffX * (alignment === 'center' ? 2 : 1);
            } else if (direction === 'left') {
                newWidthPx = startWidth - diffX * (alignment === 'center' ? 2 : 1);
            }
            
            // Constrain width percentage between 10% and 100%
            const newWidthPct = Math.min(Math.max(Math.round((newWidthPx / parentWidth) * 100), 10), 100);
            updateAttributes({ width: `${newWidthPct}%` });
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    // Crop save handler
    const handleCropSave = async () => {
        if (!completedCrop || !imageRef.current) return;
        try {
            const croppedBlob = await getCroppedImg(imageRef.current, completedCrop);
            const file = new File([croppedBlob], "cropped_image.png", { type: "image/png" });
            
            const formData = new FormData();
            formData.append('file', file);
            
            // Upload cropped image
            const res = await api.post('/collaboration/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            const newUrl = res.data.url;
            updateAttributes({ src: newUrl });
            setIsCropping(false);
        } catch (err) {
            console.error('[DIITRA] Error al recortar y subir imagen:', err);
        }
    };

    // Alignment styles
    let justifyClass = 'justify-center';
    if (alignment === 'left') justifyClass = 'justify-start';
    if (alignment === 'right') justifyClass = 'justify-end';

    // Applied style classes
    let shadowClass = '';
    if (shadow === 'sm') shadowClass = 'shadow-md';
    if (shadow === 'lg') shadowClass = 'shadow-2xl';

    let borderClass = 'border border-transparent';
    if (border === 'thin') borderClass = 'border border-gray-300 dark:border-zinc-700';
    if (border === 'rounded') borderClass = 'rounded-2xl border border-transparent';

    return (
        <NodeViewWrapper className={`flex w-full my-6 select-none ${justifyClass}`}>
            <div 
                ref={containerRef}
                className="relative group transition-all"
                style={{ width: width || '100%', maxWidth: '100%' }}
                onMouseEnter={() => isEditable && setShowToolbar(true)}
                onMouseLeave={() => !selected && setShowToolbar(false)}
            >
                {/* Image display element */}
                <img
                    ref={imageRef}
                    src={src}
                    data-drag-handle
                    alt={alt || caption || 'Imagen del documento'}
                    className={`block w-full h-auto transition-all duration-200 ${shadowClass} ${borderClass} ${
                        selected && isEditable ? 'ring-2 ring-indigo-500 ring-offset-2' : ''
                    } ${isEditable ? 'cursor-pointer' : ''}`}
                />

                {/* Left drag resize trigger */}
                {isEditable && (
                    <div 
                        onMouseDown={(e) => handleResizeStart(e, 'left')}
                        className="absolute top-0 left-0 bottom-0 w-2.5 cursor-ew-resize hover:bg-indigo-500/20 active:bg-indigo-500/40 border-l border-transparent hover:border-indigo-500/50 transition-colors z-30"
                        title="Arrastrar para agrandar desde la izquierda"
                    />
                )}

                {/* Right drag resize trigger */}
                {isEditable && (
                    <div 
                        onMouseDown={(e) => handleResizeStart(e, 'right')}
                        className="absolute top-0 right-0 bottom-0 w-2.5 cursor-ew-resize hover:bg-indigo-500/20 active:bg-indigo-500/40 border-r border-transparent hover:border-indigo-500/50 transition-colors z-30"
                        title="Arrastrar para agrandar desde la derecha"
                    />
                )}

                {/* Resizing dimensions helper popup */}
                {isResizing && (
                    <div className="absolute inset-0 bg-black/10 flex items-center justify-center pointer-events-none">
                        <span className="bg-black/80 text-white text-xs px-2 py-1 rounded font-mono font-bold shadow-lg">
                            Ancho: {width}
                        </span>
                    </div>
                )}

                {/* Main Floating Toolbar */}
                {showToolbar && isEditable && (
                    <div 
                        className="absolute -top-12 left-1/2 -translate-x-1/2 flex flex-col gap-1.5 p-1.5 rounded-lg border border-border-thin backdrop-blur-md bg-surface/90 shadow-xl z-40 animate-fade-in text-text-main"
                        onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                        }}
                    >
                        <div className="flex items-center gap-1.5">
                            {/* Alignment control subsegment */}
                            <div className="flex items-center gap-0.5 border-r border-border-thin pr-1.5">
                                <button
                                    type="button"
                                    onClick={() => handleAlign('left')}
                                    className={`p-1 rounded hover:bg-bg-deep transition-colors ${
                                        alignment === 'left' ? 'text-indigo-500 bg-bg-deep' : 'text-text-dim'
                                    }`}
                                    title="Alinear a la izquierda"
                                >
                                    <AlignLeft size={14} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleAlign('center')}
                                    className={`p-1 rounded hover:bg-bg-deep transition-colors ${
                                        alignment === 'center' ? 'text-indigo-500 bg-bg-deep' : 'text-text-dim'
                                    }`}
                                    title="Centrar"
                                >
                                    <AlignCenter size={14} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleAlign('right')}
                                    className={`p-1 rounded hover:bg-bg-deep transition-colors ${
                                        alignment === 'right' ? 'text-indigo-500 bg-bg-deep' : 'text-text-dim'
                                    }`}
                                    title="Alinear a la derecha"
                                >
                                    <AlignRight size={14} />
                                </button>
                            </div>

                            {/* Preset widths control subsegment */}
                            <div className="flex items-center gap-1 border-r border-border-thin pr-1.5 text-[9px] font-bold">
                                <button
                                    type="button"
                                    onClick={() => handleSize('25%')}
                                    className={`px-1.5 py-1 rounded hover:bg-bg-deep transition-colors ${
                                        width === '25%' ? 'text-indigo-500 bg-bg-deep' : 'text-text-dim'
                                    }`}
                                >
                                    25%
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleSize('50%')}
                                    className={`px-1.5 py-1 rounded hover:bg-bg-deep transition-colors ${
                                        width === '50%' ? 'text-indigo-500 bg-bg-deep' : 'text-text-dim'
                                    }`}
                                >
                                    50%
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleSize('75%')}
                                    className={`px-1.5 py-1 rounded hover:bg-bg-deep transition-colors ${
                                        width === '75%' ? 'text-indigo-500 bg-bg-deep' : 'text-text-dim'
                                    }`}
                                >
                                    75%
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleSize('100%')}
                                    className={`px-1.5 py-1 rounded hover:bg-bg-deep transition-colors ${
                                        width === '100%' || !width ? 'text-indigo-500 bg-bg-deep' : 'text-text-dim'
                                    }`}
                                >
                                    100%
                                </button>
                            </div>

                            {/* Custom Actions (Crop, Settings, Reset, Delete) */}
                            <div className="flex items-center gap-0.5">
                                <button
                                    type="button"
                                    onClick={() => setIsCropping(true)}
                                    className="p-1 rounded hover:bg-bg-deep text-text-dim hover:text-indigo-500 transition-colors"
                                    title="Recortar imagen"
                                >
                                    <CropIcon size={14} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowSettings(!showSettings)}
                                    className={`p-1 rounded hover:bg-bg-deep transition-colors ${
                                        showSettings ? 'text-indigo-500 bg-bg-deep' : 'text-text-dim'
                                    }`}
                                    title="Estilos y bordes de imagen"
                                >
                                    <Settings size={14} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        updateAttributes({
                                            width: '100%',
                                            alignment: 'center',
                                            shadow: 'none',
                                            border: 'none',
                                            caption: ''
                                        });
                                    }}
                                    className="p-1 rounded hover:bg-bg-deep text-text-dim hover:text-indigo-500 transition-colors"
                                    title="Restablecer valores originales"
                                >
                                    <RotateCcw size={14} />
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    className="p-1 rounded hover:bg-red-500/10 text-red-500 hover:text-red-600 transition-colors"
                                    title="Eliminar imagen"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>

                        {/* Styles & Options submenu */}
                        {showSettings && (
                            <div className="flex flex-col gap-2 mt-1.5 p-2 rounded border border-border-thin bg-surface text-[9px] font-bold text-text-main">
                                <div className="flex items-center gap-2 border-b border-border-thin pb-1.5">
                                    <span className="text-text-dim uppercase tracking-wider text-[8px]">Sombra:</span>
                                    <div className="flex gap-1">
                                        <button
                                            type="button"
                                            onClick={() => updateAttributes({ shadow: 'none' })}
                                            className={`px-1.5 py-0.5 rounded border border-border-thin ${
                                                shadow === 'none' || !shadow ? 'text-indigo-500 bg-indigo-500/10 border-indigo-500/30' : 'text-text-dim border-transparent'
                                            }`}
                                        >
                                            Ninguna
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => updateAttributes({ shadow: 'sm' })}
                                            className={`px-1.5 py-0.5 rounded border border-border-thin ${
                                                shadow === 'sm' ? 'text-indigo-500 bg-indigo-500/10 border-indigo-500/30' : 'text-text-dim border-transparent'
                                            }`}
                                        >
                                            Suave
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => updateAttributes({ shadow: 'lg' })}
                                            className={`px-1.5 py-0.5 rounded border border-border-thin ${
                                                shadow === 'lg' ? 'text-indigo-500 bg-indigo-500/10 border-indigo-500/30' : 'text-text-dim border-transparent'
                                            }`}
                                        >
                                            Fuerte
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="text-text-dim uppercase tracking-wider text-[8px]">Bordes:</span>
                                    <div className="flex gap-1">
                                        <button
                                            type="button"
                                            onClick={() => updateAttributes({ border: 'none' })}
                                            className={`px-1.5 py-0.5 rounded border border-border-thin ${
                                                border === 'none' || !border ? 'text-indigo-500 bg-indigo-500/10 border-indigo-500/30' : 'text-text-dim border-transparent'
                                            }`}
                                        >
                                            Ninguno
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => updateAttributes({ border: 'thin' })}
                                            className={`px-1.5 py-0.5 rounded border border-border-thin ${
                                                border === 'thin' ? 'text-indigo-500 bg-indigo-500/10 border-indigo-500/30' : 'text-text-dim border-transparent'
                                            }`}
                                        >
                                            Borde Fino
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => updateAttributes({ border: 'rounded' })}
                                            className={`px-1.5 py-0.5 rounded border border-border-thin ${
                                                border === 'rounded' ? 'text-indigo-500 bg-indigo-500/10 border-indigo-500/30' : 'text-text-dim border-transparent'
                                            }`}
                                        >
                                            Redondeado
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Corner Resize Handle */}
                {isEditable && (
                    <div
                        onMouseDown={(e) => handleResizeStart(e, 'corner')}
                        className="absolute bottom-2 right-2 w-4 h-4 rounded bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center cursor-se-resize shadow-md transition-colors z-30"
                        title="Arrastrar para redimensionar libremente"
                    >
                        <Maximize2 size={10} className="rotate-90" />
                    </div>
                )}

                {/* Caption / Description below the image */}
                {isEditable ? (
                    <input
                        type="text"
                        value={caption || ''}
                        onChange={(e) => updateAttributes({ caption: e.target.value })}
                        placeholder="Añadir una leyenda explicativa..."
                        className="w-full text-center text-xs text-text-dim mt-2.5 bg-transparent border-b border-transparent hover:border-border-thin focus:border-indigo-500 focus:outline-none py-1 italic font-medium tracking-wide transition-all"
                    />
                ) : caption ? (
                    <p className="text-center text-xs text-text-dim mt-2.5 italic font-medium select-text">
                        {caption}
                    </p>
                ) : null}
            </div>

            {/* Premium Crop Modal Dialog Overlay */}
            {isCropping && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                    <div className="bg-bg-deep border border-border-thin rounded-xl max-w-xl w-full p-6 shadow-2xl flex flex-col gap-4 text-text-main">
                        <div className="flex items-center justify-between border-b border-border-thin pb-3">
                            <span className="text-xs font-black uppercase tracking-widest text-text-dim flex items-center gap-1.5">
                                <CropIcon size={16} className="text-indigo-500" /> Recortar Imagen de Colaboración
                            </span>
                        </div>
                        
                        <div className="max-h-[380px] overflow-auto flex items-center justify-center bg-black/10 rounded-lg p-2 border border-border-thin">
                            <ReactCrop
                                crop={crop}
                                onChange={(c) => setCrop(c)}
                                onComplete={(c) => setCompletedCrop(c)}
                            >
                                <img 
                                    src={src} 
                                    alt="A recortar" 
                                    className="max-h-[350px] object-contain"
                                />
                            </ReactCrop>
                        </div>
                        
                        <div className="flex justify-end gap-2 border-t border-border-thin pt-3">
                            <button
                                type="button"
                                onClick={() => setIsCropping(false)}
                                className="px-4 py-2 text-[10px] font-black uppercase tracking-wider text-text-dim hover:bg-bg-deep rounded-lg transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleCropSave}
                                className="px-4 py-2 text-[10px] font-black uppercase tracking-wider bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all"
                            >
                                Aplicar Recorte
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </NodeViewWrapper>
    );
};

export const CustomImage = ImageExtension.extend({
    inline: false, // Forzar que la imagen sea un nodo de bloque para alineación correcta
    draggable: true, // Permitir arrastrar la imagen correctamente en el editor sin duplicarla
    
    addAttributes() {
        return {
            ...this.parent?.(),
            width: {
                default: '100%',
                parseHTML: element => element.getAttribute('width') || element.style.width || '100%',
                renderHTML: attributes => {
                    return {
                        width: attributes.width,
                        style: `width: ${attributes.width}; max-width: 100%; height: auto;`,
                    };
                },
            },
            alignment: {
                default: 'center',
                parseHTML: element => element.getAttribute('data-alignment') || 'center',
                renderHTML: attributes => {
                    let style = 'margin-left: auto; margin-right: auto; display: block;';
                    if (attributes.alignment === 'left') {
                        style = 'margin-right: auto; margin-left: 0; display: block;';
                    } else if (attributes.alignment === 'right') {
                        style = 'margin-left: auto; margin-right: 0; display: block;';
                    }
                    return {
                        'data-alignment': attributes.alignment,
                        style,
                    };
                },
            },
            shadow: {
                default: 'none',
                parseHTML: element => element.getAttribute('data-shadow') || 'none',
                renderHTML: attributes => {
                    return {
                        'data-shadow': attributes.shadow,
                    };
                },
            },
            border: {
                default: 'none',
                parseHTML: element => element.getAttribute('data-border') || 'none',
                renderHTML: attributes => {
                    return {
                        'data-border': attributes.border,
                    };
                },
            },
            caption: {
                default: '',
                parseHTML: element => element.getAttribute('data-caption') || '',
                renderHTML: attributes => {
                    return {
                        'data-caption': attributes.caption,
                    };
                },
            },
        };
    },

    addNodeView() {
        return ReactNodeViewRenderer(ImageNodeView);
    },
});

export default CustomImage;
