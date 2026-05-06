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

        public async Task JoinDocument(string documentId, string userName, string userUuid, string userRole)
        {
            documentId = documentId.ToLower().Trim();
            // 1. Extraer UUID de la instancia (formato: {instanceUuid}_{section})
            var instanceUuid = documentId.Split('_')[0];

            // 2. Seguridad Enterprise: Verificar si el documento ya está finalizado/firmado
            var instance = await _db.DocumentInstances
                .AsNoTracking()
                .FirstOrDefaultAsync(i => i.Uuid == instanceUuid);

            if (instance != null && (int)instance.State >= 3)
            {
                throw new HubException("Este documento está FINALIZADO Y FIRMADO. No se permiten más ediciones.");
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
            await Clients.OthersInGroup(documentId).SendAsync("UserJoined", userName, userRole);

            // 4. ESTRATEGIA ENTERPRISE: Enviar Snapshot (Estado Base) + Deltas (Historial Reciente)
            // Esto garantiza que el cliente siempre reconstruya el documento exacto.
            var updatesToSend = new List<string>();

            // 4.1 Cargar el Snapshot (Estado Canónico fusionado)
            var docSnapshot = await _db.InvCoworkDocumentos
                .AsNoTracking()
                .FirstOrDefaultAsync(d => d.Uuid == documentId);
            
            if (docSnapshot?.YjsState != null)
            {
                updatesToSend.Add(Convert.ToBase64String(docSnapshot.YjsState));
            }

            // 4.2 Cargar los Deltas acumulados desde el último snapshot
            var deltas = await _db.InvCoworkUpdates
                .AsNoTracking()
                .Where(u => u.DocumentoUuid == documentId)
                .OrderBy(u => u.IdUpdate)
                .Select(u => Convert.ToBase64String(u.UpdateData))
                .ToListAsync();
            
            updatesToSend.AddRange(deltas);

            await Clients.Caller.SendAsync("ReceiveUpdateHistory", updatesToSend);
        }

        /// <summary>
        /// Recibe una actualización incremental (Delta) de Yjs.
        /// Estrategia: Append-only en la tabla de updates para evitar colisiones.
        /// </summary>
        public async Task SendYjsUpdate(string documentId, string updateBase64)
        {
            documentId = documentId.ToLower().Trim();
            var instanceUuid = documentId.Split('_')[0];
            var instance = await _db.DocumentInstances
                .AsNoTracking()
                .FirstOrDefaultAsync(i => i.Uuid == instanceUuid);

            if (instance != null && (int)instance.State >= 3) return;

            // 1. Difusión inmediata a otros colaboradores
            await Clients.OthersInGroup(documentId).SendAsync("ReceiveYjsUpdate", updateBase64);

            // 2. Persistencia Append-Only (Profesional)
            var newUpdate = new InvCoworkUpdate
            {
                DocumentoUuid = documentId,
                UpdateData = Convert.FromBase64String(updateBase64)
            };
            
            _db.InvCoworkUpdates.Add(newUpdate);
            await _db.SaveChangesAsync();
        }

        /// <summary>
        /// ESTRATEGIA DE COMPACTACIÓN (Nivel Platinum): 
        /// El cliente envía el estado completo ya fusionado. El servidor reemplaza el snapshot
        /// y limpia el historial de deltas para mantener la base de datos esbelta y rápida.
        /// </summary>
        public async Task SubmitFullSnapshot(string documentId, string snapshotBase64)
        {
            var snapshotBytes = Convert.FromBase64String(snapshotBase64);

            // 1. Actualizar el estado canónico en el documento principal
            var doc = await _db.InvCoworkDocumentos.FirstOrDefaultAsync(d => d.Uuid == documentId);
            if (doc == null)
            {
                doc = new InvCoworkDocumento { 
                    Uuid = documentId, 
                    EntidadUuid = documentId.Split('_')[0],
                    CampoNombre = documentId.Contains('_') ? documentId.Split('_')[1] : "contenido"
                };
                _db.InvCoworkDocumentos.Add(doc);
            }
            doc.YjsState = snapshotBytes;
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

            if (doc != null)
            {
                doc.ContentHtml = html;
                doc.ContentJson = json;
                doc.ActualizadoEn = DateTime.UtcNow;
                await _db.SaveChangesAsync();

                _logger.LogInformation(
                    "[DIITRA CoWork] Snapshot de contenido guardado para {DocumentId} ({Bytes} chars)",
                    documentId, html.Length);
            }
        }

        /// <summary>
        /// Retransmite el estado de presencia (cursores, nombres, colores).
        /// No se persiste — la presencia es efímera por diseño.
        /// </summary>
        public async Task SendAwarenessUpdate(string documentId, string updateBase64)
        {
            documentId = documentId.ToLower().Trim();
            await Clients.OthersInGroup(documentId)
                         .SendAsync("ReceiveAwarenessUpdate", updateBase64);
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
}
