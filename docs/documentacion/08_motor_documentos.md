# Motor de Documentos Institucionales (Document Engine)

El subsistema de generación de documentos es el responsable de la emisión de protocolos, actas y resoluciones oficiales en formato PDF. Su diseño se centra en la flexibilidad normativa y la inmutabilidad de los registros generados.

## Pipeline de Generación

El proceso de emisión documental sigue una secuencia estricta de cinco etapas:

1. **Recuperación de Plantilla**: Se extrae el contenido HTML y CSS desde la tabla `inv_document_templates` mediante el código identificador.
2. **Inyección de Cumplimiento Legal**: Se añaden de forma automática las cláusulas de protección de datos (LOPDP) y marcas de agua en caso de borradores.
3. **Procesamiento de Variables**: El motor Handlebars.Net realiza la inyección de los datos del proyecto en los campos dinámicos de la plantilla.
4. **Renderizado de Alta Fidelidad**: La librería iText9 transforma el código HTML resultante en un archivo PDF binario cumpliendo con los estándares de diseño institucional.
5. **Registro Forense**: El sistema calcula el hash SHA-256 del documento y almacena un snapshot JSON de los datos utilizados en la tabla `inv_document_audit`.

## Trazabilidad e Integridad

Cada documento emitido cuenta con un Sello de Integridad que garantiza su autenticidad ante entidades reguladoras (SENESCYT, CACES):

- **Código de Trazabilidad Único**: Identificador alfanumérico impreso en el pie de página del documento.
- **Sellado SHA-256**: Hash vinculado al contenido binario del PDF. Cualquier modificación posterior al archivo invalidará esta firma digital.
- **Snapshot Forense**: Copia inalterable de los datos de origen, permitiendo reconstruir el documento incluso si los registros del proyecto han sido modificados o eliminados del sistema principal.

## Módulo de Verificación Pública (QR Integrity)

Para facilitar los procesos de auditoría externa, DIITRA incorpora un nodo público de verificación. Al escanear el código QR presente en el documento, el auditor accede a una interfaz que confirma:

1. La autenticidad del emisor (IST Traversari).
2. La fecha y hora exactas de la generación del documento.
3. El match de integridad entre el hash del PDF y el registro en el nodo de confianza.
4. La vigencia legal del documento según el estado actual del proyecto en el flujo de trabajo institucional.

## Administración de Plantillas

El sistema permite la actualización de los formatos institucionales mediante una interfaz de administración, lo que elimina la necesidad de realizar despliegues de código ante cambios menores en la normativa de los documentos, asegurando una agilidad operativa superior.
