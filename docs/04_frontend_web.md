# Frontend Web Enterprise (Vite + React)

El portal centralizado administrativo está pensado para carga de alta densidad (Rich Data UI) y está compuesto bajo un frontend tooling state-of-the-art.

## Core Tecnológico de Alto Rendimiento

- **Vite.js sobre Webpack**: Disminuye el Cold Start de los desarrolladores un 80% mediante ESBuild.
- **Tailwind v4 (Oxide Compiler)**: Motor sin dependencias pesadas de Node. El AST inyectado detecta atómicamente clases utillizadas. Soporte para *Content-Security-Policies* rígidas.
- **React 19 Hooks & Compiler**: Aprovecha las últimas reducciones de boilerplate para optimizar pre-renderizado del Virtual DOM en tablas de listados infinitos (cientos de convocatorias).

## Optimizaciones Web (Core Web Vitals)

Para nivel empresarial operativo:
1. **Lazy Loading y Code Splitting**: Los Módulos de "Evaluador Externo" que poseen librerías pesadas de rúbricas no se envían al paquete (bundle) inicial. Se solicitan vía red en cascada bajo demanda.
2. **React Hook Form Contextual**: En un documento de "Marco Teórico" el tipeo incesante (keystrokes) provocaría el repintado de todos los menús adyacentes. Hook form mantiene el binding local de estado previniendo re-renderizado global del Header/Footer.

## Security y Fetching

El marco integrativo del Axios se interviene en interceptores (`axios.interceptors.response`).
- Al recibir `401 Unauthorized`, el cliente no se bloquea. Está acoplado a un redibujado de la ruta (React Router DOM `<Redirect />`) enviando instantáneamente al pool de re-autenticación central, o limpieza de estado (`Zustand store`).
- Debido al token como cookie HttpOnly, el Fetching **obliga** la directriz `withCredentials: true`.
