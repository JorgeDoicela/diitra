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
1. **Limitar Búsquedas al Mínimo**: Si el usuario especifica un archivo o ruta concreta (ej. "solo busca el archivo X"), la búsqueda DEBE limitarse única y exclusivamente a ese archivo. Queda estrictamente prohibido expandir la búsqueda a otros archivos, directorios adyacentes o dependencias a menos que el usuario lo autorice explícitamente.
2. **Evitar Uso de Herramientas**: Si el usuario solicita una respuesta directa, teórica o de pasos a seguir (ej. "no busques", "solo explícame"), no debes utilizar herramientas como `list_dir`, `grep_search`, `view_file` ni `run_command`. Responde de inmediato utilizando tu conocimiento interno.
3. **No hacer Diagnósticos ni Planes Redundantes**: No inicies planes de implementación complejos ni generes artefactos de planeación (`implementation_plan.md` o `task.md`) para tareas simples, medianas o directas, a menos que sea un cambio estructural masivo o el usuario lo solicite explícitamente. Procede directamente a editar y verificar.
4. **Respuestas Concisas y Sin Duplicación**: Ve directo al grano en tus respuestas. Evita introducciones largas o resúmenes de acciones del agente. **Queda estrictamente prohibido duplicar o re-escribir código completo o bloques modificados en tu respuesta de chat** si estos ya se muestran en las salidas de las herramientas (como los `diff` de las ediciones).
5. **No Proponer Comandos**: Si el usuario indica no ejecutar comandos ni consultar bases de datos, describe los pasos a seguir en texto plano y no propongas bloques de comandos interactivos ni tareas en segundo plano.
6. **No Ejecutar 'dotnet run'**: Queda estrictamente prohibido ejecutar o proponer la ejecución de `dotnet run` para iniciar/reiniciar el backend, evitando duplicaciones de procesos o bloqueos.
7. **Prohibición de Búsquedas Innecesarias (Sobre-búsqueda)**: Queda totalmente prohibido usar `grep_search` o `list_dir` para buscar archivos cuya ruta ya es conocida o deducible. El agente debe abrir directamente el archivo objetivo mediante `view_file`.
8. **Enfoque Exclusivo en el Archivo Objetivo**: En tareas de edición simples, no se deben buscar o analizar dependencias ni archivos colaterales. Edita únicamente el archivo objetivo de manera aislada y directa.
9. **Delegación y Colaboración Activa (Ahorro de Tokens)**: Si necesitas diagnosticar la base de datos, revisar logs, probar el navegador o verificar el estado del sistema, prefiere **pedirle directamente al usuario que lo revise, inspeccione o ejecute la acción**. No gastes tokens revisando o analizando demasiados archivos o cosas de forma exhaustiva si el usuario puede realizar esa verificación, darte el estado actual o facilitarte la información directamente. **Al delegar, dale al usuario una guía paso a paso sumamente clara y concisa de lo que debe hacer o revisar.**
10. **Prohibición de Lecturas Preventivas o Redundantes**: Si tienes una sospecha clara sobre un archivo, no abras otros archivos preventivamente para "entender el contexto general". Ve directamente al archivo objetivo.
11. **Evitar Análisis en Cascada (Waterfall Checking)**: En lugar de analizar archivos en cadena buscando una explicación a un error, formula una hipótesis simple y consúltala/valídala con el usuario antes de continuar abriendo archivos.
12. **Evitar Uso de Herramientas del Navegador (Browser Subagents)**: Queda prohibido lanzar subagentes de navegador (`browser_subagent`) a menos que el usuario lo solicite de forma explícita, ya que consumen una gran cantidad de tokens. Prefiere delegar las validaciones visuales o de navegación web al usuario.
