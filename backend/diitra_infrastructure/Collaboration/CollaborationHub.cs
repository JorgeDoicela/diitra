// ═══════════════════════════════════════════════════════════════════
// DIITRA CoWork — SignalR Hub con Persistencia Yjs
//
// Este Hub hace dos cosas ahora:
//   1. RELAY: Retransmite updates de Yjs entre colaboradores (como antes).
//   2. PERSISTENCIA: Guarda el estado Yjs en BD para que:
//      - Los usuarios que llegan tarde reciban el documento completo.
//      - El contenido no se pierda si el servidor se reinicia.
//      - Quede registro de quién accedió (LOPDP Art. 26).
// ═══════════════════════════════════════════════════════════════════

using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Buffers.Binary;
using diitra_infrastructure.data.models;
using diitra_infrastructure.data.models.Cowork;

namespace diitra_infrastructure.Collaboration
{
    public class CollaborationHub : Hub
    {


        private readonly ILogger<CollaborationHub> _logger;
        private readonly DiitraContext _db;

        public CollaborationHub(ILogger<CollaborationHub> logger, DiitraContext db)
        {
            _logger = logger;
            _db = db;
        }

        public async Task<HandshakeResponse> JoinDocument(string documentId, string userName, string userUuid, string userRole)
        {
            documentId = documentId.ToLower().Trim();
            _logger.LogInformation("[HUB] User {User} joining: {Room}", userName, documentId);

            // 1. Extraer UUID de la instancia (formato: {instanceUuid}_{section})
            var instanceUuid = documentId.Split('_')[0];

            // 1.1 SEGURIDAD PLATINUM: Control de Acceso por Defensa en Profundidad
            var isHubAdmin = Context.User?.FindFirst("es_admin")?.Value == "true" ||
                             Context.User?.IsInRole("DIITRA_ADMIN") == true;

            if (!isHubAdmin)
            {
                var username = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? Context.User?.Identity?.Name;
                if (string.IsNullOrEmpty(username))
                {
                    username = userUuid; // Fallback para entornos de desarrollo locales
                }

                if (string.IsNullOrEmpty(username))
                {
                    throw new HubException("No autenticado o credenciales inválidas.");
                }

                var user = await _db.Users.FirstOrDefaultAsync(u => u.IdSigafi.Trim() == username.Trim());
                if (user == null)
                {
                    throw new HubException("Usuario no registrado en el sistema.");
                }

                string? projectUuid = null;
                var instanceToCheck = await _db.DocumentInstances
                    .AsNoTracking()
                    .FirstOrDefaultAsync(i => i.Uuid == instanceUuid);

                if (instanceToCheck != null)
                {
                    projectUuid = instanceToCheck.EntityUuid;
                }
                else
                {
                    var projectExists = await _db.InvProyectos.AnyAsync(p => p.Uuid == instanceUuid);
                    if (projectExists)
                    {
                        projectUuid = instanceUuid;
                    }
                }

                if (projectUuid != null)
                {
                    var project = await _db.InvProyectos.FirstOrDefaultAsync(p => p.Uuid == projectUuid);
                    if (project != null)
                    {
                        var isTeamMember = await _db.InvProyectosProfesores.AnyAsync(pp => pp.IdProyecto == project.IdProyecto && pp.IdUsuario == user.IdUsuario && pp.Activo != false) ||
                                           await _db.InvProyectosAlumnos.AnyAsync(pa => pa.IdProyecto == project.IdProyecto && pa.IdUsuario == user.IdUsuario && pa.Activo != false);

                        bool hasAccess = isTeamMember;

                        if (!hasAccess && project.TieneGrupo == true && project.IdGrupo.HasValue)
                        {
                            var isGroupMember = await _db.InvGruposMiembros
                                .AnyAsync(m => m.IdGrupo == project.IdGrupo.Value && m.IdUsuario == user.IdUsuario && m.Activo != false);
                            if (isGroupMember) hasAccess = true;
                        }

                        if (!hasAccess)
                        {
                            var isPeerReviewer = await _db.InvRevisionesPares
                                .AnyAsync(r => r.IdProyecto == project.IdProyecto && r.IdRevisor == user.IdUsuario);
                            if (isPeerReviewer) hasAccess = true;
                        }

                        if (!hasAccess)
                        {
                            _logger.LogWarning("[HUB] Access Denied: User {User} has no permissions for project {ProjectUuid}", username, projectUuid);
                            throw new HubException("No tienes permisos para unirte a esta sesión colaborativa.");
                        }
                    }
                }
                else
                {
                    var group = await _db.InvGruposInvestigacion
                        .Include(g => g.IdCoordinadorNavigation)
                        .FirstOrDefaultAsync(g => g.Uuid == instanceUuid);
                    if (group != null)
                    {
                        var isGroupMember = (group.IdCoordinador == user.IdUsuario) ||
                                            (group.IdCoordinadorNavigation != null && group.IdCoordinadorNavigation.IdSigafi.Trim() == username.Trim()) ||
                                            await _db.InvGruposMiembros.AnyAsync(m => m.IdGrupo == group.IdGrupo && m.IdUsuario == user.IdUsuario && (m.Activo != false || m.Activo == null));
                        if (!isGroupMember)
                        {
                            _logger.LogWarning("[HUB] Access Denied: User {User} has no permissions for group {GroupUuid}", username, instanceUuid);
                            throw new HubException("No tienes permisos para unirte a esta sesión colaborativa.");
                        }
                    }
                }
            }

            // 2. Seguridad: Verificar si el documento ya está finalizado/firmado o es Doble Ciego
            var instance = await _db.DocumentInstances
                .AsNoTracking()
                .FirstOrDefaultAsync(i => i.Uuid == instanceUuid);

            bool isBlindMode = false;
            bool isReadOnly = instance != null && (int)instance.State >= 3;
            bool isOversightObserver = false;

            if (isHubAdmin)
            {
                var observerId = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (!string.IsNullOrEmpty(observerId))
                {
                    var observerUser = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.IdSigafi == observerId);
                    if (observerUser != null)
                    {
                        string? observedProjectUuid = instance?.EntityUuid ?? instanceUuid;
                        var observedProject = await _db.InvProyectos.AsNoTracking()
                            .FirstOrDefaultAsync(p => p.Uuid == observedProjectUuid);

                        if (observedProject != null)
                        {
                            var isTeamMember = await _db.InvProyectosProfesores.AnyAsync(pp =>
                                    pp.IdProyecto == observedProject.IdProyecto
                                    && pp.IdUsuario == observerUser.IdUsuario
                                    && pp.Activo != false)
                                || await _db.InvProyectosAlumnos.AnyAsync(pa =>
                                    pa.IdProyecto == observedProject.IdProyecto
                                    && pa.IdUsuario == observerUser.IdUsuario
                                    && pa.Activo != false);

                            if (!isTeamMember)
                            {
                                // El admin no es miembro del equipo: modo supervisión (solo lectura).
                                // NOTA: No forzamos isReadOnly=true aquí porque el banner del editor
                                // mostraría incorrectamente "ya fue firmado". En su lugar marcamos
                                // isOversightObserver=true y el cliente recibe ReadOnly=true solo
                                // cuando el documento realmente ya está firmado (State >= 3).
                                // Para documentos en BORRADOR, el admin-observador puede leer
                                // sin el banner de firma falso.
                                isOversightObserver = true;
                                // isReadOnly permanece con el valor calculado por State (línea 138):
                                // true si State >= 3 (firmado), false si está en borrador.
                                userName = $"{userName} (Supervisión)";
                                userRole = "Observador";
                            }
                        }
                    }
                }
            }

