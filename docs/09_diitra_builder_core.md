# 🛠️ DIITRA Builder Core: Arquitectura de Generación Documental

El **DIITRA Builder** no es un generador de PDFs común; es un orquestador de datos institucionales diseñado para transformar el ciclo de vida de un proyecto de investigación en documentos con validez legal y técnica.

## 1. Filosofía de "Documento como Dato"
A diferencia de los sistemas tradicionales donde los documentos son archivos estáticos (Word/PDF) aislados, en DIITRA los documentos son **instancias dinámicas**.

- **Plantillas (Templates):** Definidas en `inv_document_templates`. Cada plantilla contiene la estructura lógica, los campos colaborativos (`collaborative_fields_json`) y las reglas de trazabilidad.
- **Instancias:** Almacenadas en `inv_documentos_instancias`. Una instancia es un "ser vivo" que conecta una entidad de negocio (como un Proyecto o un Informe de Avance) con el motor de edición.

## 2. El Orquestador Central (`DocumentDataOrchestrator`)
Este componente es el cerebro del Builder. Su función es "coser" diferentes fuentes de información:
1. **Datos Maestros:** Extrae información de la base de datos SQL (título, autores, presupuesto, cronograma).
2. **Contenido Colaborativo:** Recupera los fragmentos redactados en tiempo real desde el motor **CoWork**.
3. **Metadatos de Trazabilidad:** Genera el código único de seguimiento que garantiza que el documento no ha sido alterado.

## 3. Sistema de Trazabilidad y Seguridad (Normativa LOPDP)
Cada documento generado por el Builder incluye:
- **UUID Único:** Cada versión del documento tiene un identificador universal e inmutable.
- **Hash de Integridad:** Un algoritmo calcula una "huella digital" del contenido. Si un solo carácter cambia, el hash se rompe, alertando sobre fraude documental.
- **Auditoría Nativa:** El sistema registra quién, cuándo y desde qué IP se generó cada versión, cumpliendo estrictamente con el **Art. 26 de la LOPDP** (Ley Orgánica de Protección de Datos Personales).

## 4. Por qué es Profesional (Valor para el Jefe)
- **Cero Errores de Formato:** El investigador no pierde tiempo en márgenes o normas APA; el Builder impone el formato institucional automáticamente.
- **Consistencia de Datos:** Si el presupuesto cambia en el módulo de finanzas, se actualiza automáticamente en el documento PDF sin intervención humana.
- **Preparación para Firma:** El Builder genera el documento listo para el proceso de **Firma Electrónica Avanzada**, permitiendo que los IST de Quito eliminen el uso del papel.

---
*DIITRA Builder Core v3.0 - Generación Documental con Rigor Científico.*
