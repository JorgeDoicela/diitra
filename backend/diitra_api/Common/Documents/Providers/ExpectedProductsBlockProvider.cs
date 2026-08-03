using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using System.Threading;
using diitra_infrastructure.data.models;

namespace diitra_api.Controllers
{
    public class ExpectedProductsBlockProvider : IDocumentBlockProvider
    {
        public string BlockType => "expected_products";
        public BlockBehavior Behavior => BlockBehavior.DataCapture;

        public void PopulateSchema(
            JsonElement block, 
            Dictionary<string, object> schemaDict, 
            List<string> listsList,
            List<object> richTextFields,
            ref int premiumFieldsCount,
            string templateCode)
        {
            schemaDict["ProductosEsperados"] = new object[] { };
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
            if (!sectionsList.Any(s => s.Id == "productos_esperados"))
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

                configDict["completionFields"] = new[] { "ProductosEsperados" };

                sectionsList.Add(new UiSectionDto {
                    Id = "productos_esperados",
                    Label = string.IsNullOrEmpty(title) ? "Productos Esperados" : title,
                    IconName = "Package",
                    ComponentName = "ImpactSection",
                    Config = configDict
                });
            }
            return Task.CompletedTask;
        }
    }
}
