using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using diitra_application.Research;
using diitra_application.Research.Dtos;
using System.Security.Claims;

namespace diitra_api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PeerReviewsController : ControllerBase
{
    private readonly IPeerReviewService _peerReviewService;

    public PeerReviewsController(IPeerReviewService peerReviewService)
    {
        _peerReviewService = peerReviewService;
    }

    [HttpGet("pending")]
    public async Task<IActionResult> GetPending()
    {
        var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdStr, out var userId)) return Unauthorized();

        var result = await _peerReviewService.GetPendingReviewsAsync(userId);
        return Ok(result);
    }

    [HttpPost("assign")]
    // [Authorize(Roles = "DIRECTOR_INV,ADMIN_SISTEMA")]
    public async Task<IActionResult> Assign([FromBody] CreatePeerReviewDto dto)
    {
        var uuid = await _peerReviewService.AssignReviewerAsync(dto);
        return Ok(new { uuid });
    }

    [HttpPost("evaluate")]
    public async Task<IActionResult> Evaluate([FromBody] EvaluationDto dto)
    {
        var result = await _peerReviewService.SubmitEvaluationAsync(dto);
        if (!result) return NotFound();
        return Ok(new { message = "Evaluación enviada con éxito" });
    }

    [HttpGet("project/{projectId}")]
    public async Task<IActionResult> GetByProject(int projectId)
    {
        var result = await _peerReviewService.GetProjectReviewsAsync(projectId);
        return Ok(result);
    }
}