            // 2.1 Lógica de Anonimización (Doble Ciego)
            var revision = await _db.InvRevisionesPares
                .AsNoTracking()
                .FirstOrDefaultAsync(r => r.Uuid == instanceUuid);

            if (revision != null && revision.EsDobleCiego)
            {
                isBlindMode = true;
                var originalName = userName;
                userName = userRole == "Revisor" ? "Revisor Anónimo" : "Investigador (Autor)";
                _logger.LogInformation("[HUB] Masking identity for {Original} -> {Anonymized} (Blind Mode)", originalName, userName);
            }

            // 3. Registrar auditoría de acceso (LOPDP)
            var sesion = new InvCoworkSesion
            {
                DocumentoUuid = documentId,
                UsuarioUuid = userUuid,
                NombreUsuario = userName,
                RolUsuario = userRole,
                SignalrConId = Context.ConnectionId,
                ConectadoEn = DateTime.UtcNow
            };
            _db.InvCoworkSesiones.Add(sesion);
            await _db.SaveChangesAsync();

            await Groups.AddToGroupAsync(Context.ConnectionId, documentId);
            await Groups.AddToGroupAsync(Context.ConnectionId, instanceUuid); // Grupo de Coordinación (Team Pulse)
            if (!isOversightObserver)
            {
                await Clients.OthersInGroup(documentId).SendAsync("UserJoined", userName, userRole);
            }

