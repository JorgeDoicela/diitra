# Reglas del Proyecto (DIITRA)

Este archivo define las directrices y estándares obligatorios de desarrollo para el proyecto DIITRA. Se carga automáticamente al inicio de cada conversación en este workspace.

## Stack Tecnológico del Proyecto
* **Frontend:** React, Vite, TypeScript, Axios (cliente de API configurado en `api`), Yjs (colaboración en tiempo real con `CoWorkField`).
  * *Estilos:* CSS Vanilla de alta calidad (premium, animaciones fluidas). Evitar TailwindCSS a menos que el usuario lo solicite.
  * *Casing y Serialización:* El backend de DIITRA tiene una política de serialización global que transforma todas las propiedades a `snake_case` (por ejemplo, `hasTemplateUpdate` se convierte en `has_template_update`). Por lo tanto, al consumir servicios de la API en el frontend (React), siempre se deben mapear las propiedades esperando `snake_case` (o proveer fallbacks locales como `has_template_update || hasTemplateUpdate` para evitar fallos si el frontend espera camelCase).
* **Backend:** ASP.NET Core (Web API, .NET 8), Entity Framework Core (ORM), Pomelo MySQL.
* **Base de Datos:** MySQL (base de datos `sigafi_es`, puerto `3306`).

---

## Directrices de Comportamiento y Colaboración
1. **Búsquedas Enfocadas**: Priorizar la lectura directa si la ruta del archivo es conocida. Si es necesario explorar archivos relacionados para garantizar que los tipos, firmas o dependencias no se rompan, el agente puede investigar de manera proactiva pero eficiente.
2. **Uso Eficiente de Herramientas**: Utilizar conocimiento interno para responder preguntas conceptuales y usar herramientas del sistema solo cuando se necesite interactuar con el entorno.
3. **Planes Ágiles**: No es obligatorio crear planes extensos para tareas sencillas, pero si una refactorización requiere alterar múltiples capas (Frontend/Backend/Base de Datos), se puede proponer un borrador rápido para acordar el diseño.
4. **Respuestas Claras e Ilustrativas**: Mantener explicaciones claras y fluidas. No es necesario copiar bloques gigantes de código que ya están en el diff del IDE, pero sí se pueden incluir pequeños fragmentos de ejemplo para ilustrar ideas y explicar el razonamiento detrás de los cambios.
5. **Autonomía y Validación de Diagnósticos**: El agente puede colaborar para analizar la base de datos o logs guiando al usuario o proponiendo comandos específicos cuando sea necesario para resolver problemas complejos.
6. **Evitar Exploración Innecesaria**: Evitar abrir archivos no relacionados con la tarea principal, pero permitiendo la lectura de archivos de definición o tipos compartidos para evitar fallos de compilación.
7. **Uso de Navegador**: Preferir la validación manual por parte del desarrollador para ahorrar recursos, recurriendo a subagentes de navegador solo si la validación interactiva es compleja.

---

## Enrutamiento de Habilidades (Skills)
* Si la tarea actual corresponde al desarrollo o modificación de interfaces visuales, componentes React o estilos web, el agente debe activar y seguir las directrices de la skill local `/desarrollo-frontend`.
* Si la tarea corresponde a controladores de API, servicios C#, modelos de base de datos o lógica de negocio, el agente debe activar y seguir las directrices de la skill local `/desarrollo-backend`.
