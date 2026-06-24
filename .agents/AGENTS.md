# Reglas del Proyecto (Respuestas Eficientes)

Estas reglas aplican de forma obligatoria en todas las conversaciones y tareas de este proyecto para evitar el consumo excesivo de tokens y acelerar el tiempo de desarrollo.

## Directrices de Búsqueda y Herramientas
1. **Limitar Búsquedas al Mínimo**: Si el usuario especifica un archivo o ruta concreta, la búsqueda DEBE limitarse única y exclusivamente a ese archivo. Queda estrictamente prohibido usar herramientas de búsqueda (`grep_search`, `list_dir`) para buscar archivos cuya ubicación ya es conocida o deducible. Abre los archivos directamente usando `view_file`.
2. **Evitar Uso Innecesario de Herramientas**: Si no es necesario leer archivos o ejecutar comandos para responder (preguntas teóricas o explicaciones conceptuales), responde directamente utilizando tu conocimiento interno sin recurrir a herramientas.
3. **No hacer Diagnósticos ni Planes Redundantes**: No inicies planes de implementación complejos ni generes artefactos de planeación (`implementation_plan.md` o `task.md`) para tareas simples, medianas o directas, a menos que sea un cambio estructural masivo o el usuario lo solicite explícitamente. Procede directamente a editar y verificar.
4. **Respuestas Concisas y Sin Duplicación**: Ve directo al grano en tus respuestas. Evita introducciones largas o resúmenes de acciones del agente. **Queda estrictamente prohibido duplicar o re-escribir código completo o bloques modificados en tu respuesta de chat** si estos ya se muestran en las salidas de las herramientas (como los `diff` de las ediciones).
5. **No Ejecutar 'dotnet run'**: Queda prohibido ejecutar o proponer la ejecución de `dotnet run` para iniciar/reiniciar el backend de forma redundante.
6. **Enfoque Exclusivo en el Archivo Objetivo**: En tareas de edición simples, no busques ni analices dependencias o archivos colaterales. Edita únicamente el archivo objetivo de manera aislada y directa.

