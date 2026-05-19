using System.IO;
using System.IO.Compression;

namespace diitra_infrastructure.Collaboration
{
    public static class GZipHelper
    {
        /// <summary>
        /// Comprime un arreglo de bytes utilizando GZipStream en memoria de forma optimizada.
        /// </summary>
        public static byte[] Compress(byte[] data)
        {
            if (data == null || data.Length == 0) return data ?? System.Array.Empty<byte>();
            
            using (var outputStream = new MemoryStream())
            {
                using (var gZipStream = new GZipStream(outputStream, CompressionLevel.Fastest, true))
                {
                    gZipStream.Write(data, 0, data.Length);
                }
                return outputStream.ToArray();
            }
        }

        /// <summary>
        /// Descomprime un arreglo de bytes utilizando GZipStream.
        /// Cuenta con detección automática del número mágico de GZip para asegurar
        /// retrocompatibilidad absoluta con datos no comprimidos previamente.
        /// </summary>
        public static byte[] Decompress(byte[] compressedData)
        {
            if (compressedData == null || compressedData.Length == 0) return compressedData ?? System.Array.Empty<byte>();

            // Verificar número mágico de GZip (0x1F, 0x8B) para auto-detectar
            if (compressedData.Length < 2 || compressedData[0] != 0x1F || compressedData[1] != 0x8B)
            {
                // No está comprimido, retornar los datos originales de forma segura (retrocompatibilidad)
                return compressedData;
            }

            using (var inputStream = new MemoryStream(compressedData))
            using (var gZipStream = new GZipStream(inputStream, CompressionMode.Decompress))
            using (var outputStream = new MemoryStream())
            {
                gZipStream.CopyTo(outputStream);
                return outputStream.ToArray();
            }
        }
    }
}
