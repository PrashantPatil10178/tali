import { prisma } from "@tali/database/client";
import { seedStudentsData } from "../modules/students/service";

const run = async (): Promise<void> => {
  try {
    const result = await seedStudentsData();

    if (result.skipped) {
      console.info(result.reason ?? "Student seed skipped.");
      return;
    }

    console.info(
      `Seeded ${result.createdAssessments} student assessments successfully.`,
    );
  } catch (error) {
    console.error("Student seed failed:", error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
};

void run();
