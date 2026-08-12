using System.Collections.Generic;
using System.Text.Json;
using System.Threading.Tasks;
using System.Threading;
using diitra_infrastructure.data.models;

namespace diitra_api.Controllers
{
    /// <summary>
    /// Proveedor dinámico de bloque para el Acta de Dictamen de Arbitraje Consolidado.
    /// Define el esquema y las secciones UI interactivas para el dictamen final de la comisión.
    /// </summary>
    public class ArbitrationDictamenSectionBlockProvider : IDocumentBlockProvider
    {
        public string BlockType => "arbitration_dictamen_section";
        public BlockBehavior Behavior => BlockBehavior.DataCapture;

        public void PopulateSchema(
            JsonElement block, 
            Dictionary<string, object> schemaDict, 
            List<string> listsList,
            List<object> richTextFields,
            ref int premiumFieldsCount,
            string templateCode)
        {
            if (!schemaDict.ContainsKey("PuntajePromedioPonderado")) schemaDict["PuntajePromedioPonderado"] = 0;
            if (!schemaDict.ContainsKey("DictamenFinalResultado")) schemaDict["DictamenFinalResultado"] = "En Revisión";
            if (!schemaDict.ContainsKey("ObservacionesConsolidadasDirector")) schemaDict["ObservacionesConsolidadasDirector"] = "";
        }

        public Task MapToUiSectionAsync(
            JsonElement block, 
            string title, 
            List<UiSectionDto> sectionsList,
            DiitraContext dbContext,
            string templateCode,
            CancellationToken ct)
        {
            sectionsList.Add(new UiSectionDto
            {
                Id = "dictamen_arbitraje",
                Label = "Acta de Dictamen de Arbitraje",
                IconName = "Award",
                ComponentName = null, // Usa AgnosticSection
                Config = new
                {
                    completionFields = new[] { "DictamenFinalResultado" },
                    fields = new object[]
                    {
                        new
                        {
                            name = "ObservacionesConsolidadasDirector",
                            label = "Observaciones Consolidadas de la Dirección de Investigación",
                            type = "textarea",
                            collaborative = false,
                            placeholder = "Resolución y observaciones finales de la comisión..."
                        }
                    }
                }
            });

            return Task.CompletedTask;
        }
    }
}
