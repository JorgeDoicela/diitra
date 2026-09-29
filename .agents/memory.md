# Memoria del Proyecto — DIITRA

Este archivo almacena el contexto operativo, decisiones arquitectónicas consolidadas y lecciones aprendidas exclusivas del proyecto DIITRA.

---

## 1. Decisiones Arquitectónicas Consolidadas

* **Frontend:**
  - Instancia Axios centralizada en `api/` (prohibido `fetch` nativo).
  - Serialización estricta en `snake_case` desde el backend: mapear en React esperando `snake_case` con fallback dual defensivo (`has_template_update || hasTemplateUpdate`).
  - Colaboración en tiempo real: integración obligatoria de Yjs mediante `<CoWorkField>`.
  - Estilos: Sistema Geist Design con Tailwind CSS v4 nativo en `base.css`. Prohibido introducir estilos ad-hoc si existe la clase semántica (`.bento-card`, `.btn-vercel-*`, etc.).
* **Backend y Persistencia:**
  - ASP.NET Core Web API (.NET 8) con Pomelo MySQL (`sigafi_es`, puerto 3306).
  - Separación de esquemas: tablas del dominio DIITRA llevan prefijo `inv_` (escritura).
  - Frontera SIGAFI: tablas de catálogos institucionales externos son estrictamente de **solo lectura**.

---

## 2. Restricciones y Reglas Específicas

* Umbral máximo de 700 líneas por componente en React antes de modularizar.
* Preservación innegociable de la editabilidad en plantillas V1, trayecto del documento y portapapeles con `SectionBlockGuard`.
* Cero emojis y cero lenguaje publicitario o inflado en código y documentación.

---

## 3. Historial de Decisiones y Lecciones Aprendidas

* *(El agente registrará aquí automáticamente las decisiones técnicas tomadas durante futuras sesiones)*.
