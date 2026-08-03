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
    public partial class HandlebarsTemplateEngine
    {
        private readonly JsonSerializerOptions _jsonOptions = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
            WriteIndented = false,
            // Importante: serializar nulls para que Handlebars no falle
            DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.Never
        };

        private readonly IHandlebars _handlebars;

        public HandlebarsTemplateEngine()
        {
            _handlebars = Handlebars.Create();
            RegisterCustomHelpers(_handlebars);
        }

        private static readonly object _compileLock = new();

        public async Task<string> RenderAsync(
            string templateHtml,
            object data,
            Dictionary<string, object?>? extraVariables = null,
            bool isBlindMode = false)
        {
            HandlebarsTemplate<object, object> compiled;
            string rendered;

            lock (_compileLock)
            {
                try
                {
                    compiled = _handlebars.Compile(templateHtml);
                }
                catch (Exception ex)
                {
                    // Resiliencia ante plantillas guardadas previamente en BD con sintaxis anidada legacy (default a (default b c))
                    try
                    {
                        var sanitizedHtml = System.Text.RegularExpressions.Regex.Replace(
                            templateHtml,
                            @"\(default\s+([^)]+)\)",
                            "$1"
                        );
                        compiled = _handlebars.Compile(sanitizedHtml);
                    }
                    catch
                    {
                        throw new InvalidOperationException(
                            $"Error al compilar plantilla DIITRA: {ex.Message}", ex);
                    }
                }

                var context = BuildContext(data, extraVariables, isBlindMode);
                rendered = compiled(context);
            }

            return await Task.FromResult(rendered);
        }

        private static object? CleanElement(JsonElement element)
        {
            if (element.ValueKind == JsonValueKind.Object)
            {
                var dict = new Dictionary<string, object?>();
                var keys = element.EnumerateObject().Select(p => p.Name).ToList();
                foreach (var prop in element.EnumerateObject())
                {
                    var name = prop.Name;
                    if (name.Length > 0 && char.IsLower(name[0]))
                    {
                        var hasPascal = keys.Any(k => k != name && string.Equals(k, name, StringComparison.OrdinalIgnoreCase) && k.Length > 0 && char.IsUpper(k[0]));
                        if (hasPascal)
                        {
                            continue;
                        }
                    }

                    var val = prop.Value;
                    if (val.ValueKind == JsonValueKind.String)
                    {
                        var strVal = val.GetString()?.Trim();
                        if (!string.IsNullOrEmpty(strVal) &&
                            ((strVal.StartsWith("[") && strVal.EndsWith("]")) ||
                              (strVal.StartsWith("{") && strVal.EndsWith("}"))))
                        {
                            try
                            {
                                using var nestedDoc = JsonDocument.Parse(strVal);
                                dict[name] = CleanElement(nestedDoc.RootElement);
                                continue;
                            }
                            catch
                            {
                                // Dejar el string original si falla
                            }
                        }
                    }

                    dict[name] = CleanElement(val);
                }
                return dict;
            }
            else if (element.ValueKind == JsonValueKind.Array)
            {
                var list = new List<object?>();
                foreach (var item in element.EnumerateArray())
                {
                    list.Add(CleanElement(item));
                }
                return list;
            }
            else
            {
                return ToNativeType(element);
            }
        }

        public static string CleanAndNormalizeJson(string json)
        {
            if (string.IsNullOrEmpty(json)) return json;

            // 1. Sanear errores comunes de "[object Object]"
            json = System.Text.RegularExpressions.Regex.Replace(
                json,
                @"\""([a-zA-Z0-9_]+)\""\s*:\s*\""\[object Object\]\""",
                "\"$1\":null",
                System.Text.RegularExpressions.RegexOptions.IgnoreCase
            );

            try
            {
                using var doc = JsonDocument.Parse(json);
                if (doc.RootElement.ValueKind != JsonValueKind.Object)
                {
                    return json;
                }

                var cleaned = CleanElement(doc.RootElement);
                return JsonSerializer.Serialize(cleaned);
            }
            catch
            {
                return json;
            }
        }

        private Dictionary<string, object?> BuildContext(
            object data,
            Dictionary<string, object?>? extraVariables,
            bool isBlindMode)
        {
            // 1. Serializar el DTO a JSON
            var json = JsonSerializer.Serialize(data, _jsonOptions);
            
            // Clean Yjs stringified nested values in the main JSON
            json = CleanAndNormalizeJson(json);
            
            // 2. Parsear a JsonDocument para navegar recursivamente
            using var doc = JsonDocument.Parse(json);
            var dict = ToNativeType(doc.RootElement) as Dictionary<string, object?> 
                       ?? new Dictionary<string, object?>();

            // 3. Fusionar datos y contenidos colaborativos en la raíz del contexto (resiliencia para campos dinámicos y directo en plantillas)
            if (dict.TryGetValue("data", out var dataVal) && dataVal is Dictionary<string, object?> nestedData)
            {
                foreach (var kv in nestedData)
                {
                    if (!dict.ContainsKey(kv.Key))
                    {
                        dict[kv.Key] = kv.Value;
                    }
                }
            }

            if (dict.TryGetValue("contenidocolaborativo", out var coworkVal) && coworkVal is Dictionary<string, object?> nestedCowork)
            {
                foreach (var kv in nestedCowork)
                {
                    // El contenido colaborativo editado puede sobrescribir datos base si coexisten
                    dict[kv.Key] = kv.Value;
                }
            }

            // Sincronizar alias de claves (PascalCase <-> snake_case) para resiliencia en plantillas Handlebars/Scriban
            void SyncKeyAlias(string k1, string k2)
            {
                object? val = null;
                if (dict.TryGetValue(k1, out var v1) && v1 != null && !string.IsNullOrWhiteSpace(v1.ToString()))
                {
                    val = v1;
                }
                else if (dict.TryGetValue(k2, out var v2) && v2 != null && !string.IsNullOrWhiteSpace(v2.ToString()))
                {
                    val = v2;
                }

                if (val != null)
                {
                    dict[k1] = val;
                    dict[k2] = val;
                }
            }

            SyncKeyAlias("ObjetivoGeneral", "objetivo_general");
            SyncKeyAlias("ObjetivosEspecificos", "objetivos_especificos");
            SyncKeyAlias("Antecedentes", "antecedentes");
            SyncKeyAlias("DescripcionProyecto", "descripcion_proyecto");
            SyncKeyAlias("Justificacion", "justificacion");
            SyncKeyAlias("MarcoTeorico", "marco_teorico");
            SyncKeyAlias("Metodologia", "metodologia");
            SyncKeyAlias("Evaluacion", "evaluacion");
            SyncKeyAlias("ObjetivosDesarrolloSostenible", "objetivos_desarrollo_sostenible");
            SyncKeyAlias("ods", "objetivos_desarrollo_sostenible");
            SyncKeyAlias("Cronograma", "cronograma");
            SyncKeyAlias("FechaInicio", "fecha_inicio");
            SyncKeyAlias("FechaFin", "fecha_fin");

            // Mapear alias de Objetivos de Desarrollo Sostenible (ods) para plantillas oficiales
            var ods1 = dict.TryGetValue("objetivos_desarrollo_sostenible", out var v1) ? v1?.ToString() : null;
            var ods2 = dict.TryGetValue("ods", out var v2) ? v2?.ToString() : null;
            var ods3 = dict.TryGetValue("ObjetivosDesarrolloSostenible", out var v3) ? v3?.ToString() : null;
            var ods4 = dict.TryGetValue("ODS", out var v4) ? v4?.ToString() : null;
            var finalOds = !string.IsNullOrWhiteSpace(ods1) ? ods1 
                         : (!string.IsNullOrWhiteSpace(ods2) ? ods2 
                         : (!string.IsNullOrWhiteSpace(ods3) ? ods3 : ods4));

            if (!string.IsNullOrWhiteSpace(finalOds))
            {
                dict["ods"] = finalOds;
                dict["ODS"] = finalOds;
                dict["objetivos_desarrollo_sostenible"] = finalOds;
                dict["ObjetivosDesarrolloSostenible"] = finalOds;
            }

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

            // Variables extra pasadas por el controlador/servicio (normalizadas a snake_case)
            if (extraVariables != null)
            {
                foreach (var kv in extraVariables)
                {
                    if (kv.Value != null)
                    {
                        var extraJson = JsonSerializer.Serialize(kv.Value, _jsonOptions);
                        var normalizedExtraJson = CleanAndNormalizeJson(extraJson);
                        using var extraDoc = JsonDocument.Parse(normalizedExtraJson);
                        dict[kv.Key] = ToNativeType(extraDoc.RootElement);
                    }
                    else
                    {
                        dict[kv.Key] = null;
                    }
                }
            }

            // Enmascarar datos personales en modo doble ciego (LOPDP + Peer Review)
            if (isBlindMode)
                ApplyBlindMask(dict);

            return dict;
        }

        /// <summary>
        /// Convierte una cadena en PascalCase o camelCase a snake_case (ej: LineaInvestigacion -> linea_investigacion).
        /// Esto es fundamental porque la UI del Frontend utiliza nombres de propiedades en PascalCase
        /// para el guardado de metadata, mientras que los archivos de plantilla HTML oficiales (como ProyectoInvestigacion.html)
        /// esperan variables en formato snake_case según el estándar Handlebars.
        /// </summary>
        private static string ToSnakeCase(string text)
        {
            if (string.IsNullOrEmpty(text)) return text;
            var sb = new System.Text.StringBuilder();
            for (int i = 0; i < text.Length; i++)
            {
                char c = text[i];
                if (i > 0 && char.IsUpper(c))
                {
                    if (text[i - 1] != '_')
                    {
                        sb.Append('_');
                    }
                }
                sb.Append(char.ToLower(c));
            }
            return sb.ToString();
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
                        var value = ToNativeType(prop.Value);
                        
                        // 0. Guardar la clave exacta original (ej: MultiSec_block-1785266742689_0)
                        dict[prop.Name] = value;

                        // 1. Guardar la versión en minúsculas (ej: lineainvestigacion) para retrocompatibilidad
                        //    con plantillas antiguas o dinámicas que accedan a la propiedad sin guiones bajos.
                        dict[prop.Name.ToLower()] = value;

                        // 2. Guardar la versión en snake_case (ej: linea_investigacion) para que coincida con las
                        //    etiquetas de las plantillas oficiales y los bucles/iteradores (como {{#each recursos_necesarios}}).
                        var snakeKey = ToSnakeCase(prop.Name);
                        if (!dict.ContainsKey(snakeKey))
                        {
                            dict[snakeKey] = value;
                        }
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
                "nombre_autor", "cedula_autor", "nombre_tutor", "nombre_rector",
                "director_proyecto", "directorproyecto", "nombre_director_firma",
                "nombre_coordinador_firma", "director_nombre", "coordinador_nombre",
                "responsable",
                "carrera", "carreras_coejecutoras", "programa", "grupo_investigacion", "grupo_investigacion_nombre"
            };

            // El título del proyecto no debe ser anonimizado según el CACES, ya que es fundamental para evaluar coherencia e impacto.

            ApplyBlindMaskRecursive(data, fieldsToMask);
        }

        private static void ApplyBlindMaskRecursive(object? obj, HashSet<string> fieldsToMask)
        {
            if (obj == null) return;

            if (obj is Dictionary<string, object?> dict)
            {
                var keys = new List<string>(dict.Keys);
                foreach (var key in keys)
                {
                    var val = dict[key];
                    if (fieldsToMask.Contains(key))
                    {
                        dict[key] = "[ RESERVADO — PROCESO DOBLE CIEGO ]";
                    }
                    else
                    {
                        ApplyBlindMaskRecursive(val, fieldsToMask);
                    }
                }
            }
            else if (obj is System.Collections.IList list)
            {
                foreach (var item in list)
                {
                    ApplyBlindMaskRecursive(item, fieldsToMask);
                }
            }
        }

        private static System.Collections.IEnumerable? GetEnumerableProperty(object? item, params string[] keys)
        {
            if (item == null || item.GetType().Name == "UndefinedBindingResult") return null;

            if (item is System.Collections.IEnumerable directEnum && !(item is string) && !(item is System.Collections.IDictionary))
            {
                return directEnum;
            }

            if (item is Dictionary<string, object?> dict)
            {
                foreach (var k in keys)
                {
                    if (dict.TryGetValue(k, out var val) && val is System.Collections.IEnumerable en && !(val is string))
                        return en;
                    var lowerK = k.ToLower();
                    if (dict.TryGetValue(lowerK, out var valLower) && valLower is System.Collections.IEnumerable enLower && !(valLower is string))
                        return enLower;
                }
            }
            else if (item is System.Collections.IDictionary idict)
            {
                foreach (var k in keys)
                {
                    if (idict.Contains(k) && idict[k] is System.Collections.IEnumerable en && !(idict[k] is string))
                        return en;
                    var lowerK = k.ToLower();
                    if (idict.Contains(lowerK) && idict[lowerK] is System.Collections.IEnumerable enLower && !(idict[lowerK] is string))
                        return enLower;
                }
            }
            else if (item is JsonElement elem && elem.ValueKind == JsonValueKind.Object)
            {
                foreach (var k in keys)
                {
                    if (elem.TryGetProperty(k, out var prop) && prop.ValueKind == JsonValueKind.Array)
                        return prop.EnumerateArray().Select(ToNativeType).ToList();
                    if (elem.TryGetProperty(k.ToLower(), out var propLower) && propLower.ValueKind == JsonValueKind.Array)
                        return propLower.EnumerateArray().Select(ToNativeType).ToList();
                }
            }
            else
            {
                var type = item.GetType();
                foreach (var k in keys)
                {
                    var prop = type.GetProperty(k, System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.IgnoreCase);
                    if (prop != null)
                    {
                        var val = prop.GetValue(item);
                        if (val is System.Collections.IEnumerable en && !(val is string))
                            return en;
                    }
                }
            }
            return null;
        }

        private static string GetProperty(object? item, string key)
        {
            if (item == null || item.GetType().Name == "UndefinedBindingResult") return string.Empty;
            if (item is Dictionary<string, object?> dict)
            {
                if (dict.TryGetValue(key, out var val))
                    return val?.ToString() ?? string.Empty;
                if (dict.TryGetValue(key.ToLower(), out var valLower))
                    return valLower?.ToString() ?? string.Empty;
            }
            if (item is System.Collections.IDictionary idict)
            {
                if (idict.Contains(key)) return idict[key]?.ToString() ?? string.Empty;
                var lowerKey = key.ToLower();
                if (idict.Contains(lowerKey)) return idict[lowerKey]?.ToString() ?? string.Empty;
            }
            var type = item.GetType();
            var prop = type.GetProperty(key, System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.IgnoreCase);
            if (prop != null)
            {
                return prop.GetValue(item)?.ToString() ?? string.Empty;
            }
            return string.Empty;
        }
    }
}
