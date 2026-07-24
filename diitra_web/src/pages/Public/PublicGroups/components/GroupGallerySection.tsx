import React from 'react';
import { Camera, Trash } from 'lucide-react';
import type { Group } from '../types';

interface GroupGallerySectionProps {
    selectedGroup: Group;
    canEdit: boolean;
    uploading: boolean;
    activePhotoUrl: string | null;
    setActivePhotoUrl: (url: string | null) => void;
    handleUploadPhoto: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleDeletePhoto: (url: string) => void;
}

export const GroupGallerySection: React.FC<GroupGallerySectionProps> = ({
    selectedGroup,
    canEdit,
    uploading,
    activePhotoUrl,
    setActivePhotoUrl,
    handleUploadPhoto,
    handleDeletePhoto
}) => {
    return (
        <>
            {/* GALERÍA DE ACTIVIDADES */}
            <section className="py-28 relative border-t border-border-thin/30 space-y-8 animate-fade-up lg:-ml-24 lg:-mr-24">
                <div className="flex items-center justify-between">
                    <h2 className="text-xs font-mono text-text-dim uppercase tracking-widest">// Galería de Actividades</h2>
                    {canEdit && (
                        <label className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border-thin text-xs font-medium text-text-main hover:border-border-hover cursor-pointer transition-colors select-none font-sans">
                            <Camera size={13} />
                            {uploading ? 'Subiendo...' : 'Añadir foto'}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleUploadPhoto}
                                disabled={uploading}
                                className="hidden"
                            />
                        </label>
                    )}
                </div>

                {selectedGroup.fotoUrl ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {selectedGroup.fotoUrl.split(',').filter(Boolean).map((photoUrl, index) => (
                            <div
                                key={index}
                                className="relative aspect-video rounded-lg overflow-hidden bg-surface group/photo border border-border-thin/30 cursor-pointer"
                                onClick={() => setActivePhotoUrl(photoUrl)}
                            >
                                <img
                                    src={photoUrl}
                                    alt={`Galería ${index + 1}`}
                                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                                />
                                {canEdit && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeletePhoto(photoUrl);
                                        }}
                                        className="absolute top-2.5 right-2.5 p-1.5 rounded-md bg-bg-deep/80 hover:bg-red-500/10 hover:text-red-500 text-text-dim opacity-0 group-hover/photo:opacity-100 transition-all border border-border-thin/40"
                                        title="Eliminar fotografía"
                                    >
                                        <Trash size={12} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 rounded-2xl border border-dashed border-border-thin bg-surface/10 backdrop-blur-sm font-sans flex flex-col items-center justify-center gap-3">
                        <div className="p-4 rounded-full bg-surface-hover border border-border-thin/80 text-text-dim/40">
                            <Camera size={24} className="stroke-[1.5]" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-text-main mb-0.5">Galería sin imágenes</p>
                            <p className="text-[10px] text-text-dim">El grupo aún no tiene fotografías registradas.</p>
                            {canEdit && <p className="text-[9px] text-brand font-medium mt-2">Haz clic en "Añadir foto" en la esquina superior para ilustrar el portafolio.</p>}
                        </div>
                    </div>
                )}
            </section>

            {/* Modal Lightbox */}
            {activePhotoUrl && (
                <div
                    className="fixed inset-0 z-[999] flex items-center justify-center bg-black/90 backdrop-blur-sm transition-all duration-300"
                    onClick={() => setActivePhotoUrl(null)}
                >
                    <button
                        onClick={() => setActivePhotoUrl(null)}
                        className="absolute top-6 right-6 px-4 py-2 rounded-lg bg-surface/80 hover:bg-surface border border-border-thin text-xs text-text-main transition-colors font-mono select-none"
                    >
                        CERRAR
                    </button>
                    <div
                        className="max-w-[90vw] max-h-[85vh] overflow-hidden rounded-xl border border-border-thin shadow-2xl relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img src={activePhotoUrl} alt="Visualización de galería" className="w-full h-full object-contain max-h-[80vh]" />
                    </div>
                </div>
            )}
        </>
    );
};
