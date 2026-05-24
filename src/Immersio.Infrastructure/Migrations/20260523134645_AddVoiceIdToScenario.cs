using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Immersio.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddVoiceIdToScenario : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "VoiceId",
                table: "Scenarios",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "VoiceId",
                table: "Scenarios");
        }
    }
}
