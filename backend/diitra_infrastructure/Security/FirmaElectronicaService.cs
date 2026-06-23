using iText.Signatures;
using iText.Kernel.Pdf;
using iText.Kernel.Crypto;
using iText.Bouncycastleconnector;
using iText.Bouncycastle.Crypto;
using iText.Commons.Bouncycastle.Crypto;
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
            // PERFORMANCE: Native .NET X509Certificate2 password validation is extremely fast (under 10ms)
            // compared to BouncyCastle managed decryption loop which takes seconds.
            using var cert = new System.Security.Cryptography.X509Certificates.X509Certificate2(certificateData, password);
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
        
        string? alias = null;
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
        
        // Adaptación para iText 9 (BouncyCastle adapter via Creator)
        var factory = BouncyCastleFactoryCreator.GetFactory();
        for (int i = 0; i < chainEntries.Length; i++)
        {
            chain[i] = factory.CreateX509Certificate(chainEntries[i].Certificate);
        }

        // 2. Firmar el PDF
        var pdfReader = new PdfReader(readerStream);
        var signer = new PdfSigner(pdfReader, outputStream, new StampingProperties());

        // Configuración de metadatos de firma (iText 9 style)
        SignerProperties signerProperties = new SignerProperties()
            .SetReason(reason)
            .SetLocation(location);
        
        signer.SetSignerProperties(signerProperties);

        // Algoritmo de firma (SHA-256 es el estándar en Ecuador)
        IPrivateKey pk = new PrivateKeyBC(key);
        IExternalSignature pks = new PrivateKeySignature(pk, DigestAlgorithms.SHA256);
        
        // PAdES (ETSI TS 102 778): subfilter ETSI.CAdES.detached — obligatorio CACES y Ley de Comercio Electrónico Ecuador
        signer.SignDetached(pks, chain, null, null, null, 0, PdfSigner.CryptoStandard.CADES);

        return outputStream.ToArray();
    }
}
