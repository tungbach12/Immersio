using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Immersio.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddEmotionsToScenario : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "EmotionsJson",
                table: "Scenarios",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EmotionsJson",
                table: "Scenarios");
        }
    }
}
