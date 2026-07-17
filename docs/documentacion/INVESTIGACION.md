# Investigación Normativa y Tecnológica para la Automatización de la Investigación en los Institutos Superiores Tecnológicos (IST) de Ecuador

Este documento recopila la investigación y análisis técnico-normativo del ecosistema de la educación superior en Ecuador (bajo directrices de SENESCYT, CES y CACES) aplicado al diseño e implementación del sistema **DIITRA** (Departamento de Investigación e Innovación Traversari).

---

## 1. Organismos de Regulación y Control
El sistema de educación superior de tercer nivel técnico-tecnológico en Ecuador se rige bajo la coordinación y supervisión de tres entidades principales:

### A. SENESCYT (Secretaría de Educación Superior, Ciencia, Tecnología e Innovación)
* **Función:** Ejerce la rectoría de la política pública de educación superior en ciencia, tecnología e innovación.
* **Impacto en DIITRA:** Regula la oferta académica y las líneas de investigación prioritarias del país. DIITRA debe registrar y categorizar los proyectos de acuerdo con estas prioridades nacionales y las áreas del conocimiento del sector productivo.

### B. CES (Consejo de Educación Superior)
* **Función:** Organismo encargado de la planificación, regulación y coordinación del sistema de educación superior.
* **Impacto en DIITRA:** Emite el **Reglamento de Régimen Académico (RRA)** y el **Reglamento de las Instituciones de Educación Superior de Formación Técnica y Tecnológica**. DIITRA debe estructurarse conforme a las definiciones de carga horaria, distributivo docente y titulación definidas por este organismo.

### C. CACES (Consejo de Aseguramiento de la Calidad de la Educación Superior)
* **Función:** Responsable de la evaluación externa, acreditación y aseguramiento de la calidad de las instituciones educativas.
* **Impacto en DIITRA:** Define los criterios de acreditación vigentes en el **Modelo de Evaluación Externa para Institutos Superiores Técnicos y Tecnológicos (ISTT)**. El sistema DIITRA debe actuar como la fábrica de evidencias auditables y reportes compatibles con su plataforma **SIIES**.

### D. SENADI (Servicio Nacional de Derechos Intelectuales)
* **Función:** Administra los derechos de propiedad intelectual en Ecuador.
* **Impacto en DIITRA:** Centraliza el registro de derechos de autor de software, patentes de modelos de utilidad e innovaciones generadas en los proyectos del IST.

---

## 2. Marco Normativo para Institutos de Tercer Nivel
El funcionamiento de un IST convencional (no universitario) se diferencia sustancialmente de las universidades en su enfoque operativo de la investigación:

### A. Investigación Aplicada, Desarrollo e Innovación (I+D+i)
De acuerdo al **Reglamento de Régimen Académico**, los institutos tecnológicos concentran sus recursos en la **investigación aplicada** y el **desarrollo tecnológico adaptativo**.
* En lugar de priorizar publicaciones en revistas indexadas de alto impacto teórico (como Scopus/WoS), se evalúa la transferencia tecnológica y la resolución de problemas locales.
* El sistema DIITRA debe clasificar y registrar:
  * Prototipos funcionales y modelos de utilidad.
  * Diseños industriales y desarrollo de software registrado ante el SENADI.
  * Manuales de transferencia y guías de operación.

### B. Vinculación con la Sociedad
En los IST, la investigación y la vinculación están fuertemente integradas.
* Los proyectos de desarrollo tecnológico deben estar anclados a las necesidades reales de los sectores productivos o comunidades vulnerables locales.
* DIITRA debe permitir la trazabilidad de los proyectos de vinculación, el registro de beneficiarios y la medición del impacto social al finalizar las intervenciones.

### C. Horas de Distributivo Docente
Los docentes de IST convencionales cuentan con una carga de docencia directa muy elevada y pocas horas asignadas a la investigación (entre 2 y 8 horas semanales habituales).
* DIITRA debe incorporar un módulo de seguimiento riguroso de actividades del distributivo. El CACES audita que las horas declaradas estén respaldadas por bitácoras mensuales e informes firmados digitalmente.

---

## 3. Modelo de Evaluación del CACES 2024-2026 (ISTT)
El modelo vigente para el aseguramiento de la calidad de los institutos técnicos y tecnológicos se organiza en base a seis criterios, de los cuales DIITRA atiende directamente dos de los más críticos:

### Criterio: Investigación + Desarrollo e Innovación
* **Institucionalización:** Valora que la institución cuente con políticas, líneas de investigación activas, presupuesto asignado y un departamento formalizado (DIITRA).
* **Proyectos en Ejecución:** Mide la cantidad de proyectos activos anclados a líneas institucionales.
* **Productos Obtenidos:** Valora el desarrollo de software, prototipos registrados, y ponencias o publicaciones locales o regionales.
* **Redes de Cooperación:** Mide convenios vigentes de investigación con otros institutos, universidades o empresas del sector productivo.

### Criterio: Vinculación con la Sociedad
* **Planificación y Evaluación:** Audita el cumplimiento metodológico de los proyectos sociales, desde la propuesta de vinculación hasta su informe de cierre de impacto.

---

## 4. Arquitectura del Sistema DIITRA ante el Contexto Ecuatoriano
Para cumplir de forma eficiente con la lógica del negocio de los IST en Ecuador, la arquitectura de software de DIITRA debe contemplar:

### A. Firma Electrónica (.p12)
Para eliminar el papel y dotar de validez legal a las actas de aprobación, rúbricas de evaluación y reportes mensuales de avance:
1. **Esquema URI local (FirmaEC):** Llamado a la aplicación de escritorio oficial del gobierno mediante el protocolo `firmaec://` desde el navegador. El documento se envía localmente, se firma con la llave `.p12` del usuario y retorna al servidor web firmado, garantizando que la contraseña y archivo del docente nunca viajen por la red.
2. **Firma del lado del cliente (Web Crypto API):** Uso de librerías criptográficas de JavaScript (ej. `forge`) en el navegador del usuario para inyectar la firma digital en los PDFs antes de cargarlos.

### B. Repositorios Digitales (DSpace)
* DSpace es el software estándar utilizado por los repositorios institucionales de la SENESCYT.
* DIITRA debe integrar un exportador de metadatos (en esquema Dublin Core) de los proyectos y tesis finalizadas para permitir al bibliotecario del instituto subirlos a la biblioteca digital sin reescribir la información.

### C. Workspace Colaborativo y Fábrica de PDFs
* **Diseño Colaborativo:** Los proyectos son construidos dinámicamente en fases: Postulación (coordinadores/docentes/estudiantes), Evaluación de Pares (Rúbricas anónimas en doble ciego), y Aprobación (Resoluciones institucionales).
* **QuestPDF / Generador Dinámico de Plantillas:** Dado que los formatos y rúbricas del CACES cambian constantemente, la lógica de reportes de DIITRA debe basarse en plantillas PDF dinámicas para facilitar su adaptación inmediata sin necesidad de alterar el código del frontend.
* **Compatibilidad SIIES:** El sistema de base de datos debe ser capaz de exportar las evidencias estructuradas en formatos CSV compatibles con las plantillas de carga masiva solicitadas por la plataforma SIIES del CACES durante la fase de auditoría.
