namespace Diitra.Infrastructure.Common.Documents.Resources
{
    /// <summary>
    /// [MIGRADO] Las imágenes institucionales ya no se almacenan como strings Base64 en C#.
    ///
    /// Las imágenes ahora viven como archivos físicos en:
    ///   Common/Documents/Resources/Images/
    ///     ├── portada_proyecto.jpg            (portada del Formato Proyecto de Investigación)
    ///     └── fondo_hojas_investigacion.jpg   (fondo de hojas / marca de agua institucional)
    ///
    /// Son cargadas en tiempo de ejecución por ImageResourceLoader, lo que permite:
    ///   - Actualizar imágenes sin recompilar
    ///   - Mantener el repositorio sin archivos C# de 600KB
    ///   - Usar cualquier editor de imágenes para actualizar el diseño
    ///
    /// Esta clase se mantiene vacía para no romper ninguna referencia remanente.
    /// </summary>
    public static class TemplateImages
    {
        // Vacío intencionalmente. Ver: Common/Documents/Resources/Images/
    }
}
