'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi, type DashboardData } from '@/lib/api/dashboard';
import { insightsApi, type InsightsData, type Insight, type Correlation } from '@/lib/api/insights';
import { profileApi } from '@/lib/api/auth';
import type { UserProfile } from '@/types/profile';
import {
  Activity,
  LineChartUp01,
  Heart,
  Edit01,
  Target01,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  Zap,
  Beaker01,
  Check,
  Clock,
} from '@untitled-ui/icons-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  Legend,
} from 'recharts';
import { format, parseISO, formatDistanceToNow } from 'date-fns';

type TimePeriod = 'day' | 'week' | 'month' | 'year';

const PERIOD_OPTIONS: { label: string; value: TimePeriod }[] = [
  { label: 'Day', value: 'day' },
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
  { label: 'Year', value: 'year' },
];

const PIE_COLORS = ['#7c3aed', '#3b82f6', '#f59e0b'];

const SEVERITY_BORDER: Record<string, string> = {
  POSITIVE: 'border-l-success',
  WARNING: 'border-l-warning',
  NEGATIVE: 'border-l-danger',
  INFO: 'border-l-info',
};

const SEVERITY_DOT: Record<string, string> = {
  POSITIVE: 'bg-success',
  WARNING: 'bg-warning',
  NEGATIVE: 'bg-danger',
  INFO: 'bg-info',
};

const SENTIMENT_BORDER: Record<string, string> = {
  POSITIVE: 'border-l-success',
  NEGATIVE: 'border-l-danger',
  NEUTRAL: 'border-l-info',
};

const GRADE_CONFIG: Record<string, { color: string; bgRing: string; textColor: string }> = {
  A: { color: '#10b981', bgRing: 'text-success', textColor: 'text-success' },
  B: { color: '#3b82f6', bgRing: 'text-info', textColor: 'text-info' },
  C: { color: '#f59e0b', bgRing: 'text-warning', textColor: 'text-warning' },
  D: { color: '#f97316', bgRing: 'text-orange-500', textColor: 'text-orange-500' },
  F: { color: '#ef4444', bgRing: 'text-danger', textColor: 'text-danger' },
};

function getGradeFromScore(score: string): string {
  const letter = score.charAt(0).toUpperCase();
  if (GRADE_CONFIG[letter]) return letter;
  return 'C';
}


function CircularGauge({ grade, size = 160 }: { grade: string; size?: number }) {
  const config = GRADE_CONFIG[grade] || GRADE_CONFIG.C;
  const gradeValues: Record<string, number> = { A: 90, B: 75, C: 60, D: 45, F: 25 };
  const pct = gradeValues[grade] ?? 50;
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--card-border)"
          strokeWidth="10"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={config.color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-extrabold" style={{ color: config.color }}>
          {grade}
        </span>
        <span className="text-xs text-muted font-medium mt-0.5">{pct}/100</span>
      </div>
    </div>
  );
}


function MiniCircular({ pct, size = 40 }: { pct: number; size?: number }) {
  const clamped = Math.min(100, Math.max(0, pct));
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;
  const color = clamped >= 80 ? '#10b981' : clamped >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--card-border)"
          strokeWidth="3"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] font-bold text-foreground">{Math.round(clamped)}%</span>
      </div>
    </div>
  );
}


