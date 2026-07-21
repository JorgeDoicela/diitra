using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using System.Threading;
using diitra_infrastructure.data.models;

namespace diitra_api.Controllers
{
    public class ImpactsBlockProvider : IDocumentBlockProvider
    {
        public string BlockType => "impacts";

        public void PopulateSchema(
            JsonElement block, 
            Dictionary<string, object> schemaDict, 
            List<string> listsList,
            List<object> richTextFields,
            ref int premiumFieldsCount,
            string templateCode)
        {
            schemaDict["ProductosEsperados"] = new object[] { };
            schemaDict["Impacto"] = new Dictionary<string, string> { 
                { "social", "" }, 
                { "cientifico", "" }, 
                { "economico", "" }, 
                { "politico", "" }, 
                { "ambiental", "" }, 
                { "otro", "" } 
            };

            if (!listsList.Contains("ProductosEsperados")) listsList.Add("ProductosEsperados");
        }

        public Task MapToUiSectionAsync(
            JsonElement block, 
            string title, 
            List<UiSectionDto> sectionsList,
            DiitraContext dbContext,
            string templateCode,
            CancellationToken ct)
        {
            if (!sectionsList.Any(s => s.Id == "impactos"))
            {
                sectionsList.Add(new UiSectionDto {
                    Id = "impactos",
                    Label = title,
                    IconName = "Target",
                    ComponentName = "ImpactSection",
                    Config = null
                });
            }
            return Task.CompletedTask;
        }
    }
}
