using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using diitra_infrastructure.data.models.Cowork;

namespace diitra_infrastructure.data.models.Configurations;

public class DocumentInstanceConfiguration : IEntityTypeConfiguration<Diitra.Domain.Common.Documents.DocumentInstance>
{
    public void Configure(EntityTypeBuilder<Diitra.Domain.Common.Documents.DocumentInstance> entity)
    {
        entity.HasKey(e => e.Id);
        entity.ToTable("inv_documentos_instancias");
        entity.Property(e => e.Uuid).HasColumnName("uuid").HasMaxLength(36).IsRequired();
        entity.HasIndex(e => e.Uuid).IsUnique();
        entity.Property(e => e.TemplateCode).HasColumnName("template_code").HasMaxLength(100).IsRequired();
        entity.Property(e => e.TemplateVersion).HasColumnName("template_version").IsRequired();
        entity.Property(e => e.EntityUuid).HasColumnName("entity_uuid").HasMaxLength(36).IsRequired();
        entity.Property(e => e.EntityType).HasColumnName("entity_type").HasMaxLength(50).IsRequired().HasDefaultValue("Proyecto");
        entity.Property(e => e.Title).HasColumnName("titulo_instancia").HasMaxLength(255);
        entity.Property(e => e.State).HasColumnName("estado").IsRequired();
        entity.Property(e => e.CreatedAt).HasColumnName("created_at").IsRequired();
        entity.Property(e => e.UpdatedAt).HasColumnName("updated_at").IsRequired();
        entity.Property(e => e.CreatedBy).HasColumnName("created_by").HasMaxLength(100).IsRequired();
        entity.Property(e => e.FinalPdfPath).HasColumnName("final_pdf_path").HasMaxLength(512);
        entity.Property(e => e.FileHash).HasColumnName("file_hash").HasMaxLength(100);
        entity.Property(e => e.TraceabilityCode).HasColumnName("traceability_code").HasMaxLength(100);
        entity.Property(e => e.DataSnapshotJson).HasColumnName("data_snapshot_json").HasColumnType("longtext");
        entity.Property(e => e.IsFilePurged).HasColumnName("is_file_purged").HasDefaultValue(false).IsRequired();
        entity.Property(e => e.PurgedAt).HasColumnName("purged_at");
        entity.Property(e => e.PurgedBy).HasColumnName("purged_by").HasMaxLength(100);
    }
}

public class DocumentTemplateConfiguration : IEntityTypeConfiguration<Diitra.Domain.Common.Documents.DocumentTemplate>
{
    public void Configure(EntityTypeBuilder<Diitra.Domain.Common.Documents.DocumentTemplate> entity)
    {
        entity.HasKey(e => e.Id);
        entity.ToTable("inv_document_templates");
        entity.Property(e => e.Code).HasColumnName("code").HasMaxLength(100).IsRequired();
        entity.HasIndex(e => e.Code).IsUnique();
        entity.Property(e => e.Name).HasColumnName("name").HasMaxLength(255).IsRequired();
        entity.Property(e => e.Description).HasColumnName("description");
        entity.Property(e => e.HtmlContent).HasColumnName("html_content").HasColumnType("longtext").IsRequired();
        entity.Property(e => e.CustomCss).HasColumnName("custom_css").HasColumnType("longtext");
        entity.Property(e => e.Version).HasColumnName("version").IsRequired();
        entity.Property(e => e.Category).HasColumnName("category").IsRequired();
        entity.Property(e => e.RequiresLopdpClause).HasColumnName("requires_lopdp").IsRequired();
        entity.Property(e => e.SupportsBlindMode).HasColumnName("supports_blind_mode").IsRequired();
        entity.Property(e => e.RequiresTraceabilityCode).HasColumnName("requires_traceability").IsRequired();
        entity.Property(e => e.RequiresElectronicSignature).HasColumnName("requires_signature").IsRequired();
        entity.Property(e => e.SignatureType).HasColumnName("signature_type").HasMaxLength(50).HasDefaultValue("DIITRA").IsRequired();
        entity.Property(e => e.CollaborativeFieldsJson).HasColumnName("collaborative_fields_json");
        entity.Property(e => e.IsActive).HasColumnName("is_active").IsRequired();
        entity.Property(e => e.CreatedAt).HasColumnName("created_at").IsRequired();
        entity.Property(e => e.UpdatedAt).HasColumnName("updated_at").IsRequired();
        entity.Property(e => e.UpdatedBy).HasColumnName("updated_by").HasMaxLength(100);
    }
}

public class DocumentAuditEntryConfiguration : IEntityTypeConfiguration<Diitra.Domain.Common.Documents.DocumentAuditEntry>
{
    public void Configure(EntityTypeBuilder<Diitra.Domain.Common.Documents.DocumentAuditEntry> entity)
    {
        entity.HasKey(e => e.Id);
        entity.ToTable("inv_document_audit");
        entity.Property(e => e.TraceabilityCode).HasColumnName("traceability_code").HasMaxLength(100).IsRequired();
        entity.HasIndex(e => e.TraceabilityCode).IsUnique();
        entity.Property(e => e.TemplateCode).HasColumnName("template_code").HasMaxLength(100).IsRequired();
        entity.Property(e => e.TemplateVersion).HasColumnName("template_version").IsRequired();
        entity.Ignore(e => e.Category); 
        entity.Property(e => e.ProjectUuid).HasColumnName("project_uuid").HasMaxLength(36);
        entity.Property(e => e.EntityUuid).HasColumnName("entity_uuid").HasMaxLength(36);
        entity.Property(e => e.GeneratedBy).HasColumnName("generated_by").HasMaxLength(255).IsRequired();
        entity.Property(e => e.GeneratedAt).HasColumnName("generated_at").IsRequired();
        entity.Property(e => e.WasBlindMode).HasColumnName("was_blind_mode").IsRequired();
        entity.Property(e => e.FileName).HasColumnName("file_name").HasMaxLength(255).IsRequired();
        entity.Property(e => e.FileHash).HasColumnName("file_hash").HasMaxLength(100);
        entity.Property(e => e.DataSnapshotJson).HasColumnName("data_snapshot_json").HasColumnType("longtext");
    }
}

public class InvDocumentoSeccionMetadataConfiguration : IEntityTypeConfiguration<InvDocumentoSeccionMetadata>
{
    public void Configure(EntityTypeBuilder<InvDocumentoSeccionMetadata> entity)
    {
        entity.HasKey(e => e.IdMetadata).HasName("PRIMARY");
        entity.ToTable("inv_documentos_secciones_metadata");
        entity.HasIndex(e => new { e.DocumentoUuid, e.SeccionNombre }).IsUnique();
    }
}
