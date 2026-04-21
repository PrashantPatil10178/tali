"use client";

import { Bar, BarChart, XAxis } from "recharts";
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
  assessments: {
    label: "Assessments",
    color: "var(--chart-1)",
  },
  avgScore: {
    label: "Avg Score",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

export function BarGraph() {
  const { stats, isLoading } = useDashboardStats();

  const chartData = useMemo(() => {
    if (stats.subjectStats.length === 0) {
      return [{ subject: "No Data", assessments: 0, avgScore: 0 }];
    }

    return stats.subjectStats.slice(0, 6).map((subject) => ({
      subject: subject.subject,
      assessments: subject.count,
      avgScore: Math.round(subject.averageScore),
    }));
  }, [stats.subjectStats]);

  const hasSubjectData = stats.subjectStats.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Subject Performance
          <Badge variant="outline">
            {hasSubjectData ? <Icons.trendingUp /> : <Icons.trendingDown />}
            {isLoading ? "Loading" : `${stats.subjectStats.length} subjects`}
          </Badge>
        </CardTitle>
        <CardDescription>
          {hasSubjectData
            ? "Assessment count and average score by subject"
            : "No subject analytics available yet"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={chartData}>
            <rect
              x="0"
              y="0"
              width="100%"
              height="85%"
              fill="url(#default-multiple-pattern-dots)"
            />
            <defs>
              <DottedBackgroundPattern />
            </defs>
            <XAxis
              dataKey="subject"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => String(value).slice(0, 8)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dashed" hideLabel />}
            />
            <Bar
              dataKey="assessments"
              color="var(--chart-1)"
              fill="var(--color-assessments)"
              shape={<CustomHatchedBar isHatched={false} />}
              radius={4}
            />
            <Bar
              dataKey="avgScore"
              fill="var(--color-avgScore)"
              shape={<CustomHatchedBar />}
              radius={4}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

const CustomHatchedBar = (
  props: React.SVGProps<SVGRectElement> & {
    dataKey?: string;
    isHatched?: boolean;
  },
) => {
  const { fill, x, y, width, height, dataKey } = props;

  const isHatched = props.isHatched ?? true;
  const safeKey = String(dataKey || "series");

  return (
    <>
      <rect
        rx={4}
        x={x}
        y={y}
        width={width}
        height={height}
        stroke="none"
        fill={isHatched ? `url(#hatched-bar-pattern-${safeKey})` : fill}
      />
      <defs>
        <pattern
          key={safeKey}
          id={`hatched-bar-pattern-${safeKey}`}
          x="0"
          y="0"
          width="5"
          height="5"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(-45)"
        >
          <rect width="10" height="10" opacity={0.5} fill={fill}></rect>
          <rect width="1" height="10" fill={fill}></rect>
        </pattern>
      </defs>
    </>
  );
};
const DottedBackgroundPattern = () => {
  return (
    <pattern
      id="default-multiple-pattern-dots"
      x="0"
      y="0"
      width="10"
      height="10"
      patternUnits="userSpaceOnUse"
    >
      <circle
        className="dark:text-muted/40 text-muted"
        cx="2"
        cy="2"
        r="1"
        fill="currentColor"
      />
    </pattern>
  );
};
