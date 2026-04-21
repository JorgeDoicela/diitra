# Security Policy & Secrets Management

## Secrets Management Strategy

DIITRA uses a multi-layered approach to secret management to ensure production credentials never leak:

1.  **Development**: Local development uses `.env` files (Web/Mobile) and `appsettings.Development.json` or User Secrets (Backend). These files are strictly ignored by Git.
2.  **Continuous Integration**: GitHub Actions secrets are used to store sensitive data needed during build or deployment.
3.  **Production**: 
    *   **Backend**: Environment variables or a dedicated Secret Manager (e.g., Azure Key Vault).
    *   **Frontend**: Built-time environment variables injected via CI/CD.

## Vulnerability Reporting

If you discover a security vulnerability, please do NOT create a public issue. Instead:
1.  Send an email to `investigacion@istpet.edu.ec` with the subject "SECURITY VULNERABILITY".
2.  Provide a detailed description of the exploit and steps to reproduce.
3.  The team will respond within 48 hours to acknowledge and start the remediation process.

## Best Practices

*   **HttpOnly Cookies**: JWT tokens are stored in `HttpOnly` and `SameSite=Strict` cookies to prevent XSS and CSRF attacks.
*   **Data Validation**: All inputs are validated via `FluentValidation` (Backend) and `Zod` (Frontend).
*   **Global Exception Handling**: Detailed errors are logged but never exposed to the client in production.
