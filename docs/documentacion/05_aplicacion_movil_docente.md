# Frontend Mobile (Expo React Native)

El componente móvil permite al personal docente la gestión eficiente de aprobaciones y la captura de evidencias fotográficas in-situ mediante integración con la API REST y los módulos de cámara de dispositivos iOS y Android.

## Expo Router (App Router)

El sistema de navegación se basa en Expo Router v6, utilizando una estructura de archivos que facilita la implementación de Deep Linking.

- **Enrutamiento basado en archivos**: Las rutas dentro de `/app` se mapean automáticamente a enlaces profundos (ej. `/app/proyectos/123`).
- **Integración con Magic Links**: Permite que las notificaciones por correo electrónico redirijan al usuario directamente a la sección de revisión correspondiente dentro de la aplicación móvil.

## Estrategia de Build y Despliegue (CI/CD)

El proceso de generación de binarios se gestiona mediante Expo Application Services (EAS), garantizando la trazabilidad y consistencia del software.

### EAS Update (Over The Air)

Mediante EAS Update, el sistema permite la distribución de parches críticos en la capa de interfaz de usuario sin requerir una nueva publicación en las tiendas de aplicaciones (App Store / Google Play). Esto asegura una respuesta rápida ante errores en la lógica de negocio o de presentación.

## Módulos Nativos y Rendimiento

La aplicación utiliza módulos nativos optimizados para garantizar la fluidez de la interfaz de usuario. El uso de React Native Reanimated permite una gestión eficiente de las animaciones y transiciones de cronogramas sin degradar el hilo principal de ejecución del sistema.
