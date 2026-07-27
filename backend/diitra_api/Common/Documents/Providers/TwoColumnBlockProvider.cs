using System.Collections.Generic;
using System.Text.Json;
using System.Threading.Tasks;
using System.Threading;
using diitra_infrastructure.data.models;

namespace diitra_api.Controllers
{
    public class TwoColumnBlockProvider : IDocumentBlockProvider
    {
        public string BlockType => "two_column";
        public BlockBehavior Behavior => BlockBehavior.Configurable;

        public void PopulateSchema(
            JsonElement block, 
            Dictionary<string, object> schemaDict, 
            List<string> listsList,
            List<object> richTextFields,
            ref int premiumFieldsCount,
            string templateCode)
        {
            var id = block.TryGetProperty("id", out var idProp) ? idProp.GetString() ?? "" : "";
            var varName = id.Replace("block-", "");
            varName = System.Globalization.CultureInfo.CurrentCulture.TextInfo.ToTitleCase(varName.ToLower());
            if (System.Text.RegularExpressions.Regex.IsMatch(varName, @"^\d+$"))
            {
                varName = "field_" + varName;
            }

            string leftContent = "";
            string rightContent = "";

            if (block.TryGetProperty("config", out var configProp) && configProp.ValueKind == JsonValueKind.Object)
            {
                if (configProp.TryGetProperty("leftContent", out var lcProp) && lcProp.ValueKind == JsonValueKind.String)
                    leftContent = lcProp.GetString() ?? "";
                if (configProp.TryGetProperty("rightContent", out var rcProp) && rcProp.ValueKind == JsonValueKind.String)
                    rightContent = rcProp.GetString() ?? "";
            }

            schemaDict[varName + "Izquierda"] = leftContent;
            schemaDict[varName + "Derecha"] = rightContent;
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
            var titleText = block.TryGetProperty("title", out var titleProp) ? titleProp.GetString() ?? "Sección a Dos Columnas" : "Sección a Dos Columnas";

            var varName = id.Replace("block-", "");
            varName = System.Globalization.CultureInfo.CurrentCulture.TextInfo.ToTitleCase(varName.ToLower());
            if (System.Text.RegularExpressions.Regex.IsMatch(varName, @"^\d+$"))
            {
                varName = "field_" + varName;
            }

            string leftTitle = "Columna Izquierda";
            string rightTitle = "Columna Derecha";
            string leftHeaderStyle = "blue";
            string rightHeaderStyle = "blue";

            if (block.TryGetProperty("config", out var configProp))
            {
                if (configProp.TryGetProperty("leftTitle", out var ltProp))
                    leftTitle = ltProp.GetString() ?? "Columna Izquierda";
                if (configProp.TryGetProperty("rightTitle", out var rtProp))
                    rightTitle = rtProp.GetString() ?? "Columna Derecha";
                if (configProp.TryGetProperty("leftHeaderStyle", out var lhsProp))
                    leftHeaderStyle = lhsProp.GetString() ?? "blue";
                if (configProp.TryGetProperty("rightHeaderStyle", out var rhsProp))
                    rightHeaderStyle = rhsProp.GetString() ?? "blue";
            }

            sectionsList.Add(new UiSectionDto
            {
                Id = varName,
                Label = titleText,
                IconName = "Columns2",
                ComponentName = "AgnosticSection",
                Config = new
                {
                    completionFields = new[] { varName + "Izquierda", varName + "Derecha" },
                    layout = "two-column",
                    fields = new[]
                    {
                        new
                        {
                            name = varName + "Izquierda",
                            label = leftTitle,
                            type = "rich-text",
                            collaborative = true,
                            placeholder = "Redacte el contenido de la columna izquierda...",
                            headerStyle = leftHeaderStyle
                        },
                        new
                        {
                            name = varName + "Derecha",
                            label = rightTitle,
                            type = "rich-text",
                            collaborative = true,
                            placeholder = "Redacte el contenido de la columna derecha...",
                            headerStyle = rightHeaderStyle
                        }
                    }
                }
            });

            return Task.CompletedTask;
        }
    }
}
