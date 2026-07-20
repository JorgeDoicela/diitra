using diitra_domain.Identity.Entities;

namespace diitra_application.Security;

public interface IRbacService
{
    Task SeedRbacStructureAsync();
    Task SynchronizeUserRolesAsync(User user);
    Task AssignDefaultPermissionsToRoleAsync(Role role);
}
