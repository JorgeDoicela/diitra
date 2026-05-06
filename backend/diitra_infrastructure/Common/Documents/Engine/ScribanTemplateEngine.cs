using HandlebarsDotNet;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Globalization;

namespace Diitra.Infrastructure.Common.Documents.Engine
{
    /// <summary>
    /// Motor de renderizado de plantillas usando Handlebars.Net.
    /// Sintaxis: {{ variable_en_snake_case }} — compatible con el estándar Handlebars/Mustache.
    /// Handlebars.Net es la elección enterprise estándar: sin vulnerabilidades conocidas,
    /// ampliamente usado en sistemas de facturación, legales y educativos.
    /// </summary>
    public class ScribanTemplateEngine   // Nombre interno mantenido para no romper dependencias
    {
        private readonly JsonSerializerOptions _jsonOptions = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
            WriteIndented = false,
            // Importante: serializar nulls para que Handlebars no falle
            DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.Never
        };

        private readonly IHandlebars _handlebars;

        public ScribanTemplateEngine()
        {
            _handlebars = Handlebars.Create();

            // Helper: valor por defecto si la variable está vacía
            _handlebars.RegisterHelper("default", (output, context, arguments) =>
            {
                var value = arguments.ElementAtOrDefault(0)?.ToString();
                var fallback = arguments.ElementAtOrDefault(1)?.ToString() ?? "";
                output.WriteSafeString(string.IsNullOrWhiteSpace(value) ? fallback : value);
            });

            // Helper: formatear fecha en español ecuatoriano
            _handlebars.RegisterHelper("fecha_larga", (output, context, arguments) =>
            {
                if (DateTime.TryParse(arguments.ElementAtOrDefault(0)?.ToString(), out var date))
                    output.WriteSafeString(date.ToString("dd 'de' MMMM 'de' yyyy", new CultureInfo("es-EC")));
                else
                    output.WriteSafeString(arguments.ElementAtOrDefault(0)?.ToString() ?? "");
            });

            // Helper: formatear moneda
            _handlebars.RegisterHelper("moneda", (output, context, arguments) =>
            {
                if (decimal.TryParse(arguments.ElementAtOrDefault(0)?.ToString(), out var amount))
                    output.WriteSafeString($"${amount:N2}");
                else
                    output.WriteSafeString(arguments.ElementAtOrDefault(0)?.ToString() ?? "$0.00");
            });
        }

        /// <summary>
        /// Renderiza la plantilla HTML inyectando los datos y las variables globales del sistema.
        /// </summary>
        public async Task<string> RenderAsync(
            string templateHtml,
            object data,
            Dictionary<string, object>? extraVariables = null,
            bool isBlindMode = false)
        {
            // Compilar la plantilla (Handlebars cachea internamente)
            HandlebarsTemplate<object, object> compiled;
            try
            {
                compiled = _handlebars.Compile(templateHtml);
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException(
                    $"Error al compilar plantilla DIITRA: {ex.Message}", ex);
            }

            var context = BuildContext(data, extraVariables, isBlindMode);

            var rendered = compiled(context);
            return await Task.FromResult(rendered);
        }

        private Dictionary<string, object?> BuildContext(
            object data,
            Dictionary<string, object>? extraVariables,
            bool isBlindMode)
        {
            // Serializar el DTO a snake_case y convertir a diccionario para Handlebars
            var json = JsonSerializer.Serialize(data, _jsonOptions);
            var dict = JsonSerializer.Deserialize<Dictionary<string, object?>>(json, _jsonOptions)
                       ?? new Dictionary<string, object?>();

            // Enmascarar datos personales en modo doble ciego (LOPDP + Peer Review)
            if (isBlindMode)
                ApplyBlindMask(dict);

            // Variables globales del sistema (siempre disponibles en cualquier plantilla)
            var ecuadorCulture = new CultureInfo("es-EC");
            dict["fecha_emision"] = DateTime.Now.ToString("dd 'de' MMMM 'de' yyyy", ecuadorCulture);
            dict["fecha_emision_corta"] = DateTime.Now.ToString("dd/MM/yyyy");
            dict["hora_emision"] = DateTime.Now.ToString("HH:mm");
            dict["anio_actual"] = DateTime.Now.Year.ToString();
            dict["es_doble_ciego"] = isBlindMode;
            dict["ciudad"] = "Quito";
            dict["pais"] = "Ecuador";
            dict["institucion"] = "DIITRA - Departamento de Investigación e Innovación Traversari";

            // Variables extra pasadas por el controlador/servicio
            if (extraVariables != null)
                foreach (var kv in extraVariables)
                    dict[kv.Key] = kv.Value;

            return dict;
        }

        /// <summary>
        /// Enmascara datos de identidad personal conforme a:
        /// - LOPDP (Art. 26 - Datos sensibles en procesos de evaluación)
        /// - RRA CES (Art. 10 - Evaluación por pares con doble anonimización)
        /// </summary>
        private static void ApplyBlindMask(Dictionary<string, object?> data)
        {
            var fieldsToMask = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                "nombre", "nombres", "apellido", "apellidos", "nombre_completo",
                "cedula", "correo", "email", "telefono", "celular",
                "autor", "investigador", "docente",
                "nombre_investigador", "nombre_director", "nombre_revisor",
                "nombre_autor", "cedula_autor", "nombre_tutor", "nombre_rector"
            };

            foreach (var field in fieldsToMask)
                if (data.ContainsKey(field))
                    data[field] = "[ RESERVADO — PROCESO DOBLE CIEGO ]";
        }
    }
}
