import { useState, useRef, useEffect } from 'react';
import type { Crop, PixelCrop } from 'react-image-crop';
import Compressor from 'compressorjs';
import { createCanvas, applyAdaptiveThreshold, getCroppedImg } from './canvasUtils';

export interface ImageCropperState {
    imageSrc: string | null;
    crop: Crop | undefined;
    completedCrop: PixelCrop | null;
    rotation: number;
    showCropper: boolean;
    threshold: number;
    inkMode: 'blue' | 'black' | 'original';
    aspectRatio: number | undefined;
    previewBase64: string;
    isDragging: boolean;
    imgRef: React.RefObject<HTMLImageElement | null>;
    setCrop: (c: Crop) => void;
    setCompletedCrop: (c: PixelCrop | null) => void;
    setRotation: (v: number) => void;
    setThreshold: (v: number) => void;
    setInkMode: (v: 'blue' | 'black' | 'original') => void;
    setIsDragging: (v: boolean) => void;
    handleAspectChange: (aspect: number | undefined) => void;
    processFile: (file: File, onError: (msg: string) => void) => void;
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>, onError: (msg: string) => void) => void;
    handleDragOver: (e: React.DragEvent) => void;
    handleDragLeave: () => void;
    handleDrop: (e: React.DragEvent, onError: (msg: string) => void) => void;
    onImageLoad: (e: React.SyntheticEvent<HTMLImageElement>) => void;
    applyCropAndFilters: (onSuccess: (b64: string) => void, onError: (msg: string) => void) => Promise<void>;
    cancelCrop: () => void;
}

function buildCropFromAspect(width: number, height: number, aspect: number | undefined): Crop & { unit: '%' } {
    if (aspect) {
        let cropW = 100, cropH = ((width / aspect) / height) * 100;
        if (cropH > 100) { cropH = 100; cropW = ((height * aspect) / width) * 100; }
        return { unit: '%', width: cropW, height: cropH, x: (100 - cropW) / 2, y: (100 - cropH) / 2 };
    }
    return { unit: '%', width: 100, height: 100, x: 0, y: 0 };
}

