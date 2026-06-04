# Análisis de Integridad y Validación de Carga Horaria (DIITRA)

Este documento detalla la arquitectura de control, persistencia y validación de la **carga horaria de investigación** (distributivos académicos de SIGAFI frente a horas comprometidas en proyectos activos de DIITRA) implementada a lo largo del ecosistema de la plataforma.

---

## 1. Modelo de Persistencia en la Base de Datos

El diseño relacional separa la capacidad del docente de su asignación específica a proyectos:

*   **Horas Disponibles (Distributivo de SIGAFI)**:
    *   La tabla `profesores_actividades` registra la planificación horaria del profesor por período académico.
    *   Las horas destinadas a investigación están identificadas con `IdSubcategoria == 7` (Actividades de Investigación) en la columna `HorasSemana`.
*   **Horas Dedicadas al Proyecto (DIITRA Core)**:
    *   La tabla relacional `inv_proyectos_profesores` posee la columna `horasSemanales` (`decimal? HorasSemanales`), que indica el número de horas semanales que el profesor dedica a un proyecto de investigación en particular.

---

## 2. Arquitectura de Servicios y Backend (.NET Core API)

### A. Estructuras de Datos (DTOs)
Para transferir la información de horas y distributivos de manera consistente entre las capas del sistema, se extendieron los siguientes objetos de transferencia de datos:
*   `UserManagementDto` (en `AdminDtos.cs`): Contiene `HorasAsignadas` para visualizar la carga de proyectos de los profesores en las vistas administrativas.
*   `DashboardStatsDto` (en `DashboardDtos.cs`): Añade `HorasDisponiblesDistributivo` para transmitir el límite del distributivo al portal del docente.
*   `InvestigadorDto` (en `ProyectoDto.cs`): Incluye `HorasDisponibles` (de SIGAFI) y `HorasAsignadas` (de otros proyectos) para resolver la disponibilidad directamente en el cliente.

### B. Lógica en Capa de Infraestructura y Controladores
*   **AdminService (`GetUsersAsync`)**: Al listar usuarios de tipo `DOCENTE`, consulta la tabla `inv_proyectos_profesores` sumando las horas comprometidas en proyectos con estados activos (`"Enviado"`, `"En Revisión"`, `"Aprobado"`, `"En Ejecución"`) para reflejarlas en el panel administrativo.
*   **ProjectOrchestrator (`GetDashboardStatsAsync`)**: Resuelve el período académico activo y calcula la suma de horas del distributivo (`IdSubcategoria == 7`) para el docente autenticado, poblando la estadística principal de su dashboard.
*   **CatalogsController (`SearchUsers`)**: Al buscar docentes, el endpoint devuelve en el objeto JSON los campos `horasDisponibles` (horas del distributivo en el periodo activo) y `horasAsignadas` (horas acumuladas en proyectos activos). Esto habilita los buscadores y autocompletados a renderizar la disponibilidad de inmediato.

### C. Motor de Validación de Reglas (`WorkflowEngineService.cs`)
Al intentar realizar una transición de estado a `"Enviado"` (postulado) o `"Aprobado"`, el sistema ejecuta una validación de sobrecarga para cada uno de los docentes miembros:
1.  Suma las horas semanales declaradas para el docente en el proyecto actual y las de sus otros proyectos activos en el mismo período.
2.  Compara esta suma contra su límite asignado en el distributivo (`profesores_actividades`).
3.  Si la suma supera el límite, se cancela la transacción lanzando un error descriptivo para prevenir la doble contabilidad o el incumplimiento legal.

---

## 3. Integración en la Interfaz de Usuario (Vite + React)

### A. Listado y Ficha de Docentes (`UsersPage.tsx`)
En el módulo de **Administración -> Docentes**, se despliegan tres badges de control:
*   `SIGAFI: Xh` (Horas aprobadas en el distributivo).
*   `Asig: Yh` (Horas asignadas en proyectos activos en DIITRA).
*   `Disp: Zh` (Horas libres disponibles, calculadas como $SIGAFI - Asignadas$).
El panel de detalles lateral expone el mismo desglose con barras de colores según el nivel de ocupación.

### B. Dashboard del Docente (`DocenteDashboard.tsx`)
La barra de progreso de la tarjeta **Carga Horaria de Investigación** se dibuja basándose en las horas cargadas desde el distributivo activo de SIGAFI. Si el profesor tiene `0` horas asignadas para el periodo actual, se renderiza una advertencia visual de inactividad investigativa.

### C. Espacio de Trabajo del Proyecto (`ProjectWorkspace.tsx`)
*   **Autocompletado de Miembros**: Muestra la capacidad del docente antes de agregarlo en formato `Disp: Xh / Yh`.
*   **Advertencias en Tiempo Real**: Al editar la dedicación horaria de un integrante, la interfaz compara el valor ingresado con su capacidad disponible. Si el valor es excesivo, se muestra instantáneamente un mensaje rojo parpadeante (`⚠️ Excede límite! Máx disp: Xh`) antes de que el usuario intente enviar los cambios al servidor.

### D. Ficha de Grupos de Investigación (`GroupFormDrawer.tsx`)
El buscador para asignar al **Coordinador Responsable** y a los **Docentes Investigadores** de un grupo muestra en sus sugerencias la etiqueta `Disp: Xh / Yh`. Esto ayuda a los directores o administradores a planificar la conformación del grupo seleccionando únicamente a docentes con horas disponibles para investigación.
