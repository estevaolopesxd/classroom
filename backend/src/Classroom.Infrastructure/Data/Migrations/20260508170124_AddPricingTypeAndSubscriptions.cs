using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Classroom.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddPricingTypeAndSubscriptions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PricingType",
                table: "Courses",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "CurrentPeriodEnd",
                table: "CourseEnrollments",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "StripeCustomerId",
                table: "CourseEnrollments",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "StripeSubscriptionId",
                table: "CourseEnrollments",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SubscriptionStatus",
                table: "CourseEnrollments",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_CourseEnrollments_StripeSubscriptionId",
                table: "CourseEnrollments",
                column: "StripeSubscriptionId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_CourseEnrollments_StripeSubscriptionId",
                table: "CourseEnrollments");

            migrationBuilder.DropColumn(
                name: "PricingType",
                table: "Courses");

            migrationBuilder.DropColumn(
                name: "CurrentPeriodEnd",
                table: "CourseEnrollments");

            migrationBuilder.DropColumn(
                name: "StripeCustomerId",
                table: "CourseEnrollments");

            migrationBuilder.DropColumn(
                name: "StripeSubscriptionId",
                table: "CourseEnrollments");

            migrationBuilder.DropColumn(
                name: "SubscriptionStatus",
                table: "CourseEnrollments");
        }
    }
}
