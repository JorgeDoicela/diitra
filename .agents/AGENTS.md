# Reglas del Proyecto (DIITRA)

Este archivo define las directrices y estándares obligatorios de desarrollo para el proyecto DIITRA. Se carga automáticamente al inicio de cada conversación en este workspace.

## Stack Tecnológico del Proyecto
* **Frontend:** React, Vite, TypeScript, Axios (cliente de API configurado en `api`), Yjs (colaboración en tiempo real con `CoWorkField`).
  * *Estilos:* CSS Vanilla de alta calidad (premium, animaciones fluidas). Evitar TailwindCSS a menos que el usuario lo solicite.
* **Backend:** ASP.NET Core (Web API, .NET 8), Entity Framework Core (ORM), Pomelo MySQL.
* **Base de Datos:** MySQL (base de datos `sigafi_es`, puerto `3307`).

---

## Directrices de Comportamiento y Ahorro de Tokens
1. **Limitar Búsquedas al Mínimo**: Si se especifica un archivo o ruta concreta, la búsqueda DEBE limitarse únicamente a ese archivo. Queda estrictamente prohibido usar `grep_search` o `list_dir` para buscar archivos cuya ubicación ya es conocida o deducible.
2. **Evitar Uso Innecesario de Herramientas**: Responder directamente utilizando conocimiento interno para consultas teóricas o explicaciones conceptuales sin llamar a herramientas del sistema.
3. **No hacer Diagnósticos ni Planes Redundantes**: No generar archivos de planificación (`implementation_plan.md` o `task.md`) para tareas simples o medianas a menos que el usuario lo solicite expresamente. Proceder directamente a la edición.
4. **Respuestas Concisas y Sin Duplicación**: Ir al grano en las respuestas. Queda prohibido re-escribir bloques completos de código modificado en el chat si estos ya se muestran en las salidas de las herramientas (como los diff de las ediciones).
5. **No Ejecutar 'dotnet run'**: Queda prohibido proponer o ejecutar `dotnet run` para iniciar/reiniciar el backend de forma redundante.
6. **Enfoque Exclusivo en el Archivo Objetivo**: En tareas de edición simples, modificar únicamente el archivo objetivo de manera aislada y directa.
7. **Delegación y Colaboración Activa**: Si es necesario diagnosticar la base de datos, revisar logs, probar el navegador o verificar el estado del sistema, **pedirle directamente al usuario que lo revise o ejecute la acción**, proporcionando una guía paso a paso sumamente clara y concisa de lo que debe hacer.
8. **Evitar Análisis en Cascada**: Formular una hipótesis simple y validarla con el usuario antes de continuar abriendo archivos en cadena.
9. **Evitar Uso de Herramientas del Navegador**: Queda prohibido lanzar subagentes de navegador (`browser_subagent`) a menos que el usuario lo solicite explícitamente.

---

## Enrutamiento de Habilidades (Skills)
* Si la tarea actual corresponde al desarrollo o modificación de interfaces visuales, componentes React o estilos web, el agente debe activar y seguir las directrices de la skill local `/desarrollo-frontend`.
* Si la tarea corresponde a controladores de API, servicios C#, modelos de base de datos o lógica de negocio, el agente debe activar y seguir las directrices de la skill local `/desarrollo-backend`.
