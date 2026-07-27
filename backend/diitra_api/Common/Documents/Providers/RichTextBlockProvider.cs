using System.Collections.Generic;
using System.Text.Json;
using System.Threading.Tasks;
using System.Threading;
using diitra_infrastructure.data.models;

namespace diitra_api.Controllers
{
    public class RichTextBlockProvider : IDocumentBlockProvider
    {
        public string BlockType => "rich_text";

        public void PopulateSchema(
            JsonElement block, 
            Dictionary<string, object> schemaDict, 
            List<string> listsList,
            List<object> richTextFields,
            ref int premiumFieldsCount,
            string templateCode)
        {
            var id = block.TryGetProperty("id", out var idProp) ? idProp.GetString() ?? "" : "";
            var title = block.TryGetProperty("title", out var titleProp) ? titleProp.GetString() ?? "Sección" : "Sección";

            var varName = id.Replace("block-", "");
            varName = System.Globalization.CultureInfo.CurrentCulture.TextInfo.ToTitleCase(varName.ToLower());
            
            // Normalización a los casings esperados por TechnicalSection
            if (varName == "Marcoteorico" || varName == "Marco_teorico" || varName == "Marco") varName = "MarcoTeorico";
            if (varName == "Descripcionproyecto" || varName == "Descripcion_proyecto" || varName == "Descripcion") varName = "DescripcionProyecto";
            if (varName == "Objetivogeneral") varName = "ObjetivoGeneral"; 
            if (varName == "Objetivosespecificos") varName = "ObjetivosEspecificos";
            if (varName == "Objetivosdesarrollosostenible") varName = "ObjetivosDesarrolloSostenible";

            // Normalizaciones para Informe de Avance e Informe Final
            if (varName == "Conclusionesparciales" || varName == "Conclusiones_parciales") varName = "ConclusionesParciales";
            if (varName == "Resumenejecutivo" || varName == "Resumen_ejecutivo") varName = "ResumenEjecutivo";
            if (varName == "Cumplimientoobjetivos" || varName == "Cumplimiento_objetivos") varName = "CumplimientoObjetivos";
            if (varName == "Impactofinal" || varName == "Impacto_final") varName = "ImpactoFinal";
            if (varName == "Transferenciaconocimiento" || varName == "Transferencia_conocimiento") varName = "TransferenciaConocimiento";
            if (varName == "Bibliografiafinal" || varName == "Bibliografia_final") varName = "BibliografiaFinal";

            // Si es puramente numérico (como un timestamp auto-generado), le agregamos un prefijo de letras
            // para evitar colisiones de tipos de constructores en Yjs/ProseMirror en el frontend
            if (System.Text.RegularExpressions.Regex.IsMatch(varName, @"^\d+$"))
            {
                varName = "field_" + varName;
            }

            // Si es bibliografía, la dejamos para la sección final
            if (varName.ToLower() == "bibliografia" || varName == "field_bibliografia")
            {
                schemaDict["Bibliografia"] = "";
            }
            else
            {
                if (varName == "Antecedentes" || varName == "DescripcionProyecto" || varName == "Justificacion" || varName == "ObjetivoGeneral" || varName == "ObjetivosEspecificos" || varName == "MarcoTeorico" || varName == "Metodologia" || varName == "Evaluacion")
                {
                    premiumFieldsCount++;
                }

                schemaDict[varName] = "";
            }
        }

        public Task MapToUiSectionAsync(
            JsonElement block, 
            string title, 
            List<UiSectionDto> sectionsList,
            DiitraContext dbContext,
            string templateCode,
            CancellationToken ct)
        {
            var id = block.TryGetProperty("id", out var idProp) ? idProp.GetString() ?? "" : "";
            var titleText = block.TryGetProperty("title", out var titleProp) ? titleProp.GetString() ?? "Sección" : "Sección";

            var varName = id.Replace("block-", "");
            varName = System.Globalization.CultureInfo.CurrentCulture.TextInfo.ToTitleCase(varName.ToLower());
            
            // Aplicamos las mismas normalizaciones que en PopulateSchema
            if (varName == "Marcoteorico" || varName == "Marco_teorico" || varName == "Marco") varName = "MarcoTeorico";
            if (varName == "Descripcionproyecto" || varName == "Descripcion_proyecto" || varName == "Descripcion") varName = "DescripcionProyecto";
            if (varName == "Objetivogeneral") varName = "ObjetivoGeneral"; 
            if (varName == "Objetivosespecificos") varName = "ObjetivosEspecificos";
            if (varName == "Objetivosdesarrollosostenible") varName = "ObjetivosDesarrolloSostenible";
            if (varName == "Conclusionesparciales" || varName == "Conclusiones_parciales") varName = "ConclusionesParciales";
            if (varName == "Resumenejecutivo" || varName == "Resumen_ejecutivo") varName = "ResumenEjecutivo";
            if (varName == "Cumplimientoobjetivos" || varName == "Cumplimiento_objetivos") varName = "CumplimientoObjetivos";
            if (varName == "Impactofinal" || varName == "Impacto_final") varName = "ImpactoFinal";
            if (varName == "Transferenciaconocimiento" || varName == "Transferencia_conocimiento") varName = "TransferenciaConocimiento";
            if (varName == "Bibliografiafinal" || varName == "Bibliografia_final") varName = "BibliografiaFinal";

            if (System.Text.RegularExpressions.Regex.IsMatch(varName, @"^\d+$"))
            {
                varName = "field_" + varName;
            }

            if (varName.ToLower() == "bibliografia" || varName == "field_bibliografia")
            {
                return Task.CompletedTask;
            }

            // Agregamos una pestaña independiente para este bloque de texto enriquecido
            sectionsList.Add(new UiSectionDto {
                Id = varName,
                Label = titleText,
                IconName = "FileText",
                ComponentName = null, // AgnosticSection
                Config = new {
                    completionFields = new[] { varName },
                    fields = new[] {
                        new {
                            name = varName,
                            label = titleText,
                            type = "rich-text",
                            collaborative = true,
                            placeholder = $"Redacte la sección {titleText}..."
                        }
                    }
                }
            });

            return Task.CompletedTask;
        }
    }
}
