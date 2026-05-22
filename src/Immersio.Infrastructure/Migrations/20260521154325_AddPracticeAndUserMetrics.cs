using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Immersio.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPracticeAndUserMetrics : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CurrentLanguageLevel",
                table: "Users",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "B2 Upper");

            migrationBuilder.AddColumn<int>(
                name: "ExperiencePoints",
                table: "Users",
                type: "int",
                nullable: false,
                defaultValue: 2400);

            migrationBuilder.AddColumn<double>(
                name: "LearningHours",
                table: "Users",
                type: "float",
                nullable: false,
                defaultValue: 48.0);

            migrationBuilder.AddColumn<int>(
                name: "StreakCount",
                table: "Users",
                type: "int",
                nullable: false,
                defaultValue: 12);

            migrationBuilder.CreateTable(
                name: "UserPronunciationLogs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Phrase = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    Transcript = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    Score = table.Column<int>(type: "int", nullable: false),
                    PracticedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserPronunciationLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserPronunciationLogs_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_UserPronunciationLogs_UserId",
                table: "UserPronunciationLogs",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UserPronunciationLogs");

            migrationBuilder.DropColumn(
                name: "CurrentLanguageLevel",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "ExperiencePoints",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "LearningHours",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "StreakCount",
                table: "Users");
        }
    }
}
