import Elysia, { t } from "elysia";
import {
  saveGradingResult,
  saveLearningPlan,
  getAllStudents,
  getStudentProfile,
  getAllGradingHistory,
  getDashboardStats,
} from "./service";

export const studentsRoutes = new Elysia({ prefix: "/api/students" })
  // Save a grading result (auto-creates student)
  .post(
    "/results",
    async ({ body }) => {
      try {
        const { studentId, analysisId } = await saveGradingResult(body.result);
        return {
          success: true,
          studentId,
          analysisId,
        };
      } catch (error) {
        console.error("Failed to save grading result:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    {
      body: t.Object({
        result: t.Object({
          studentName: t.String(),
          subject: t.String(),
          score: t.Number(),
          totalMarks: t.Number(),
          feedback: t.String(),
          corrections: t.Array(
            t.Object({
              questionNo: t.String(),
              questionText: t.String(),
              studentAnswer: t.String(),
              correctAnswer: t.String(),
              marksObtained: t.Number(),
              maxMarks: t.Number(),
              analysis: t.String(),
            }),
          ),
          date: t.String(),
          weakAreas: t.Array(t.String()),
          className: t.Optional(t.String()),
          schoolName: t.Optional(t.String()),
          examType: t.Optional(t.String()),
          rollNumber: t.Optional(t.String()),
        }),
      }),
    },
  )

  // Save a learning plan for an analysis
  .post(
    "/learning-plans",
    async ({ body }) => {
      try {
        const planId = await saveLearningPlan(body.analysisId, body.plan);
        return { success: true, planId };
      } catch (error) {
        console.error("Failed to save learning plan:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    {
      body: t.Object({
        analysisId: t.String(),
        plan: t.Object({
          weakAreas: t.Array(t.String()),
          needsTeacherAssistance: t.Boolean(),
          assistanceReason: t.String(),
          activities: t.Array(
            t.Object({
              day: t.Number(),
              title: t.String(),
              whatIsNeeded: t.String(),
              howToDo: t.String(),
              guidelines: t.String(),
            }),
          ),
          timeline: t.String(),
          dailyTime: t.String(),
        }),
      }),
    },
  )

  // Get all students with stats
  .get("/", async () => {
    try {
      const students = await getAllStudents();
      return { success: true, students };
    } catch (error) {
      console.error("Failed to fetch students:", error);
      return {
        success: false,
        students: [],
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  })

  // Get student profile with history
  .get("/:id", async ({ params }) => {
    try {
      const profile = await getStudentProfile(params.id);
      if (!profile) {
        return { success: false, error: "Student not found" };
      }
      return { success: true, profile };
    } catch (error) {
      console.error("Failed to fetch student profile:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  })

  // Get all grading history
  .get("/history/all", async () => {
    try {
      const history = await getAllGradingHistory();
      return { success: true, history };
    } catch (error) {
      console.error("Failed to fetch history:", error);
      return {
        success: false,
        history: [],
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  })

  // Get dashboard statistics
  .get("/dashboard/stats", async () => {
    try {
      const stats = await getDashboardStats();
      return { success: true, ...stats };
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
      return {
        success: false,
        totalStudents: 0,
        totalTests: 0,
        averageScore: 0,
        recentResults: [],
        subjectStats: [],
        studentsNeedingAttention: [],
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });
