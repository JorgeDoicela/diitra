# DIITRA Builder Core: Arquitectura de Generación Documental

El DIITRA Builder es un orquestador de datos diseñado para transformar la información técnica de los proyectos de investigación en documentos oficiales con validez legal.

## Filosofía de Datos Dinámicos

A diferencia de los sistemas basados en archivos estáticos, DIITRA gestiona los documentos como instancias dinámicas de datos:

- **Plantillas (Templates)**: Definidas en `inv_document_templates`, contienen la estructura lógica y las reglas de trazabilidad.
- **Instancias**: Conexiones dinámicas entre las entidades de negocio (Proyectos, Informes) y el motor de renderizado.

## Orquestación de Información

El `DocumentDataOrchestrator` centraliza la recolección de datos desde múltiples fuentes:

1. **Datos Maestros**: Información estructurada de la base de datos (presupuestos, cronogramas).
2. **Contenido Colaborativo**: Fragmentos de texto generados en tiempo real mediante el motor CoWork.
3. **Metadatos de Integridad**: Generación de códigos únicos que aseguran la inmutabilidad del documento.

## Trazabilidad y Seguridad Normativa

En cumplimiento con la Ley Orgánica de Protección de Datos Personales (LOPDP):

- **Identificación Única**: Uso de UUIDs para cada versión del documento.
- **Hash de Integridad**: Cálculo de huellas digitales SHA-256 para prevenir alteraciones documentales.
- **Registro de Auditoría**: Trazabilidad completa de la generación (usuario, fecha, dirección IP).

## Estándares Institucionales

- **Consistencia Formativa**: Automatización de normas APA y formatos institucionales, eliminando errores manuales.
- **Sincronización Automática**: Los cambios en los módulos de gestión se reflejan instantáneamente en los documentos generados.
- **Preparación para Firma Digital**: Generación de documentos compatibles con los estándares de firma electrónica avanzada (.p12).
