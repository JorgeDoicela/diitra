# Reglas del Proyecto (DIITRA)

Este archivo define el stack tecnológico y las convenciones exclusivas del proyecto DIITRA. Las reglas de comportamiento general (idioma, tokens, búsquedas eficientes, delegación de diagnósticos) están definidas en el `AGENTS.md` global y aplican automáticamente a este workspace.

---

## Stack Tecnológico

* **Frontend:** React, Vite, TypeScript
  * *API Client:* Axios — instancia configurada en `api/`, usarla siempre. No usar `fetch` nativo.
  * *Colaboración en tiempo real:* Yjs con componente `<CoWorkField>`
  * *Estilos:* CSS Vanilla de alta calidad (premium, animaciones fluidas). **Evitar TailwindCSS** a menos que el usuario lo solicite explícitamente.
  * *Serialización:* El backend transforma todas las propiedades a `snake_case` de forma global. Al consumir la API en React, mapear siempre esperando `snake_case` y usar fallbacks duales cuando sea necesario (ej: `has_template_update || hasTemplateUpdate`).
* **Backend:** ASP.NET Core Web API (.NET 8), Entity Framework Core (ORM), Pomelo MySQL
* **Base de Datos:** MySQL — base de datos `sigafi_es`, puerto `3306`

---

## Enrutamiento de Skills

* Tareas de **UI, componentes React, estilos, animaciones o integraciones del cliente** → activar skill `diitra-frontend`
* Tareas de **controladores API, servicios C#, EF Core, DTOs, migraciones o base de datos** → activar skill `diitra-backend`