function TrendArrow({ value, suffix = '%', invert = false }: { value: number; suffix?: string; invert?: boolean }) {
  const isPositive = invert ? value < 0 : value > 0;
  const isNeutral = value === 0;

  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-medium ${
        isNeutral ? 'text-muted' : isPositive ? 'text-success' : 'text-danger'
      }`}
    >
      {value > 0 ? (
        <ArrowUp className="h-3 w-3" />
      ) : value < 0 ? (
        <ArrowDown className="h-3 w-3" />
      ) : null}
      {value > 0 ? '+' : ''}
      {value.toFixed(1)}{suffix}
    </span>
  );
}


function MetricCard({
  icon: Icon,
  label,
  value,
  subtext,
  trend,
  trendInvert,
  trendSuffix,
  rightSlot,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  subtext?: string;
  trend?: number;
  trendInvert?: boolean;
  trendSuffix?: string;
  rightSlot?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-card-border bg-card-bg p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted">{label}</p>
            <p className="text-xl font-bold text-foreground tabular-nums">{value}</p>
          </div>
        </div>
        {rightSlot}
      </div>
      {(trend !== undefined || subtext) && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          {trend !== undefined && (
            <TrendArrow value={trend} invert={trendInvert} suffix={trendSuffix ?? '%'} />
          )}
          {subtext && <span className="text-muted">{subtext}</span>}
        </div>
      )}
    </div>
  );
}


function InsightCard({ insight }: { insight: Insight }) {
  return (
    <div
      className={`rounded-lg border border-card-border bg-card-bg p-4 border-l-4 shadow-sm ${SEVERITY_BORDER[insight.severity] || 'border-l-info'}`}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${SEVERITY_DOT[insight.severity] || 'bg-info'}`} />
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold text-foreground">{insight.title}</h4>
          <p className="mt-1 text-xs text-muted leading-relaxed">{insight.message}</p>
          {insight.actionLink && insight.actionLabel && (
            <Link
              href={insight.actionLink}
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-dark transition-colors"
            >
              {insight.actionLabel}
              <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}


function CorrelationCard({ correlation }: { correlation: Correlation }) {
  const trendIcon =
    correlation.trend === 'UP' ? (
      <ArrowUp className="h-4 w-4" />
    ) : correlation.trend === 'DOWN' ? (
      <ArrowDown className="h-4 w-4" />
    ) : (
      <span className="text-xs font-medium">--</span>
    );

  const trendColor =
    correlation.sentiment === 'POSITIVE'
      ? 'text-success'
      : correlation.sentiment === 'NEGATIVE'
        ? 'text-danger'
        : 'text-muted';

  return (
    <div
      className={`rounded-lg border border-card-border bg-card-bg p-4 border-l-4 shadow-sm ${SENTIMENT_BORDER[correlation.sentiment] || 'border-l-info'}`}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-semibold text-foreground">{correlation.title}</h4>
        <span className={`shrink-0 ${trendColor}`}>{trendIcon}</span>
      </div>
      <p className="mt-1 text-xs text-muted leading-relaxed">{correlation.description}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {correlation.modules.map((mod) => (
          <span
            key={mod}
            className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary"
          >
            {mod}
          </span>
        ))}
      </div>
    </div>
  );
}


function ChartCard({ title, children, height = 240 }: { title: string; children: React.ReactNode; height?: number }) {
  return (
    <div className="rounded-xl border border-card-border bg-card-bg p-4 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-foreground">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        {children as React.ReactElement}
      </ResponsiveContainer>
    </div>
  );
}

function ChartEmpty({ message }: { message: string }) {
  return (
    <div className="flex h-[240px] items-center justify-center text-sm text-muted">
      {message}
    </div>
  );
}


const TOOLTIP_STYLE = {
  backgroundColor: 'var(--card-bg)',
  border: '1px solid var(--card-border)',
  borderRadius: '8px',
  fontSize: '12px',
};


function ActivityItem({
  icon: Icon,
  description,
  timestamp,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  timestamp: string;
  href: string;
}) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-sidebar-bg/60 transition-colors">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-foreground truncate">{description}</p>
        <p className="text-xs text-muted">{timestamp}</p>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-muted" />
    </Link>
  );
}


