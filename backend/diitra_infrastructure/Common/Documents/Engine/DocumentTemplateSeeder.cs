using Diitra.Domain.Common.Documents;
using Microsoft.Extensions.Logging;
using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using diitra_infrastructure.data.models;

namespace Diitra.Infrastructure.Common.Documents.Engine
{
    /// <summary>
    /// Utilidad para sembrar y sincronizar el catálogo maestro de plantillas de documentos
    /// (DocumentTemplateRegistry) con la base de datos activa al arrancar la aplicación.
    /// </summary>
    public static class DocumentTemplateSeeder
    {
        public static async Task SeedTemplatesAsync(
            DiitraContext context, 
            ILogger logger)
        {
            var seedTemplates = DocumentTemplateRegistry.GetSeedTemplates().ToList();
            logger.LogInformation("DIITRA DocumentSeeder: Iniciando sincronización de {Count} plantillas semilla en la base de datos...", seedTemplates.Count);

            var dbSet = context.Set<DocumentTemplate>();

            foreach (var seed in seedTemplates)
            {
                var template = await dbSet.FirstOrDefaultAsync(t => t.Code == seed.Code);
                if (template == null)
                {
                    logger.LogInformation("DIITRA DocumentSeeder: Registrando plantilla semilla '{Code}' (\"{Name}\")...", seed.Code, seed.Name);
                    await dbSet.AddAsync(seed);
                }
                else if (seed.Version > template.Version || 
                         (seed.Version == template.Version && 
                          (seed.SupportsBlindMode != template.SupportsBlindMode || 
                           seed.RequiresLopdpClause != template.RequiresLopdpClause || 
                           seed.RequiresElectronicSignature != template.RequiresElectronicSignature)))
                {
                    logger.LogInformation("DIITRA DocumentSeeder: Sincronizando plantilla '{Code}' a v{Version} por diferencias en metadatos...", seed.Code, seed.Version);
                    template.SyncWithSeed(seed);
                    dbSet.Update(template);
                }
            }

            var affected = await context.SaveChangesAsync();
            if (affected > 0)
            {
                logger.LogInformation("DIITRA DocumentSeeder: Sincronización finalizada. Guardados {Count} cambios en base de datos.", affected);
            }
            else
            {
                logger.LogInformation("DIITRA DocumentSeeder: Sincronización finalizada. No se detectaron cambios.");
            }
        }
    }
}
