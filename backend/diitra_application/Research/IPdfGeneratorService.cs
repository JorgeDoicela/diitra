using System.Threading.Tasks;
using Diitra.Application.Research.Dtos;

namespace Diitra.Application.Research
{
    public interface IPdfGeneratorService
    {
        Task<byte[]> GenerateProjectPdfAsync(ProyectoDto proyecto);
    }
}
