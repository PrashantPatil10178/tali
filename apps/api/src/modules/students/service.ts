import { prisma } from "@tali/database/client";
import type { GradingResult, LearningPlan } from "@tali/types";

interface SeedStudentAssessment {
  readonly studentName: string;
  readonly rollNumber: string;
  readonly className: string;
  readonly subject: string;
  readonly score: number;
  readonly totalMarks: number;
  readonly weakAreas: readonly string[];
  readonly feedback: string;
  readonly examType: string;
  readonly daysAgo: number;
}

const STUDENT_SEED_ASSESSMENTS: readonly SeedStudentAssessment[] = [
  {
    studentName: "Arjun Singh",
    rollNumber: "A-101",
    className: "10-A",
    subject: "Mathematics",
    score: 41,
    totalMarks: 50,
    weakAreas: ["Word problems", "Linear equations"],
    feedback:
      "Good numerical accuracy. Focus on step-by-step reasoning in applied questions.",
    examType: "Unit Test",
    daysAgo: 2,
  },
  {
    studentName: "Priya Desai",
    rollNumber: "A-102",
    className: "10-A",
    subject: "Science",
    score: 44,
    totalMarks: 50,
    weakAreas: ["Diagram labeling"],
    feedback:
      "Strong conceptual understanding. Improve neat diagram annotations for full marks.",
    examType: "Weekly Assessment",
    daysAgo: 3,
  },
  {
    studentName: "Rohan Patil",
    rollNumber: "A-103",
    className: "10-A",
    subject: "English",
    score: 36,
    totalMarks: 50,
    weakAreas: ["Grammar accuracy", "Answer structure"],
    feedback:
      "Content is relevant, but sentence construction needs refinement.",
    examType: "Class Test",
    daysAgo: 5,
  },
  {
    studentName: "Sneha Kulkarni",
    rollNumber: "A-104",
    className: "10-A",
    subject: "Marathi",
    score: 46,
    totalMarks: 50,
    weakAreas: ["Spelling consistency"],
    feedback: "Excellent expression. Revise spelling in long-form answers.",
    examType: "Weekly Assessment",
    daysAgo: 6,
  },
  {
    studentName: "Aman Verma",
    rollNumber: "A-105",
    className: "10-A",
    subject: "History",
    score: 33,
    totalMarks: 50,
    weakAreas: ["Chronology", "Answer depth"],
    feedback:
      "Key points are present. Add timeline anchors and richer explanations.",
    examType: "Unit Test",
    daysAgo: 8,
  },
  {
    studentName: "Kavya Joshi",
    rollNumber: "A-106",
    className: "10-A",
    subject: "Geography",
    score: 39,
    totalMarks: 50,
    weakAreas: ["Map interpretation"],
    feedback:
      "Concept clarity is good. Practice map-based questions for faster accuracy.",
    examType: "Class Test",
    daysAgo: 10,
  },
];

const shouldAutoSeedStudents = (): boolean => {
  if (process.env.TALI_AUTO_SEED_STUDENTS === "false") {
    return false;
  }

  if (process.env.TALI_AUTO_SEED_STUDENTS === "true") {
    return true;
  }

  return process.env.NODE_ENV !== "production";
};

const clampNumber = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

const buildSeedCorrections = (
  subject: string,
  score: number,
  totalMarks: number,
  weakAreas: readonly string[],
): GradingResult["corrections"] => {
  const percent = totalMarks > 0 ? (score / totalMarks) * 100 : 0;
  const base = Math.round((percent / 100) * 10);
  const primaryGap = weakAreas[0] ?? "concept clarity";

  return [
    {
      questionNo: "1",
      questionText: `${subject} concept check`,
      studentAnswer: "Attempted with key points",
      correctAnswer: "Complete definition with supporting explanation",
      marksObtained: clampNumber(base + 1, 0, 10),
      maxMarks: 10,
      analysis:
        "Good start. Include one more supporting step to make the answer complete.",
    },
    {
      questionNo: "2",
      questionText: `${subject} application question`,
      studentAnswer: "Partially correct process",
      correctAnswer: "Full process with final conclusion",
      marksObtained: clampNumber(base, 0, 10),
      maxMarks: 10,
      analysis: `Revise ${primaryGap} and practice two similar examples.`,
    },
    {
      questionNo: "3",
      questionText: `${subject} reasoning question`,
      studentAnswer: "Short response with basic reasoning",
      correctAnswer: "Structured reasoning with examples",
      marksObtained: clampNumber(base - 1, 0, 10),
      maxMarks: 10,
      analysis:
        "Reasoning is present but concise. Expand with one clear explanation point.",
    },
  ];
};

