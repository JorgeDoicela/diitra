# Frontend Mobile (Expo React Native Companion)

La rama híbrida móvil habilita al plantel docente enviar aprobaciones veloces y a los Coinvestigadores anexar evidencias fotográficas In-Situ mediante conectividad REST y cámaras de dispositivos iOS/Android.

## Expo File-Based Routing (App Router)

Atrás queda el Navigation Container imperativo extenso. DIITRA Mobile es estructurado sobre **Expo Router v6**. 
- Todo archivo insertado en `/app` muta un Deep Link interno (ej: `/app/mis-proyectos/123`).
- Ideal para la estrategia de Magic Links, donde un mail al celular con URL `diitra://revision?token=abc` ataca directamente la Deep Route nativa en iOS/Android sin parseo extra manual.

## Estrategia de Build Enterprise (CI/CD con EAS)

A nivel corporativo, compilar Binarios APKs/AABs o IPA locales es anticuado. La trazabilidad asume **Expo Application Services (EAS)**:

```bash
# Ejemplo: Empaquetamiento corporativo asíncrono
eas build --profile production --platform both
```

### EAS Update (Over The Air - OTA)
> [!TIP]
> **Hot-Fixing Corporativo**.
> Al hallar un error en la capa Javascript UI (por ejemplo, SignalR desconectando un timeout) no se hace resubmit a las tiendas Apple App Store o Google Play de la App Móvil. 
> Mediante `eas update`, la versión alojada inyecta los bundles javascript nuevos transparentemente durante el proximo Launch de la APP del usuario.

## Módulos Híbridos Sensoriales
Haciendo de capa Bridge hacia ecosistemas nativos, la delegación C++ en hilo de UI (JSI/Worklets vía React Native Reanimated) mantiene fluídos los mapas de cronograma y la apertura de archivos sin degradar el Main Thread nativo donde ocurre la lógica pesada de la cámara de validaciones (`expo-haptics` da respuesta táctil inmersiva al validar procesos).
