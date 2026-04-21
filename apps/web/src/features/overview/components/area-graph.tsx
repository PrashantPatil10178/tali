"use client";

import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { useMemo } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import { Icons } from "@/components/icons";
import React from "react";
import { useDashboardStats } from "./use-dashboard-stats";

const chartConfig = {
  scorePercent: {
    label: "Score %",
    color: "var(--chart-1)",
  },
  weakTopics: {
    label: "Weak Topics",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

export function AreaGraph() {
  const { stats, isLoading } = useDashboardStats();

  const chartData = useMemo(() => {
    if (stats.recentResults.length === 0) {
      return [{ assessment: "N/A", scorePercent: 0, weakTopics: 0 }];
    }

    return [...stats.recentResults]
      .sort((first, second) => {
        return new Date(first.date).getTime() - new Date(second.date).getTime();
      })
      .map((result, index) => {
        const maxMarks = Math.max(result.totalMarks, 1);
        return {
          assessment: `T${index + 1}`,
          scorePercent: Math.round((result.score / maxMarks) * 100),
          weakTopics: result.weakAreas.length,
        };
      });
  }, [stats.recentResults]);

  const hasResults = stats.recentResults.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Assessment Trend
          <Badge variant="outline">
            {hasResults ? <Icons.trendingUp /> : <Icons.trendingDown />}
            {isLoading ? "Loading" : `${stats.recentResults.length} results`}
          </Badge>
        </CardTitle>
        <CardDescription>
          {hasResults
            ? "Score progression and weak-topic count in recent tests"
            : "No recent assessments yet"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <AreaChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="assessment"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => String(value)}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <defs>
              <DottedBackgroundPattern config={chartConfig} />
            </defs>
            <Area
              dataKey="weakTopics"
              type="natural"
              fill="url(#dotted-background-pattern-weakTopics)"
              fillOpacity={0.4}
              stroke="var(--color-weakTopics)"
              strokeWidth={0.8}
            />
            <Area
              dataKey="scorePercent"
              type="natural"
              fill="url(#dotted-background-pattern-scorePercent)"
              fillOpacity={0.4}
              stroke="var(--color-scorePercent)"
              strokeWidth={0.8}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

const DottedBackgroundPattern = ({ config }: { config: ChartConfig }) => {
  const items = Object.fromEntries(
    Object.entries(config).map(([key, value]) => [key, value.color]),
  );
  return (
    <>
      {Object.entries(items).map(([key, value]) => (
        <pattern
          key={key}
          id={`dotted-background-pattern-${key}`}
          x="0"
          y="0"
          width="7"
          height="7"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="5" cy="5" r="1.5" fill={value} opacity={0.5}></circle>
        </pattern>
      ))}
    </>
  );
};
