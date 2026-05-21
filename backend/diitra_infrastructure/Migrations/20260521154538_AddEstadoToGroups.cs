using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace diitra_infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddEstadoToGroups : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "estado",
                table: "inv_grupos_investigacion",
                type: "varchar(20)",
                maxLength: 20,
                nullable: true,
                defaultValue: "Aprobado")
                .Annotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "estado",
                table: "inv_grupos_investigacion");
        }
    }
}