            // 4. ESTRATEGIA: Enviar Snapshot (Estado Base) + Deltas
            var updatesToSend = new List<byte[]>();

            var docSnapshot = await _db.InvCoworkDocumentos
                .AsNoTracking()
                .FirstOrDefaultAsync(d => d.Uuid == documentId);

            if (docSnapshot?.YjsState != null)
            {
                byte[] decompressedSnapshot = GZipHelper.Decompress(docSnapshot.YjsState);
                updatesToSend.Add(decompressedSnapshot);
            }

            var deltas = await _db.InvCoworkUpdates
                .AsNoTracking()
                .Where(u => u.DocumentoUuid == documentId)
                .OrderBy(u => u.IdUpdate)
                .Select(u => u.UpdateData)
                .ToListAsync();

            foreach (var deltaBytes in deltas)
            {
                byte[] decompressedDelta = GZipHelper.Decompress(deltaBytes);
                updatesToSend.Add(decompressedDelta);
            }

            _logger.LogInformation("[HUB] Sending {Count} history updates to {User}", updatesToSend.Count, userName);
            await Clients.Caller.SendAsync("ReceiveUpdateHistory", updatesToSend);

            return new HandshakeResponse(
                IsBlindMode: isBlindMode,
                ReadOnly: isReadOnly,
                IsOversightObserver: isOversightObserver,
                ServerTimestamp: DateTime.UtcNow.ToString("O"),
                DeltaCount: deltas.Count
            );
        }

        /// <summary>
        /// Recibe una actualización incremental (Delta) de Yjs.
        /// Estrategia: Append-only en la tabla de updates para evitar colisiones.
        /// </summary>
        public async Task SendYjsUpdate(string documentId, byte[] updateData)
        {
            documentId = documentId.ToLower().Trim();

            var instanceUuid = documentId.Split('_')[0];
            var instance = await _db.DocumentInstances
                .AsNoTracking()
                .FirstOrDefaultAsync(i => i.Uuid == instanceUuid);

            if (instance != null && (int)instance.State >= 3) return;

            // 1. Difusión inmediata a otros colaboradores (envío binario directo)
            await Clients.OthersInGroup(documentId).SendAsync("ReceiveYjsUpdate", updateData);

            // 2. Persistencia Append-Only con compresión GZip transparente
            byte[] compressedBytes = GZipHelper.Compress(updateData);

            var newUpdate = new InvCoworkUpdate
            {
                DocumentoUuid = documentId,
                UpdateData = compressedBytes
            };

            _db.InvCoworkUpdates.Add(newUpdate);
            await _db.SaveChangesAsync();

            // 3. Compactación reactiva automática asistida por el cliente
            var deltaCount = await _db.InvCoworkUpdates.CountAsync(u => u.DocumentoUuid == documentId);
            if (deltaCount > 150)
            {
                await Clients.Caller.SendAsync("TriggerCompaction");
            }
        }

