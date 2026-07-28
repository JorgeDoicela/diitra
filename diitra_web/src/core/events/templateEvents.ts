// ══════════════════════════════════════════════════════════════════════════════
// DIITRA SYSTEM EVENTS — EVENT BUS & BROADCAST SYSTEM
// ══════════════════════════════════════════════════════════════════════════════

import { useEffect } from 'react';

export interface TemplatePublishedEventDetail {
    templateCode?: string;
    template_code?: string;
    name?: string;
    version?: string;
    timestamp?: number;
}

const EVENT_NAME = 'diitra-template-published';
const CHANNEL_NAME = 'diitra_system_channel';

// ── Emisor de Evento (Real-Time Broadcast) ────────────────────────────────────
export function notifyTemplatePublished(data: { templateCode?: string; template_code?: string; name?: string; version?: string }) {
    const code = data.template_code || data.templateCode || '';
    const detail: TemplatePublishedEventDetail = {
        templateCode: code,
        template_code: code,
        name: data.name,
        version: data.version,
        timestamp: Date.now(),
    };

    console.info('[DIITRA EventBus] Emitiendo publicación de plantilla:', detail);

    // 1. Emitir en la pestaña actual (CustomEvent)
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail }));

    // 2. Transmitir a todas las demás pestañas abiertas (BroadcastChannel)
    if (typeof BroadcastChannel !== 'undefined') {
        try {
            const channel = new BroadcastChannel(CHANNEL_NAME);
            channel.postMessage({ type: EVENT_NAME, detail });
            channel.close();
        } catch (e) {
            console.warn('[DIITRA EventBus] BroadcastChannel error:', e);
        }
    }

    // 3. Fallback de LocalStorage (al cambiar la clave se notifica a otras pestañas)
    try {
        localStorage.setItem('diitra_last_published_template', JSON.stringify(detail));
    } catch {}
}

const normalizeCode = (code?: string) => (code ? code.replace(/-/g, '_').toUpperCase().trim() : '');

// ── React Hook para escuchar eventos de publicación ──────────────────────────
export function useTemplatePublishedListener(
    onPublished: (detail: TemplatePublishedEventDetail) => void,
    filterTemplateCode?: string
) {
    useEffect(() => {
        const handleEvent = (detail: TemplatePublishedEventDetail) => {
            const filterNorm = normalizeCode(filterTemplateCode);
            const rawCode = detail.template_code || detail.templateCode || '';
            const detailNorm = normalizeCode(rawCode);

            console.info('[DIITRA EventBus] Evento recibido en listener:', { filterNorm, detailNorm, detail });

            if (filterNorm && detailNorm && filterNorm !== detailNorm) {
                console.info('[DIITRA EventBus] Descartando evento por filtro de plantilla no coincidente.');
                return;
            }
            onPublished(detail);
        };

        // 1. Escuchar CustomEvent local
        const localHandler = (e: Event) => {
            const customEvent = e as CustomEvent<TemplatePublishedEventDetail>;
            if (customEvent.detail) {
                handleEvent(customEvent.detail);
            }
        };
        window.addEventListener(EVENT_NAME, localHandler);

        // 2. Escuchar BroadcastChannel multitab
        let channel: BroadcastChannel | null = null;
        if (typeof BroadcastChannel !== 'undefined') {
            try {
                channel = new BroadcastChannel(CHANNEL_NAME);
                channel.onmessage = (event) => {
                    if (event.data?.type === EVENT_NAME && event.data.detail) {
                        handleEvent(event.data.detail);
                    }
                };
            } catch (e) {
                console.warn('[DIITRA EventBus] Error listening on BroadcastChannel:', e);
            }
        }

        // 3. Escuchar LocalStorage event (Fallback multiplataforma)
        const storageHandler = (e: StorageEvent) => {
            if (e.key === 'diitra_last_published_template' && e.newValue) {
                try {
                    const parsed = JSON.parse(e.newValue);
                    if (parsed) handleEvent(parsed);
                } catch {}
            }
        };
        window.addEventListener('storage', storageHandler);

        return () => {
            window.removeEventListener(EVENT_NAME, localHandler);
            window.removeEventListener('storage', storageHandler);
            if (channel) {
                channel.close();
            }
        };
    }, [onPublished, filterTemplateCode]);
}
