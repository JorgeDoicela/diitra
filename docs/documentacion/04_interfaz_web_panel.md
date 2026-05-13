# Frontend Web Enterprise (Vite + React)

El portal centralizado administrativo está diseñado para la gestión de datos de alta densidad (Rich Data UI) y utiliza un ecosistema de herramientas de última generación.

## Core Tecnológico

- **Vite.js**: Optimiza el tiempo de arranque del entorno de desarrollo mediante el uso de ESBuild.
- **Tailwind v4 (Oxide Compiler)**: Motor de estilos de alto rendimiento que permite una compilación atómica de clases y soporte para Content Security Policies (CSP) estrictas.
- **React 19**: Utiliza Hooks y compilación optimizada para mejorar el renderizado del DOM virtual en componentes complejos y listados extensos.

## Optimizaciones Web (Core Web Vitals)

Para nivel empresarial operativo:
1. **Lazy Loading y Code Splitting**: Los Módulos de "Evaluador Externo" que poseen librerías pesadas de rúbricas no se envían al paquete (bundle) inicial. Se solicitan vía red en cascada bajo demanda.
2. **React Hook Form Contextual**: En un documento de "Marco Teórico" el tipeo incesante (keystrokes) provocaría el repintado de todos los menús adyacentes. Hook form mantiene el binding local de estado previniendo re-renderizado global del Header/Footer.

## Security y Fetching

El marco integrativo del Axios se interviene en interceptores (`axios.interceptors.response`).
- Al recibir `401 Unauthorized`, el cliente no se bloquea. Está acoplado a un redibujado de la ruta (React Router DOM `<Redirect />`) enviando instantáneamente al pool de re-autenticación central, o limpieza de estado (`Zustand store`).
- Debido al token como cookie HttpOnly, el Fetching **obliga** la directriz `withCredentials: true`.
