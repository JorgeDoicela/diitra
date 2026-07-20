/**
 * DIITRA — Vitest Global Setup
 *
 * Este archivo se ejecuta antes de cada test suite.
 * Configura mocks globales de los contextos de la app
 * y extiende los matchers de Vitest con @testing-library/jest-dom.
 */
import "@testing-library/jest-dom";
import { vi } from "vitest";

// ─── Mock de import.meta.env (Vite no existe en Node/Vitest) ────────────────
vi.stubEnv("VITE_API_BASE_URL", "http://localhost:5000/api");

// ─── Mock de axios para no hacer peticiones HTTP reales ─────────────────────
vi.mock("axios", async () => {
    const actual = await vi.importActual<typeof import("axios")>("axios");
    return {
        ...actual,
        default: {
            ...actual.default,
            create: () => ({
                get: vi.fn(),
                post: vi.fn(),
                put: vi.fn(),
                patch: vi.fn(),
                delete: vi.fn(),
                interceptors: {
                    request: { use: vi.fn(), eject: vi.fn() },
                    response: { use: vi.fn(), eject: vi.fn() },
                },
            }),
        },
    };
});

// ─── Mock de react-router-dom (useNavigate) ──────────────────────────────────
vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual<typeof import("react-router-dom")>(
        "react-router-dom"
    );
    return {
        ...actual,
        useNavigate: () => vi.fn(),
    };
});

// ─── Mock de NotificationsContext ─────────────────────────────────────────────
vi.mock("../../api/NotificationsContext", () => ({
    useNotifications: () => ({
        addToast: vi.fn(),
    }),
    NotificationsProvider: ({ children }: { children: React.ReactNode }) =>
        children,
}));

// ─── Mock de ConfirmContext ───────────────────────────────────────────────────
vi.mock("../../api/ConfirmContext", () => ({
    useConfirm: () => vi.fn().mockResolvedValue(true),
    ConfirmProvider: ({ children }: { children: React.ReactNode }) => children,
}));
