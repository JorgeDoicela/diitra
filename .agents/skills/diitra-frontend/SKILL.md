---
name: diitra-frontend
description: Extiende la skill global de frontend con convenciones y patrones específicos de DIITRA (Yjs, CoWorkField, snake_case, Axios). Activa esta skill EN COMBINACIÓN CON `desarrollo-frontend` para tareas de UI, componentes React, estilos o integraciones del cliente en DIITRA.
---
# Extensión de Frontend — DIITRA

> **Orquestación:** Esta skill **extiende y complementa** las directrices globales de `desarrollo-frontend`. Debe cargarse siempre junto con los principios globales (estética premium, micro-animaciones, tipografía, tipado estricto).


## 1. Colaboración en Tiempo Real (Yjs / CoWorkField)

* En formularios editables, encapsula los campos de entrada con el componente `<CoWorkField>` configurado con su `name` y el manejador `cowork`.
* Los nombres de campo **deben coincidir exactamente** con la estructura definida en `DocumentTemplateRegistry.ts` (ej: `LineaInvestigacion`, `SublineaInvestigacion`). Un nombre incorrecto rompe la sincronización en tiempo real entre usuarios.

## 2. Serialización API — snake_case

* El backend de DIITRA transforma globalmente todas las propiedades a `snake_case` en la serialización. Al consumir la API desde React, mapea siempre esperando `snake_case` y provee fallbacks duales para evitar fallos de tipado:
  ```ts
  const value = response.has_template_update ?? response.hasTemplateUpdate;
  ```
* Usa **siempre** el cliente Axios configurado (`api`) para todas las llamadas al backend. No uses `fetch` nativo.

## 3. Modularización — Umbral DIITRA

* El umbral de extracción de subcomponentes en DIITRA es de **700 líneas** (más permisivo que el estándar global de 400-500, dado el alto acoplamiento de contexto compartido). Si una página o componente supera las 700 líneas, extrae inmediatamente sus secciones a componentes hijos en una subcarpeta `components/`.

## 4. Convenciones UI — DIITRA

* Usa `custom-scrollbar` como clase CSS estándar del proyecto para barras de scroll discretas.
* Los sidebars colapsables y arrastrables deben persistir su estado de visibilidad con `localStorage`.
* En selects/dropdowns con catálogos relacionales, verifica que cada opción exponga el `id` local y las claves de vinculación externa necesarias (ej: `l.id` y `s.id_linea` para vincular líneas y sublíneas de forma reactiva).

## 5. Estructura de Carpetas y Organización

* **Vistas / Páginas:** `src/pages/[NombreModulo]/` (contiene la página principal y su subcarpeta `components/` si supera el umbral de modularización).
* **Componentes Compartidos:** `src/components/` (sólo componentes UI globales o reutilizables entre múltiples módulos).
* **Servicios de API:** `src/api/` (instancia de Axios configurada, métodos de consumo modularizados por entidad).
* **Hooks Personalizados:** `src/hooks/` (lógica de estado reusable o subscripciones en tiempo real).

