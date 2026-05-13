# Arquitectura Nuclear y TRL 2026

## Introducción

La Arquitectura Nuclear representa la evolución tecnológica del sistema DIITRA para satisfacer los requerimientos de excelencia institucional proyectados para el año 2026. Se basa en un modelo orientado a metadatos (metadata-driven) que permite la tipificación dinámica de productos y evidencias.

## Componentes del Núcleo Tecnológico

### Persistencia Orientada a Metadatos

Las entidades principales utilizan estructuras JSON para el almacenamiento de atributos específicos de categoría, permitiendo la adaptación inmediata a nuevas normativas sin requerir cambios estructurales en el esquema de base de datos.

### Motor TRL (Technology Readiness Levels)

Soporte para el seguimiento de la madurez tecnológica mediante la escala TRL (1-9), facilitando la clasificación de proyectos entre investigación básica, aplicada y desarrollo experimental.

### Vinculación e Innovación Productiva

Módulo integrado para la gestión de relaciones con entidades externas, asegurando el cumplimiento de los criterios de acreditación relacionados con la vinculación con el sector productivo.

### Catálogos Dinámicos

Separación estricta entre la lógica de negocio y los datos maestros, permitiendo la gestión granular de tipos de producto, evidencias y rúbricas de evaluación.

## Estrategias de Resiliencia Forense

DIITRA implementa capas de protección para asegurar la integridad del sistema a largo plazo:

1. **Snapshots Forenses**: Captura inmutable de los datos del proyecto en el momento de la emisión de cada documento oficial.
2. **Trazabilidad Temporal**: Registro persistente de extensiones de plazos y cambios en la vigencia legal de los proyectos.
3. **Servicios de Notificación Desacoplados**: Arquitectura basada en drivers que permite la integración de nuevos canales de comunicación sin afectar el núcleo del sistema.

## Gestión de Flujos Académicos

Para la implementación de nuevas tipologías de investigación o cambios en el ciclo de vida, el administrador debe definir las reglas en `inv_config_workflow`, las cuales son procesadas automáticamente por el motor de flujo y el sistema de generación documental, garantizando una transición sin interrupciones en la operación institucional.
