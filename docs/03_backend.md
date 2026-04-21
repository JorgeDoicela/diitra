# Backend Enterprise API (.NET 9)

El ecosistema transaccional se fundamente en la fiabilidad industrial de **.NET 9/8**. Centralizando la lógica bajo el paradigma *Modular Monolith*.

## 🛡️ Seguridad y Mitigaciones OWASP

Para adherirse a estándares de seguridad Enterprise (ISO 27001), la configuración del Gateway C# implementa la prevención de vectores top de vulnerabilidad Web:

1. **Broken Access Control mitigating via PBAC**: El código prescinde de la decoración genérica de Roles en los controladores. Se implementa un analizador que mapea la clase `typeof(Permissions)` y auto-resuelve requerimientos a nivel Claim, previniendo escalamiento de privilegios por inyección de token.
2. **XSS Protection Mechanism**: La plataforma inyecta la autenticación JWT empaquetándola en la cabecera `Set-Cookie` en estado `HttpOnly`. Bloqueando al motor V8 de Javascript (Cliente) el acceso de lectura a los secretos de sesión.
3. **CORS Governance**: Las políticas de acceso orígenes cruzados estipuladas en `Program.cs` ("Diitra_policy") no aplican wilcards `*` en producción. Estipulan explícitamente los puertos estáticos (Vite 5173, Next/React 3000-3002) mitigando falsificadores de dominio.

## 🚀 Desglose de Inyección de Dependencias

```csharp
// Modular Monolith Injection Structure
builder.Services.AddScoped<IAuthService, AuthService>();      // Auth Module
builder.Services.AddScoped<IAdminService, AdminService>();    // Admin Module
builder.Services.AddScoped<IResearchService, ProjectService>();// Research Module
// Servicios Híbridos Inyectables
builder.Services.AddScoped<IFirmaElectronicaService, FirmaElectronicaService>();
builder.Services.AddScoped<IAIAssistantService, AIAssistantService>();
```

Las dependencias de infraestructura se manejan mediante el ciclo de vida `AddScoped`, esto significa que cada petición HTTP/SignalR provee su propia bolsa transaccional unitaria a través del Contexto (`DiitraContext`), previniendo choques polimórficos de Singletons concurrentes.

## 📡 WebSockets: The SignalR Bus
En un entorno colaborativo donde la firma de una resolución o edición de un sub-título de cronograma puede suceder mientras otro usuario co-edita (Idéntico al estilo GSuite), SignalR expone el `DocumentHub`.
Este Hub empuja _streams_ binarios ligeros (MsgPack o fallback a JSON) directo hacia Axios/Fetch, minimizando el I/O blocking request del servidor.