        /// <summary>
        /// ESTRATEGIA DE COMPACTACIÓN (Nivel Platinum):
        /// El cliente envía el estado completo ya fusionado. El servidor reemplaza el snapshot
        /// y limpia el historial de deltas para mantener la base de datos esbelta y rápida.
        /// </summary>
        public async Task SubmitFullSnapshot(string documentId, byte[] snapshotBytes)
        {
            var compressedSnapshot = GZipHelper.Compress(snapshotBytes);

            // 1. Actualizar el estado canónico en el documento principal
            var doc = await _db.InvCoworkDocumentos.FirstOrDefaultAsync(d => d.Uuid == documentId);
            if (doc == null)
            {
                // documentId can be plain UUID (main doc) or UUID_FieldName (per-field rich-text)
                var separatorIdx = documentId.LastIndexOf('_');
                var entityUuid = separatorIdx >= 36 ? documentId.Substring(0, separatorIdx) : documentId;
                var campoNombre = separatorIdx >= 36 ? documentId.Substring(separatorIdx + 1) : "contenido";

                doc = new InvCoworkDocumento {
                    Uuid = documentId,
                    EntidadUuid = entityUuid,
                    CampoNombre = campoNombre
                };
                _db.InvCoworkDocumentos.Add(doc);
            }
            doc.YjsState = compressedSnapshot;
            doc.ActualizadoEn = DateTime.UtcNow;

            // 2. COMPACTACIÓN: Eliminar todos los deltas previos ya que están incluidos en el snapshot
            var oldUpdates = _db.InvCoworkUpdates.Where(u => u.DocumentoUuid == documentId);
            _db.InvCoworkUpdates.RemoveRange(oldUpdates);

            await _db.SaveChangesAsync();
            _logger.LogInformation("[DIITRA CoWork] Compactación exitosa para {DocumentId}. Historial de deltas reiniciado.", documentId);
        }

        /// <summary>
        /// Recibe el contenido final (HTML/JSON) renderizado por el cliente.
        /// Esto es vital para que el Motor de Documentos (Builder) pueda generar
        /// el PDF oficial sin necesidad de un parser Yjs en el servidor.
        /// </summary>
        public async Task SubmitFinalContent(string documentId, string html, string json)
        {
            var doc = await _db.InvCoworkDocumentos
                .FirstOrDefaultAsync(d => d.Uuid == documentId);

            if (doc == null)
            {
                // documentId can be plain UUID (main doc) or UUID_FieldName (per-field rich-text)
                var separatorIdx = documentId.LastIndexOf('_');
                var entityUuid = separatorIdx >= 36 ? documentId.Substring(0, separatorIdx) : documentId;
                var campoNombre = separatorIdx >= 36 ? documentId.Substring(separatorIdx + 1) : "contenido";

                doc = new InvCoworkDocumento
                {
                    Uuid = documentId,
                    EntidadUuid = entityUuid,
                    CampoNombre = campoNombre,
                    EntidadTipo = "PROYECTO",
                    Version = 1,
                    CreadoEn = DateTime.UtcNow
                };
                _db.InvCoworkDocumentos.Add(doc);
            }

            doc.ContentHtml = html;
            doc.ContentJson = json;
            doc.ActualizadoEn = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            _logger.LogInformation(
                "[DIITRA CoWork] Snapshot de contenido guardado para {DocumentId} ({Bytes} chars)",
                documentId, html?.Length ?? 0);
        }

        /// <summary>
        /// Retransmite el estado de presencia (cursores, nombres, colores).
        /// No se persiste — la presencia es efímera por diseño.
        /// </summary>
        public async Task SendAwarenessUpdate(string documentId, byte[] updateData)
        {
            documentId = documentId.ToLower().Trim();
            await Clients.OthersInGroup(documentId)
                         .SendAsync("ReceiveAwarenessUpdate", updateData);
        }

