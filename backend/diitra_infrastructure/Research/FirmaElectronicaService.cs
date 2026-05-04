using System;
using System.IO;
using System.Threading.Tasks;
using Diitra.Application.Research;

namespace Diitra.Infrastructure.Research
{
    public class FirmaElectronicaService : IFirmaElectronicaService
    {
        public Task<byte[]> FirmarPdfAsync(byte[] pdfOriginal, Stream certificadoP12, string password, string razon, string ubicacion)
        {
            // Arquitectura Enterprise: La firma ahora se realiza en el cliente usando FirmaEC.
            // Este método será reemplazado por un Validador de Firma en futuras iteraciones.
            throw new NotImplementedException("La firma se debe realizar localmente con FirmaEC por normativa legal. Este endpoint será refactorizado a VerificarFirmaAsync.");
        }
    }
}
