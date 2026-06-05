using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace diitra_infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddEvidenciaPathToArco : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "evidenciaPath",
                table: "inv_lopdp_derechos_arco",
                type: "varchar(512)",
                maxLength: 512,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "evidenciaPath",
                table: "inv_lopdp_derechos_arco");
        }
    }
}
