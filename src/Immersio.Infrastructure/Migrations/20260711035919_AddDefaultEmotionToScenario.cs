using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Immersio.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddDefaultEmotionToScenario : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DefaultEmotion",
                table: "Scenarios",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DefaultEmotion",
                table: "Scenarios");
        }
    }
}
