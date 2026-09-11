import api from './axios_config';

/**
 * Cache centralizado de promesas para catálogos institucionales.
 * Evita "cache stampedes" (carreras de red) causados por montajes simultáneos
 * de componentes (ej: DocumentEditor + MemberSearchSelector + ProjectWorkspace).
 * Una vez solicitada una URL o catálogo, todos los consumidores comparten la
 * misma promesa en vuelo y el resultado en memoria durante la sesión.
 */
const KNOWN_ALIASES: Record<string, string> = {
    'carreras': '/catalogs/carreras',
    'mi-carrera': '/catalogs/mi-carrera',
    'programas': '/catalogs/programas',
    'dominios': '/catalogs/dominios',
    'lineas': '/Convocatorias/catalogos/lineas',
    'sublineas': '/catalogs/sublineas-investigacion',
    'tipos-producto': '/catalogs/tipo-producto',
    'tipos-investigacion': '/catalogs/tipos-investigacion',
    'niveles': '/catalogs/niveles',
    'departments': '/Admin/departments',
    'groups': '/groups',
    'convocatorias': '/Convocatorias'
};

function normalizeCatalogKey(rawKey: string): string {
    const trimmed = rawKey.trim();
    if (KNOWN_ALIASES[trimmed]) {
        return KNOWN_ALIASES[trimmed];
    }
    // Normalizar slash inicial
    return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

const promiseCache = new Map<string, Promise<any>>();
const dataCache = new Map<string, any>();

export async function fetchCatalogCached<T = any>(
    key: string,
    fetcher?: () => Promise<{ data: T }>
): Promise<T> {
    const normalizedKey = normalizeCatalogKey(key);

    if (dataCache.has(normalizedKey)) {
        return dataCache.get(normalizedKey);
    }

    if (promiseCache.has(normalizedKey)) {
        return promiseCache.get(normalizedKey);
    }

    const execFetcher = fetcher || (() => api.get<T>(normalizedKey));

    const promise = execFetcher()
        .then((res) => {
            const data = res?.data !== undefined ? res.data : (res as any);
            dataCache.set(normalizedKey, data);
            promiseCache.delete(normalizedKey);
            return data;
        })
        .catch((err) => {
            promiseCache.delete(normalizedKey);
            console.warn(`[catalogsCache] Error al cargar catálogo '${normalizedKey}':`, err);
            return (Array.isArray(err) ? [] : []) as unknown as T;
        });

    promiseCache.set(normalizedKey, promise);
    return promise;
}

export function clearCatalogCache(key?: string) {
    if (key) {
        const normalizedKey = normalizeCatalogKey(key);
        dataCache.delete(normalizedKey);
        promiseCache.delete(normalizedKey);
    } else {
        dataCache.clear();
        promiseCache.clear();
    }
}
