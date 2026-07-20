import React from 'react';

export const formatCarrera = (carrera: string | null | undefined): string => {
    if (!carrera) return 'Sin carrera asignada';
    return carrera
        .toLowerCase()
        .replace(/(^\w|\s\w)/g, (m) => m.toUpperCase())
        .replace(/\b(De|En|Y|La|El|Los|Las|Con|Para)\b/g, (m) => m.toLowerCase());
};

export const formatNombre = (nombre: string | null | undefined): string => {
    if (!nombre) return '';
    return nombre
        .toLowerCase()
        .replace(/(^\w|\s\w)/g, (m) => m.toUpperCase());
};

export const highlightText = (text: string | null | undefined, search: string): React.ReactNode => {
    if (!text) return '';
    if (!search.trim()) return <>{text}</>;

    try {
        const escapedSearch = search.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const regex = new RegExp(`(${escapedSearch})`, 'gi');
        const parts = text.split(regex);

        return (
            <>
                {parts.map((part, i) =>
                    regex.test(part) ? (
                        <mark key={i} className="bg-brand/20 text-brand font-semibold px-0.5 rounded-sm">
                            {part}
                        </mark>
                    ) : (
                        part
                    )
                )}
            </>
        );
    } catch (e) {
        return <>{text}</>;
    }
};