        // ── COORDINACIÓN DE EQUIPO (Team Pulse) ──────────────────────────────

        /// <summary>
        /// Notifica actividad en una sección específica (ej: "Usuario X está escribiendo en Resumen").
        /// Se difunde a todos los miembros de la instancia del documento (no solo de la sección).
        /// </summary>
        public async Task NotifySectionActivity(string instanceUuid, string sectionName, string action, string userName)
        {
            // 1. Broadcast en tiempo real
            await Clients.Group(instanceUuid).SendAsync("SectionActivity", new {
                instanceUuid,
                sectionName,
                action,
                userName,
                timestamp = DateTime.UtcNow
            });

            // 2. PERSISTENCIA: guardar visita a sección para que sobreviva recargas.
            try
            {
                var ahora = DateTime.UtcNow;

                // Cerrar visitas anteriores abiertas del mismo usuario en esta sección / documento
                var anteriores = await _db.InvCoworkSesiones
                    .Where(s => s.DocumentoUuid == instanceUuid &&
                                s.NombreUsuario == userName &&
                                s.SeccionNombre != null &&
                                !s.DesconectadoEn.HasValue)
                    .ToListAsync();
                foreach (var ant in anteriores)
                    ant.DesconectadoEn = ahora;

                // Recuperar la sesión base de esta conexión para heredar el Rol y UUID de usuario real
                var baseSesion = await _db.InvCoworkSesiones
                    .AsNoTracking()
                    .FirstOrDefaultAsync(s => s.SignalrConId == Context.ConnectionId && s.SeccionNombre == null);

                var userUuid = baseSesion?.UsuarioUuid ?? Context.UserIdentifier ?? "anon";
                var rol = baseSesion?.RolUsuario ?? "Investigador";

                // Registrar nueva visita
                _db.InvCoworkSesiones.Add(new InvCoworkSesion
                {
                    DocumentoUuid = instanceUuid,
                    UsuarioUuid   = userUuid,
                    NombreUsuario = userName,
                    RolUsuario    = rol,
                    SignalrConId  = Context.ConnectionId,
                    SeccionNombre = sectionName.ToUpper(),
                    Accion        = action,
                    ConectadoEn   = ahora
                });

                await _db.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogWarning("[DIITRA CoWork] No se pudo persistir SectionActivity: {Msg}", ex.Message);
                // Best-effort: el broadcast ya se realizó
            }
        }

        /// <summary>
        /// Actualiza el estado de una sección y lo notifica en tiempo real.
        /// Persiste tanto el UUID como el nombre del usuario para trazabilidad sin joins adicionales.
        /// DocumentoUuid = instanceUuid (no incluye el nombre de sección) para que GetPulse
        /// y GetProjectActivity lo encuentren correctamente con una sola clave.
        /// </summary>
        public async Task UpdateSectionStatus(string instanceUuid, string sectionName, string status, string userUuid, string userName = "")
        {
            // CORRECCIÓN: Usar instanceUuid puro como DocumentoUuid.
            // La unicidad del registro se garantiza por (DocumentoUuid, SeccionNombre).
            var meta = await _db.InvDocumentosSeccionesMetadata
                .FirstOrDefaultAsync(m => m.DocumentoUuid == instanceUuid && m.SeccionNombre == sectionName);

            if (meta == null)
            {
                meta = new InvDocumentoSeccionMetadata
                {
                    DocumentoUuid = instanceUuid,
                    SeccionNombre = sectionName
                };
                _db.InvDocumentosSeccionesMetadata.Add(meta);
            }

            meta.Estado = status;
            meta.UltimoUsuarioUuid = userUuid;
            meta.UltimoNombreUsuario = string.IsNullOrEmpty(userName) ? null : userName;
            meta.ActualizadoEn = DateTime.UtcNow;

            await _db.SaveChangesAsync();

            // Notificar a todo el equipo incluyendo el nombre para evitar re-consultas en el cliente
            await Clients.Group(instanceUuid).SendAsync("SectionStatusUpdated", new {
                instanceUuid,
                sectionName,
                status,
                updatedBy = userUuid,
                updatedByName = userName,
                updatedAt = meta.ActualizadoEn
            });
        }

