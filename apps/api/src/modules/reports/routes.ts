import { Elysia, t } from "elysia";
import { GradingResult } from "@tali/types";
import { buildPdfMinimax, buildBulkPdfMinimax } from "./minimax";

export const reportsRoutes = new Elysia({ prefix: "/reports" })
  .post(
    "/pdf",
    async ({ body, set }) => {
      try {
        const locale = (body.locale || "en") as "en" | "mr";
        const result = body.result as unknown as GradingResult;
        const displayName =
          result.studentName?.trim() ||
          result.subject?.trim() ||
          (locale === "mr" ? "विद्यार्थी_अहवाल" : "student_report");
        const buffer = await buildPdfMinimax(result, locale);

        set.headers["Content-Type"] = "application/pdf";
        set.headers["Content-Disposition"] =
          `attachment; filename="${encodeURIComponent(displayName)}_report.pdf"`;
        return buffer;
      } catch (error) {
        console.error("PDF generation failed:", error);
        set.status = 500;
        return {
          success: false,
          error:
            error instanceof Error ? error.message : "PDF generation failed",
        };
      }
    },
    {
      body: t.Object({
        result: t.Any(),
        locale: t.Optional(t.String()),
      }),
    },
  )
  .post(
    "/bulk-pdf",
    async ({ body, set }) => {
      try {
        const locale = (body.locale || "en") as "en" | "mr";
        const results = body.results as unknown as GradingResult[];
        const buffer = await buildBulkPdfMinimax(results, locale);

        set.headers["Content-Type"] = "application/pdf";
        set.headers["Content-Disposition"] =
          `attachment; filename="bulk_report_${results.length}_students.pdf"`;
        return buffer;
      } catch (error) {
        console.error("Bulk PDF generation failed:", error);
        set.status = 500;
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Bulk PDF generation failed",
        };
      }
    },
    {
      body: t.Object({
        results: t.Array(t.Any()),
        locale: t.Optional(t.String()),
      }),
    },
  );
