# Backend Enterprise API (.NET 8.0)

El ecosistema transaccional se fundamenta en la fiabilidad industrial de **.NET 8.0 (LTS)**. Centralizando la lógica bajo el paradigma *Modular Monolith* y optimizado para un arranque instantáneo eliminando dependencias de red síncronas en el inicio.


## Seguridad y Mitigaciones OWASP

Para adherirse a estándares de seguridad Enterprise (ISO 27001), la configuración del Gateway C# implementa la prevención de vectores top de vulnerabilidad Web:

1. **Broken Access Control mitigating via PBAC**: El código prescinde de la decoración genérica de Roles en los controladores. Se implementa un analizador que mapea la clase `typeof(Permissions)` y auto-resuelve requerimientos a nivel Claim, previniendo escalamiento de privilegios por inyección de token.
2. **XSS Protection Mechanism**: La plataforma inyecta la autenticación JWT empaquetándola en la cabecera `Set-Cookie` en estado `HttpOnly`. Bloqueando al motor V8 de Javascript (Cliente) el acceso de lectura a los secretos de sesión.
3. **CORS Governance**: Las políticas de acceso orígenes cruzados estipuladas en `Program.cs` ("Diitra_policy") no aplican wilcards `*` en producción. Estipulan explícitamente los puertos estáticos (Vite 5173, Next/React 3000-3002) mitigando falsificadores de dominio.

## Desglose de Inyección de Dependencias

```csharp
// Modular Monolith Injection Structure
builder.Services.AddScoped<IAuthService, AuthService>();       // Auth Module
builder.Services.AddScoped<IAdminService, AdminService>();     // Admin Module
builder.Services.AddScoped<IResearchService, ProjectService>(); // Research Module

// Motor Enterprise de Documentos (Document Engine)
builder.Services.AddScoped<IDocumentEngine, DocumentEngine>();
builder.Services.AddScoped<IDocumentTemplateRepository, DocumentTemplateRepository>();
builder.Services.AddScoped<IDocumentAuditRepository, DocumentAuditRepository>();

// Servicios Híbridos Inyectables
builder.Services.AddScoped<IFirmaElectronicaService, FirmaElectronicaService>();
builder.Services.AddScoped<IAIAssistantService, AIAssistantService>();
```

Las dependencias de infraestructura se manejan mediante el ciclo de vida `AddScoped`, esto significa que cada petición HTTP/SignalR provee su propia bolsa transaccional unitaria a través del Contexto (`DiitraContext`), previniendo choques polimórficos de Singletons concurrentes.

## WebSockets: The SignalR Bus
En un entorno colaborativo donde la firma de una resolución o edición de un sub-título de cronograma puede suceder mientras otro usuario co-edita (Idéntico al estilo GSuite), SignalR expone el `DocumentHub`.
Este Hub empuja _streams_ binarios ligeros (MsgPack o fallback a JSON) directo hacia Axios/Fetch, minimizando el I/O blocking request del servidor.

## Motor Enterprise de Documentos

Todo documento institucional (PDF) se genera a través del `IDocumentEngine`. Esto garantiza:
- **Desacoplamiento total**: los controladores no saben cómo se genera el PDF
- **Plantillas editables**: el HTML vive en BD (`doc_templates`), editable sin redespliegue
- **Cumplimiento LOPDP**: pie legal inyectado automáticamente en cada documento
- **Auditoría**: cada PDF generado queda registrado en `doc_audit_entries`

Ver documentación completa en [`08_motor_documentos.md`](./08_motor_documentos.md).
