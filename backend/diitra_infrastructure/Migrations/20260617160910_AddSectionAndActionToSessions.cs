using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace diitra_infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSectionAndActionToSessions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "bloqueadoHasta",
                table: "usuarios");

            migrationBuilder.DropColumn(
                name: "intentosFallidos",
                table: "usuarios");

            migrationBuilder.DropColumn(
                name: "usuario_asigno",
                table: "rbac_rol_modulo_operacion");

            migrationBuilder.DropColumn(
                name: "usuario_desactivo",
                table: "rbac_rol_modulo_operacion");

            migrationBuilder.AddColumn<decimal>(
                name: "horasSemanales",
                table: "inv_proyectos_alumnos",
                type: "decimal(4,1)",
                precision: 4,
                scale: 1,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "accion",
                table: "inv_cowork_sesiones",
                type: "varchar(255)",
                maxLength: 255,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "seccionNombre",
                table: "inv_cowork_sesiones",
                type: "varchar(100)",
                maxLength: 100,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "horasSemanales",
                table: "inv_proyectos_alumnos");

            migrationBuilder.DropColumn(
                name: "accion",
                table: "inv_cowork_sesiones");

            migrationBuilder.DropColumn(
                name: "seccionNombre",
                table: "inv_cowork_sesiones");

            migrationBuilder.AddColumn<DateTime>(
                name: "bloqueadoHasta",
                table: "usuarios",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "intentosFallidos",
                table: "usuarios",
                type: "int",
                nullable: false,
                defaultValueSql: "'0'");

            migrationBuilder.AddColumn<string>(
                name: "usuario_asigno",
                table: "rbac_rol_modulo_operacion",
                type: "varchar(150)",
                maxLength: 150,
                nullable: false,
                defaultValue: "")
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "usuario_desactivo",
                table: "rbac_rol_modulo_operacion",
                type: "varchar(150)",
                maxLength: 150,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");
        }
    }
}
