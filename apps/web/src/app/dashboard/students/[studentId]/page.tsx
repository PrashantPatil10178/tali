import StudentDetailViewPage from "@/features/students/components/student-detail-view-page";
import { use } from "react";

interface StudentDetailPageProps {
  readonly params: Promise<{
    readonly studentId: string;
  }>;
}

export default function Page({ params }: StudentDetailPageProps) {
  const { studentId } = use(params);
  return <StudentDetailViewPage studentId={studentId} />;
}
