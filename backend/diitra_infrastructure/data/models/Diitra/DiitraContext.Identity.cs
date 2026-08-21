using Microsoft.EntityFrameworkCore;
using diitra_domain.Identity.Entities;

namespace diitra_infrastructure.data.models;

public partial class DiitraContext
{
    partial void OnModelCreatingIdentity(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("usuarios");

            entity.HasKey(e => e.IdUsuario);
            entity.Property(e => e.IdUsuario).HasColumnName("idUsuario").ValueGeneratedOnAdd();

            entity.Property(e => e.IdSigafi).HasMaxLength(20).HasColumnName("idSigafi");
            entity.Property(e => e.TablaSigafi).HasColumnType("enum('alumno','profesor','otros')").HasColumnName("tablaSigafi");
            entity.Property(e => e.Nombre).HasMaxLength(200).HasColumnName("nombre");
            entity.Property(e => e.Contrasenia).HasMaxLength(250).IsRequired().HasColumnName("contrasenia");
            entity.Property(e => e.Activo).HasColumnType("tinyint(4)").HasColumnName("activo").HasDefaultValueSql("'1'").HasSentinel(true);
            entity.Property(e => e.Administrador).HasColumnType("tinyint(4)").HasColumnName("administrador").HasDefaultValueSql("'0'").HasSentinel(false);
            
            // Nuevos campos de email y validación
            entity.Property(e => e.EmailInstitucional).HasMaxLength(100).HasColumnName("emailInstitucional");
            entity.Property(e => e.EmailValidado).HasColumnType("tinyint(4)").HasColumnName("emailValidado").HasDefaultValueSql("'0'").HasSentinel(false);
            entity.Property(e => e.HashEmailToken).HasMaxLength(255).HasColumnName("hashEmailToken");
            entity.Property(e => e.FechaEmailValidacion).HasColumnName("fechaEmailValidacion");
        });

        modelBuilder.Entity<Role>(entity =>
        {
            entity.HasKey(e => e.IdRol);
            entity.ToTable("rbac_rol");
            entity.Property(e => e.IdRol).HasColumnName("idRol");
            entity.Property(e => e.Nombre).HasMaxLength(255).IsRequired().HasColumnName("Nombre");
            entity.Property(e => e.CodigoRol).HasMaxLength(25).HasColumnName("codigo_rol").IsRequired();
            entity.Property(e => e.EsActivo).HasColumnType("tinyint(4)").HasColumnName("esActivo");
        });

        modelBuilder.Entity<UserRole>(entity =>
        {
            entity.HasKey(e => e.IdUsuarioRol);
            entity.ToTable("rbac_usuario_rol");
            entity.Property(e => e.IdUsuarioRol).HasColumnName("idUsuarioRol");
            entity.Property(e => e.IdUsuario).HasColumnName("idUsuario");
            entity.Property(e => e.IdRol).HasColumnName("idRol");
            entity.Property(e => e.EsActivo).HasColumnType("tinyint(4)").HasColumnName("esActivo");
            entity.Property(e => e.FechaCreacion).HasColumnName("fecha_creacion");
            entity.Property(e => e.FechaModificacion).HasColumnName("fecha_modificacion");

            entity.HasOne(d => d.User).WithMany(p => p.UserRoles)
                .HasPrincipalKey(u => u.IdUsuario)
                .HasForeignKey(d => d.IdUsuario).HasConstraintName("fk_ur_usuario");
            entity.HasOne(d => d.Role).WithMany(p => p.UserRoles)
                .HasForeignKey(d => d.IdRol).HasConstraintName("fk_ur_rol");
        });

        modelBuilder.Entity<SystemEntity>(entity =>
        {
            entity.HasKey(e => e.IdSistema);
            entity.ToTable("rbac_sistema");
            entity.Property(e => e.IdSistema).HasColumnName("idSistema");
            entity.Property(e => e.Codigo).HasMaxLength(20).IsRequired().HasColumnName("codigo");
            entity.Property(e => e.Detalle).HasMaxLength(50).IsRequired().HasColumnName("detalle");
        });

        modelBuilder.Entity<IdentityModule>(entity =>
        {
            entity.HasKey(e => e.IdModulos);
            entity.ToTable("rbac_modulos");
            entity.Property(e => e.IdModulos).HasColumnName("idModulos");
            entity.Property(e => e.IdSistema).HasColumnName("id_sistema");
            entity.Property(e => e.Nombre).HasMaxLength(255).HasColumnName("Nombre");
            entity.Property(e => e.EsActivo).HasColumnType("tinyint(4)").HasColumnName("esActivo");

            entity.HasOne(d => d.Sistema).WithMany(p => p.Modulos)
                .HasForeignKey(d => d.IdSistema).HasConstraintName("fk_mod_sistema");
        });

        modelBuilder.Entity<IdentityOperation>(entity =>
        {
            entity.HasKey(e => e.IdOperaciones);
            entity.ToTable("rbac_operaciones");
            entity.Property(e => e.IdOperaciones).HasColumnName("idOperaciones");
            entity.Property(e => e.NombreOperacion).HasMaxLength(100).HasColumnName("NombreOperacion");
        });

        modelBuilder.Entity<ModuleOperation>(entity =>
        {
            entity.HasKey(e => e.IdModulosOperaciones);
            entity.ToTable("rbac_modulos_operaciones");
            entity.Property(e => e.IdModulosOperaciones).HasColumnName("idModulosOperaciones");
            entity.Property(e => e.IdModulos).HasColumnName("idModulos");
            entity.Property(e => e.IdOperaciones).HasColumnName("idOperaciones");
            entity.Property(e => e.FechaCreacion).HasColumnName("fecha_creacion").HasColumnType("date");
            entity.Property(e => e.FechaModificacion).HasColumnName("fecha_modificacion").HasColumnType("date");
            entity.Property(e => e.EsActivo).HasColumnType("tinyint(4)").HasColumnName("esActivo");

            entity.HasOne(d => d.Module).WithMany(p => p.ModuloOperations)
                .HasForeignKey(d => d.IdModulos).HasConstraintName("fk_mo_mod");
            entity.HasOne(d => d.Operation).WithMany(p => p.ModuloOperations)
                .HasForeignKey(d => d.IdOperaciones).HasConstraintName("fk_mo_oper");
        });

        modelBuilder.Entity<RoleModuleOperation>(entity =>
        {
            entity.HasKey(e => e.IdRolModuloOperacion);
            entity.ToTable("rbac_rol_modulo_operacion");
            entity.Property(e => e.IdRolModuloOperacion).HasColumnName("idRolModuloOperacion");
            entity.Property(e => e.IdModulosOperaciones).HasColumnName("idModulosOperaciones");
            entity.Property(e => e.IdRol).HasColumnName("idRol");
            entity.Property(e => e.FechaAsignacion).HasColumnName("fecha_asignacion").HasColumnType("date");
            entity.Property(e => e.FechaModificacion).HasColumnName("fecha_modificacion").HasColumnType("date");
            entity.Property(e => e.FechaDesactivacion).HasColumnName("fecha_desactivacion").HasColumnType("date");
            entity.Property(e => e.EsActivo).HasColumnType("tinyint(4)").HasColumnName("esActivo");

            entity.HasOne(d => d.ModuleOperation).WithMany(p => p.RoleModuleOperations)
                .HasForeignKey(d => d.IdModulosOperaciones).HasConstraintName("fk_rmo_mo");
            entity.HasOne(d => d.Role).WithMany(p => p.RoleModuleOperations)
                .HasForeignKey(d => d.IdRol).HasConstraintName("fk_rmo_rol");
        });

        modelBuilder.Entity<InvNotificacion>(entity =>
        {
            entity.HasKey(e => e.IdNotificacion).HasName("PRIMARY");
            entity.ToTable("inv_notificaciones");
            entity.Property(e => e.IdNotificacion).HasColumnName("idNotificacion");
            entity.Property(e => e.Uuid).HasColumnName("uuid").HasMaxLength(36).IsRequired();
            entity.HasIndex(e => e.Uuid).IsUnique().HasDatabaseName("uq_notif_uuid");
            entity.Property(e => e.IdProyecto).HasColumnName("idProyecto");
            entity.Property(e => e.Destinatario).HasColumnName("destinatario");
            entity.Property(e => e.TipoDestinatario).HasColumnName("tipoDestinatario").HasColumnType("enum('Usuario','Profesor','Alumno')").HasDefaultValueSql("'Usuario'");
            entity.Property(e => e.Categoria).HasColumnName("categoria").HasMaxLength(50).HasDefaultValueSql("'SISTEMA'");
            entity.Property(e => e.Prioridad).HasColumnName("prioridad").HasMaxLength(20).HasDefaultValueSql("'NORMAL'");
            entity.Property(e => e.Titulo).HasColumnName("titulo").HasMaxLength(255).IsRequired();
            entity.Property(e => e.Mensaje).HasColumnName("mensaje").HasColumnType("text");
            entity.Property(e => e.UrlAccion).HasColumnName("urlAccion").HasMaxLength(255);
            entity.Property(e => e.Leido).HasColumnName("leido").HasColumnType("tinyint(1)").HasDefaultValueSql("'0'").HasSentinel(false);
            entity.Property(e => e.FechaEnvio).HasColumnName("fechaEnvio").HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.FechaLectura).HasColumnName("fechaLectura");
            entity.Property(e => e.Version).HasColumnName("version").HasDefaultValueSql("'1'");

            entity.HasOne(d => d.IdProyectoNavigation).WithMany().HasForeignKey(d => d.IdProyecto).OnDelete(DeleteBehavior.SetNull).HasConstraintName("fk_notif_proyecto");
            entity.HasOne(d => d.DestinatarioNavigation).WithMany().HasForeignKey(d => d.Destinatario).OnDelete(DeleteBehavior.Restrict).HasConstraintName("fk_notif_usuario");
        });

        modelBuilder.Entity<AccessToken>(entity =>
        {
            entity.HasKey(e => e.IdToken).HasName("PRIMARY");
            entity.ToTable("inv_tokens_acceso");
            entity.Property(e => e.IdToken).HasColumnName("idToken");
            entity.Property(e => e.Uuid).HasColumnName("uuid").HasMaxLength(36).IsRequired();
            entity.HasIndex(e => e.Uuid).IsUnique().HasDatabaseName("uq_tokens_uuid");
            entity.Property(e => e.IdProyecto).HasColumnName("idProyecto");
            entity.Property(e => e.Token).HasColumnName("token").HasMaxLength(255).IsRequired();
            entity.HasIndex(e => e.Token).IsUnique();
            entity.Property(e => e.IdReferencia).HasColumnName("idReferencia");
            entity.Property(e => e.TipoReferencia).HasColumnName("tipoReferencia").HasMaxLength(50).HasDefaultValueSql("'Externo'");
            entity.Property(e => e.Scopes).HasColumnName("scopes").HasMaxLength(255);
            entity.Property(e => e.MaxUsos).HasColumnName("maxUsos").HasDefaultValueSql("'1'");
            entity.Property(e => e.UsosActuales).HasColumnName("usosActuales").HasDefaultValueSql("'0'");
            entity.Property(e => e.IpOrigen).HasColumnName("ipOrigen").HasMaxLength(50);
            entity.Property(e => e.Activo).HasColumnType("tinyint(1)").HasDefaultValueSql("'1'").HasSentinel(true);
            entity.Property(e => e.FechaRegistro).HasColumnName("fechaRegistro").HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.FechaExpiracion).HasColumnName("fechaExpiracion");
            entity.Property(e => e.Version).HasColumnName("version").HasDefaultValueSql("'1'");

            entity.HasOne(d => d.IdProyectoNavigation).WithMany().HasForeignKey(d => d.IdProyecto).OnDelete(DeleteBehavior.SetNull).HasConstraintName("fk_token_proyecto");
        });

        modelBuilder.Entity<InvUsuarioMetadata>(entity =>
        {
            entity.HasKey(e => e.IdMetadata).HasName("PRIMARY");
            entity.ToTable("inv_usuarios_metadata");
            entity.Property(e => e.IdMetadata).HasColumnName("idMetadata");
            entity.Property(e => e.Uuid).HasColumnName("uuid").HasMaxLength(36).IsRequired();
            entity.HasIndex(e => e.Uuid).IsUnique().HasDatabaseName("uq_usermeta_uuid");
            entity.Property(e => e.IdUsuario).HasColumnName("idUsuario");
            entity.Property(e => e.OrcidId).HasColumnName("orcidId").HasMaxLength(20);
            entity.Property(e => e.ScopusId).HasColumnName("scopusId").HasMaxLength(30);
            entity.Property(e => e.GoogleScholarUrl).HasColumnName("googleScholarUrl").HasMaxLength(255);
            entity.Property(e => e.ResearchGateUrl).HasColumnName("researchGateUrl").HasMaxLength(255);
            entity.Property(e => e.Especialidad).HasColumnName("especialidad").HasColumnType("text");
            entity.Property(e => e.GradoAcademicoMaximo).HasColumnName("gradoAcademicoMaximo").HasMaxLength(100);
            entity.Property(e => e.AceptoTerminosFirma).HasColumnName("aceptoTerminosFirma").HasColumnType("tinyint(1)").HasDefaultValue(false);
            entity.Property(e => e.FechaConsentimientoFirma).HasColumnName("fechaConsentimientoFirma");
            entity.Property(e => e.Configuracion).HasColumnName("configuracion").HasColumnType("json");
            entity.Property(e => e.FechaRegistro).HasColumnName("fechaRegistro").HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.FechaUltimoAcceso).HasColumnName("fechaUltimoAcceso");
            entity.Property(e => e.Version).HasColumnName("version").HasDefaultValueSql("'1'");

            entity.HasOne(d => d.User).WithOne()
                .HasPrincipalKey<User>(u => u.IdUsuario)
                .HasForeignKey<InvUsuarioMetadata>(d => d.IdUsuario)
                .HasConstraintName("fk_usermeta_usuario");
        });

        modelBuilder.Entity<InvLopdpConsentimiento>(entity =>
        {
            entity.HasKey(e => e.IdConsentimiento).HasName("PRIMARY");
            entity.ToTable("inv_lopdp_consentimientos");
            entity.Property(e => e.IdConsentimiento).HasColumnName("idConsentimiento");
            entity.Property(e => e.Uuid).HasColumnName("uuid").HasMaxLength(36).IsRequired().HasConversion<string>();
            entity.HasIndex(e => e.Uuid).IsUnique();
            entity.Property(e => e.IdUsuario).HasColumnName("idUsuario");
            entity.Property(e => e.VersionPolitica).HasColumnName("versionPolitica").HasMaxLength(20).IsRequired();
            entity.Property(e => e.Canal).HasColumnName("canal").HasColumnType("enum('Web','Movil','Presencial')").HasDefaultValue("Web");
            entity.Property(e => e.FechaConsentimiento).HasColumnName("fechaConsentimiento").HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.IpDireccion).HasColumnName("ipDireccion").HasMaxLength(45);
            entity.Property(e => e.UserAgent).HasColumnName("userAgent").HasMaxLength(255);
            entity.Property(e => e.FirmaHash).HasColumnName("firmaHash").HasColumnType("text");
            entity.Property(e => e.Estado).HasColumnName("estado").HasColumnType("enum('Otorgado','Revocado')").HasDefaultValue("Otorgado");
            entity.Property(e => e.FechaRevocacion).HasColumnName("fechaRevocacion");

            entity.HasOne(d => d.User).WithMany()
                .HasForeignKey(d => d.IdUsuario).OnDelete(DeleteBehavior.Cascade).HasConstraintName("fk_consentimiento_usuario");
        });

        modelBuilder.Entity<InvLopdpAuditoriaDatos>(entity =>
        {
            entity.HasKey(e => e.IdAuditoriaDatos).HasName("PRIMARY");
            entity.ToTable("inv_lopdp_auditoria_datos");
            entity.Property(e => e.IdAuditoriaDatos).HasColumnName("idAuditoriaDatos");
            entity.Property(e => e.Uuid).HasColumnName("uuid").HasMaxLength(36).IsRequired().HasConversion<string>();
            entity.HasIndex(e => e.Uuid).IsUnique();
            entity.Property(e => e.IdUsuarioActor).HasColumnName("idUsuarioActor");
            entity.Property(e => e.IdUsuarioAfectado).HasColumnName("idUsuarioAfectado");
            entity.Property(e => e.TablaAfectada).HasColumnName("tablaAfectada").HasMaxLength(100).IsRequired();
            entity.Property(e => e.ColumnaAfectada).HasColumnName("columnaAfectada").HasMaxLength(100);
            entity.Property(e => e.Operacion).HasColumnName("operacion").HasColumnType("enum('LECTURA','ESCRITURA','ELIMINACION','DESCARGA')").IsRequired();
            entity.Property(e => e.Motivo).HasColumnName("motivo").HasMaxLength(255);
            entity.Property(e => e.IpDireccion).HasColumnName("ipDireccion").HasMaxLength(45);
            entity.Property(e => e.UserAgent).HasColumnName("userAgent").HasMaxLength(255);
            entity.Property(e => e.FechaAcceso).HasColumnName("fechaAcceso").HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.HasOne(d => d.UsuarioActor).WithMany()
                .HasForeignKey(d => d.IdUsuarioActor).OnDelete(DeleteBehavior.SetNull).HasConstraintName("fk_audit_datos_actor");
            
            entity.HasOne(d => d.UsuarioAfectado).WithMany()
                .HasForeignKey(d => d.IdUsuarioAfectado).OnDelete(DeleteBehavior.Cascade).HasConstraintName("fk_audit_datos_afectado");
        });

        modelBuilder.Entity<InvBackupLog>(entity =>
        {
            entity.HasKey(e => e.IdBackup).HasName("PRIMARY");
            entity.ToTable("inv_backup_logs");
            entity.Property(e => e.IdBackup).HasColumnName("idBackup");
            entity.Property(e => e.Uuid).HasColumnName("uuid").HasMaxLength(36).IsRequired().HasConversion<string>();
            entity.HasIndex(e => e.Uuid).IsUnique();
            entity.Property(e => e.FechaBackup).HasColumnName("fechaBackup").HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.Tipo).HasColumnName("tipo").HasColumnType("enum('Completo','BaseDatos','Archivos')").IsRequired();
            entity.Property(e => e.Destino).HasColumnName("destino").HasMaxLength(255).IsRequired();
            entity.Property(e => e.NombreArchivo).HasColumnName("nombreArchivo").HasMaxLength(255).IsRequired();
            entity.Property(e => e.TamanioBytes).HasColumnName("tamanioBytes").IsRequired();
            entity.Property(e => e.Estado).HasColumnName("estado").HasColumnType("enum('Exitoso','Fallido','En_Proceso')").HasDefaultValue("En_Proceso");
            entity.Property(e => e.HashVerificacion).HasColumnName("hashVerificacion").HasMaxLength(64);
            entity.Property(e => e.ErrorMensaje).HasColumnName("errorMensaje").HasColumnType("text");
            entity.Property(e => e.EjecutadoPor).HasColumnName("ejecutadoPor");

            entity.HasOne(d => d.Ejecutor).WithMany()
                .HasForeignKey(d => d.EjecutadoPor).OnDelete(DeleteBehavior.SetNull).HasConstraintName("fk_backup_ejecutor");
        });

        modelBuilder.Entity<InvAuditAdmin>(entity =>
        {
            entity.HasKey(e => e.IdAudit).HasName("PRIMARY");
            entity.ToTable("inv_audit_admin");
            entity.Property(e => e.IdAudit).HasColumnName("idAudit");
            entity.Property(e => e.IdUsuarioAdmin).HasColumnName("idUsuarioAdmin");
            entity.Property(e => e.IdUsuarioAfectado).HasColumnName("idUsuarioAfectado");
            entity.Property(e => e.Accion).HasColumnName("accion").HasMaxLength(100).IsRequired();
            entity.Property(e => e.Detalle).HasColumnName("detalle").HasColumnType("text");
            entity.Property(e => e.IpOrigen).HasColumnName("ipOrigen").HasMaxLength(45);
            entity.Property(e => e.Fecha).HasColumnName("fecha").HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.HasOne(d => d.UserAdmin).WithMany()
                .HasForeignKey(d => d.IdUsuarioAdmin).OnDelete(DeleteBehavior.Restrict).HasConstraintName("fk_audit_admin");
            entity.HasOne(d => d.UserAfectado).WithMany()
                .HasForeignKey(d => d.IdUsuarioAfectado).OnDelete(DeleteBehavior.Cascade).HasConstraintName("fk_audit_afectado");
        });

        modelBuilder.Entity<InvDispositivoToken>(entity =>
        {
            entity.HasKey(e => e.IdToken).HasName("PRIMARY");
            entity.ToTable("inv_dispositivos_tokens");
            entity.Property(e => e.IdToken).HasColumnName("idToken");
            entity.Property(e => e.IdUsuario).HasColumnName("idUsuario");
            entity.Property(e => e.DeviceToken).HasColumnName("deviceToken").HasMaxLength(512).IsRequired();
            entity.HasIndex(e => e.DeviceToken).IsUnique();
            entity.Property(e => e.Plataforma).HasColumnName("plataforma").HasMaxLength(20).HasDefaultValueSql("'Web'");
            entity.Property(e => e.UltimaSincronizacion).HasColumnName("ultimaSincronizacion").HasDefaultValueSql("CURRENT_TIMESTAMP").ValueGeneratedOnAddOrUpdate();

            entity.HasOne(d => d.IdUsuarioNavigation).WithMany()
                .HasForeignKey(d => d.IdUsuario).OnDelete(DeleteBehavior.Cascade).HasConstraintName("fk_token_usuario");
        });

        modelBuilder.Entity<InvMagicLink>(entity =>
        {
            entity.HasKey(e => e.IdMagicLink).HasName("PRIMARY");
            entity.ToTable("inv_magic_links");
            entity.Property(e => e.IdMagicLink).HasColumnName("id_magic_link");
            entity.Property(e => e.IdUsuario).HasColumnName("id_usuario");
            entity.Property(e => e.TokenHash).HasColumnName("token_hash").HasMaxLength(64).IsRequired();
            entity.Property(e => e.FechaCreacion).HasColumnName("fecha_creacion").HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.FechaExpiracion).HasColumnName("fecha_expiracion");
            entity.Property(e => e.Utilizado).HasColumnName("utilizado").HasColumnType("tinyint(1)");
            entity.Property(e => e.FechaUtilizado).HasColumnName("fecha_utilizado");
            entity.Property(e => e.IpCreacion).HasColumnName("ip_creacion").HasMaxLength(45);
            entity.Property(e => e.IpUtilizacion).HasColumnName("ip_utilizacion").HasMaxLength(45);
            entity.Property(e => e.UserAgent).HasColumnName("user_agent").HasMaxLength(255);
            entity.Property(e => e.CodigoPinHandoff).HasColumnName("codigo_pin_handoff").HasMaxLength(12);
            entity.Property(e => e.FechaExpiracionPin).HasColumnName("fecha_expiracion_pin");
            entity.Property(e => e.Proposito).HasColumnName("proposito").HasMaxLength(30).HasDefaultValue("MAGIC_LINK");

            entity.HasIndex(e => e.TokenHash).IsUnique();
            entity.HasIndex(e => e.CodigoPinHandoff);

            entity.HasOne(d => d.Usuario).WithMany()
                .HasForeignKey(d => d.IdUsuario)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("fk_magic_link_usuario");
        });

        modelBuilder.Entity<InvEmailTemplate>(entity =>
        {
            entity.HasKey(e => e.IdEmailTemplate).HasName("PRIMARY");
            entity.ToTable("inv_email_templates");
            entity.Property(e => e.IdEmailTemplate).HasColumnName("idEmailTemplate");
            entity.Property(e => e.Uuid).HasColumnName("uuid").HasMaxLength(36).IsRequired();
            entity.HasIndex(e => e.Uuid).IsUnique();
            entity.Property(e => e.Codigo).HasColumnName("codigo").HasMaxLength(100).IsRequired();
            entity.HasIndex(e => e.Codigo).IsUnique();
            entity.Property(e => e.Nombre).HasColumnName("nombre").HasMaxLength(255).IsRequired();
            entity.Property(e => e.Descripcion).HasColumnName("descripcion").HasColumnType("text");
            entity.Property(e => e.Asunto).HasColumnName("asunto").HasMaxLength(255).IsRequired();
            entity.Property(e => e.CuerpoHtml).HasColumnName("cuerpoHtml").HasColumnType("longtext").IsRequired();
            entity.Property(e => e.Activo).HasColumnName("activo").HasColumnType("tinyint(1)").HasDefaultValue(true);
            entity.Property(e => e.FechaCreado).HasColumnName("fechaCreado").HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.FechaActualizado).HasColumnName("fechaActualizado").HasDefaultValueSql("CURRENT_TIMESTAMP").ValueGeneratedOnAddOrUpdate();
        });

        modelBuilder.Entity<InvEmailHistorial>(entity =>
        {
            entity.HasKey(e => e.IdEmailHistorial).HasName("PRIMARY");
            entity.ToTable("inv_email_historial");
            entity.Property(e => e.IdEmailHistorial).HasColumnName("idEmailHistorial");
            entity.Property(e => e.Uuid).HasColumnName("uuid").HasMaxLength(36).IsRequired();
            entity.HasIndex(e => e.Uuid).IsUnique();
            entity.Property(e => e.Destinatario).HasColumnName("destinatario").HasMaxLength(255).IsRequired();
            entity.Property(e => e.IdUsuarioDestinatario).HasColumnName("idUsuarioDestinatario");
            entity.Property(e => e.Asunto).HasColumnName("asunto").HasMaxLength(255).IsRequired();
            entity.Property(e => e.Cuerpo).HasColumnName("cuerpo").HasColumnType("longtext").IsRequired();
            entity.Property(e => e.Estado).HasColumnName("estado").HasColumnType("enum('Pendiente','Enviado','Fallido','Rebotado')").HasDefaultValueSql("'Pendiente'");
            entity.Property(e => e.ErrorMensaje).HasColumnName("errorMensaje").HasColumnType("text");
            entity.Property(e => e.FechaEnvio).HasColumnName("fechaEnvio").HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.AdjuntosJson).HasColumnName("adjuntosJson").HasColumnType("json");
            entity.Property(e => e.MetadataJson).HasColumnName("metadataJson").HasColumnType("json");

            entity.HasOne(d => d.IdUsuarioDestinatarioNavigation).WithMany()
                .HasForeignKey(d => d.IdUsuarioDestinatario).OnDelete(DeleteBehavior.SetNull).HasConstraintName("fk_email_hist_usuario");
        });
    }
}
