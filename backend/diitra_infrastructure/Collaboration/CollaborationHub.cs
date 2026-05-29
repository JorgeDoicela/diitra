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
        private const string YjsLogMagic = "DYLG1";
        private static readonly byte[] YjsLogMagicBytes = System.Text.Encoding.ASCII.GetBytes(YjsLogMagic);
        private const byte FrameTypeDelta = 0x00;
        private const byte FrameTypeSnapshot = 0x01;

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
                             Context.User?.IsInRole("DIITRA_ADMIN") == true ||
                             Context.User?.IsInRole("ADMIN_SISTEMA") == true ||
                             Context.User?.IsInRole("DIRECTOR_INV") == true;

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

                var user = await _db.Users.FirstOrDefaultAsync(u => u.IdSigafi == username);
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
            }

            // 2. Seguridad Enterprise: Verificar si el documento ya está finalizado/firmado o es Doble Ciego
            var instance = await _db.DocumentInstances
                .AsNoTracking()
                .FirstOrDefaultAsync(i => i.Uuid == instanceUuid);

            bool isBlindMode = false;
            bool isReadOnly = instance != null && (int)instance.State >= 3;

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
            await Clients.OthersInGroup(documentId).SendAsync("UserJoined", userName, userRole);

            // 4. ESTRATEGIA ENTERPRISE: Enviar Snapshot (Estado Base) + Deltas
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
            if (deltaCount > 500)
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
            await Clients.Group(instanceUuid).SendAsync("SectionActivity", new {
                instanceUuid,
                sectionName,
                action,
                userName,
                timestamp = DateTime.UtcNow
            });
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
            // Cerrar la sesión de auditoría
            var sesion = await _db.InvCoworkSesiones
                .Where(s => s.SignalrConId == Context.ConnectionId && s.DesconectadoEn == null)
                .FirstOrDefaultAsync();

            if (sesion != null)
            {
                sesion.DesconectadoEn = DateTime.UtcNow;
                await _db.SaveChangesAsync();
                _logger.LogInformation(
                    "[DIITRA CoWork] {User} se desconectó del documento.",
                    sesion.NombreUsuario);
            }

            await base.OnDisconnectedAsync(exception);
        }

        // ─────────────────────────────────────────────────────────────
        // Persistencia Yjs: Fusiona el update con el estado almacenado
        // ─────────────────────────────────────────────────────────────

        private async Task PersistYjsUpdateAsync(string documentId, string updateBase64)
        {
            try
            {
                var updateBytes = Convert.FromBase64String(updateBase64);

                var doc = await _db.InvCoworkDocumentos
                    .FirstOrDefaultAsync(d => d.Uuid == documentId);

                if (doc == null)
                {
                    // Primera vez que se edita este documento
                    doc = new InvCoworkDocumento
                    {
                        Uuid = documentId,
                        EntidadTipo = "PROYECTO",
                        EntidadUuid = documentId,
                        CampoNombre = "contenido_principal",
                        YjsState = CreateLogWithSingleDelta(updateBytes),
                        Version = 1
                    };
                    _db.InvCoworkDocumentos.Add(doc);
                }
                else
                {
                    // Persistencia append-only: nunca sobrescribe el estado previo.
                    // Si hay estado legado, se preserva como snapshot base.
                    doc.YjsState = AppendDeltaToLog(doc.YjsState, updateBytes);
                    doc.Version++;
                    doc.ActualizadoEn = DateTime.UtcNow;
                }

                await _db.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(
                    "[DIITRA CoWork] No se pudo persistir el update de {DocumentId}: {Error}",
                    documentId, ex.Message);
                // El fallo de persistencia NO interrumpe la colaboración en curso
            }
        }

        private static List<byte[]> DecodeSyncUpdates(byte[] persistedBytes)
        {
            // Formato legado: tratar como un único estado base.
            if (!IsFramedLog(persistedBytes))
            {
                return new List<byte[]> { persistedBytes };
            }

            var frames = ReadFrames(persistedBytes);
            if (frames.Count == 0) return new List<byte[]>();

            // Si existe snapshot, usar el más reciente y solo los deltas posteriores.
            var lastSnapshotIndex = frames.FindLastIndex(f => f.FrameType == FrameTypeSnapshot);
            if (lastSnapshotIndex >= 0)
            {
                var result = new List<byte[]> { frames[lastSnapshotIndex].Payload };
                for (var i = lastSnapshotIndex + 1; i < frames.Count; i++)
                {
                    if (frames[i].FrameType == FrameTypeDelta)
                        result.Add(frames[i].Payload);
                }
                return result;
            }

            // Si no hay snapshot, reenviar todos los deltas en orden.
            return frames
                .Where(f => f.FrameType == FrameTypeDelta)
                .Select(f => f.Payload)
                .ToList();
        }

        private static byte[] CreateLogWithSingleDelta(byte[] delta)
        {
            return BuildLog(new List<(byte FrameType, byte[] Payload)>
            {
                (FrameTypeDelta, delta)
            });
        }

        private static byte[] AppendDeltaToLog(byte[]? existing, byte[] delta)
        {
            // Sin estado previo: nuevo log.
            if (existing == null || existing.Length == 0)
                return CreateLogWithSingleDelta(delta);

            // Estado legado: migrar a log preservando el blob previo como snapshot.
            if (!IsFramedLog(existing))
            {
                return BuildLog(new List<(byte FrameType, byte[] Payload)>
                {
                    (FrameTypeSnapshot, existing),
                    (FrameTypeDelta, delta)
                });
            }

            // Estado en formato log: anexar nuevo frame delta.
            var deltaFrame = BuildFrame(FrameTypeDelta, delta);
            var merged = new byte[existing.Length + deltaFrame.Length];
            Buffer.BlockCopy(existing, 0, merged, 0, existing.Length);
            Buffer.BlockCopy(deltaFrame, 0, merged, existing.Length, deltaFrame.Length);
            return merged;
        }

        private static bool IsFramedLog(byte[] data)
        {
            if (data.Length < YjsLogMagicBytes.Length) return false;
            for (var i = 0; i < YjsLogMagicBytes.Length; i++)
            {
                if (data[i] != YjsLogMagicBytes[i]) return false;
            }
            return true;
        }

        private static byte[] BuildLog(List<(byte FrameType, byte[] Payload)> frames)
        {
            var totalLength = YjsLogMagicBytes.Length + frames.Sum(f => 1 + 4 + f.Payload.Length);
            var result = new byte[totalLength];
            var offset = 0;
            Buffer.BlockCopy(YjsLogMagicBytes, 0, result, offset, YjsLogMagicBytes.Length);
            offset += YjsLogMagicBytes.Length;

            foreach (var frame in frames)
            {
                result[offset] = frame.FrameType;
                offset += 1;
                BinaryPrimitives.WriteInt32LittleEndian(result.AsSpan(offset, 4), frame.Payload.Length);
                offset += 4;
                Buffer.BlockCopy(frame.Payload, 0, result, offset, frame.Payload.Length);
                offset += frame.Payload.Length;
            }
            return result;
        }

        private static byte[] BuildFrame(byte frameType, byte[] payload)
        {
            var frame = new byte[1 + 4 + payload.Length];
            frame[0] = frameType;
            BinaryPrimitives.WriteInt32LittleEndian(frame.AsSpan(1, 4), payload.Length);
            Buffer.BlockCopy(payload, 0, frame, 5, payload.Length);
            return frame;
        }

        private static List<(byte FrameType, byte[] Payload)> ReadFrames(byte[] framedLog)
        {
            var frames = new List<(byte FrameType, byte[] Payload)>();
            if (!IsFramedLog(framedLog)) return frames;

            var offset = YjsLogMagicBytes.Length;
            while (offset + 5 <= framedLog.Length)
            {
                var frameType = framedLog[offset];
                offset += 1;

                var payloadLength = BinaryPrimitives.ReadInt32LittleEndian(framedLog.AsSpan(offset, 4));
                offset += 4;

                if (payloadLength < 0 || offset + payloadLength > framedLog.Length)
                    break;

                var payload = new byte[payloadLength];
                Buffer.BlockCopy(framedLog, offset, payload, 0, payloadLength);
                offset += payloadLength;
                frames.Add((frameType, payload));
            }

            return frames;
        }
    }

    public record HandshakeResponse(
        bool IsBlindMode,
        bool ReadOnly,
        string ServerTimestamp,
        int DeltaCount
    );
}