export function useImageCropper(): ImageCropperState {
    const imgRef = useRef<HTMLImageElement | null>(null);
    const [imageSrc, setImageSrc]         = useState<string | null>(null);
    const [crop, setCrop]                 = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
    const [rotation, setRotation]         = useState(0);
    const [showCropper, setShowCropper]   = useState(false);
    const [threshold, setThreshold]       = useState(14);
    const [inkMode, setInkMode]           = useState<'blue' | 'black' | 'original'>('blue');
    const [aspectRatio, setAspectRatio]   = useState<number | undefined>(2);
    const [previewBase64, setPreviewBase64] = useState('');
    const [isDragging, setIsDragging]     = useState(false);

    // Preview en tiempo real con debounce
    useEffect(() => {
        if (!imageSrc || !completedCrop) return;
        let active = true;

        const generate = async () => {
            try {
                const image = new Image();
                image.src = imageSrc;
                await new Promise<void>((res, rej) => { image.onload = () => res(); image.onerror = rej; });
                if (!active || !imgRef.current) return;

                const el = imgRef.current;
                const scaleX = image.naturalWidth / el.width;
                const scaleY = image.naturalHeight / el.height;
                const scaled = {
                    x: completedCrop.x * scaleX, y: completedCrop.y * scaleY,
                    width: completedCrop.width * scaleX, height: completedCrop.height * scaleY,
                };

                const pw = 280, ph = Math.round((scaled.height * pw) / scaled.width);
                const { canvas, ctx } = createCanvas(pw, ph);
                if (!ctx) return;

                const { canvas: draw, ctx: dCtx } = createCanvas(scaled.width, scaled.height);
                if (!dCtx) return;

                await getCroppedImg(image, scaled, rotation, dCtx);
                if (!active) return;
                ctx.drawImage(draw, 0, 0, pw, ph);
                applyAdaptiveThreshold(canvas, ctx, threshold, inkMode);
                if (!active) return;
                setPreviewBase64(canvas.toDataURL('image/png'));
            } catch { /* falla silenciosa de preview */ }
        };

        const timer = setTimeout(generate, 150);
        return () => { active = false; clearTimeout(timer); };
    }, [imageSrc, completedCrop, rotation, threshold, inkMode]);

    const processFile = (file: File, onError: (msg: string) => void) => {
        if (!file.type.startsWith('image/')) {
            onError('Por favor, seleccione un archivo de imagen válido (PNG, JPG).');
            return;
        }
        new Compressor(file, {
            quality: 0.8, maxWidth: 1200, maxHeight: 1200,
            success(result) { setImageSrc(URL.createObjectURL(result as File)); setShowCropper(true); },
            error() { setImageSrc(URL.createObjectURL(file)); setShowCropper(true); },
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, onError: (msg: string) => void) => {
        const file = e.target.files?.[0];
        if (file) processFile(file, onError);
    };

    const handleDragOver  = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = () => setIsDragging(false);
    const handleDrop      = (e: React.DragEvent, onError: (msg: string) => void) => {
        e.preventDefault(); setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) processFile(file, onError);
    };

    const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const { width, height } = e.currentTarget;
        const c = buildCropFromAspect(width, height, aspectRatio);
        setCrop(c);
        setCompletedCrop({ unit: 'px', x: (c.x/100)*width, y: (c.y/100)*height, width: (c.width/100)*width, height: (c.height/100)*height });
    };

    const handleAspectChange = (aspect: number | undefined) => {
        setAspectRatio(aspect);
        if (imgRef.current) {
            const { width, height } = imgRef.current;
            const c = buildCropFromAspect(width, height, aspect);
            setCrop(c);
            setCompletedCrop({ unit: 'px', x: (c.x/100)*width, y: (c.y/100)*height, width: (c.width/100)*width, height: (c.height/100)*height });
        }
    };

    const applyCropAndFilters = async (onSuccess: (b64: string) => void, onError: (msg: string) => void) => {
        if (!imageSrc || !completedCrop || !imgRef.current) return;
        try {
            const image = new Image();
            image.src = imageSrc;
            await new Promise<void>((res, rej) => { image.onload = () => res(); image.onerror = rej; });

            const el = imgRef.current;
            const scaleX = image.naturalWidth / el.width;
            const scaleY = image.naturalHeight / el.height;
            const scaled = {
                x: completedCrop.x * scaleX, y: completedCrop.y * scaleY,
                width: completedCrop.width * scaleX, height: completedCrop.height * scaleY,
            };

            const targetW = Math.min(scaled.width, 800);
            const targetH = Math.round((scaled.height * targetW) / scaled.width);
            const { canvas, ctx } = createCanvas(targetW, targetH);
            if (!ctx) return;

            const { canvas: draw, ctx: dCtx } = createCanvas(scaled.width, scaled.height);
            if (!dCtx) return;

            await getCroppedImg(image, scaled, rotation, dCtx);
            ctx.drawImage(draw, 0, 0, targetW, targetH);
            applyAdaptiveThreshold(canvas, ctx, threshold, inkMode);

            onSuccess(canvas.toDataURL('image/png'));
            setShowCropper(false);
            setImageSrc(null);
        } catch {
            onError('Ocurrió un error al procesar y recortar la firma.');
        }
    };

    const cancelCrop = () => { setShowCropper(false); setImageSrc(null); };

    return {
        imageSrc, crop, completedCrop, rotation, showCropper, threshold, inkMode,
        aspectRatio, previewBase64, isDragging, imgRef,
        setCrop, setCompletedCrop, setRotation, setThreshold, setInkMode, setIsDragging,
        handleAspectChange, processFile, handleFileChange, handleDragOver, handleDragLeave,
        handleDrop, onImageLoad, applyCropAndFilters, cancelCrop,
    };
}