        /// <summary>
        /// Publica un comentario y lo retransmite a todo el equipo.
        /// </summary>
        public async Task PostComment(string instanceUuid, string userUuid, string userName, string content, int? parentId = null)
        {
            var comment = new InvCollaborationComment
            {
                DocumentoUuid = instanceUuid,
                UsuarioUuid = userUuid,
                NombreUsuario = userName,
                Contenido = content,
                IdPadre = parentId
            };

            _db.InvCollaborationComments.Add(comment);
            await _db.SaveChangesAsync();

            await Clients.Group(instanceUuid).SendAsync("NewCommentReceived", new {
                idComentario = comment.IdComentario,
                usuarioUuid = comment.UsuarioUuid,
                nombreUsuario = comment.NombreUsuario,
                contenido = comment.Contenido,
                idPadre = comment.IdPadre,
                creadoEn = comment.CreadoEn
            });
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            // Cerrar TODAS las sesiones abiertas para esta conexión (sesión base + sesiones de sección)
            var sesiones = await _db.InvCoworkSesiones
                .Where(s => s.SignalrConId == Context.ConnectionId && s.DesconectadoEn == null)
                .ToListAsync();

            if (sesiones.Any())
            {
                var ahora = DateTime.UtcNow;
                string? baseUuid = null;

                foreach (var sesion in sesiones)
                {
                    var duracion = (ahora - sesion.ConectadoEn).TotalSeconds;
                    var esSesionTecnica = string.IsNullOrWhiteSpace(sesion.SeccionNombre)
                                          && string.IsNullOrWhiteSpace(sesion.Accion);

                    if (esSesionTecnica && duracion < 5)
                    {
                        // Ruido técnico de React Strict Mode (~1-2s) → eliminar
                        _db.InvCoworkSesiones.Remove(sesion);
                        _logger.LogDebug(
                            "[DIITRA CoWork] Sesión efímera ({Sec:F0}s) de {User} eliminada (ruido React).",
                            duracion, sesion.NombreUsuario);
                    }
                    else
                    {
                        // Sesión real → cerrar con timestamp
                        sesion.DesconectadoEn = ahora;
                        baseUuid ??= sesion.DocumentoUuid.Split('_')[0];
                        _logger.LogInformation(
                            "[DIITRA CoWork] {User} se desconectó de {Doc} ({Sec:F0}s).",
                            sesion.NombreUsuario, sesion.DocumentoUuid, duracion);
                    }
                }

                await _db.SaveChangesAsync();

                // Auto-poda: mantener solo los últimos 100 registros por documento
                if (baseUuid != null)
                {
                    var pattern = baseUuid + "%";
                    var totalSesiones = await _db.InvCoworkSesiones
                        .CountAsync(s => EF.Functions.Like(s.DocumentoUuid, pattern));

                    if (totalSesiones > 100)
                    {
                        var exceso = await _db.InvCoworkSesiones
                            .Where(s => EF.Functions.Like(s.DocumentoUuid, pattern)
                                     && s.DesconectadoEn.HasValue)
                            .OrderBy(s => s.ConectadoEn)
                            .Take(totalSesiones - 100)
                            .ToListAsync();
                        _db.InvCoworkSesiones.RemoveRange(exceso);
                        await _db.SaveChangesAsync();
                    }
                }
            }

            await base.OnDisconnectedAsync(exception);
        }


    }

    public record HandshakeResponse(
        bool IsBlindMode,
        bool ReadOnly,
        bool IsOversightObserver,
        string ServerTimestamp,
        int DeltaCount
    );
}