const buildSeedResult = (assessment: SeedStudentAssessment): GradingResult => {
  const resultDate = new Date(Date.now() - assessment.daysAgo * 86400000);

  return {
    studentName: assessment.studentName,
    subject: assessment.subject,
    score: assessment.score,
    totalMarks: assessment.totalMarks,
    feedback: assessment.feedback,
    corrections: buildSeedCorrections(
      assessment.subject,
      assessment.score,
      assessment.totalMarks,
      assessment.weakAreas,
    ),
    date: resultDate.toISOString(),
    weakAreas: [...assessment.weakAreas],
    className: assessment.className,
    examType: assessment.examType,
    rollNumber: assessment.rollNumber,
  };
};

let seedingInFlight: Promise<void> | null = null;

// Ensure a default school and class exist for auto-created students
async function ensureDefaultSchoolAndClass() {
  let school = await prisma.school.findFirst({
    where: { code: "DEFAULT" },
  });

  if (!school) {
    school = await prisma.school.create({
      data: {
        name: "Default School",
        code: "DEFAULT",
        defaultLanguage: "MARATHI",
      },
    });
  }

  let defaultClass = await prisma.class.findFirst({
    where: {
      schoolId: school.id,
      name: "Default",
      academicYear: new Date().getFullYear().toString(),
    },
  });

  if (!defaultClass) {
    defaultClass = await prisma.class.create({
      data: {
        schoolId: school.id,
        name: "Default",
        academicYear: new Date().getFullYear().toString(),
      },
    });
  }

  return { school, defaultClass };
}

// Find or create a student by name, with class-aware resolution
async function findOrCreateStudent(
  studentName: string,
  className?: string,
  rollNumber?: string,
): Promise<string> {
  const { school, defaultClass } = await ensureDefaultSchoolAndClass();

  // ── Resolve the correct class (or fall back to "Default") ──
  let targetClass = defaultClass;
  if (className && className.trim()) {
    const normalizedClassName = className.trim();
    let cls = await prisma.class.findFirst({
      where: { schoolId: school.id, name: normalizedClassName },
    });

    if (!cls) {
      cls = await prisma.class.create({
        data: {
          schoolId: school.id,
          name: normalizedClassName,
          academicYear: new Date().getFullYear().toString(),
        },
      });
    }

    targetClass = cls;
  }

  // ── Try to find existing student by name + class (precise match) ──
  let student = await prisma.student.findFirst({
    where: {
      schoolId: school.id,
      name: studentName,
      classId: targetClass.id,
    },
  });

  // ── Fall back to school-wide name match (cross-class) ──
  if (!student) {
    student = await prisma.student.findFirst({
      where: {
        schoolId: school.id,
        name: studentName,
      },
    });
  }

  if (student) {
    // Backfill roll number if we only had a placeholder and now have a real one
    const updates: Record<string, unknown> = {};

    if (rollNumber && student.rollNumber.startsWith("AUTO-")) {
      updates.rollNumber = rollNumber;
    }

    // Move to the correct class if a more specific one was detected
    if (
      student.classId !== targetClass.id &&
      targetClass.id !== defaultClass.id
    ) {
      updates.classId = targetClass.id;
    }

    if (Object.keys(updates).length > 0) {
      await prisma.student.update({
        where: { id: student.id },
        data: updates,
      });
    }

    return student.id;
  }

  // ── Create new student ──
  const existingCount = await prisma.student.count({
    where: { classId: targetClass.id },
  });
  const newRollNumber = rollNumber || `AUTO-${existingCount + 1}`;

  student = await prisma.student.create({
    data: {
      schoolId: school.id,
      classId: targetClass.id,
      name: studentName,
      rollNumber: newRollNumber,
      preferredLanguage: "BILINGUAL",
    },
  });

  return student.id;
}

