// ═══════════════════════════════════════════════════════════════════
// DIITRA CoWork — High-Performance Binary Utilities (v1.0)
// Optimized encoders to prevent Call Stack Overflow on large deltas
// ═══════════════════════════════════════════════════════════════════

/**
 * Convierte un Uint8Array a Base64 de forma ultra-rápida y segura.
 * Utiliza chunking para prevenir errores "Maximum call stack size exceeded" en deltas masivos.
 */
export function uint8ArrayToBase64(bytes: Uint8Array): string {
    const chunks: string[] = [];
    const chunkSize = 0x8000; // Bloques de 32KB
    for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.subarray(i, i + chunkSize);
        // Cast a any para prevenir advertencias de tipado estricto en apply
        chunks.push(String.fromCharCode.apply(null, chunk as any));
    }
    return btoa(chunks.join(''));
}

/**
 * Convierte una cadena Base64 a Uint8Array a la velocidad del motor de JS.
 * Evita la creación de cierres (closures) y arreglos temporales.
 */
export function base64ToUint8Array(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}
