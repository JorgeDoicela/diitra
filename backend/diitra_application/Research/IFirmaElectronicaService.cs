using System.IO;
using System.Threading.Tasks;

namespace Diitra.Application.Research
{
    public interface IFirmaElectronicaService
    {
        Task<byte[]> FirmarPdfAsync(byte[] pdfOriginal, Stream certificadoP12, string password, string razon, string ubicacion);
        Task<FirmaValidationResult> VerificarFirmaAsync(byte[] pdfFirmado);
    }

    public class FirmaValidationResult
    {
        public bool EsValida { get; set; }
        public string FirmanteNombre { get; set; } = string.Empty;
        public string FirmanteCedula { get; set; } = string.Empty;
        public string EntidadEmisora { get; set; } = string.Empty;
        public DateTime FechaFirma { get; set; }
        public bool EsCertificadoAutorizado { get; set; }
    }
}