// Save a grading result to the database
export async function saveGradingResult(result: GradingResult): Promise<{
  studentId: string;
  analysisId: string;
}> {
  const { school } = await ensureDefaultSchoolAndClass();

  // Find or create student
  const studentId = await findOrCreateStudent(
    result.studentName,
    result.className,
    result.rollNumber,
  );

  // Retrieve the student's resolved class so the exam is linked correctly
  const studentRecord = await prisma.student.findUnique({
    where: { id: studentId },
  });
  const resolvedClassId = studentRecord!.classId;

  // Find or create a default subject
  let subject = await prisma.subject.findFirst({
    where: {
      schoolId: school.id,
      name: result.subject,
    },
  });

  if (!subject) {
    subject = await prisma.subject.create({
      data: {
        schoolId: school.id,
        name: result.subject,
        defaultLanguage: "BILINGUAL",
      },
    });
  }

  // Find or create a teacher (use a system teacher for auto-scans)
  let teacher = await prisma.user.findFirst({
    where: { email: "system@tali.local" },
  });

  if (!teacher) {
    teacher = await prisma.user.create({
      data: {
        name: "System",
        email: "system@tali.local",
        emailVerified: true,
        role: "TEACHER",
        schoolId: school.id,
      },
    });
  }

  // Create an exam record for this grading
  const exam = await prisma.exam.create({
    data: {
      title: `${result.subject} - ${result.examType || "Assessment"}`,
      subjectId: subject.id,
      classId: resolvedClassId,
      teacherId: teacher.id,
      examDate: new Date(result.date),
      totalMarks: result.totalMarks,
      outputLanguage: "BILINGUAL",
    },
  });

  // Create an upload record (simulated for direct analysis)
  const upload = await prisma.examPaperUpload.create({
    data: {
      teacherId: teacher.id,
      examId: exam.id,
      fileUrl: "direct-scan",
      processingStatus: "COMPLETED",
      detectedStudentCount: 1,
    },
  });

  // Create the student answer sheet
  const answerSheet = await prisma.studentAnswerSheet.create({
    data: {
      uploadId: upload.id,
      studentId: studentId,
      detectedStudentName: result.studentName,
      detectedRollNumber: result.rollNumber,
      pageRangeStart: 1,
      pageRangeEnd: 1,
      processingStatus: "ANALYZED",
    },
  });

  // Create the answer analysis
  const analysis = await prisma.answerAnalysis.create({
    data: {
      studentAnswerSheetId: answerSheet.id,
      studentScore: result.score,
      strengths: { en: [], mr: [] },
      weakTopics: {
        en: result.weakAreas,
        mr: result.weakAreas,
      },
      conceptualMistakes: { en: [], mr: [] },
      teacherRemarks: {
        en: result.feedback,
        mr: result.feedback,
      },
      answerBreakdown: result.corrections,
      analysisStatus: "FINALIZED",
      outputLanguage: "BILINGUAL",
    },
  });

  return {
    studentId,
    analysisId: analysis.id,
  };
}

export async function seedStudentsData(): Promise<{
  skipped: boolean;
  createdAssessments: number;
  reason?: string;
}> {
  const [studentCount, analysisCount] = await Promise.all([
    prisma.student.count(),
    prisma.answerAnalysis.count(),
  ]);

  if (studentCount > 0 || analysisCount > 0) {
    return {
      skipped: true,
      createdAssessments: 0,
      reason: "Existing student data detected. Seed step skipped.",
    };
  }

  for (const assessment of STUDENT_SEED_ASSESSMENTS) {
    await saveGradingResult(buildSeedResult(assessment));
  }

  return {
    skipped: false,
    createdAssessments: STUDENT_SEED_ASSESSMENTS.length,
  };
}

async function ensureSeededStudentsData(): Promise<void> {
  if (!shouldAutoSeedStudents()) {
    return;
  }

  if (seedingInFlight) {
    return seedingInFlight;
  }

  seedingInFlight = seedStudentsData()
    .then((result) => {
      if (!result.skipped) {
        console.info(
          `Seeded ${result.createdAssessments} initial student assessments.`,
        );
      }
    })
    .catch((error) => {
      console.error("Student auto-seeding failed:", error);
    })
    .finally(() => {
      seedingInFlight = null;
    });

  return seedingInFlight;
}

