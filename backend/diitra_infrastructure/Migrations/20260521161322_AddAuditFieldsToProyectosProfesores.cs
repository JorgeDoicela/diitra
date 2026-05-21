using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace diitra_infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAuditFieldsToProyectosProfesores : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "activo",
                table: "inv_proyectos_profesores",
                type: "tinyint(1)",
                nullable: true,
                defaultValueSql: "'1'");

            migrationBuilder.AddColumn<DateTime>(
                name: "fecha_fin",
                table: "inv_proyectos_profesores",
                type: "datetime",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "fecha_inicio",
                table: "inv_proyectos_profesores",
                type: "datetime",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "motivo_cambio",
                table: "inv_proyectos_profesores",
                type: "varchar(150)",
                maxLength: 150,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<bool>(
                name: "activo",
                table: "inv_proyectos_alumnos",
                type: "tinyint(1)",
                nullable: true,
                defaultValueSql: "'1'");

            migrationBuilder.AddColumn<DateTime>(
                name: "fecha_fin",
                table: "inv_proyectos_alumnos",
                type: "datetime",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "fecha_inicio",
                table: "inv_proyectos_alumnos",
                type: "datetime",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "motivo_cambio",
                table: "inv_proyectos_alumnos",
                type: "varchar(150)",
                maxLength: 150,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "activo",
                table: "inv_proyectos_profesores");

            migrationBuilder.DropColumn(
                name: "fecha_fin",
                table: "inv_proyectos_profesores");

            migrationBuilder.DropColumn(
                name: "fecha_inicio",
                table: "inv_proyectos_profesores");

            migrationBuilder.DropColumn(
                name: "motivo_cambio",
                table: "inv_proyectos_profesores");

            migrationBuilder.DropColumn(
                name: "activo",
                table: "inv_proyectos_alumnos");

            migrationBuilder.DropColumn(
                name: "fecha_fin",
                table: "inv_proyectos_alumnos");

            migrationBuilder.DropColumn(
                name: "fecha_inicio",
                table: "inv_proyectos_alumnos");

            migrationBuilder.DropColumn(
                name: "motivo_cambio",
                table: "inv_proyectos_alumnos");
        }
    }
}
