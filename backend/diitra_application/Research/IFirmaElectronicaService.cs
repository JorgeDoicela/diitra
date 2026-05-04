using System.IO;
using System.Threading.Tasks;

namespace Diitra.Application.Research
{
    public interface IFirmaElectronicaService
    {
        Task<byte[]> FirmarPdfAsync(byte[] pdfOriginal, Stream certificadoP12, string password, string razon, string ubicacion);
    }
}
