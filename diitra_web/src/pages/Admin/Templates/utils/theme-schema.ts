export interface ThemeToken {
    key: string;            // Nombre en snake_case para Handlebars: theme.colors.primary
    camelKey: string;       // Nombre en camelCase para el JSON
    label: string;          // Etiqueta para la UI
    type: 'color' | 'text' | 'select' | 'toggle' | 'image';
    category: 'colors' | 'typography' | 'layout' | 'brand';
    defaultValue: string | boolean;
    options?: { label: string; value: string }[]; // Para type='select'
    description?: string;
    unit?: string;          // Unidad de medida: 'cm', 'pt', etc.
}

export const THEME_SCHEMA: ThemeToken[] = [
    // COLORS
    { key: 'primary', camelKey: 'primary', label: 'Color Primario', type: 'color', category: 'colors', defaultValue: '#222c57' },
    { key: 'secondary', camelKey: 'secondary', label: 'Color Secundario (Dorado)', type: 'color', category: 'colors', defaultValue: '#c4a857' },
    { key: 'text', camelKey: 'text', label: 'Color de Texto de Párrafos', type: 'color', category: 'colors', defaultValue: '#1a1a1a' },
    { key: 'table_header_bg', camelKey: 'tableHeaderBg', label: 'Fondo de Encabezados de Tabla', type: 'color', category: 'colors', defaultValue: '#222c57' },
    { key: 'table_header_color', camelKey: 'tableHeaderColor', label: 'Texto de Encabezados de Tabla', type: 'color', category: 'colors', defaultValue: '#ffffff' },
    // TYPOGRAPHY
    {
        key: 'font_family', camelKey: 'fontFamily', label: 'Familia Tipográfica', type: 'select', category: 'typography', defaultValue: "'Calibri', 'Open Sans', Arial, sans-serif",
        options: [
            { label: 'Calibri (Recomendado)', value: "'Calibri', 'Open Sans', Arial, sans-serif" },
            { label: 'Helvetica', value: "'Helvetica Neue', Helvetica, Arial, sans-serif" },
            { label: 'Century Gothic', value: "'Century Gothic', sans-serif" },
            { label: 'Georgia (Serif)', value: 'Georgia, serif' },
        ]
    },
    { key: 'base_size', camelKey: 'baseSize', label: 'Tamaño de Fuente Base', type: 'text', category: 'typography', defaultValue: '10pt', unit: 'pt' },
    { key: 'line_height', camelKey: 'lineHeight', label: 'Interlineado', type: 'text', category: 'typography', defaultValue: '1.4' },
    // LAYOUT
    { key: 'margin_top', camelKey: 'marginTop', label: 'Margen Superior', type: 'text', category: 'layout', defaultValue: '3cm', unit: 'cm' },
    { key: 'margin_bottom', camelKey: 'marginBottom', label: 'Margen Inferior', type: 'text', category: 'layout', defaultValue: '2cm', unit: 'cm' },
    { key: 'margin_left', camelKey: 'marginLeft', label: 'Margen Izquierdo', type: 'text', category: 'layout', defaultValue: '2cm', unit: 'cm' },
    { key: 'margin_right', camelKey: 'marginRight', label: 'Margen Derecho', type: 'text', category: 'layout', defaultValue: '2cm', unit: 'cm' },
    // BRAND
    { key: 'document_code', camelKey: 'documentCode', label: 'Código Normativo del Formato', type: 'text', category: 'brand', defaultValue: '', description: 'Código normativo en esquina superior derecha (ej: F – ISTPET – 001 – INDIV – ABR 2026)' },
    { key: 'cover_image', camelKey: 'coverImage', label: 'Imagen de Portada (Personalizada)', type: 'image', category: 'brand', defaultValue: '' },
    { key: 'background_image', camelKey: 'backgroundImage', label: 'Imagen de Fondo de Hojas', type: 'image', category: 'brand', defaultValue: '' },
    {
        key: 'background_opacity', camelKey: 'backgroundOpacity', label: 'Opacidad de Marca de Agua / Fondo', type: 'select', category: 'brand', defaultValue: '0.12',
        options: [
            { label: '5% - Muy Suave (Recomendado)', value: '0.05' },
            { label: '12% - Suave Estándar (Recomendado)', value: '0.12' },
            { label: '20% - Visible Moderado', value: '0.2' },
            { label: '35% - Intenso', value: '0.35' },
            { label: '50% - Opacidad Media', value: '0.5' },
            { label: '100% - Sin Transparencia', value: '1.0' },
        ]
    },
    {
        key: 'background_fit', camelKey: 'backgroundFit', label: 'Modo de Ajuste de Fondo', type: 'select', category: 'brand', defaultValue: 'contain',
        options: [
            { label: 'Marca de Agua Central (Sello)', value: 'contain' },
            { label: 'Hoja Membretada Completa (Full Bleed)', value: 'cover' },
            { label: 'Extendido Exacto (100% 100%)', value: '100% 100%' },
        ]
    },
];

export function buildDefaultTheme(): Record<string, Record<string, any>> {
    const theme: Record<string, Record<string, any>> = { colors: {}, typography: {}, layout: {}, brand: {} };
    for (const token of THEME_SCHEMA) {
        theme[token.category][token.camelKey] = token.defaultValue;
    }
    return theme;
}

export function getOfficialDocumentCode(templateCode?: string): string {
    if (!templateCode) return '';
    const upper = templateCode.toUpperCase();
    if (upper.includes('PROTOCOLO') || upper.includes('PROYECTO_INVESTIGACION') || upper.includes('INVESTIGACION') || upper === '1') {
        return 'F – ISTPET – 001 – INDIV – ABR 2026';
    }
    if (upper.includes('PLAN_APRENDIZAJE')) {
        return 'F – ISTPET – 002 – INDIV – ABR 2026';
    }
    if (upper.includes('RUBRICA') || upper.includes('EVALUACION')) {
        return 'F – ISTPET – 003 – INDIV – ABR 2026';
    }
    return '';
}

export function mergeWithDefaults(partial: any, templateCode?: string): Record<string, Record<string, any>> {
    const defaults = buildDefaultTheme();
    let result = defaults;

    if (partial) {
        let parsed: any = {};
        if (typeof partial === 'string') {
            try {
                parsed = JSON.parse(partial);
            } catch {
                parsed = {};
            }
        } else {
            parsed = partial;
        }

        result = {
            colors: { ...defaults.colors, ...(parsed.colors || {}) },
            typography: { ...defaults.typography, ...(parsed.typography || {}) },
            layout: { ...defaults.layout, ...(parsed.layout || {}) },
            brand: { ...defaults.brand, ...(parsed.brand || {}) },
        };
    }

    if (templateCode && !result.brand.documentCode && !result.brand.document_code) {
        result.brand.documentCode = getOfficialDocumentCode(templateCode);
    }

    return result;
}
