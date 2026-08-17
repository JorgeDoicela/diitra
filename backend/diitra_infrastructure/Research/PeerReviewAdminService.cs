using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using diitra_application.Common.Notifications;
using diitra_application.Research;
using diitra_application.Research.Dtos;
using diitra_application.Security;
using diitra_infrastructure.data.models;
using diitra_infrastructure.Research.Subservices;

namespace diitra_infrastructure.Research
{
    public class PeerReviewAdminService : IPeerReviewAdminService
    {
        private readonly IPeerReviewQuerySubservice _querySubservice;
        private readonly IPeerReviewerManagementSubservice _reviewerManagementSubservice;
        private readonly IPeerReviewAssignmentSubservice _assignmentSubservice;

        public PeerReviewAdminService(
            IPeerReviewQuerySubservice querySubservice,
            IPeerReviewerManagementSubservice reviewerManagementSubservice,
            IPeerReviewAssignmentSubservice assignmentSubservice)
        {
            _querySubservice = querySubservice;
            _reviewerManagementSubservice = reviewerManagementSubservice;
            _assignmentSubservice = assignmentSubservice;
        }

        internal PeerReviewAdminService(
            DiitraContext context,
            IAuthService authService,
            IAuditService auditService,
            INotificationService notificationService,
            diitra_application.Common.IAppUrlService appUrlService)
            : this(
                new PeerReviewQuerySubservice(context),
                new PeerReviewerManagementSubservice(context, auditService),
                new PeerReviewAssignmentSubservice(context, authService, auditService, notificationService, appUrlService))
        {
        }

        public Task<IEnumerable<ArbitrajeProyectoDto>> GetArbitrajesActivosAsync()
            => _querySubservice.GetArbitrajesActivosAsync();

        public Task<ArbitrajeStatsDto> GetArbitrajeStatsAsync()
            => _querySubservice.GetArbitrajeStatsAsync();

        public Task<ArbitrajeProyectoDto?> GetArbitrajeByProjectAsync(string projectUuid)
            => _querySubservice.GetArbitrajeByProjectAsync(projectUuid);

        public Task<IEnumerable<PeerReviewDto>> GetProjectReviewsAsync(int projectId)
            => _querySubservice.GetProjectReviewsAsync(projectId);

        public Task<IEnumerable<RevisorDisponibleDto>> SearchRevisoresAsync(string query, bool soloExternos, string? projectUuid)
            => _reviewerManagementSubservice.SearchRevisoresAsync(query, soloExternos, projectUuid);

        public Task<string> RegisterRevisorExternoAsync(RegistrarRevisorExternoDto dto, int directorId)
            => _reviewerManagementSubservice.RegisterRevisorExternoAsync(dto, directorId);

        public Task<IEnumerable<RevisorDisponibleDto>> GetRevisoresExternosAsync()
            => _reviewerManagementSubservice.GetRevisoresExternosAsync();

        public Task<string> AsignarArbitroAsync(AsignarArbitroDto dto, int directorId)
            => _assignmentSubservice.AsignarArbitroAsync(dto, directorId);

        public Task<string> AssignReviewerAsync(CreatePeerReviewDto dto)
            => _assignmentSubservice.AssignReviewerAsync(dto);

        public Task<bool> RevocarAsignacionAsync(string revisionUuid, int directorId)
            => _assignmentSubservice.RevocarAsignacionAsync(revisionUuid, directorId);

        public Task<bool> ExtenderFechaLimiteAsync(string revisionUuid, DateTime nuevaFecha, int directorId)
            => _assignmentSubservice.ExtenderFechaLimiteAsync(revisionUuid, nuevaFecha, directorId);

        public Task<bool> UpdateProjectSettingsAsync(string projectUuid, PeerReviewSettingsDto dto)
            => _assignmentSubservice.UpdateProjectSettingsAsync(projectUuid, dto);
    }
}
