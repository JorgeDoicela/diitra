using diitra_application.Research;
using diitra_application.Research.Dtos;
using diitra_infrastructure.data.models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace diitra_api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize] // Ajustar roles según sea necesario
public partial class GroupsController : ControllerBase
{
    private readonly IGroupsService _groupsService;
    private readonly DiitraContext _context;
    private readonly IGroupDocumentOrchestrator _groupDocumentOrchestrator;

    public GroupsController(
        IGroupsService groupsService, 
        DiitraContext context,
        IGroupDocumentOrchestrator groupDocumentOrchestrator)
    {
        _groupsService = groupsService;
        _context = context;
        _groupDocumentOrchestrator = groupDocumentOrchestrator;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? search, [FromQuery] string? memberCedula)
    {
        var userSigafiId = GetCurrentUserReference();
        var isAdmin = IsAdminUser();
        var groups = await _groupsService.GetAllAsync(search, userSigafiId, isAdmin, memberCedula);
        return Ok(groups);
    }

    [HttpGet("{uuid}")]
    public async Task<IActionResult> GetByUuid(string uuid)
    {
        var group = await _groupsService.GetByUuidAsync(uuid);
        if (group == null) return NotFound();
        return Ok(group);
    }

    [HttpGet("public")]
    [AllowAnonymous]
    public async Task<IActionResult> GetPublicGroups([FromQuery] string? search)
    {
        var groups = await _groupsService.GetPublicGroupsAsync(search);
        return Ok(groups);
    }

    [HttpGet("public/{uuid}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetPublicGroupByUuid(string uuid)
    {
        var group = await _groupsService.GetPublicGroupByUuidAsync(uuid);
        if (group == null) return NotFound();
        return Ok(group);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateGroupDto dto)
    {
        try 
        {
            var solicitanteNombre = User.FindFirst(ClaimTypes.Name)?.Value ?? User.FindFirst("nombre")?.Value;

            var isAdmin = User.IsInRole("DIITRA_ADMIN");
            if (!isAdmin)
            {
                dto.Estado = "Pendiente";
                if (string.IsNullOrEmpty(dto.IdProfesorCoordinador))
                {
                    dto.IdProfesorCoordinador = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                }
            }
            
            var group = await _groupsService.CreateAsync(dto, solicitanteNombre);
            return CreatedAtAction(nameof(GetByUuid), new { uuid = group.Uuid }, group);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message, detail = ex.InnerException?.Message });
        }
    }

