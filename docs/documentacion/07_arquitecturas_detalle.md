# Detalle de Arquitecturas DIITRA

Este documento proporciona una visión técnica profunda de los patrones arquitectónicos implementados en el ecosistema DIITRA, asegurando el cumplimiento de la normativa SENESCYT/CACES y la mantenibilidad del software.

## Backend: Clean Architecture (Onion Pattern)

El backend utiliza .NET 8.0 siguiendo una arquitectura de capas concéntricas donde el núcleo de dominio se mantiene independiente de las tecnologías externas.

### Capas y Responsabilidades

1. **Domain (Núcleo)**: Contiene las entidades de negocio (Proyecto, Presupuesto), objetos de valor e interfaces de repositorio. Es código C# puro sin dependencias externas.
2. **Application (Lógica de Negocio)**: Implementa los casos de uso del sistema. Incluye servicios de aplicación, DTOs y validaciones mediante FluentValidation.
3. **Infrastructure (Implementación)**: Contiene el contexto de base de datos (DiitraContext), implementaciones de persistencia, integración con servicios de firma electrónica y clientes de IA.
4. **API (Presentación)**: Define los endpoints REST, controladores y middlewares de gestión de excepciones y seguridad.

## Frontend Web: Modular Layered React

La aplicación web utiliza React 19 y Vite para optimizar el rendimiento y la experiencia de desarrollo.

### Organización de Componentes

- **Pages**: Componentes que mapean directamente a una ruta de la aplicación.
- **Components**: Unidades atómicas de interfaz y componentes de negocio reutilizables.
- **Hooks**: Encapsulación de lógica de estado y efectos secundarios.
- **API Services**: Capa de comunicación con el backend basada en Axios con interceptores de seguridad.

## Base de Datos: Persistencia y Trazabilidad

El motor de base de datos MariaDB/MySQL garantiza la integridad referencial y la auditoría de los procesos.

- **Integridad Referencial**: Uso estricto de claves foráneas y triggers para la generación de identificadores únicos.
- **Soft Delete**: Política de eliminación lógica para asegurar la permanencia de registros auditables.
- **Optimización de Consultas**: Uso de vistas para la consolidación de indicadores requeridos por los procesos de acreditación.

## Motor de Documentos: Arquitectura de Pipeline

El motor de generación de documentos opera bajo un patrón de pipeline, donde cada etapa tiene una responsabilidad única y es fácilmente reemplazable.

1. **Repository Layer**: Localización de plantillas en `inv_document_templates`.
2. **Compliance Layer**: Inyección automática de cláusulas legales y normativas.
3. **Template Engine**: Procesamiento dinámico de variables mediante Handlebars.Net.
4. **Renderer Layer**: Conversión de HTML/CSS a formato PDF binario utilizando iText9.
5. **Audit Layer**: Registro inmutable de la emisión y captura del snapshot forense.

## Calidad y Despliegue

- **Rendimiento**: Optimización del proceso de arranque mediante la eliminación de dependencias bloqueantes.
- **Gestión de Entornos**: Uso de perfiles de configuración para asegurar la consistencia entre entornos de desarrollo y producción.
- **CI/CD**: Integración continua mediante GitHub Actions para la validación automática de la calidad del código.
