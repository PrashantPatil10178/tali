"use client";

import { LabelList, Pie, PieChart } from "recharts";
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
import { useDashboardStats } from "./use-dashboard-stats";

const chartConfig = {
  tests: {
    label: "Tests",
  },
} satisfies ChartConfig;

export function PieGraph() {
  const { stats, isLoading } = useDashboardStats();
  const hasData = stats.subjectStats.length > 0;

  const chartData = useMemo(() => {
    if (!hasData) {
      return [{ subject: "No Data", tests: 1, fill: "var(--muted)" }];
    }

    return stats.subjectStats.map((subject, index) => ({
      subject: subject.subject,
      tests: subject.count,
      fill: `var(--chart-${(index % 5) + 1})`,
    }));
  }, [hasData, stats.subjectStats]);

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>
          Subject Test Share
          <Badge variant="outline">
            {hasData ? <Icons.trendingUp /> : <Icons.trendingDown />}
            {isLoading ? "Loading" : `${stats.totalTests} tests`}
          </Badge>
        </CardTitle>
        <CardDescription>
          {hasData
            ? "Distribution of analyzed tests by subject"
            : "No subject distribution data yet"}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 items-center justify-center pb-0">
        <ChartContainer
          config={chartConfig}
          className="[&_.recharts-text]:fill-background mx-auto aspect-square max-h-75 min-h-62.5"
        >
          <PieChart>
            <ChartTooltip
              content={<ChartTooltipContent nameKey="tests" hideLabel />}
            />
            <Pie
              data={chartData}
              innerRadius={30}
              dataKey="tests"
              nameKey="subject"
              radius={10}
              cornerRadius={8}
              paddingAngle={4}
            >
              <LabelList
                dataKey="tests"
                stroke="none"
                fontSize={12}
                fontWeight={500}
                fill="currentColor"
                formatter={(value: number) => value.toString()}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
