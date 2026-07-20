using Microsoft.EntityFrameworkCore;
using System;
using System.Threading.Tasks;
using diitra_application.Research;
using Diitra.Application.Research;
using diitra_application.Research.Dtos;
using diitra_application.Security;
using diitra_domain.Identity.Entities;
using diitra_infrastructure.data.models;
using Diitra.Application.Common.Documents;
using Diitra.Application.Common;
using diitra_application.Common.Notifications;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Http;

namespace diitra_infrastructure.Research
{
    public partial class PeerReviewService : IPeerReviewService
    {
        private readonly DiitraContext _context;
        private readonly IAuditService _auditService;
        private readonly IDocumentEngine _documentEngine;
        private readonly INotificationService _notificationService;
        private readonly IConfiguration _configuration;
        private readonly IAuthService _authService;
        private readonly IWorkflowEngineService _workflowEngineService;
        private readonly ILogger<PeerReviewService> _logger;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public PeerReviewService(
            DiitraContext context, 
            IAuditService auditService, 
            IDocumentEngine documentEngine, 
            INotificationService notificationService, 
            IConfiguration configuration, 
            IAuthService authService, 
            IWorkflowEngineService workflowEngineService,
            ILogger<PeerReviewService> logger,
            IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _auditService = auditService;
            _documentEngine = documentEngine;
            _notificationService = notificationService;
            _configuration = configuration;
            _authService = authService;
            _workflowEngineService = workflowEngineService;
            _logger = logger;
            _httpContextAccessor = httpContextAccessor;
        }

        private string GetFrontendUrl()
        {
            var configuredUrl = _configuration["Email:FrontendUrl"] ?? "http://localhost:3000";
            
            var httpContext = _httpContextAccessor?.HttpContext;
            if (httpContext != null)
            {
                var request = httpContext.Request;
                var host = request.Host.Value;
                
                if ((host.Contains("localhost") || host.Contains("127.0.0.1")) && 
                    (configuredUrl.Contains("localhost:3000") || configuredUrl.Contains("localhost:5173")))
                {
                    return configuredUrl;
                }
                
                var scheme = request.Scheme;
                return $"{scheme}://{host}/diitra";
            }

            return configuredUrl;
        }
    }
}