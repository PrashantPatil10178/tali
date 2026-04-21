"use client";

import { useEffect, useState } from "react";
import { getDashboardStats } from "@tali/gemini/client";
import type { GradingResult } from "@tali/types";

interface SubjectStat {
  subject: string;
  averageScore: number;
  count: number;
}

interface StudentAttention {
  name: string;
  subject: string;
  score: number;
  weakAreas: string[];
}

export interface DashboardStatsData {
  totalStudents: number;
  totalTests: number;
  averageScore: number;
  recentResults: GradingResult[];
  subjectStats: SubjectStat[];
  studentsNeedingAttention: StudentAttention[];
}

const EMPTY_STATS: DashboardStatsData = {
  totalStudents: 0,
  totalTests: 0,
  averageScore: 0,
  recentResults: [],
  subjectStats: [],
  studentsNeedingAttention: [],
};

let cachedStats: DashboardStatsData | null = null;
let inFlightRequest: Promise<DashboardStatsData> | null = null;

const toNumber = (value: unknown): number => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return 0;
  }

  return value;
};

const normalizeStats = (
  response: Awaited<ReturnType<typeof getDashboardStats>>,
): DashboardStatsData => {
  return {
    totalStudents: toNumber(response.totalStudents),
    totalTests: toNumber(response.totalTests),
    averageScore: toNumber(response.averageScore),
    recentResults: Array.isArray(response.recentResults)
      ? response.recentResults
      : [],
    subjectStats: Array.isArray(response.subjectStats)
      ? response.subjectStats
      : [],
    studentsNeedingAttention: Array.isArray(response.studentsNeedingAttention)
      ? response.studentsNeedingAttention
      : [],
  };
};

const fetchDashboardStats = async (): Promise<DashboardStatsData> => {
  if (cachedStats) {
    return cachedStats;
  }

  if (inFlightRequest) {
    return inFlightRequest;
  }

  inFlightRequest = getDashboardStats()
    .then((response) => {
      if (!response.success) {
        throw new Error(response.error || "Failed to load dashboard stats.");
      }

      const normalized = normalizeStats(response);
      cachedStats = normalized;
      return normalized;
    })
    .finally(() => {
      inFlightRequest = null;
    });

  return inFlightRequest;
};

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStatsData>(
    cachedStats || EMPTY_STATS,
  );
  const [isLoading, setIsLoading] = useState<boolean>(!cachedStats);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (cachedStats) {
      setStats(cachedStats);
      setIsLoading(false);
      return () => {
        isMounted = false;
      };
    }

    const load = async () => {
      setIsLoading(true);
      try {
        const nextStats = await fetchDashboardStats();
        if (!isMounted) {
          return;
        }

        setStats(nextStats);
        setError(null);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setStats(EMPTY_STATS);
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load dashboard stats.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    stats,
    isLoading,
    error,
  };
}
