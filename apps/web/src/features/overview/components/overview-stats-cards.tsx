"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Icons } from "@/components/icons";
import { useDashboardStats } from "./use-dashboard-stats";

const metricValue = (value: number, suffix = ""): string => {
  return `${value.toLocaleString()}${suffix}`;
};

export function OverviewStatsCards() {
  const { stats, isLoading } = useDashboardStats();
  const attentionCount = stats.studentsNeedingAttention.length;

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:shadow-xs md:grid-cols-2 lg:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Students</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {isLoading ? "..." : metricValue(stats.totalStudents)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <Icons.trendingUp />
              Active
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Learners tracked in your workspace
          </div>
          <div className="text-muted-foreground">
            Updated from the student database
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Tests</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {isLoading ? "..." : metricValue(stats.totalTests)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <Icons.trendingUp />
              Live
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Answer sheets evaluated so far
          </div>
          <div className="text-muted-foreground">
            Auto-synced from report history
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Average Score</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {isLoading
              ? "..."
              : metricValue(Math.round(stats.averageScore), "%")}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {stats.averageScore >= 50 ? (
                <Icons.trendingUp />
              ) : (
                <Icons.trendingDown />
              )}
              Class
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Overall class performance snapshot
          </div>
          <div className="text-muted-foreground">
            Based on all analyzed assessments
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Needs Attention</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {isLoading ? "..." : metricValue(attentionCount)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {attentionCount > 0 ? (
                <Icons.trendingDown />
              ) : (
                <Icons.trendingUp />
              )}
              Priority
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Students flagged for follow-up
          </div>
          <div className="text-muted-foreground">
            Scores below expected threshold
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
