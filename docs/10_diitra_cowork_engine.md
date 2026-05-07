# 🚀 DIITRA CoWork Engine: Colaboración en Tiempo Real

El **DIITRA CoWork** es el motor que permite que múltiples investigadores redacten un mismo protocolo de investigación simultáneamente, sin conflictos de edición y con sincronización milimétrica.

## 1. La Tecnología de Fondo: CRDTs (Yjs)
A diferencia de otros editores que "bloquean" el documento cuando alguien entra, DIITRA utiliza **CRDTs** (Conflict-free Replicated Data Types) a través de la librería **Yjs**.
- **Resolución Automática:** Si dos docentes escriben en el mismo párrafo al mismo tiempo, el sistema fusiona los cambios de forma matemática, garantizando que nadie pierda su trabajo.
- **Eficiencia Extrema:** Solo se envían "deltas" (pequeños cambios de texto) a través de la red, no el documento completo, lo que permite trabajar incluso con conexiones lentas en campo.

## 2. Transporte de Grado Enterprise (SignalR)
Para la comunicación entre el navegador y el servidor, utilizamos **SignalR sobre WebSockets**.
- **Baja Latencia:** Los cursores de otros usuarios se mueven en tiempo real, creando una experiencia inmersiva similar a herramientas como Figma.
- **Aislamiento de Sesiones:** Gracias al sistema de "Salas" dinámicas, un investigador en la sección de "Metodología" no interfiere con quien está en "Antecedentes", manteniendo la integridad de cada sección por separado.

## 3. Presencia y Conciencia (Awareness)
El motor gestiona un estado de "conciencia" distribuida:
- **Cursores Remotos:** Cada usuario tiene un color y una etiqueta con sus iniciales, permitiendo saber exactamente dónde está trabajando cada miembro del equipo.
- **Modo Ciego Inteligente:** Para procesos de **Peer Review**, el motor puede anonimizar los cursores automáticamente, ocultando la identidad del revisor para cumplir con los estándares científicos internacionales.

## 4. Persistencia y Snapshotting
El motor no solo colabora, también protege:
- **Snapshots Automáticos:** Cada vez que los usuarios dejan de escribir, el sistema genera un "Snapshot" en la base de datos SQL (`inv_cowork_updates`).
- **Historial de Cambios:** Guardamos cada delta de edición. Esto permite, en versiones futuras, realizar una "auditoría forense" para saber quién aportó qué idea al proyecto de investigación.

## 5. Por qué es Profesional (Valor para el Jefe)
- **Eliminación de Versiones Infinitas:** Se acabaron los archivos llamados "Protocolo_v1_final_corregido_copia.docx". Solo hay una fuente de verdad en tiempo real.
- **Aislamiento de Seguridad:** Cada sección del documento es una "bóveda" independiente. Si hay un error en una sección, el resto del documento permanece intacto.
- **Infraestructura Propia:** A diferencia de Google Docs, toda la información reside en los servidores del Instituto, garantizando la **soberanía de los datos** y la protección de la propiedad intelectual.

---
*DIITRA CoWork Core v3.0 - Colaboración sin fricciones para la ciencia.*
