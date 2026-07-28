# Catálogos Institucionales y Normativa Ecuador

## 1. Visión General de Catálogos

El subsistema de catálogos (`CatalogsController` / `PndController`) provee las estructuras de clasificación normalizadas necesarias para garantizar que las propuestas de investigación del ISTT cumplan con los marcos normativos del CACES, la SENESCYT y las clasificaciones internacionales de I+D+i.

---

## 2. Clasificación Áreas del Conocimiento UNESCO

DIITRA implementa el árbol estandarizado de áreas del conocimiento de la UNESCO, estructurado en tres niveles jerárquicos:

```mermaid
graph TD
    GrandArea["1. Gran Área (ej. 06 Tecnologías de la Información y Comunicación)"]
    GrandArea --> SpecificArea["2. Área Específica (ej. 061 Tecnologías de la Información)"]
    SpecificArea --> DetailedArea["3. Área Detallada (ej. 0612 Diseño y Administración de Redes)"]
```

### Propósito en el Sistema
* **Formulación de Proyectos:** Cada propuesta debe vincularse obligatoriamente a una subárea detallada UNESCO.
* **Asignación de Evaluadores Pares:** El `PeerReviewAdminService` utiliza este catálogo para cruzar las áreas de especialidad del evaluador con el área del proyecto, garantizando idoneidad técnica en el dictamen.

---

## 3. Alineación con el Plan Nacional de Desarrollo (PND) y ODS

Para sustentar la pertinencia social y económica de los proyectos ante las auditorías del CACES, las propuestas deben articularse con los instrumentos de planificación nacional e internacional.

### 3.1. Plan Nacional de Desarrollo (PND)
* **Controlador:** `PndController`.
* **Estructura:** Ejes estratégicos, objetivos nacionales y políticas públicas del Ecuador.
* **Mapeo:** La tabla `cat_pnd_objetivos` registra las metas nacionales a las cuales tributan los resultados del proyecto.

### 3.2. Objetivos de Desarrollo Sostenible (ODS - ONU)
* **Estructura:** Los 17 Objetivos de Desarrollo Sostenible de la Agenda 2030.
* **Mapeo:** Vinculación directa entre el producto tecnológico (TRL 1-9) y el ODS impactado (ej. ODS 4 Educación de Calidad, ODS 9 Industria e Innovación).

---

## 4. Catálogos Internos e Integración SIGAFI

```mermaid
graph LR
    SIGAFI[("Sistema Académico SIGAFI")] -->|Sincronización| SeedScript[seed_profesores_carreras.sql]
    SeedScript --> LocalDB[("Base 'sigafi_es'\nCatálogos Locales")]

    LocalDB --> Careers[Carreras / Coordinaciones]
    LocalDB --> ResearchLines[Líneas y Sublíneas de Investigación]
    LocalDB --> GroupCatalogs[Grupos de Investigación Reconocidos]
```

### 4.1. Carreras y Docentes (SIGAFI)
* **Tablas:** `cat_carreras`, `cat_docentes_perfiles`.
* **Sincronización:** Mantiene la relación de carreras acreditadas en el ISTT y la plantilla docente activa con sus títulos académicos registrados en SENESCYT.

### 4.2. Líneas y Sublíneas de Investigación ISTT
* **Tabla:** `cat_lineas_investigacion`.
* **Estructura:** Áreas prioritarias aprobadas por el Órgano Colegiado Superior (OCS) del instituto para la asignación de presupuestos institucionales.
