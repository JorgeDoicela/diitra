using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using diitra_infrastructure.data.models.Cowork;

namespace diitra_infrastructure.data.models.Configurations;

public class InvCoworkDocumentoConfiguration : IEntityTypeConfiguration<InvCoworkDocumento>
{
    public void Configure(EntityTypeBuilder<InvCoworkDocumento> entity)
    {
        entity.HasKey(e => e.IdDocumento);
        entity.ToTable("inv_cowork_documentos");
        entity.Property(e => e.Uuid).HasColumnName("uuid").HasMaxLength(100).IsRequired();
        entity.Property(e => e.EntidadTipo).HasColumnName("entidadTipo").HasMaxLength(50).IsRequired();
        entity.Property(e => e.EntidadUuid).HasColumnName("entidadUuid").HasMaxLength(100).IsRequired();
        entity.Property(e => e.CampoNombre).HasColumnName("campoNombre").HasMaxLength(100).IsRequired();
        entity.Property(e => e.YjsState).HasColumnName("yjsState");
        entity.Property(e => e.ContentHtml).HasColumnName("contentHtml");
        entity.Property(e => e.ContentJson).HasColumnName("contentJson");
        entity.Property(e => e.Version).HasColumnName("version").HasDefaultValue(0);
        entity.Property(e => e.CreadoEn).HasColumnName("creadoEn");
        entity.Property(e => e.ActualizadoEn).HasColumnName("actualizadoEn");
    }
}

public class InvCoworkUpdateConfiguration : IEntityTypeConfiguration<InvCoworkUpdate>
{
    public void Configure(EntityTypeBuilder<InvCoworkUpdate> entity)
    {
        entity.HasKey(e => e.IdUpdate);
        entity.ToTable("inv_cowork_updates");
        entity.Property(e => e.DocumentoUuid).HasColumnName("documentoUuid").HasMaxLength(100).IsRequired();
        entity.Property(e => e.UpdateData).HasColumnName("updateData").IsRequired();
        entity.Property(e => e.CreadoEn).HasColumnName("creadoEn");
    }
}

public class InvCoworkSesionConfiguration : IEntityTypeConfiguration<InvCoworkSesion>
{
    public void Configure(EntityTypeBuilder<InvCoworkSesion> entity)
    {
        entity.HasKey(e => e.IdSesion);
        entity.ToTable("inv_cowork_sesiones");
        entity.Property(e => e.DocumentoUuid).HasColumnName("documentoUuid").HasMaxLength(100).IsRequired();
        entity.Property(e => e.UsuarioUuid).HasColumnName("usuarioUuid").HasMaxLength(36).IsRequired();
        entity.Property(e => e.NombreUsuario).HasColumnName("nombreUsuario").HasMaxLength(255).IsRequired();
        entity.Property(e => e.RolUsuario).HasColumnName("rolUsuario").HasMaxLength(100).IsRequired();
        entity.Property(e => e.SignalrConId).HasColumnName("signalrConId").HasMaxLength(255);
        entity.Property(e => e.SeccionNombre).HasColumnName("seccionNombre").HasMaxLength(100);
        entity.Property(e => e.Accion).HasColumnName("accion").HasMaxLength(255);
        entity.Property(e => e.ConectadoEn).HasColumnName("conectadoEn");
        entity.Property(e => e.DesconectadoEn).HasColumnName("desconectadoEn");
    }
}

public class InvCollaborationCommentConfiguration : IEntityTypeConfiguration<InvCollaborationComment>
{
    public void Configure(EntityTypeBuilder<InvCollaborationComment> entity)
    {
        entity.HasKey(e => e.IdComentario).HasName("PRIMARY");
        entity.ToTable("inv_collaboration_comments");
        entity.HasIndex(e => e.DocumentoUuid);
    }
}
