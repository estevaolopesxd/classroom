using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Classroom.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddCoupons : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CouponCode",
                table: "Purchases",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "CouponId",
                table: "Purchases",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "DiscountPercent",
                table: "Purchases",
                type: "numeric",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Coupons",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Code = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    DiscountPercent = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: false),
                    CourseId = table.Column<Guid>(type: "uuid", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    MaxUses = table.Column<int>(type: "integer", nullable: true),
                    UsedCount = table.Column<int>(type: "integer", nullable: false),
                    CreatedById = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Coupons", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Coupons_Courses_CourseId",
                        column: x => x.CourseId,
                        principalTable: "Courses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Coupons_Users_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Purchases_CouponId",
                table: "Purchases",
                column: "CouponId");

            migrationBuilder.CreateIndex(
                name: "IX_Coupons_Code",
                table: "Coupons",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Coupons_CourseId",
                table: "Coupons",
                column: "CourseId");

            migrationBuilder.CreateIndex(
                name: "IX_Coupons_CreatedById",
                table: "Coupons",
                column: "CreatedById");

            migrationBuilder.AddForeignKey(
                name: "FK_Purchases_Coupons_CouponId",
                table: "Purchases",
                column: "CouponId",
                principalTable: "Coupons",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Purchases_Coupons_CouponId",
                table: "Purchases");

            migrationBuilder.DropTable(
                name: "Coupons");

            migrationBuilder.DropIndex(
                name: "IX_Purchases_CouponId",
                table: "Purchases");

            migrationBuilder.DropColumn(
                name: "CouponCode",
                table: "Purchases");

            migrationBuilder.DropColumn(
                name: "CouponId",
                table: "Purchases");

            migrationBuilder.DropColumn(
                name: "DiscountPercent",
                table: "Purchases");
        }
    }
}
