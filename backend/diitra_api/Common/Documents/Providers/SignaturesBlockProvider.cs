using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using System.Threading;
using diitra_infrastructure.data.models;

namespace diitra_api.Controllers
{
    public class SignaturesBlockProvider : IDocumentBlockProvider
    {
        public string BlockType => "signatures";

        public void PopulateSchema(
            JsonElement block, 
            Dictionary<string, object> schemaDict, 
            List<string> listsList,
            List<object> richTextFields,
            ref int premiumFieldsCount,
            string templateCode)
        {
            var dynamicSignatures = new Dictionary<string, string>();

            // Intentar extraer firmantes configurados en el maquetador visual
            bool hasCustomSignatories = false;
            if (block.TryGetProperty("config", out var configProp) && 
                configProp.TryGetProperty("signatories", out var sigsProp) && 
                sigsProp.ValueKind == JsonValueKind.Array)
            {
                var sigsList = sigsProp.EnumerateArray().ToList();
                for (int i = 0; i < sigsList.Count; i++)
                {
                    var sig = sigsList[i];
                    var role = sig.TryGetProperty("role", out var roleProp) ? roleProp.GetString() ?? "Firmante" : "Firmante";
                    dynamicSignatures[$"Firmante_{i}_Nombre"] = "";
                    dynamicSignatures[$"Firmante_{i}_Cargo"] = role;
                }
                hasCustomSignatories = sigsList.Count > 0;
            }

            if (templateCode == "PROTOCOLO_INVESTIGACION" || !hasCustomSignatories)
            {
                // Fallback clásico
                schemaDict["FirmasResponsabilidad"] = new Dictionary<string, string> {
                    { "DirectorNombre", "" },
                    { "DirectorCargo", "Director del Proyecto" },
                    { "CoordinadorNombre", "" },
                    { "CoordinadorCargo", "Coordinador de Carrera" }
                };
            }
            else
            {
                schemaDict["FirmasResponsabilidad"] = dynamicSignatures;
            }

            if (!schemaDict.ContainsKey("Bibliografia"))
            {
                schemaDict["Bibliografia"] = "";
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
            // Extraer firmantes para pasar al frontend
            var signatoriesList = new List<object>();
            if (block.TryGetProperty("config", out var configProp) && 
                configProp.TryGetProperty("signatories", out var sigsProp) && 
                sigsProp.ValueKind == JsonValueKind.Array)
            {
                foreach (var sig in sigsProp.EnumerateArray())
                {
                    var label = sig.TryGetProperty("label", out var l) ? l.GetString() ?? "Firmante:" : "Firmante:";
                    var namePlaceholder = sig.TryGetProperty("name", out var n) ? n.GetString() ?? "" : "";
                    var role = sig.TryGetProperty("role", out var r) ? r.GetString() ?? "" : "";
                    signatoriesList.Add(new { label, name = namePlaceholder, role });
                }
            }

            if (templateCode == "PROTOCOLO_INVESTIGACION")
            {
                if (!sectionsList.Any(s => s.Id == "bibliografia"))
                {
                    sectionsList.Add(new UiSectionDto {
                        Id = "bibliografia",
                        Label = "Bibliografía & Firmas",
                        IconName = "Library",
                        ComponentName = "BibliographySection",
                        Config = new {
                            signatories = signatoriesList.ToArray()
                        }
                    });
                }
            }
            else
            {
                if (!sectionsList.Any(s => s.Id == "firmas_dinamicas"))
                {
                    sectionsList.Add(new UiSectionDto {
                        Id = "firmas_dinamicas",
                        Label = string.IsNullOrEmpty(title) ? "Firmas de Responsabilidad" : title,
                        IconName = "PenLine",
                        ComponentName = "BibliographySection",
                        Config = new {
                            isBibliographyHidden = true,
                            title = string.IsNullOrEmpty(title) ? "Firmas de Responsabilidad" : title,
                            signatories = signatoriesList.ToArray()
                        }
                    });
                }
            }
            return Task.CompletedTask;
        }
    }
}
