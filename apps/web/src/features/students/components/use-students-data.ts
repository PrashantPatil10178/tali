"use client";

import { useEffect, useState } from "react";
import { getAllStudents, type StudentListItem } from "@tali/gemini/client";

interface StudentsState {
  readonly students: StudentListItem[];
  readonly isLoading: boolean;
  readonly error: string | null;
}

const EMPTY_STUDENTS: StudentListItem[] = [];

let studentsCache: StudentListItem[] | null = null;
let studentsRequestInFlight: Promise<StudentListItem[]> | null = null;

const fetchStudents = async (): Promise<StudentListItem[]> => {
  if (studentsCache) {
    return studentsCache;
  }

  if (studentsRequestInFlight) {
    return studentsRequestInFlight;
  }

  studentsRequestInFlight = getAllStudents()
    .then((response) => {
      if (!response.success) {
        throw new Error(response.error || "Unable to fetch student roster.");
      }

      const normalized = Array.isArray(response.students)
        ? response.students
        : EMPTY_STUDENTS;
      studentsCache = normalized;
      return normalized;
    })
    .finally(() => {
      studentsRequestInFlight = null;
    });

  return studentsRequestInFlight;
};

const sortByName = (
  students: readonly StudentListItem[],
): StudentListItem[] => {
  return [...students].sort((left, right) => {
    return left.name.localeCompare(right.name, "en", { sensitivity: "base" });
  });
};

export function useStudentsData(): StudentsState {
  const [students, setStudents] = useState<StudentListItem[]>(
    studentsCache ?? EMPTY_STUDENTS,
  );
  const [isLoading, setIsLoading] = useState<boolean>(!studentsCache);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadStudents = async (): Promise<void> => {
      setIsLoading(true);

      try {
        const nextStudents = await fetchStudents();
        if (!isMounted) {
          return;
        }

        setStudents(sortByName(nextStudents));
        setError(null);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setStudents(EMPTY_STUDENTS);
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to fetch student roster.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadStudents();

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    students,
    isLoading,
    error,
  };
}
