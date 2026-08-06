using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using System.Threading;
using diitra_infrastructure.data.models;

namespace diitra_api.Controllers
{
    public class FinalReportWritingSectionBlockProvider : IDocumentBlockProvider
    {
        public string BlockType => "final_report_writing_section";
        public BlockBehavior Behavior => BlockBehavior.DataCapture;

        public void PopulateSchema(
            JsonElement block, 
            Dictionary<string, object> schemaDict, 
            List<string> listsList,
            List<object> richTextFields,
            ref int premiumFieldsCount,
            string templateCode)
        {
            int addedCount = 0;
            if (block.TryGetProperty("config", out var configProp) &&
                configProp.TryGetProperty("writingSections", out var sectionsProp) &&
                sectionsProp.ValueKind == JsonValueKind.Array &&
                sectionsProp.GetArrayLength() > 0)
            {
                foreach (var sec in sectionsProp.EnumerateArray())
                {
                    if (sec.TryGetProperty("enabled", out var en) && !en.GetBoolean()) continue;
                    
                    string fieldKey = "";
                    if (sec.TryGetProperty("fieldKey", out var fkProp)) fieldKey = fkProp.GetString() ?? "";
                    if (string.IsNullOrEmpty(fieldKey) && sec.TryGetProperty("id", out var idProp)) fieldKey = idProp.GetString() ?? "";

                    if (!string.IsNullOrEmpty(fieldKey))
                    {
                        schemaDict[fieldKey] = "";
                        addedCount++;
                    }
                }
            }

            if (addedCount == 0)
            {
                // Fallback a las 15 sub-secciones por defecto del Informe Final
                schemaDict["Indice"] = "";
                schemaDict["Resumen"] = "";
                schemaDict["Introduccion"] = "";
                schemaDict["Objetivos"] = "";
                schemaDict["Fundamentos"] = "";
                schemaDict["Metodos"] = "";
                schemaDict["Resultados"] = "";
                schemaDict["Productos"] = "";
                schemaDict["Impactos"] = "";
                schemaDict["Transferencia"] = "";
                schemaDict["InformeFinanciero"] = "";
                schemaDict["Conclusiones"] = "";
                schemaDict["Recomendaciones"] = "";
                schemaDict["Bibliografia"] = "";
                schemaDict["Anexos"] = "";
                addedCount = 15;
            }

            premiumFieldsCount += addedCount;
        }

