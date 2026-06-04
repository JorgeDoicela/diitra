using System;
using System.IO;
using System.Security.Cryptography;
using System.Text;

namespace diitra_infrastructure.Security;

public static class CryptoHelper
{
    /// <summary>
    /// Cifra una cadena de texto plano usando AES-256-CBC.
    /// Deriva una clave de 32 bytes a partir de cualquier configuración usando SHA-256.
    /// </summary>
    public static string Encrypt(string plainText, string keyConfigString)
    {
        if (string.IsNullOrEmpty(plainText)) return plainText;
        if (string.IsNullOrEmpty(keyConfigString)) throw new ArgumentNullException(nameof(keyConfigString), "La clave de cifrado no puede estar vacía.");

        byte[] key = SHA256.HashData(Encoding.UTF8.GetBytes(keyConfigString));

        using var aes = Aes.Create();
        aes.Key = key;
        aes.GenerateIV();
        byte[] iv = aes.IV;

        using var encryptor = aes.CreateEncryptor(aes.Key, aes.IV);
        using var ms = new MemoryStream();
        
        // Escribimos el IV al inicio del stream
        ms.Write(iv, 0, iv.Length);

        using (var cs = new CryptoStream(ms, encryptor, CryptoStreamMode.Write))
        using (var sw = new StreamWriter(cs))
        {
            sw.Write(plainText);
        }

        return Convert.ToBase64String(ms.ToArray());
    }

    /// <summary>
    /// Descifra una cadena cifrada en AES-256-CBC.
    /// </summary>
    public static string Decrypt(string cipherText, string keyConfigString)
    {
        if (string.IsNullOrEmpty(cipherText)) return cipherText;
        if (string.IsNullOrEmpty(keyConfigString)) throw new ArgumentNullException(nameof(keyConfigString), "La clave de cifrado no puede estar vacía.");

        byte[] key = SHA256.HashData(Encoding.UTF8.GetBytes(keyConfigString));
        byte[] fullCipher = Convert.FromBase64String(cipherText);

        using var aes = Aes.Create();
        aes.Key = key;

        byte[] iv = new byte[aes.BlockSize / 8]; // 16 bytes para AES
        byte[] cipherBytes = new byte[fullCipher.Length - iv.Length];

        Buffer.BlockCopy(fullCipher, 0, iv, 0, iv.Length);
        Buffer.BlockCopy(fullCipher, iv.Length, cipherBytes, 0, cipherBytes.Length);

        aes.IV = iv;

        using var decryptor = aes.CreateDecryptor(aes.Key, aes.IV);
        using var ms = new MemoryStream(cipherBytes);
        using var cs = new CryptoStream(ms, decryptor, CryptoStreamMode.Read);
        using var sr = new StreamReader(cs);

        return sr.ReadToEnd();
    }
}
