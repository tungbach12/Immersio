using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Immersio.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTagToCard : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Tag",
                table: "Cards",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Tag",
                table: "Cards");
        }
    }
}
