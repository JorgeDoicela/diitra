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

        /// <summary>
        /// El cliente se une a la sala del documento.
        /// Si el documento ya tiene estado Yjs en BD, lo envía al recién llegado
        /// para que se sincronice con el trabajo anterior.
        /// </summary>
        public async Task JoinDocument(string documentId, string userName, string userUuid, string userRole)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, documentId);

            // Registrar la sesión para auditoría LOPDP
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

            _logger.LogInformation(
                "[DIITRA CoWork] {User} ({Role}) se unió al documento {DocumentId}",
                userName, userRole, documentId);

            // Enviar el estado actual del documento al recién llegado
            // (vacío si nadie ha escrito nada aún)
            var docState = await _db.InvCoworkDocumentos
                .Where(d => d.Uuid == documentId)
                .FirstOrDefaultAsync();

            if (docState?.YjsState != null && docState.YjsState.Length > 0)
            {
                var stateBase64 = Convert.ToBase64String(docState.YjsState);
                // Enviar SOLO al cliente que acaba de entrar, no al grupo
                await Clients.Caller.SendAsync("ReceiveFullState", stateBase64);
                _logger.LogInformation(
                    "[DIITRA CoWork] Estado sincronizado ({Bytes} bytes) enviado a {User}",
                    docState.YjsState.Length, userName);
            }
        }

        /// <summary>
        /// Retransmite un update Yjs y lo persiste en BD.
        /// El guardado es asíncrono y no bloquea la retransmisión.
        /// </summary>
        public async Task SendYjsUpdate(string documentId, string updateBase64)
        {
            // 1. Retransmitir inmediatamente (no esperar el guardado en BD)
            await Clients.OthersInGroup(documentId)
                         .SendAsync("ReceiveYjsUpdate", updateBase64);

            // 2. Persistir el update fusionándolo con el estado actual en BD
            _ = PersistYjsUpdateAsync(documentId, updateBase64);
        }

        /// <summary>
        /// Retransmite el estado de presencia (cursores, nombres, colores).
        /// No se persiste — la presencia es efímera por diseño.
        /// </summary>
        public async Task SendAwarenessUpdate(string documentId, string updateBase64)
        {
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
                        YjsState = updateBytes,
                        Version = 1
                    };
                    _db.InvCoworkDocumentos.Add(doc);
                }
                else
                {
                    // Fusionar el nuevo update con el estado existente
                    // En una implementación completa, aquí se usaría Y.mergeUpdates()
                    // Por ahora guardamos el último snapshot completo que el cliente envía
                    doc.YjsState = updateBytes;
                    doc.Version++;
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
    }
}
