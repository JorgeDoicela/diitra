using HandlebarsDotNet;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Globalization;
using System.Linq;
using Diitra.Domain.Common.Documents;
using System.Collections.Generic;

namespace Diitra.Infrastructure.Common.Documents.Engine
{
    /// <summary>
    /// Motor de renderizado de DIITRA Builder (usando Handlebars.Net).
    /// Sintaxis: {{ variable_en_snake_case }} — compatible con el estándar Handlebars/Mustache.
    /// </summary>
    public class ScribanTemplateEngine   // Nombre interno mantenido por compatibilidad
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

            // Helper: sumar múltiples valores numéricos (útil para totalizar rúbricas en el motor Handlebars)
            _handlebars.RegisterHelper("sum", (output, context, arguments) =>
            {
                decimal total = 0;
                foreach (var arg in arguments)
                {
                    if (decimal.TryParse(arg?.ToString(), out var val))
                    {
                        total += val;
                    }
                }
                output.WriteSafeString(total.ToString(CultureInfo.InvariantCulture));
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

            // Helper: comparación de igualdad (útil para condicionales {{#if (eq a b)}})
            _handlebars.RegisterHelper("eq", (context, arguments) =>
            {
                var a = arguments.ElementAtOrDefault(0);
                var b = arguments.ElementAtOrDefault(1);
                return a?.ToString() == b?.ToString();
            });

            // Helper: negación
            _handlebars.RegisterHelper("not", (context, arguments) =>
            {
                var val = arguments.ElementAtOrDefault(0);
                if (val is bool b) return !b;
                return val == null;
            });

            // Helper: conjunción lógica Y (and)
            _handlebars.RegisterHelper("and", (context, arguments) =>
            {
                if (arguments.Length == 0) return false;
                foreach (var arg in arguments)
                {
                    if (arg == null) return false;
                    if (arg is bool b && !b) return false;
                    if (arg is string s && string.IsNullOrEmpty(s)) return false;
                    if (arg is int i && i == 0) return false;
                    if (arg is long l && l == 0) return false;
                    if (arg is decimal dec && dec == 0) return false;
                    if (arg is double d && d == 0) return false;
                }
                return true;
            });

            // Helper: disyunción lógica O (or)
            _handlebars.RegisterHelper("or", (context, arguments) =>
            {
                if (arguments.Length == 0) return false;
                foreach (var arg in arguments)
                {
                    if (arg is bool b && b) return true;
                    if (arg is string s && !string.IsNullOrEmpty(s)) return true;
                    if (arg is int i && i != 0) return true;
                    if (arg is long l && l != 0) return true;
                    if (arg is decimal dec && dec != 0) return true;
                    if (arg is double d && d != 0) return true;
                    if (arg != null && !(arg is bool) && !(arg is string) && !(arg is int) && !(arg is long) && !(arg is decimal) && !(arg is double)) return true;
                }
                return false;
            });

            // Helper: generar columnas de ancho col para el cronograma (48 semanas)
            _handlebars.RegisterHelper("generar_columnas_col", (output, context, arguments) =>
            {
                var sb = new System.Text.StringBuilder();
                for (int i = 0; i < 48; i++)
                {
                    sb.Append("<col style=\"width: 1.33%;\" />");
                }
                output.WriteSafeString(sb.ToString());
            });

            // Helper: agrupar objetivos dinámicamente y sólo mostrar el objetivo si cambió
            _handlebars.RegisterHelper("mostrar_objetivo", (output, context, arguments) =>
            {
                var indexObj = arguments.ElementAtOrDefault(0);
                var listObj = arguments.ElementAtOrDefault(1);

                if (indexObj == null || listObj == null) return;

                int index = 0;
                if (indexObj is int idx) index = idx;
                else if (!int.TryParse(indexObj.ToString(), out index)) return;

                if (listObj is System.Collections.IEnumerable enumerable)
                {
                    var list = new System.Collections.ArrayList();
                    foreach (var item in enumerable) list.Add(item);

                    if (index < 0 || index >= list.Count) return;

                    var currentItem = list[index];
                    var currentObj = GetProperty(currentItem, "objetivo");

                    if (index == 0)
                    {
                        output.WriteSafeString(currentObj);
                        return;
                    }

                    var prevItem = list[index - 1];
                    var prevObj = GetProperty(prevItem, "objetivo");

                    if (currentObj != prevObj)
                    {
                        output.WriteSafeString(currentObj);
                    }
                }
            });

            // Helper: generar las 48 columnas de la tabla de cronograma basadas en la lista de semanas activa
            _handlebars.RegisterHelper("columnas_gantt", (output, context, arguments) =>
            {
                var semanasObj = arguments.ElementAtOrDefault(0);
                var rowIndexObj = arguments.ElementAtOrDefault(1);

                int rowIndex = 0;
                if (rowIndexObj is int r) rowIndex = r;
                else if (rowIndexObj != null) int.TryParse(rowIndexObj.ToString(), out rowIndex);

                var semanas = new List<bool>();
                if (semanasObj is System.Collections.IEnumerable enumerable)
                {
                    foreach (var item in enumerable)
                    {
                        if (item is bool b) semanas.Add(b);
                        else if (item != null && bool.TryParse(item.ToString(), out var bParsed)) semanas.Add(bParsed);
                        else semanas.Add(false);
                    }
                }

                var sb = new System.Text.StringBuilder();
                for (int w = 0; w < 48; w++)
                {
                    bool active = w < semanas.Count && semanas[w];
                    if (active)
                    {
                        sb.Append("<td class=\"bg-gantt-").Append(rowIndex % 8).Append("\" style=\"border: 1px solid #000000; padding: 0;\"></td>");
                    }
                    else
                    {
                        sb.Append("<td style=\"border: 1px solid #000000; padding: 0;\"></td>");
                    }
                }
                output.WriteSafeString(sb.ToString());
            });

            // Helper: generar las 8 filas de ejemplo para la tabla de cronograma como fallback
            _handlebars.RegisterHelper("render_fallback_cronograma", (output, context, arguments) =>
            {
                var sb = new System.Text.StringBuilder();
                for (int r = 0; r < 8; r++)
                {
                    sb.Append("<tr>");
                    if (r == 0)
                    {
                        sb.Append("<td rowspan=\"4\" style=\"border: 1px solid #000000; text-align: center; vertical-align: middle; font-weight: bold; font-size: 8pt; color: #000000;\">OBJETIVO<br/>N° 1</td>");
                    }
                    else if (r > 3)
                    {
                        sb.Append("<td style=\"border: 1px solid #000000;\">&nbsp;</td>");
                    }

                    sb.Append("<td style=\"border: 1px solid #000000; padding: 4px; text-align: center; vertical-align: middle; color: #000000;\">");
                    sb.Append(r < 4 ? (r + 1).ToString() : "&nbsp;");
                    sb.Append("</td>");

                    sb.Append("<td style=\"border: 1px solid #000000; padding: 4px; text-align: left; vertical-align: middle; color: #000000;\">");
                    sb.Append(r < 2 ? "Especificar la actividad" : "&nbsp;");
                    sb.Append("</td>");

                    sb.Append("<td style=\"border: 1px solid #000000; padding: 4px;\">&nbsp;</td>");

                    for (int w = 0; w < 48; w++)
                    {
                        bool active = false;
                        if (r == 0 && (w >= 1 && w <= 3)) active = true;
                        else if (r == 1 && (w >= 4 && w <= 7)) active = true;
                        else if (r == 2 && (w >= 8 && w <= 10)) active = true;
                        else if (r == 3 && (w >= 11 && w <= 15)) active = true;
                        else if (r == 4 && (w >= 16 && w <= 17)) active = true;
                        else if (r == 5 && (w >= 18 && w <= 23)) active = true;
                        else if (r == 6 && (w >= 24 && w <= 26)) active = true;
                        else if (r == 7 && (w >= 27 && w <= 31)) active = true;

                        if (active)
                        {
                            sb.Append("<td class=\"bg-gantt-").Append(r).Append("\" style=\"border: 1px solid #000000; padding: 0;\"></td>");
                        }
                        else
                        {
                            sb.Append("<td style=\"border: 1px solid #000000; padding: 0;\"></td>");
                        }
                    }
                    sb.Append("</tr>");
                }
                output.WriteSafeString(sb.ToString());
            });
        }

        /// <summary>
        /// Renderiza la plantilla HTML inyectando los datos y las variables globales del sistema.
        /// </summary>
        public async Task<string> RenderAsync(
            string templateHtml,
            object data,
            Dictionary<string, object?>? extraVariables = null,
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
            Dictionary<string, object?>? extraVariables,
            bool isBlindMode)
        {
            // 1. Serializar el DTO a JSON
            var json = JsonSerializer.Serialize(data, _jsonOptions);
            
            // 2. Parsear a JsonDocument para navegar recursivamente
            using var doc = JsonDocument.Parse(json);
            var dict = ToNativeType(doc.RootElement) as Dictionary<string, object?> 
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
        /// Convierte recursivamente un JsonElement a tipos nativos de C# (Dictionary, List, string, etc.)
        /// Esto es CRÍTICO porque Handlebars.Net no sabe navegar objetos JsonElement directamente.
        /// </summary>
        private static object? ToNativeType(JsonElement element)
        {
            switch (element.ValueKind)
            {
                case JsonValueKind.Object:
                    var dict = new Dictionary<string, object?>();
                    foreach (var prop in element.EnumerateObject())
                    {
                        // Normalizamos a minúsculas para que coincida con la plantilla Handlebars
                        dict[prop.Name.ToLower()] = ToNativeType(prop.Value);
                    }
                    return dict;

                case JsonValueKind.Array:
                    var list = new List<object?>();
                    foreach (var item in element.EnumerateArray())
                    {
                        list.Add(ToNativeType(item));
                    }
                    return list;

                case JsonValueKind.String:
                    return element.GetString();

                case JsonValueKind.Number:
                    if (element.TryGetInt64(out long l)) return l;
                    if (element.TryGetDouble(out double d)) return d;
                    return element.GetDecimal();

                case JsonValueKind.True:
                    return true;

                case JsonValueKind.False:
                    return false;

                case JsonValueKind.Null:
                default:
                    return null;
            }
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

        private static string GetProperty(object? item, string key)
        {
            if (item is Dictionary<string, object?> dict)
            {
                if (dict.TryGetValue(key, out var val))
                    return val?.ToString() ?? string.Empty;
                if (dict.TryGetValue(key.ToLower(), out var valLower))
                    return valLower?.ToString() ?? string.Empty;
            }
            return string.Empty;
        }
    }
}
