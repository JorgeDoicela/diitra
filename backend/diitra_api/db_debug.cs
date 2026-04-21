using System;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using diitra_infrastructure.data.models;
using Microsoft.Extensions.Configuration;
using System.IO;

namespace diitra_debug;

class Program
{
    static void Main(string[] args)
    {
        var config = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.json")
            .Build();

        var connectionString = config.GetConnectionString("default_connection");
        var optionsBuilder = new DbContextOptionsBuilder<DiitraContext>();
        optionsBuilder.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString));

        using (var context = new DiitraContext(optionsBuilder.Options))
        {
            Console.WriteLine("--- DB DEBUG ---");
            
            var targetId = "0302144159";
            var professor = context.Profesores.FirstOrDefault(p => p.IdProfesor.Contains(targetId));
            if (professor == null)
            {
                Console.WriteLine($"ERROR: Professor {targetId} NOT found in DB!");
            }
            else
            {
                Console.WriteLine($"Found: {professor.PrimerNombre} {professor.PrimerApellido} (ID: |{professor.IdProfesor}|)");
            }

            var roles = context.Roles.ToList();
            Console.WriteLine("\nAvailable Roles:");
            foreach (var r in roles)
            {
                Console.WriteLine($"- {r.IdRol}: {r.Nombre}");
            }

            var userRoles = context.UserRoles
                .Where(ur => ur.IdReferencia.Contains(targetId))
                .ToList();
            
            Console.WriteLine($"\nRoles for {targetId}:");
            if (!userRoles.Any()) Console.WriteLine("NONE");
            foreach (var ur in userRoles)
            {
                var roleName = roles.FirstOrDefault(r => r.IdRol == ur.IdRol)?.Nombre ?? "Unknown";
                Console.WriteLine($"- Role ID: {ur.IdRol} ({roleName}), Active: {ur.Activo}");
            }
        }
    }
}