    [HttpPut("{uuid}")]
    public async Task<IActionResult> Update(string uuid, [FromBody] CreateGroupDto dto)
    {
        try
        {
            var existingGroup = await _groupsService.GetByUuidAsync(uuid);
            if (existingGroup == null) return NotFound();

            if (!await CanManageGroupAsync(uuid))
            {
                return StatusCode(403, new { message = "No tienes permisos para modificar este grupo de investigación." });
            }

            var solicitanteNombre = User.FindFirst(ClaimTypes.Name)?.Value ?? User.FindFirst("nombre")?.Value;

            var isAdmin = User.IsInRole("DIITRA_ADMIN");
            if (!isAdmin)
            {
                dto.Estado = "Pendiente";
                if (string.IsNullOrEmpty(dto.IdProfesorCoordinador))
                {
                    dto.IdProfesorCoordinador = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                }
            }

            var group = await _groupsService.UpdateAsync(uuid, dto, solicitanteNombre);
            return Ok(group);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpDelete("{uuid}")]
    public async Task<IActionResult> Deactivate(string uuid)
    {
        if (!await CanManageGroupAsync(uuid))
        {
            return StatusCode(403, new { message = "No tienes permisos para realizar esta acción sobre el grupo." });
        }

        var userIdRef = User.FindFirstValue(ClaimTypes.NameIdentifier);
        bool isAdmin = User.IsInRole("DIITRA_ADMIN");

        if (isAdmin)
        {
            var result = await _groupsService.DeactivateAsync(uuid);
            if (!result) return NotFound();
            return NoContent();
        }
        else
        {
            var result = await _groupsService.DeleteAsync(uuid, userIdRef);
            if (!result) return NotFound();
            return Ok(new { message = "Propuesta de grupo enviada a la papelera" });
        }
    }

    [HttpPost("{uuid}/members")]
    public async Task<IActionResult> AddMember(string uuid, [FromBody] GroupMemberDto memberDto)
    {
        if (!await CanManageGroupAsync(uuid))
        {
            return StatusCode(403, new { message = "No tienes permisos para gestionar integrantes de este grupo." });
        }

        var result = await _groupsService.AddMemberAsync(uuid, memberDto);
        if (!result) return NotFound();
        return Ok();
    }

    [HttpDelete("members/{memberId}")]
    public async Task<IActionResult> RemoveMember(int memberId, [FromQuery] string? reason = null)
    {
        var groupUuid = await _context.InvGruposMiembros
            .Where(m => m.IdGrupoMiembro == memberId)
            .Select(m => m.IdGrupoNavigation.Uuid)
            .FirstOrDefaultAsync();

        if (string.IsNullOrEmpty(groupUuid))
        {
            return NotFound();
        }

        if (!await CanManageGroupAsync(groupUuid))
        {
            return StatusCode(403, new { message = "No tienes permisos para gestionar integrantes de este grupo." });
        }

        var result = await _groupsService.RemoveMemberAsync(memberId, reason);
        if (!result) return NotFound();
        return NoContent();
    }

    [HttpPatch("{uuid}/review")]
    [Authorize(Roles = "DIITRA_ADMIN")]
    public async Task<IActionResult> ReviewGroup(string uuid, [FromBody] ReviewGroupRequest request)
    {
        try
        {
            var result = await _groupsService.ReviewGroupAsync(uuid, request.Aprobado, request.GetResolucion());
            if (!result) return NotFound(new { message = "Grupo no encontrado" });
            return Ok(new { message = "Grupo revisado exitosamente" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPatch("{uuid}/start-review")]
    [Authorize(Roles = "DIITRA_ADMIN")]
    public async Task<IActionResult> StartReview(string uuid)
    {
        try
        {
            var result = await _groupsService.StartReviewAsync(uuid);
            if (!result) return NotFound(new { message = "Grupo no encontrado" });
            return Ok(new { message = "Revisión iniciada y grupo bloqueado" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPatch("{uuid}/cancel-review")]
    [Authorize(Roles = "DIITRA_ADMIN")]
    public async Task<IActionResult> CancelReview(string uuid)
    {
        try
        {
            var result = await _groupsService.CancelReviewAsync(uuid);
            if (!result) return NotFound(new { message = "Grupo no encontrado" });
            return Ok(new { message = "Revisión cancelada y grupo desbloqueado" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("{uuid}/proposal-document/pdf")]
    public async Task<IActionResult> GetProposalDocumentPdf(string uuid, [FromQuery] bool isDraft = false)
    {
        try
        {
            var requestedBy = User.FindFirst(ClaimTypes.Name)?.Value ?? User.FindFirst("nombre")?.Value ?? "Usuario";
            var result = await _groupDocumentOrchestrator.GenerateProposalDocumentAsync(uuid, requestedBy, isDraft);

            if (result?.PdfBytes == null || result.PdfBytes.Length == 0)
            {
                return StatusCode(500, new { message = "Error al generar el PDF de la propuesta de grupo." });
            }

            return File(result.PdfBytes, "application/pdf", $"Propuesta_Grupo_{uuid}.pdf");
        }
        catch (KeyNotFoundException knf)
        {
            return NotFound(new { message = knf.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message, detail = ex.InnerException?.Message });
        }
    }

    [HttpGet("{uuid}/proposal-document/data")]
    public async Task<IActionResult> GetProposalDocumentData(string uuid)
    {
        try
        {
            var data = await _groupDocumentOrchestrator.BuildGroupDocumentDataAsync(uuid);
            return Ok(data);
        }
        catch (KeyNotFoundException knf)
        {
            return NotFound(new { message = knf.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message, detail = ex.InnerException?.Message });
        }
    }
}

public class ReviewGroupRequest
{
    public bool Aprobado { get; set; }
    public string? Resolucion { get; set; }
    public string? ResolucionAprobacion { get; set; }

    public string? GetResolucion() =>
        !string.IsNullOrWhiteSpace(Resolucion)
            ? Resolucion
            : ResolucionAprobacion;
}

public partial class GroupsController
{
    private bool IsAdminUser() =>
        User.IsInRole("DIITRA_ADMIN");

    private string? GetCurrentUserReference() =>
        User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

    private async Task<bool> CanManageGroupAsync(string groupUuid)
    {
        if (IsAdminUser()) return true;

        var userRef = GetCurrentUserReference();
        if (string.IsNullOrEmpty(userRef)) return false;

        var userRefTrim = userRef.Trim();
        var group = await _groupsService.GetByUuidAsync(groupUuid);
        if (group == null) return false;

        if (group.Estado == "Aprobado" || group.Estado == "En Evaluación")
        {
            return false;
        }

        if (string.Equals(group.IdProfesorCoordinador?.Trim(), userRefTrim, StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        if (group.TeacherMemberCedulas != null &&
            group.TeacherMemberCedulas.Any(ced => string.Equals(ced.Trim(), userRefTrim, StringComparison.OrdinalIgnoreCase)))
        {
            return true;
        }

        return false;
    }
}