function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="lg:col-span-3 h-48 animate-pulse rounded-xl border border-card-border bg-card-bg" />
        <div className="h-48 animate-pulse rounded-xl border border-card-border bg-card-bg" />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl border border-card-border bg-card-bg" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="h-80 animate-pulse rounded-xl border border-card-border bg-card-bg" />
        <div className="h-80 animate-pulse rounded-xl border border-card-border bg-card-bg" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-72 animate-pulse rounded-xl border border-card-border bg-card-bg" />
        ))}
      </div>
    </div>
  );
}


function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <AlertCircle className="h-12 w-12 text-muted-light" />
      <h3 className="mt-4 text-lg font-semibold text-foreground">Not enough data yet</h3>
      <p className="mt-1 text-sm text-muted">
        Start tracking your workouts, nutrition, and wellness to see your dashboard come to life.
      </p>
    </div>
  );
}


export default function DashboardPage() {
  const [period, setPeriod] = useState<TimePeriod>('week');

  const { data: dashData, isLoading: dashLoading } = useQuery<DashboardData>({
    queryKey: ['dashboard', period],
    queryFn: () => dashboardApi.get({ period }),
  });

  const { data: insightsData, isLoading: insightsLoading } = useQuery<InsightsData>({
    queryKey: ['insights'],
    queryFn: () => insightsApi.get(),
  });

  const { data: profile } = useQuery<UserProfile>({
    queryKey: ['profile'],
    queryFn: () => profileApi.get(),
  });

  const isLoading = dashLoading || insightsLoading;

  if (isLoading) return <LoadingSkeleton />;
  if (!dashData) return <EmptyState />;

  const hasAnyData =
    dashData.workouts.totalSessions > 0 ||
    dashData.nutrition.daysLogged > 0 ||
    dashData.journal.entriesCount > 0;

  if (!hasAnyData) return <EmptyState />;

  const grade = insightsData ? getGradeFromScore(insightsData.overallScore) : 'C';
  const targets = profile?.recommendedTargets ?? null;

  const calorieTarget = targets?.calories ?? null;
  const calorieDiff = calorieTarget
    ? ((dashData.nutrition.avgCalories - calorieTarget) / calorieTarget) * 100
    : null;
  const calorieCloseToTarget = calorieDiff !== null && Math.abs(calorieDiff) <= 10;

  const frequencyData = dashData.workouts.frequencyByDay.map((d) => ({
    date: format(parseISO(d.date), 'MMM d'),
    sessions: d.count,
  }));

  const weightData = dashData.metrics.weightTrend.map((d) => ({
    date: format(parseISO(d.date), 'MMM d'),
    weight: d.value,
  }));

  const macroData = [
    { name: 'Protein', value: Math.round(dashData.nutrition.avgProteinG), color: '#7c3aed' },
    { name: 'Carbs', value: Math.round(dashData.nutrition.avgCarbsG), color: '#3b82f6' },
    { name: 'Fat', value: Math.round(dashData.nutrition.avgFatG), color: '#f59e0b' },
  ];
  const macroTotal = macroData.reduce((s, m) => s + m.value, 0);

  const realmData = Object.entries(dashData.journal.realmAverages).map(([realm, avg]) => ({
    realm: realm.charAt(0) + realm.slice(1).toLowerCase(),
    value: avg,
  }));

  const calorieTrendData = dashData.nutrition.dailyCalories.map((d) => ({
    date: format(parseISO(d.date), 'MMM d'),
    calories: Math.round(d.calories),
  }));

  const habitCompletionPct = Math.round(dashData.habits.overallCompletionRate * 100);

  const weightGoalLine =
    profile?.dietGoal === 'CUT' || profile?.dietGoal === 'BULK'
      ? profile.weightKg
      : null;

  const activityItems: {
    icon: React.ComponentType<{ className?: string }>;
    description: string;
    timestamp: string;
    href: string;
    sortDate: string;
  }[] = [];

  dashData.workouts.frequencyByDay.forEach((d) => {
    if (d.count > 0) {
      activityItems.push({
        icon: Zap,
        description: `${d.count} workout session${d.count > 1 ? 's' : ''} completed`,
        timestamp: formatDistanceToNow(parseISO(d.date), { addSuffix: true }),
        href: '/workouts',
        sortDate: d.date,
      });
    }
  });

  dashData.nutrition.dailyCalories.forEach((d) => {
    if (d.calories > 0) {
      activityItems.push({
        icon: Heart,
        description: `Logged ${Math.round(d.calories)} kcal`,
        timestamp: formatDistanceToNow(parseISO(d.date), { addSuffix: true }),
        href: '/nutrition',
        sortDate: d.date,
      });
    }
  });

  dashData.journal.ratingTrend.forEach((d) => {
    activityItems.push({
      icon: Edit01,
      description: `Journal entry rated ${d.overall_rating.toFixed(1)}/10`,
      timestamp: formatDistanceToNow(parseISO(d.date), { addSuffix: true }),
      href: '/journal',
      sortDate: d.date,
    });
  });

  if (dashData.therapeutics.completedCount > 0) {
    activityItems.push({
      icon: Beaker01,
      description: `${dashData.therapeutics.completedCount} therapeutic doses taken this period`,
      timestamp: 'This period',
      href: '/therapeutics',
      sortDate: '',
    });
  }

  if (dashData.habits.activeHabits > 0) {
    activityItems.push({
      icon: Check,
      description: `${dashData.habits.activeHabits} active habits tracked (${habitCompletionPct}% completion)`,
      timestamp: 'This period',
      href: '/habits',
      sortDate: '',
    });
  }

  const recentActivity = activityItems
    .sort((a, b) => (b.sortDate > a.sortDate ? 1 : -1))
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
        <div className="flex-1 rounded-xl border border-card-border bg-card-bg p-6 shadow-sm">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
            <CircularGauge grade={grade} size={140} />
            <div className="text-center sm:text-left">
              <h2 className="text-lg font-bold text-foreground">Overall Health Score</h2>
              {insightsData?.overallSummary && (
                <p className="mt-2 text-sm text-muted leading-relaxed max-w-md">
                  {insightsData.overallSummary}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:w-72">
          <div className="rounded-xl border border-card-border bg-card-bg p-4 shadow-sm">
            <p className="text-xs font-medium text-muted mb-3">Time Period</p>
            <div className="grid grid-cols-2 gap-1.5">
              {PERIOD_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setPeriod(opt.value)}
                  className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                    period === opt.value
                      ? 'bg-primary text-white shadow-sm'
                      : 'border border-card-border text-muted hover:text-foreground hover:bg-sidebar-bg'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-card-border bg-card-bg p-4 shadow-sm flex-1">
            <p className="text-xs font-medium text-muted mb-2">Quick Stats</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">PRs this period</span>
                <span className="font-semibold text-foreground tabular-nums">{dashData.workouts.newPrs}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">Total volume</span>
                <span className="font-semibold text-foreground tabular-nums">
                  {dashData.workouts.totalVolumeKg > 0
                    ? `${(dashData.workouts.totalVolumeKg / 1000).toFixed(1)}t`
                    : '--'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">Therapeutics adherence</span>
                <span className="font-semibold text-foreground tabular-nums">
                  {Math.round(dashData.therapeutics.adherenceRate * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <MetricCard
          icon={Zap}
          label="Total Workouts"
          value={String(dashData.workouts.totalSessions)}
          subtext="vs prev period"
        />
        <MetricCard
          icon={Heart}
          label="Avg Daily Calories"
          value={
            dashData.nutrition.avgCalories
              ? Math.round(dashData.nutrition.avgCalories).toLocaleString()
              : '--'
          }
          trend={calorieDiff ?? undefined}
          trendSuffix="% from target"
          subtext={calorieTarget ? `Target: ${calorieTarget.toLocaleString()}` : undefined}
        />
        <MetricCard
          icon={LineChartUp01}
          label="Current Weight"
          value={
            dashData.metrics.currentWeight
              ? profile?.unitSystem === 'IMPERIAL'
                ? `${(dashData.metrics.currentWeight * 2.20462).toFixed(1)} lbs`
                : `${dashData.metrics.currentWeight.toFixed(1)} kg`
              : '--'
          }
          trend={dashData.metrics.weightChange ? (profile?.unitSystem === 'IMPERIAL' ? dashData.metrics.weightChange * 2.20462 : dashData.metrics.weightChange) : undefined}
          trendInvert={profile?.dietGoal === 'CUT'}
          trendSuffix={profile?.unitSystem === 'IMPERIAL' ? ' lbs' : ' kg'}
          subtext="vs prev period"
        />
        <MetricCard
          icon={Target01}
          label="Habit Completion"
          value={`${habitCompletionPct}%`}
          rightSlot={<MiniCircular pct={habitCompletionPct} />}
          subtext={`${dashData.habits.longestStreak}d longest streak`}
        />
        <MetricCard
          icon={Edit01}
          label="Journal Avg Score"
          value={
            dashData.journal.avgOverallRating
              ? `${dashData.journal.avgOverallRating.toFixed(1)} / 10`
              : '--'
          }
          subtext={`${dashData.journal.entriesCount} entries`}
        />
      </div>

      {insightsData && (insightsData.insights.length > 0 || insightsData.correlations.length > 0) && (
        <div>
          <h2 className="text-lg font-bold text-foreground mb-4">Insights & Recommendations</h2>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted uppercase tracking-wide">Insights</h3>
              {insightsData.insights.length > 0 ? (
                insightsData.insights.map((insight) => (
                  <InsightCard key={insight.id} insight={insight} />
                ))
              ) : (
                <p className="text-sm text-muted py-4">No insights available for this period.</p>
              )}
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted uppercase tracking-wide">
                Cross-Module Correlations
              </h3>
              {insightsData.correlations.length > 0 ? (
                insightsData.correlations.map((corr) => (
                  <CorrelationCard key={corr.id} correlation={corr} />
                ))
              ) : (
                <p className="text-sm text-muted py-4">
                  Not enough data to identify correlations yet.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-card-border bg-card-bg p-4 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Workout Frequency</h3>
          {frequencyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={frequencyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: 'var(--muted)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'var(--muted)' }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="sessions" fill="var(--primary)" radius={[4, 4, 0, 0]} name="Sessions" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ChartEmpty message="Not enough workout data yet" />
          )}
        </div>

        <div className="rounded-xl border border-card-border bg-card-bg p-4 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-foreground">
            Weight Trend
            {profile?.dietGoal && (
              <span className="ml-2 text-xs font-normal text-muted">
                ({profile.dietGoal.charAt(0) + profile.dietGoal.slice(1).toLowerCase()})
              </span>
            )}
          </h3>
          {weightData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={weightData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: 'var(--muted)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'var(--muted)' }}
                  axisLine={false}
                  tickLine={false}
                  domain={['dataMin - 1', 'dataMax + 1']}
                />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                {weightGoalLine && (
                  <ReferenceLine
                    y={weightGoalLine}
                    stroke="var(--warning)"
                    strokeDasharray="6 3"
                    label={{ value: 'Start', position: 'right', fill: 'var(--muted)', fontSize: 10 }}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: 'var(--primary)' }}
                  name="Weight (kg)"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <ChartEmpty message="No weight data for this period" />
          )}
        </div>

        <div className="rounded-xl border border-card-border bg-card-bg p-4 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Macro Distribution</h3>
          {macroTotal > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={macroData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, value }) => `${name}: ${value}g`}
                >
                  {macroData.map((entry, idx) => (
                    <Cell key={idx} fill={PIE_COLORS[idx]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => [`${value}g`, '']} />
                <Legend
                  wrapperStyle={{ fontSize: '12px' }}
                  formatter={(value: string) => <span className="text-muted text-xs">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <ChartEmpty message="No nutrition data for this period" />
          )}
        </div>

        <div className="rounded-xl border border-card-border bg-card-bg p-4 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Journal Realms</h3>
          {realmData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={realmData} cx="50%" cy="50%" outerRadius={75}>
                <PolarGrid stroke="var(--card-border)" />
                <PolarAngleAxis
                  dataKey="realm"
                  tick={{ fontSize: 10, fill: 'var(--muted)' }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 10]}
                  tick={{ fontSize: 9, fill: 'var(--muted-light)' }}
                />
                <Radar
                  dataKey="value"
                  stroke="var(--primary)"
                  fill="var(--primary)"
                  fillOpacity={0.2}
                  strokeWidth={2}
                  name="Score"
                />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <ChartEmpty message="Not enough journal data yet" />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-card-border bg-card-bg p-4 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-foreground">
            Calorie Trend
            {calorieTarget && (
              <span className="ml-2 text-xs font-normal text-muted">
                Target: {calorieTarget.toLocaleString()} kcal
              </span>
            )}
          </h3>
          {calorieTrendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={calorieTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: 'var(--muted)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'var(--muted)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                {calorieTarget && (
                  <ReferenceLine
                    y={calorieTarget}
                    stroke="var(--success)"
                    strokeDasharray="6 3"
                    label={{ value: 'Target', position: 'right', fill: 'var(--success)', fontSize: 10 }}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="calories"
                  stroke="var(--info)"
                  strokeWidth={2}
                  dot={{ r: 2, fill: 'var(--info)' }}
                  activeDot={{ r: 4, fill: 'var(--info)' }}
                  name="Calories"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <ChartEmpty message="No calorie data for this period" />
          )}
        </div>

        <div className="rounded-xl border border-card-border bg-card-bg p-4 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Habit & Therapeutics Overview</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted uppercase tracking-wide">Habits</p>
              <div className="flex items-center gap-3">
                <MiniCircular pct={habitCompletionPct} size={52} />
                <div>
                  <p className="text-lg font-bold text-foreground tabular-nums">{habitCompletionPct}%</p>
                  <p className="text-xs text-muted">Completion rate</p>
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted">Active habits</span>
                  <span className="font-medium text-foreground tabular-nums">{dashData.habits.activeHabits}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted">Longest streak</span>
                  <span className="font-medium text-foreground tabular-nums">{dashData.habits.longestStreak} days</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted uppercase tracking-wide">Therapeutics</p>
              <div className="flex items-center gap-3">
                <MiniCircular pct={Math.round(dashData.therapeutics.adherenceRate * 100)} size={52} />
                <div>
                  <p className="text-lg font-bold text-foreground tabular-nums">
                    {Math.round(dashData.therapeutics.adherenceRate * 100)}%
                  </p>
                  <p className="text-xs text-muted">Adherence</p>
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted">Injectables</span>
                  <span className="font-medium text-foreground tabular-nums">{dashData.therapeutics.activePeptides}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted">Medications</span>
                  <span className="font-medium text-foreground tabular-nums">{dashData.therapeutics.activeMedications}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted">Supplements</span>
                  <span className="font-medium text-foreground tabular-nums">{dashData.therapeutics.activeSupplements}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {recentActivity.length > 0 && (
        <div className="rounded-xl border border-card-border bg-card-bg shadow-sm">
          <div className="flex items-center justify-between border-b border-card-border px-5 py-4">
            <h2 className="text-sm font-semibold text-foreground">Recent Activity</h2>
            <span className="text-xs text-muted">{recentActivity.length} items</span>
          </div>
          <div className="divide-y divide-card-border">
            {recentActivity.map((item, idx) => (
              <ActivityItem
                key={idx}
                icon={item.icon}
                description={item.description}
                timestamp={item.timestamp}
                href={item.href}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
