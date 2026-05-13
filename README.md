# DIITRA: Departamento de Investigación e Innovación Traversari

Sistema integral para la administración del ciclo de vida de proyectos de investigación e innovación tecnológica. Diseñado para garantizar la transparencia, trazabilidad y cumplimiento de los estándares de acreditación de Institutos Superiores en Ecuador.

---

## Capacidades Nucleares del Sistema

DIITRA se fundamenta en tres pilares estratégicos para asegurar la excelencia institucional:

1. **Auditoría Integral**: Cada transición de estado genera un rastro inmutable de trazabilidad, integrando firmas digitales y sellos de tiempo.
2. **Resiliencia Forense**: Implementación de snapshots de datos SHA-256 para la protección de la producción científica ante auditorías del CACES.
3. **Gobernanza de Datos**: Modelo de persistencia robusto que asegura la integridad de la propiedad intelectual y el cumplimiento de la LOPDP.

## Arquitectura Tecnológica

La plataforma utiliza un stack tecnológico moderno y escalable:

- **Frontend Web**: Aplicación React SPA con arquitectura de componentes modular.
- **Backend Core**: API Gateway desarrollado en .NET 8.0 utilizando Clean Architecture.
- **Persistencia**: Base de datos MariaDB/MySQL Enterprise con segregación de esquemas.
- **Integridad Documental**: Motor de generación PDF basado en iText9 y plantillas dinámicas.

## Cumplimiento Normativo (CACES 2026)

El sistema ha sido fortificado para cumplir con las exigencias regulatorias nacionales:

- **Motor de Estados Configurable**: Adaptabilidad inmediata a cambios en el Reglamento de Régimen Académico.
- **Trazabilidad de TRL**: Seguimiento detallado de los Niveles de Madurez Tecnológica (TRL 1-9).
- **Verificación Pública**: Nodo de consulta externa para la validación de autenticidad de documentos mediante códigos QR.

## Documentación Técnica Relacionada

Para una comprensión profunda de los subsistemas, consulte los siguientes documentos:

- [Arquitectura de Sistema y Diseño C4](./docs/documentacion/01_arquitectura.md)
- [Gobernanza de Datos y Modelo de Base de Datos](./docs/documentacion/02_base_datos.md)
- [Especificación Técnica de la API Backend](./docs/documentacion/03_api_backend_servicios.md)
- [Interfaz Web y Panel Administrativo](./docs/documentacion/04_interfaz_web_panel.md)
- [Aplicación Móvil para el Personal Docente](./docs/documentacion/05_aplicacion_movil_docente.md)
- [Flujos de Trabajo y Diagramas de Secuencia](./docs/documentacion/06_flujos_trabajo.md)
- [Arquitecturas de Detalle y Patrones](./docs/documentacion/07_arquitecturas_detalle.md)
- [Motor de Documentos e Integridad Forense](./docs/documentacion/08_motor_documentos.md)
- [Generador de Documentos Core](./docs/documentacion/09_generador_documentos_core.md)
- [Motor Colaborativo CoWork](./docs/documentacion/10_motor_colaborativo_cowork.md)
- [Ecosistema Institucional y Normativa](./docs/documentacion/11_diitra_ecosistema_institucional.md)
- [Arquitectura Nuclear y Madurez TRL](./docs/documentacion/12_arquitectura_nuclear_trl.md)

---

## Guía de Despliegue e Instalación

### Requisitos del Entorno
- .NET SDK 8.0 o superior
- Node.js 18.x o superior
- MariaDB 10.5+ o MySQL 8.0+

### Procedimiento de Arranque
1. **Base de Datos**: Ejecute el script de inicialización ubicado en `scripts/base_datos/`.
2. **Servidor API**: Configure la cadena de conexión en `appsettings.json` e inicie el servicio mediante `dotnet run`.
3. **Cliente Web**: Instale las dependencias mediante `npm install` e inicie el entorno de desarrollo con `npm run dev`.

---

DIITRA Trust Architecture | IST Traversari | Quito, Ecuador
