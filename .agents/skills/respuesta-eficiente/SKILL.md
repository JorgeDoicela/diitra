---
name: respuesta-eficiente
description: Activa esta skill cuando el usuario pida respuestas directas, limite la búsqueda de archivos, pida evitar análisis del código, o use frases restrictivas como "Solo busca el archivo X", "Ve al grano", "No revises archivos", "No hagas análisis profundo" o "No ejecutes comandos". Evita búsquedas innecesarias de archivos para optimizar tokens.
---
# Skill de Respuestas Eficientes y Restricción de Búsquedas

Esta skill regula el comportamiento del agente para evitar el consumo innecesario de tokens y prevenir búsquedas exhaustivas de archivos en el proyecto cuando el usuario solicita respuestas directas, rápidas o limitadas en alcance.

## Activadores de la Skill
Activa esta skill inmediatamente cuando el usuario incluya instrucciones de restricción o frases similares en su solicitud:
- "Solo busca el archivo X y no investigues más" (o cualquier orden que limite la búsqueda a un archivo/ruta específico).
- "Ve al grano y no busques en el código/proyecto" (o solicitudes de respuestas basadas solo en conocimiento interno).
- "No hagas análisis profundo, solo responde con [lo que necesites]".
- "No revises archivos ni uses herramientas, solo explécame...".
- "Ve directo al grano sin hacer diagnósticos ni búsquedas".
- "No ejecutes comandos ni consultes la base de datos, indícame los pasos a seguir".
- "No hagas dotnet run" o cualquier orden que limite la ejecución del backend.
- Cualquier instrucción explícita de "no buscar", "ir al grano", "responder rápido" o "limitar alcance".

## Instrucciones de Comportamiento
1. **Búsquedas de Ruta Eficientes**: Si la ruta del archivo a editar o analizar es conocida o deducible, abre directamente el archivo usando `view_file` en lugar de realizar búsquedas globales redundantes (`grep_search` o `list_dir`).
2. **Consultar Archivos Relacionados para Mayor Seguridad**: Al realizar modificaciones de código, puedes leer brevemente archivos de interfaces, firmas o tipos relacionados si es estrictamente necesario para evitar errores de compilación o linter.
3. **Planes de Acción Ágiles**: Evita generar planes extensos para tareas sencillas. Si la tarea es simple, edita directamente. Para refactorizaciones complejas, acuerda una ruta de acción breve con el desarrollador en el chat.
4. **Respuestas Concisas y Sin Código Redundante**: Ve al grano en tus respuestas. Explica brevemente el razonamiento técnico detrás de los cambios, pero evita transcribir bloques de código completos que ya son visibles en los diffs del IDE para ahorrar tokens de contexto.
5. **No Ejecutar Servicios de Forma Redundante**: Evita proponer o lanzar comandos interactivos repetitivos de inicio de servicios (como `dotnet run` o `npm run dev`) si ya se encuentran activos en segundo plano.
6. **Colaboración y Diagnóstico Compartido**: Si requieres validar logs, el estado de un servicio local o la base de datos, guíate con el usuario solicitándole el feedback directo o sugiriendo comandos específicos de manera clara y directa.
7. **Uso del Navegador Justificado**: Evita lanzar subagentes de navegador (`browser_subagent`) para validaciones triviales que el usuario pueda confirmar de inmediato visualmente, reservándolos para flujos de prueba complejos.
8. **Hipótesis Directas**: Ante un error, prioriza formular hipótesis sencillas y valídalas con el desarrollador en lugar de leer múltiples archivos en cascada.
