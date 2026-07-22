using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using System.Threading;
using diitra_infrastructure.data.models;

namespace diitra_api.Controllers
{
    public class ProjectEthicsReportBlockProvider : IDocumentBlockProvider
    {
        public string BlockType => "project_ethics_report";

        public void PopulateSchema(
            JsonElement block, 
            Dictionary<string, object> schemaDict, 
            List<string> listsList,
            List<object> richTextFields,
            ref int premiumFieldsCount,
            string templateCode)
        {
            schemaDict["JustificacionEtica"] = "";
            schemaDict["RiesgosIdentificados"] = "";
            schemaDict["MetodoConsentimiento"] = "";
            schemaDict["DictamenComite"] = "Aprobado sin observaciones";
            schemaDict["ObservacionesEspecificas"] = "";
            schemaDict["MiembrosFirmantes"] = new object[] { };

            if (!listsList.Contains("MiembrosFirmantes"))
                listsList.Add("MiembrosFirmantes");
        }

        public Task MapToUiSectionAsync(
            JsonElement block, 
            string title, 
            List<UiSectionDto> sectionsList,
            DiitraContext dbContext,
            string templateCode,
            CancellationToken ct)
        {
            if (!sectionsList.Any(s => s.Id == "evaluacion_comite"))
            {
                var fieldsList = new List<object>
                {
                    new { name = "JustificacionEtica", label = "Justificación Ética de la Investigación", type = "rich-text", collaborative = true, min = (int?)null, max = (int?)null, options = (string[]?)null, placeholder = "Describa el impacto ético sobre seres humanos, datos sensibles o animales..." },
                    new { name = "RiesgosIdentificados", label = "Identificación y Mitigación de Riesgos", type = "rich-text", collaborative = true, min = (int?)null, max = (int?)null, options = (string[]?)null, placeholder = "Especifique cualquier riesgo biológico, digital o social y cómo se resolverá..." },
                    new { name = "MetodoConsentimiento", label = "Mecanismo de Consentimiento Informado", type = "rich-text", collaborative = true, min = (int?)null, max = (int?)null, options = (string[]?)null, placeholder = "Detalle cómo se obtendrá el consentimiento firmado de los participantes..." },
                    new { name = "DictamenComite", label = "Dictamen Final de Comisión de Ética", type = "select", collaborative = false, min = (int?)null, max = (int?)null, options = new[] { "Aprobado sin observaciones", "Aprobado con sugerencias", "Rechazado" }, placeholder = (string?)null },
                    new { name = "ObservacionesEspecificas", label = "Observaciones y Requerimientos de Enmienda", type = "textarea", collaborative = false, min = (int?)null, max = (int?)null, options = (string[]?)null, placeholder = "Escriba cualquier directriz obligatoria que el equipo de investigadores deba aplicar..." }
                };

                sectionsList.Add(new UiSectionDto {
                    Id = "evaluacion_comite",
                    Label = string.IsNullOrEmpty(title) ? "Evaluación de Ética" : title,
                    IconName = "CheckSquare",
                    ComponentName = null, // AgnosticSection
                    Config = new {
                        referenceTemplateCode = "PROTOCOLO_INVESTIGACION",
                        fields = fieldsList.ToArray()
                    }
                });
            }
            return Task.CompletedTask;
        }
    }
}