// Save a learning plan for an analysis
export async function saveLearningPlan(
  analysisId: string,
  plan: LearningPlan,
): Promise<string> {
  const existing = await prisma.learningImprovementPlan.findUnique({
    where: { analysisId },
  });

  if (existing) {
    await prisma.learningImprovementPlan.update({
      where: { id: existing.id },
      data: {
        activities: plan.activities,
        recommendedStudySchedule: {
          timeline: plan.timeline,
          dailyTime: plan.dailyTime,
        },
      },
    });
    return existing.id;
  }

  const lip = await prisma.learningImprovementPlan.create({
    data: {
      analysisId,
      activities: plan.activities,
      recommendedStudySchedule: {
        timeline: plan.timeline,
        dailyTime: plan.dailyTime,
      },
      outputLanguage: "BILINGUAL",
    },
  });

  return lip.id;
}

// Get all students with their stats
export async function getAllStudents(): Promise<
  Array<{
    id: string;
    name: string;
    rollNumber: string;
    className: string;
    testCount: number;
    averageScore: number;
    lastTestDate: string | null;
  }>
> {
  await ensureSeededStudentsData();

  const students = await prisma.student.findMany({
    include: {
      class: true,
      answerSheets: {
        include: {
          analyses: {
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return students.map((student) => {
    const analyses = student.answerSheets.flatMap((sheet) => sheet.analyses);
    const scores = analyses.map((a) => Number(a.studentScore));
    const avgScore =
      scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0;
    const lastTest =
      analyses.length > 0
        ? analyses.sort(
            (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
          )[0].createdAt
        : null;

    return {
      id: student.id,
      name: student.name,
      rollNumber: student.rollNumber,
      className: student.class.name,
      testCount: analyses.length,
      averageScore: avgScore,
      lastTestDate: lastTest?.toISOString() || null,
    };
  });
}

// Get student profile with full history
export async function getStudentProfile(studentId: string): Promise<{
  id: string;
  name: string;
  rollNumber: string;
  className: string;
  results: Array<GradingResult & { analysisId: string; studentId: string }>;
  learningPlans: LearningPlan[];
} | null> {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      class: true,
      answerSheets: {
        include: {
          upload: {
            include: {
              exam: {
                include: {
                  subject: true,
                },
              },
            },
          },
          analyses: {
            include: {
              learningImprovementPlan: true,
            },
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
  });

  if (!student) return null;

  const results: Array<
    GradingResult & { analysisId: string; studentId: string }
  > = [];
  const learningPlans: LearningPlan[] = [];

  for (const sheet of student.answerSheets) {
    for (const analysis of sheet.analyses) {
      const exam = sheet.upload.exam;
      const weakTopics = analysis.weakTopics as Record<string, string[]>;
      const remarks = analysis.teacherRemarks as Record<string, string>;
      const breakdown = analysis.answerBreakdown as Array<{
        questionNo: string;
        questionText: string;
        studentAnswer: string;
        correctAnswer: string;
        marksObtained: number;
        maxMarks: number;
        analysis: string;
      }>;

      results.push({
        studentName: student.name,
        subject: exam.subject.name,
        score: Number(analysis.studentScore),
        totalMarks: Number(exam.totalMarks || 0),
        feedback: remarks?.en || remarks?.mr || "",
        corrections: breakdown || [],
        date: analysis.createdAt.toISOString(),
        weakAreas: weakTopics?.en || weakTopics?.mr || [],
        className: student.class.name,
        analysisId: analysis.id,
        studentId: student.id,
      });

      if (analysis.learningImprovementPlan) {
        const lip = analysis.learningImprovementPlan;
        const schedule = lip.recommendedStudySchedule as Record<string, string>;
        const activities = lip.activities as Array<{
          day: number;
          title: string;
          whatIsNeeded: string;
          howToDo: string;
          guidelines: string;
        }>;

        learningPlans.push({
          weakAreas: weakTopics?.en || weakTopics?.mr || [],
          needsTeacherAssistance: false,
          assistanceReason: "",
          activities: activities || [],
          timeline: schedule?.timeline || "",
          dailyTime: schedule?.dailyTime || "",
        });
      }
    }
  }

  return {
    id: student.id,
    name: student.name,
    rollNumber: student.rollNumber,
    className: student.class.name,
    results,
    learningPlans,
  };
}

// Get all grading history (for reports page)
export async function getAllGradingHistory(): Promise<GradingResult[]> {
  await ensureSeededStudentsData();

  const analyses = await prisma.answerAnalysis.findMany({
    include: {
      studentAnswerSheet: {
        include: {
          student: {
            include: {
              class: true,
            },
          },
          upload: {
            include: {
              exam: {
                include: {
                  subject: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return analyses.map((analysis) => {
    const sheet = analysis.studentAnswerSheet;
    const student = sheet.student;
    const exam = sheet.upload.exam;
    const weakTopics = analysis.weakTopics as Record<string, string[]>;
    const remarks = analysis.teacherRemarks as Record<string, string>;
    const breakdown = analysis.answerBreakdown as Array<{
      questionNo: string;
      questionText: string;
      studentAnswer: string;
      correctAnswer: string;
      marksObtained: number;
      maxMarks: number;
      analysis: string;
    }>;

    return {
      studentName: student?.name || sheet.detectedStudentName || "Unknown",
      subject: exam.subject.name,
      score: Number(analysis.studentScore),
      totalMarks: Number(exam.totalMarks || 0),
      feedback: remarks?.en || remarks?.mr || "",
      corrections: breakdown || [],
      date: analysis.createdAt.toISOString(),
      weakAreas: weakTopics?.en || weakTopics?.mr || [],
      className: student?.class?.name,
      analysisId: analysis.id,
      studentId: student?.id,
    };
  });
}

// Get dashboard statistics
export async function getDashboardStats(): Promise<{
  totalStudents: number;
  totalTests: number;
  averageScore: number;
  recentResults: GradingResult[];
  subjectStats: Array<{ subject: string; averageScore: number; count: number }>;
  studentsNeedingAttention: Array<{
    name: string;
    subject: string;
    score: number;
    weakAreas: string[];
  }>;
}> {
  await ensureSeededStudentsData();

  const [studentCount, analysisCount, analyses, subjects] = await Promise.all([
    prisma.student.count(),
    prisma.answerAnalysis.count(),
    prisma.answerAnalysis.findMany({
      include: {
        studentAnswerSheet: {
          include: {
            student: true,
            upload: {
              include: {
                exam: {
                  include: { subject: true },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.subject.findMany(),
  ]);

  // Calculate overall average
  const allScores = analyses.map((a) => Number(a.studentScore));
  const avgScore =
    allScores.length > 0
      ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
      : 0;

  // Calculate per-subject stats
  const subjectMap = new Map<string, { total: number; count: number }>();
  for (const analysis of analyses) {
    const subjectName = analysis.studentAnswerSheet.upload.exam.subject.name;
    const current = subjectMap.get(subjectName) || { total: 0, count: 0 };
    current.total += Number(analysis.studentScore);
    current.count += 1;
    subjectMap.set(subjectName, current);
  }

  const subjectStats = Array.from(subjectMap.entries()).map(
    ([subject, stats]) => ({
      subject,
      averageScore: Math.round(stats.total / stats.count),
      count: stats.count,
    }),
  );

  // Find students needing attention (score < 50%)
  const lowScorers = analyses
    .filter((a) => {
      const totalMarks = Number(a.studentAnswerSheet.upload.exam.totalMarks);
      const pct =
        totalMarks > 0 ? (Number(a.studentScore) / totalMarks) * 100 : 0;
      return pct < 50;
    })
    .slice(0, 5);

  const studentsNeedingAttention = lowScorers.map((a) => {
    const weakTopics = a.weakTopics as Record<string, string[]>;
    return {
      name:
        a.studentAnswerSheet.student?.name ||
        a.studentAnswerSheet.detectedStudentName ||
        "Unknown",
      subject: a.studentAnswerSheet.upload.exam.subject.name,
      score: Number(a.studentScore),
      weakAreas: weakTopics?.en || weakTopics?.mr || [],
    };
  });

  // Recent results
  const recentResults = analyses.slice(0, 5).map((analysis) => {
    const sheet = analysis.studentAnswerSheet;
    const student = sheet.student;
    const exam = sheet.upload.exam;
    const weakTopics = analysis.weakTopics as Record<string, string[]>;
    const remarks = analysis.teacherRemarks as Record<string, string>;

    return {
      studentName: student?.name || sheet.detectedStudentName || "Unknown",
      subject: exam.subject.name,
      score: Number(analysis.studentScore),
      totalMarks: Number(exam.totalMarks || 0),
      feedback: remarks?.en || remarks?.mr || "",
      corrections: [],
      date: analysis.createdAt.toISOString(),
      weakAreas: weakTopics?.en || weakTopics?.mr || [],
    };
  });

  return {
    totalStudents: studentCount,
    totalTests: analysisCount,
    averageScore: avgScore,
    recentResults,
    subjectStats,
    studentsNeedingAttention,
  };
}
