import StudentDetailViewPage from "@/features/students/components/student-detail-view-page";

interface StudentDetailPageProps {
  readonly params: {
    readonly studentId: string;
  };
}

export default function Page({ params }: StudentDetailPageProps) {
  return <StudentDetailViewPage studentId={params.studentId} />;
}
