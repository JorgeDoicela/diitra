---
name: desarrollo-frontend
description: Activa esta skill para tareas relacionadas con la interfaz de usuario de DIITRA (React, TypeScript, Vite, CSS, componentes UI, formularios colaborativos o integraciones del cliente).
---
# Skill de Desarrollo Frontend (DIITRA)

Esta habilidad regula y optimiza el flujo de trabajo para el desarrollo del frontend en la aplicación web DIITRA.

## Directrices de Desarrollo
1. **Rol de Experto en UI/UX y Diseño Web:**
   * **Estética Premium y Moderna**: Diseña interfaces que asombren al usuario visualmente. Usa paletas de colores armónicas (fondos oscuros, bordes ultradelgados en `border-border-thin`, contrastes altos con el brand color) y tipografías consistentes (ej. fuentes monoespaciadas para códigos/IDs y sans-serif limpias para el resto).
   * **Micro-interacciones y Feedback Activo**: Agrega transiciones suaves (`duration-200`), efectos hover, estados activos al hacer clic, indicadores animados de carga (`Loader2` animado), y ondas de sonido dinámicas cuando el dictado por voz esté activo.
   * **Layouts Flexibles y Limpios**: Diseña páginas que se adapten a distintos anchos (sidebars colapsables y arrastrables con local storage). El contenido central debe tener scroll independiente y barras de scroll discretas (`custom-scrollbar`).
2. **Modularización y Arquitectura del Componente:**
   * **Evitar Componentes Gigantes**: Si una página supera las 800 líneas de código, extrae inmediatamente sus sub-paneles, formularios, modales o secciones interactivas a componentes hijos en una subcarpeta `components/`.
   * **Paso Limpio de Props**: Delega la lógica de llamadas API y mutación de estado a la página contenedora (Smart Component) y mantén los componentes hijos tan puros y enfocados en renderizado como sea posible (Dumb Components).
3. **Colaboración en Tiempo Real (Yjs):**
   * En los formularios editables, encapsula siempre los campos de entrada utilizando el componente `<CoWorkField>` configurado con su correspondiente `name` y el manejador `cowork`.
   * Asegura que los nombres de los campos coincidan exactamente con la estructura definida en `DocumentTemplateRegistry.ts` (ej. `LineaInvestigacion`, `SublineaInvestigacion`).
4. **Peticiones a la API:**
   * Utiliza el cliente Axios configurado (`api`) para comunicarse con el backend.
   * **Casing y Serialización:** El backend de DIITRA tiene una política de serialización global que transforma todas las propiedades a `snake_case` (por ejemplo, `hasTemplateUpdate` se convierte en `has_template_update`). Por lo tanto, al consumir servicios de la API en el frontend (React), siempre se deben mapear las propiedades esperando `snake_case` (o proveer fallbacks locales como `has_template_update || hasTemplateUpdate` para evitar fallos si el frontend espera camelCase).
5. **Mapeo de Catálogos:**
   * Al mapear datos en selects o dropdowns, verifica que la variable contenga tanto el identificador local como las claves de vinculación externa (ej: para vincular líneas y sublíneas de forma reactiva, busca `l.id` y `s.id_linea`).
