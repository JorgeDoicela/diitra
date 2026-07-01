---
name: desarrollo-frontend
description: Activa esta skill para tareas relacionadas con la interfaz de usuario de DIITRA (React, TypeScript, Vite, CSS, componentes UI, formularios colaborativos o integraciones del cliente).
---
# Skill de Desarrollo Frontend (DIITRA)

Esta habilidad regula y optimiza el flujo de trabajo para el desarrollo del frontend en la aplicación web DIITRA.

## Directrices de Desarrollo
1. **Colaboración en Tiempo Real (Yjs):**
   * En los formularios editables, encapsula siempre los campos de entrada utilizando el componente `<CoWorkField>` configurado con su correspondiente `name` y el manejador `cowork`.
   * Asegura que los nombres de los campos coincidan exactamente con la estructura definida en `DocumentTemplateRegistry.ts` (ej. `LineaInvestigacion`, `SublineaInvestigacion`).
2. **Sistema de Diseño y Estilos:**
   * Utiliza CSS Vanilla de alta calidad para construir interfaces premium, dinámicas y modernas (con degradados fluidos, sombras suaves, hover interactivo y transiciones).
   * Respeta el esquema de colores institucional (tonos oscuros premium, toques de azul primario y textos legibles).
   * No uses TailwindCSS a menos que el desarrollador lo pida explícitamente.
3. **Peticiones a la API:**
   * Utiliza el cliente Axios configurado (`api`) para comunicarte con el backend.
   * **Casing:** Ten en cuenta que el backend serializa las respuestas en formato **snake_case** (ej. `id_sublinea`, `id_linea`) o **camelCase** según el controlador. Inspecciona el JSON devuelto en la consola o pestaña de red para mapear las propiedades correctamente.
4. **Mapeo de Catálogos:**
   * Al mapear datos en selects o dropdowns, verifica que la variable contenga tanto el identificador local como las claves de vinculación externa (ej: para vincular líneas y sublíneas de forma reactiva, busca `l.id` y `s.id_linea`).
