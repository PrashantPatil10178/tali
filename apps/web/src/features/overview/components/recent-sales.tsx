"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useDashboardStats } from "./use-dashboard-stats";

const getInitials = (value: string): string => {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
};

const formatDate = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
  }).format(date);
};

export function RecentSales() {
  const { stats } = useDashboardStats();

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Recent Assessments</CardTitle>
        <CardDescription>
          {stats.totalTests} analyzed tests in total.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {stats.recentResults.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No recent assessments yet.
            </p>
          ) : null}
          {stats.recentResults.map((result, index) => (
            <div
              key={`${result.studentName}-${result.date}-${index}`}
              className="flex items-center"
            >
              <Avatar className="h-9 w-9">
                <AvatarImage src="" alt="Student avatar" />
                <AvatarFallback>
                  {getInitials(result.studentName || "Unknown Student")}
                </AvatarFallback>
              </Avatar>
              <div className="ml-4 space-y-1">
                <p className="text-sm leading-none font-medium">
                  {result.studentName || "Unknown Student"}
                </p>
                <p className="text-muted-foreground text-sm">
                  {result.subject} • {formatDate(result.date)}
                </p>
              </div>
              <div className="ml-auto font-medium">
                {result.score}/{result.totalMarks}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
