# Guía de Creación y Formateo de Plantillas HTML-to-PDF (DIITRA)

Este directorio contiene las plantillas HTML oficiales de la institución. Estas plantillas son procesadas por el backend utilizando el motor de **iText 9 (pdfHTML)** para compilar PDFs dinámicos con calidad de imprenta.

---

## Las 3 Reglas de Oro (Imprescindibles)

Dado que un PDF representa un medio físico y no una pantalla de navegador, debes seguir estas tres reglas de oro para evitar que el diseño se descuadre o se rompa:

### 1. Maquetación con CSS Clásico e Impresora-Friendly
* **Sí puedes usar:** Tablas estándar (`<table>`), contenedores (`<div>`), márgenes (`margin`), rellenos (`padding`), bordes (`border`) y posicionamiento básico. *Flexbox* es soportado para alineaciones sencillas.
* **Evita:** Diseños complejos con *CSS Grid*, animaciones (`@keyframes`), sombras complejas o efectos de transformación 3D, ya que las impresoras de PDF no los interpretan.
* **Auto-Ajuste:** Deja que las tablas e inputs crezcan naturalmente según el contenido inyectado por las llaves dinámicas.

### 2. Unidades Físicas Absolutas
* Estás diseñando para un papel real (ejemplo, formato **A4: 210mm x 297mm**).
* **Usa siempre unidades de medida físicas** en tu CSS para anchos, altos y márgenes:
  * `pt` (puntos) para el tamaño de letra (`font-size: 11pt;`).
  * `mm` (milímetros) o `cm` (centímetros) para anchos, altos, paddings y márgenes.
  * **Evita:** Unidades relativas a pantallas de dispositivos móviles/monitores como `vw`, `vh` o porcentajes ambiguos.

### 3. Control Preciso de Saltos de Página (`page-break`)
* **Evitar cortes indeseados (Ej: Firmas o Tablas)**: Si tienes un bloque de firmas, un recuadro o una tabla corta que nunca debe cortarse por la mitad al final de una hoja, agrégale la clase CSS de prevención:
  ```css
  .evitar-corte {
      page-break-inside: avoid;
      break-inside: avoid;
  }
  ```
* **Salto de página forzado**: Si deseas obligar al documento a saltar de hoja (por ejemplo, para separar la portada del contenido, o empezar una nueva sección en otra página):
  ```css
  .salto-pagina {
      page-break-after: always;
  }
  ```

---

## Cómo Agregar una Nueva Plantilla en 3 Pasos

Cuando necesites crear un nuevo formato documental en el futuro, sigue estos sencillos pasos:

### Paso 1: Crear el archivo HTML
Crea un nuevo archivo `.html` dentro de la subcarpeta de su área en `Common/Documents/Templates/` (ej: `Common/Documents/Templates/Investigacion/NuevoDocumento.html`).
* Puedes usar la **Plantilla Base** al final de este documento como punto de partida.

### Paso 2: Registrar la ruta en el Cargador
Abre [TemplateFileLoader.cs](file:///c:/Users/DESARROLLADOR/Desktop/Proyectos/diitra/backend/diitra_infrastructure/Common/Documents/Engine/TemplateFileLoader.cs) y registra tu nuevo código en el mapa explícito de rutas:
```csharp
var map = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
{
    ["PROTOCOLO_INVESTIGACION"]     = "Investigacion/ProyectoInvestigacion.html",
    ["INFORME_FINAL_INVESTIGACION"] = "Investigacion/InformeFinal.html",
    ["MI_NUEVO_CODIGO"]             = "Investigacion/NuevoDocumento.html", // <-- Agrega esta línea
};
```

### Paso 3: Registrar en el Catálogo Maestro
Abre [DocumentTemplateRegistry.cs](file:///c:/Users/DESARROLLADOR/Desktop/Proyectos/diitra/backend/diitra_infrastructure/Common/Documents/DocumentTemplateRegistry.cs) y registra la metadata inicial con su código:
```csharp
yield return DocumentTemplate.Create(
    code: "MI_NUEVO_CODIGO",
    name: "Nombre Oficial del Documento",
    description: "Breve descripción institucional.",
    category: DocumentCategory.Otros, // Categoría correspondiente
    htmlContent: "<!-- Cargado desde archivo físico -->", // Vacío o placeholder
    requiresLopdp: true,
    supportsBlind: false,
    requiresTraceability: true,
    requiresSignature: true,
    version: 1); // Versión inicial
```

---

## Plantilla Base para Nuevos Documentos (Copiar y Pegar)

Puedes copiar este esqueleto HTML para comenzar a diseñar cualquier documento nuevo:

```html
<!--
    =============================================================================
    DIITRA TEMPLATE DOCUMENTATION & FORMATTING RULES (HTML-to-PDF)
    =============================================================================
    1. CSS ESTÁNDAR: Usa tablas (<table>), bloques (<div>), márgenes y paddings.
    2. UNIDADES FÍSICAS: Diseña en tamaño A4. Usa 'pt' para fuentes y 'mm'/'cm' para márgenes.
    3. CONTROL DE SALTOS: Usa 'page-break-inside: avoid' en cajas que no deban cortarse.
    =============================================================================
-->
<style>
    /* Reset e Impresión */
    * { box-sizing: border-box; }

    @page {
        size: A4;
        margin-top: 3cm;
        margin-bottom: 2cm;
        margin-left: 2cm;
        margin-right: 2cm;
    }

    .doc-body {
        font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
        color: #1a202c;
        line-height: 1.6;
        font-size: 11pt; /* Tamaño óptimo para impresión */
    }

    /* Evitar cortes indeseados */
    .evitar-corte {
        page-break-inside: avoid;
        break-inside: avoid;
    }

    /* Salto forzado */
    .salto-pagina {
        page-break-after: always;
    }
</style>

<div class="doc-body">
    <h1>Título del Documento</h1>
    <p>Este es un texto redactado. Puedes usar llaves para inyectar variables: {{variable}}</p>

    <div class="evitar-corte">
        <h3>Sección que no debe dividirse</h3>
        <p>Contenido protegido contra saltos de página accidentales.</p>
    </div>
</div>
```
