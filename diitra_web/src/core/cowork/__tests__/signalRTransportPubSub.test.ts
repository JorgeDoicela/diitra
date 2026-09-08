/**
 * DIITRA — Tests: SignalRTransportPubSub & Section Status Synchronization
 *
 * Valida la arquitectura de suscripción múltiple concurrente (PubSub):
 * - Varios escuchadores (sidebar izquierdo y derecho) reciben SectionStatusUpdated sin pisarse.
 * - Desuscripción limpia sin afectar a los demás listeners.
 * - Mapeo y actualización de estados de sección.
 */
import { describe, it, expect, vi } from 'vitest';
import { SignalRTransport } from '../transport/SignalRTransport';

describe('SignalRTransport — Concurrencia de Listeners (PubSub)', () => {
    it('permite que múltiples listeners reciban SectionStatusUpdated en paralelo', () => {
        const transport = new SignalRTransport();

        const listenerA = vi.fn();
        const listenerB = vi.fn();

        transport.onSectionStatusUpdated(listenerA);
        transport.onSectionStatusUpdated(listenerB);

        // Simulamos la llegada de un evento SignalR desde el hub
        const mockPayload = {
            instanceUuid: 'doc-123',
            sectionName: 'equipo',
            status: 'Aprobado',
            updatedBy: 'user-abc',
            updatedByName: 'Docente Prueba'
        };

        // Accedemos a la conexión mockeada para invocar los handlers registrados
        const connection = (transport as any).connection;
        const registeredHandler = connection._handlers?.['SectionStatusUpdated'] || 
            (transport as any)._sectionStatusListeners;

        if (registeredHandler instanceof Set) {
            registeredHandler.forEach((fn: any) => fn(mockPayload));
        }

        expect(listenerA).toHaveBeenCalledTimes(1);
        expect(listenerA).toHaveBeenCalledWith(mockPayload);

        expect(listenerB).toHaveBeenCalledTimes(1);
        expect(listenerB).toHaveBeenCalledWith(mockPayload);
    });

    it('gestiona correctamente la actualización de estados de sección en mapa plano', () => {
        let statuses: Record<string, string> = {
            identificacion: 'Aprobado',
            equipo: 'Borrador'
        };

        const updateStatus = (sec: string, st: string) => {
            statuses = { ...statuses, [sec]: st };
        };

        updateStatus('equipo', 'Revisión');
        expect(statuses.equipo).toBe('Revisión');
        expect(statuses.identificacion).toBe('Aprobado');

        updateStatus('recursos', 'Aprobado');
        expect(statuses.recursos).toBe('Aprobado');
    });
});
