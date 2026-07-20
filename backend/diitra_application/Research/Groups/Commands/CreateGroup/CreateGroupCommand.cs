using diitra_application.Research.Dtos;
using MediatR;

namespace diitra_application.Research.Groups.Commands.CreateGroup
{
    public record CreateGroupCommand(CreateGroupDto Dto, string? SolicitanteNombre = null) : IRequest<GroupDto>;
}
