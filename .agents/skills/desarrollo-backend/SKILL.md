---
name: desarrollo-backend
description: Activa esta skill para tareas relacionadas con el backend de DIITRA (controladores ASP.NET Core, servicios C#, Entity Framework Core, lógica de base de datos, DTOs o autenticación).
---
# Skill de Desarrollo Backend (DIITRA)

Esta habilidad regula y optimiza el flujo de trabajo para el desarrollo del backend (Web API) del sistema DIITRA.

## Directrices de Desarrollo
1. **Optimización de Consultas (EF Core):**
   * Al consultar entidades con relaciones de muchos a muchos o colecciones dependientes (ej: `InvGrupoInvestigacion` y sus líneas asociadas `IdLineas`), asegúrate de cargar explícitamente estas colecciones usando `.Include()` (ej. `.Include(g => g.IdLineas)`).
   * Evita consultas perezosas (lazy loading) implícitas que puedan resultar en colecciones nulas o consultas N+1.
2. **Mapeo Completo en DTOs:**
   * Al mapear entidades hacia objetos de transferencia de datos (DTOs) en los listados generales (métodos `GetAll` o similares), incluye siempre todas las propiedades de colecciones requeridas por el cliente frontend (como arreglos de IDs de relación: `LineasIds`, `CarrerasIds`).
   * No dejes propiedades complejas en `null` o vacías a menos que sea estrictamente necesario por paginación o rendimiento.
3. **Estructura del Código:**
   * Mantén los controladores en `diitra_api` limpios y delgados. Toda la lógica de negocio pesada, validación o persistencia de datos debe ser delegada a la capa de servicios en `diitra_infrastructure` o `diitra_application`.
4. **Seguridad y Gobernanza de Datos:**
   * Respeta los estándares de la skill `/gobernanza-datos-segura`. No modifiques credenciales ni realices operaciones destructivas en bases de datos locales sin aprobación explícita.
5. **Convenciones de Base de Datos (DIITRA):**
   * **Tablas de Investigación (`inv_`):** Las tablas nativas de nuestro módulo de investigación utilizan obligatoriamente el prefijo `inv_` (ej: `inv_proyectos`, `inv_grupos_investigacion`). Al crear nuevas entidades o migraciones, mantén siempre esta convención.
   * **Tablas Institucionales (Solo Lectura):** Las tablas de datos generales del instituto (ej: `carreras`, `periodos`, `usuarios`, `profesores_carreras_periodo`) pertenecen al sistema externo `sigafi` y son **estrictamente de solo lectura** para la API de DIITRA. No crees consultas que intenten modificar estos registros.