        public Task MapToUiSectionAsync(
            JsonElement block, 
            string title, 
            List<UiSectionDto> sectionsList,
            DiitraContext dbContext,
            string templateCode,
            CancellationToken ct)
        {
            if (!sectionsList.Any(s => s.Id == "redaccion_informe_final"))
            {
                Dictionary<string, object>? configDict = null;
                if (block.TryGetProperty("config", out var configProp) && configProp.ValueKind == JsonValueKind.Object)
                {
                    try
                    {
                        configDict = JsonSerializer.Deserialize<Dictionary<string, object>>(configProp.GetRawText());
                    }
                    catch { }
                }

                if (configDict == null)
                {
                    configDict = new Dictionary<string, object>();
                }

                if (!configDict.ContainsKey("writingSections") && !configDict.ContainsKey("technicalSections"))
                {
                    var defaultSections = new object[]
                    {
                        new { id = "sec_indice", fieldKey = "Indice", numberPrefix = "2.", title = "ÍNDICE", placeholder = "Elaborar un índice detallado...", requirementText = "DETALLAR ÍNDICE DE CONTENIDO, TABLAS E IMÁGENES", enabled = true },
                        new { id = "sec_resumen", fieldKey = "Resumen", numberPrefix = "3.", title = "RESUMEN", placeholder = "(250-300 palabras, 3-4 párrafos)...", requirementText = "250-300 PALABRAS, 3-4 PÁRRAFOS", enabled = true },
                        new { id = "sec_introduccion", fieldKey = "Introduccion", numberPrefix = "4.", title = "INTRODUCCIÓN", placeholder = "(500-700 palabras, 5-7 párrafos)...", requirementText = "500-700 PALABRAS, APA 7ª", enabled = true },
                        new { id = "sec_objetivos", fieldKey = "Objetivos", numberPrefix = "5.", title = "OBJETIVO GENERAL Y OBJETIVOS ESPECÍFICOS", placeholder = "Escriba su objetivo general...", requirementText = "OBJETIVO GENERAL + ESPECÍFICOS", enabled = true },
                        new { id = "sec_fundamentos", fieldKey = "Fundamentos", numberPrefix = "6.", title = "FUNDAMENTOS", placeholder = "(EXTENSIÓN VARIABLE)...", requirementText = "EXTENSIÓN VARIABLE - APA 7ª", enabled = true },
                        new { id = "sec_metodos", fieldKey = "Metodos", numberPrefix = "7.", title = "MÉTODOS", placeholder = "(700-900 palabras, 5-8 párrafos)...", requirementText = "700-900 PALABRAS, 5-8 PÁRRAFOS", enabled = true },
                        new { id = "sec_resultados", fieldKey = "Resultados", numberPrefix = "8.", title = "RESULTADOS", placeholder = "(800-1200 palabras, 6-12 párrafos)...", requirementText = "800-1200 PALABRAS", enabled = true },
                        new { id = "sec_productos", fieldKey = "Productos", numberPrefix = "9.", title = "PRODUCTOS", placeholder = "(400-600 palabras, 4-6 párrafos)...", requirementText = "400-600 PALABRAS", enabled = true },
                        new { id = "sec_impactos", fieldKey = "Impactos", numberPrefix = "10.", title = "IMPACTOS", placeholder = "(500-800 palabras, 5-8 párrafos)...", requirementText = "500-800 PALABRAS", enabled = true },
                        new { id = "sec_transferencia", fieldKey = "Transferencia", numberPrefix = "11.", title = "TRANSFERENCIA DE RESULTADOS", placeholder = "(400-600 palabras, 4-6 párrafos)...", requirementText = "400-600 PALABRAS", enabled = true },
                        new { id = "sec_informe_financiero", fieldKey = "InformeFinanciero", numberPrefix = "12.", title = "INFORME FINANCIERO DE GASTOS", placeholder = "(Extensión variable)...", requirementText = "EXTENSIÓN VARIABLE", enabled = true },
                        new { id = "sec_conclusiones", fieldKey = "Conclusiones", numberPrefix = "13.", title = "CONCLUSIONES", placeholder = "(500-700 palabras, 5-7 párrafos)...", requirementText = "500-700 PALABRAS", enabled = true },
                        new { id = "sec_recomendaciones", fieldKey = "Recomendaciones", numberPrefix = "14.", title = "RECOMENDACIONES", placeholder = "(500-700 palabras, 5-7 párrafos)...", requirementText = "500-700 PALABRAS", enabled = true },
                        new { id = "sec_bibliografia", fieldKey = "Bibliografia", numberPrefix = "15.", title = "BIBLIOGRAFÍA", placeholder = "(Extensión variable)...", requirementText = "NORMAS APA 7ª EDICIÓN", enabled = true },
                        new { id = "sec_anexos", fieldKey = "Anexos", numberPrefix = "16.", title = "ANEXOS", placeholder = "(Extensión variable)...", requirementText = "DOCUMENTOS COMPLEMENTARIOS Y CAPTURAS", enabled = true }
                    };
                    configDict["writingSections"] = defaultSections;
                    configDict["technicalSections"] = defaultSections;
                }
                else if (configDict.ContainsKey("writingSections") && !configDict.ContainsKey("technicalSections"))
                {
                    configDict["technicalSections"] = configDict["writingSections"];
                }

                configDict["completionFields"] = new[] { "Resumen", "Introduccion", "Resultados", "Conclusiones" };

                sectionsList.Add(new UiSectionDto {
                    Id = "redaccion_informe_final",
                    Label = string.IsNullOrEmpty(title) ? "Plan de Redacción Informe Final" : title,
                    IconName = "FileText",
                    ComponentName = "TechnicalSection",
                    Config = configDict
                });
            }
            return Task.CompletedTask;
        }
    }
}
