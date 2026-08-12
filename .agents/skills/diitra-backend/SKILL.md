---
name: diitra-backend
description: Extiende la skill global de backend con convenciones y restricciones específicas del proyecto DIITRA. Activa esta skill EN COMBINACIÓN CON `desarrollo-backend` para tareas de controladores, servicios C#, EF Core, DTOs o base de datos de DIITRA.
---
# Extensión de Backend — DIITRA

> **Orquestación:** Esta skill **extiende y complementa** las directrices globales de `desarrollo-backend`. Debe cargarse siempre junto con los principios globales (arquitectura limpia, inyección de dependencias, logging, commits semánticos).


## 1. Convenciones de Base de Datos (DIITRA)

* **Tablas del Módulo de Investigación (`inv_`):** Todas las tablas nativas del módulo usan el prefijo `inv_` (ej: `inv_proyectos`, `inv_grupos_investigacion`, `inv_lineas_investigacion`). Al crear nuevas entidades o migraciones, mantén esta convención de forma obligatoria.
* **Tablas Institucionales (`sigafi`) — Estrictamente Solo Lectura:** Las tablas del sistema externo (`carreras`, `periodos`, `usuarios`, `profesores_carreras_periodo`) pertenecen a `sigafi` y son de **solo lectura** para la API de DIITRA. Nunca generes consultas que intenten escribir en estos registros.

## 2. Consultas EF Core — DIITRA

* Al consultar entidades con relaciones muchos-a-muchos (ej: `InvGrupoInvestigacion` y su colección `IdLineas`), carga siempre las colecciones con `.Include()`:
  ```csharp
  .Include(g => g.IdLineas)
  ```
* Usa `.AsNoTracking()` en todas las consultas de solo lectura para optimizar memoria y evitar tracking innecesario.

## 3. Mapeo Completo de DTOs — DIITRA

* En métodos `GetAll` o listados generales, incluye **todas** las colecciones requeridas por el frontend: `LineasIds`, `CarrerasIds`, y similares. No dejes arrays de relación en `null` sin una justificación explícita de paginación o rendimiento.

## 4. Seguridad y Gobernanza

* Aplica siempre las reglas de la skill global `gobernanza-datos-segura` para cualquier operación que involucre credenciales, roles, permisos o tablas de usuarios de `sigafi`.

## 5. Convenciones de Rutas y Controladores API

* **Prefijo de Ruta y Nombres:** Todas las rutas de controladores API deben mantener el prefijo `/api/[controller]` usando sustantivos en inglés en plural y kebab-case (ej: `/api/projects`, `/api/peer-reviews`, `/api/document-templates`).
* **Verbos HTTP:** Respeta estrictamente los verbos REST estándar (`GET` para lectura, `POST` para creación, `PUT` para actualización completa, `PATCH` para parcial, `DELETE` para eliminación).
* **Respuestas Uniformes:** Devuelve respuestas estructuradas con códigos HTTP adecuados (`200 OK`, `201 Created`, `400 BadRequest`, `404 NotFound`, `500 InternalServerError`).


