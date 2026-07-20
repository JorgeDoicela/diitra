using Microsoft.EntityFrameworkCore;
using diitra_infrastructure.data.models.Configurations;

namespace diitra_infrastructure.data.models;

public partial class DiitraContext
{
    partial void OnModelCreatingDiitra(ModelBuilder modelBuilder)
    {
        // Catálogos e información maestra
        modelBuilder.ApplyConfiguration(new InvLineaInvestigacionConfiguration());
        modelBuilder.ApplyConfiguration(new InvProgramaConfiguration());
        modelBuilder.ApplyConfiguration(new InvDominioConfiguration());
        modelBuilder.ApplyConfiguration(new InvDominioCarreraConfiguration());
        modelBuilder.ApplyConfiguration(new InvSublineaConfiguration());
        modelBuilder.ApplyConfiguration(new InvTipoInvestigacionConfiguration());
        modelBuilder.ApplyConfiguration(new InvTipoConvocatoriaConfiguration());
        modelBuilder.ApplyConfiguration(new InvAgendaZonalConfiguration());
        modelBuilder.ApplyConfiguration(new InvOdsEjeConfiguration());
        modelBuilder.ApplyConfiguration(new InvOdsConfiguration());
        modelBuilder.ApplyConfiguration(new InvCatImpactoConfiguration());
        modelBuilder.ApplyConfiguration(new InvCatTipoProductoConfiguration());
        modelBuilder.ApplyConfiguration(new InvCatTipoEvidenciaConfiguration());
        modelBuilder.ApplyConfiguration(new InvEntidadExternaConfiguration());
        modelBuilder.ApplyConfiguration(new InvPndObjetivoConfiguration());

        // Ciclo de vida de Proyectos
        modelBuilder.ApplyConfiguration(new InvProyectoConfiguration());
        modelBuilder.ApplyConfiguration(new InvTrazabilidadProyectoConfiguration());
        modelBuilder.ApplyConfiguration(new InvProyectoCarreraConfiguration());
        modelBuilder.ApplyConfiguration(new InvProyectoDominioConfiguration());
        modelBuilder.ApplyConfiguration(new InvProyectoParticipanteConfiguration());
        modelBuilder.ApplyConfiguration(new InvObjetivoProyectoConfiguration());
        modelBuilder.ApplyConfiguration(new InvProyectoOdsConfiguration());
        modelBuilder.ApplyConfiguration(new InvRecursoDisponibleConfiguration());
        modelBuilder.ApplyConfiguration(new InvPresupuestoItemConfiguration());
        modelBuilder.ApplyConfiguration(new InvFinanciamientoConfiguration());
        modelBuilder.ApplyConfiguration(new InvProductoConfiguration());
        modelBuilder.ApplyConfiguration(new InvImpactoProyectoConfiguration());
        modelBuilder.ApplyConfiguration(new InvCronogramaConfiguration());
        modelBuilder.ApplyConfiguration(new InvBibliografiaProyectoConfiguration());
        modelBuilder.ApplyConfiguration(new InvInformeAvanceConfiguration());
        modelBuilder.ApplyConfiguration(new InvEvidenciaConfiguration());
        modelBuilder.ApplyConfiguration(new InvGastoConfiguration());
        modelBuilder.ApplyConfiguration(new InvTransferenciaConfiguration());
        modelBuilder.ApplyConfiguration(new InvProyectoMmlConfiguration());
        modelBuilder.ApplyConfiguration(new InvProyectoDocumentoAdjuntoConfiguration());

        // Convocatorias
        modelBuilder.ApplyConfiguration(new InvConvocatoriaConfiguration());
        modelBuilder.ApplyConfiguration(new InvRubricaConfiguration());
        modelBuilder.ApplyConfiguration(new InvRubricaCriterioConfiguration());

        // Revisiones por Pares
        modelBuilder.ApplyConfiguration(new InvRevisionesParesConfiguration());
        modelBuilder.ApplyConfiguration(new InvEvaluacionesDetalleConfiguration());

        // Motor de Documentos
        modelBuilder.ApplyConfiguration(new DocumentInstanceConfiguration());
        modelBuilder.ApplyConfiguration(new DocumentTemplateConfiguration());
        modelBuilder.ApplyConfiguration(new DocumentAuditEntryConfiguration());
        modelBuilder.ApplyConfiguration(new InvDocumentoSeccionMetadataConfiguration());

        // Trabajo Colaborativo (Cowork)
        modelBuilder.ApplyConfiguration(new InvCoworkDocumentoConfiguration());
        modelBuilder.ApplyConfiguration(new InvCoworkUpdateConfiguration());
        modelBuilder.ApplyConfiguration(new InvCoworkSesionConfiguration());
        modelBuilder.ApplyConfiguration(new InvCollaborationCommentConfiguration());

        // Calendario
        modelBuilder.ApplyConfiguration(new InvCalendarioEventoNormativoConfiguration());
        modelBuilder.ApplyConfiguration(new InvIcalTokenConfiguration());
        modelBuilder.ApplyConfiguration(new InvCalendarioAlertaEnviadaConfiguration());

        // Grupos de Investigación
        modelBuilder.ApplyConfiguration(new InvGrupoInvestigacionConfiguration());
        modelBuilder.ApplyConfiguration(new InvGrupoMiembroConfiguration());

        // Configuraciones de Workflow e Indicadores
        modelBuilder.ApplyConfiguration(new InvConfigIndicadorConfiguration());
        modelBuilder.ApplyConfiguration(new InvConfigWorkflowConfiguration());
    }
}
