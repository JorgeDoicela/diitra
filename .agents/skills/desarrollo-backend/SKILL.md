---
name: desarrollo-backend
description: Activa esta skill para tareas relacionadas con el backend de DIITRA (controladores ASP.NET Core, servicios C#, Entity Framework Core, lógica de base de datos, DTOs o autenticación).
---
# Skill de Desarrollo Backend (DIITRA)

Esta habilidad regula y optimiza el flujo de trabajo para el desarrollo del backend (Web API) del sistema DIITRA.

## Directrices de Desarrollo
1. **Rol de Experto en Arquitectura de Software:**
   * **Separación de Responsabilidades**: Los controladores ASP.NET Core deben ser intermediarios HTTP ultradelgados. Toda la validación, lógica de negocio compleja, flujos de estados y consultas de base de datos se delegan obligatoriamente a la capa de servicios o manejadores específicos en la infraestructura.
   * **Inyección de Dependencias Limpia**: Utiliza siempre abstracciones (interfaces) para inyectar servicios, repositorios o clientes HTTP. Registra correctamente los alcances de vida (transient, scoped, singleton) en el contenedor de servicios de la API.
   * **Robustez y Manejo de Errores**: Diseña métodos defensivos. Valida los parámetros de entrada y los DTOs en las capas correspondientes antes de interactuar con el motor de persistencia. Retorna respuestas HTTP semánticas y mensajes descriptivos claros.
2. **Optimización de Consultas (EF Core):**
   * Al consultar entidades con relaciones de muchos a muchos o colecciones dependientes (ej: `InvGrupoInvestigacion` y sus líneas asociadas `IdLineas`), asegúrate de cargar explícitamente estas colecciones usando `.Include()` (ej. `.Include(g => g.IdLineas)`).
   * Evita consultas perezosas (lazy loading) implícitas que puedan resultar en colecciones nulas o consultas N+1.
3. **Mapeo Completo en DTOs:**
   * Al mapear entidades hacia objetos de transferencia de datos (DTOs) en los listados generales (métodos `GetAll` o similares), incluye siempre todas las propiedades de colecciones requeridas por el cliente frontend (como arreglos de IDs de relación: `LineasIds`, `CarrerasIds`).
   * No dejes propiedades complejas en `null` o vacías a menos que sea estrictamente necesario por paginación o rendimiento.
4. **Seguridad y Gobernanza de Datos:**
   * Respeta los estándares de la skill `/gobernanza-datos-segura`. No modifiques credenciales ni realices operaciones destructivas en bases de datos locales sin aprobación explícitamente consentida del usuario.
5. **Convenciones de Base de Datos (DIITRA):**
   * **Tablas de Investigación (`inv_`):** Las tablas nativas de nuestro módulo de investigación utilizan obligatoriamente el prefijo `inv_` (ej: `inv_proyectos`, `inv_grupos_investigacion`). Al crear nuevas entidades o migraciones, mantén siempre esta convención.
   * **Tablas Institucionales (Solo Lectura):** Las tablas de datos generales del instituto (ej: `carreras`, `periodos`, `usuarios`, `profesores_carreras_periodo`) pertenecen al sistema externo `sigafi` y son **estrictamente de solo lectura** para la API de DIITRA. No crees consultas que intenten modificar estos registros.
