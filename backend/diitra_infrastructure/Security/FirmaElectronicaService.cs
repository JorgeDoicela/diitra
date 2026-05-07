using iText.Signatures;
using iText.Kernel.Pdf;
using Org.BouncyCastle.Crypto;
using Org.BouncyCastle.Pkcs;
using System.IO;

namespace diitra_infrastructure.Security;

public interface IFirmaElectronicaService
{
    bool ValidateCertificate(byte[] certificateData, string password);
    byte[] SignPdf(byte[] pdfData, byte[] certificateData, string password, string reason = "Firma Institucional DIITRA", string location = "Quito, Ecuador");
}

public class FirmaElectronicaService : IFirmaElectronicaService
{
    public bool ValidateCertificate(byte[] certificateData, string password)
    {
        try 
        {
            using var ms = new MemoryStream(certificateData);
            var pkcs12 = new Pkcs12StoreBuilder().Build();
            pkcs12.Load(ms, password.ToCharArray());
            return true;
        }
        catch
        {
            return false;
        }
    }

    public byte[] SignPdf(byte[] pdfData, byte[] certificateData, string password, string reason = "Firma Institucional DIITRA", string location = "Quito, Ecuador")
    {
        using var readerStream = new MemoryStream(pdfData);
        using var outputStream = new MemoryStream();
        
        // 1. Cargar el certificado .p12
        var pkcs12 = new Pkcs12StoreBuilder().Build();
        pkcs12.Load(new MemoryStream(certificateData), password.ToCharArray());
        
        string alias = null;
        foreach (string a in pkcs12.Aliases)
        {
            if (pkcs12.IsKeyEntry(a))
            {
                alias = a;
                break;
            }
        }

        if (alias == null) throw new InvalidOperationException("No se encontró una llave privada en el certificado.");

        AsymmetricKeyParameter key = pkcs12.GetKey(alias).Key;
        X509CertificateEntry[] chainEntries = pkcs12.GetCertificateChain(alias);
        iText.Commons.Bouncycastle.Cert.IX509Certificate[] chain = new iText.Commons.Bouncycastle.Cert.IX509Certificate[chainEntries.Length];
        
        // Adaptación para iText7 (BouncyCastle adapter)
        var factory = new iText.Bouncycastle.BouncycastleFactory();
        for (int i = 0; i < chainEntries.Length; i++)
        {
            chain[i] = factory.CreateX509Certificate(chainEntries[i].Certificate);
        }

        // 2. Firmar el PDF
        var pdfReader = new PdfReader(readerStream);
        var signer = new PdfSigner(pdfReader, outputStream, new StampingProperties());

        // Apariencia visual (opcional - por ahora invisible o básica)
        var appearance = signer.GetSignatureAppearance();
        appearance.SetReason(reason)
                  .SetLocation(location)
                  .SetReuseAppearance(false);

        // Algoritmo de firma (SHA-256 es el estándar en Ecuador)
        IExternalSignature pks = new PrivateKeySignature(factory.CreatePrivateKey(key), DigestAlgorithms.SHA256);
        
        signer.SignDetached(pks, chain, null, null, null, 0, PdfSigner.CryptoStandard.CMS);

        return outputStream.ToArray();
    }
}
