'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  format,
  parseISO,
  addDays,
  subDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isSameMonth,
  isToday,
} from 'date-fns';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Download01,
  Calendar,
  Clock,
  ArrowUp,
  ArrowDown,
  Target04,
  SearchSm,
} from '@untitled-ui/icons-react';
import { nutritionApi } from '@/lib/api/nutrition';
import { profileApi } from '@/lib/api/auth';
import type { UserProfile } from '@/types/profile';
import type { NutritionTargets } from '@/types/profile';
import type { MealType, NutritionDay, FoodEntry } from '@/types/nutrition';
import { FDA_DAILY_VALUES } from '@/types/nutrition';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';


import { API_BASE } from '@/lib/api/client';

const MEAL_ORDER: MealType[] = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'];
const MEAL_LABELS: Record<MealType, string> = {
  BREAKFAST: 'Breakfast',
  LUNCH: 'Lunch',
  DINNER: 'Dinner',
  SNACK: 'Snacks',
};

type ViewMode = 'day' | 'month';


function dvPercent(value: number, dv: number): number {
  return Math.round((value / dv) * 100);
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

type TargetStatus = 'good' | 'over' | 'under' | 'warning-over' | 'warning-under' | 'none';

function getTargetStatus(actual: number, target: number | null | undefined): TargetStatus {
  if (!target || target === 0) return 'none';
  const ratio = actual / target;
  if (ratio >= 0.9 && ratio <= 1.1) return 'good';
  if (ratio > 1.1) return 'over';
  if (ratio < 0.8) return 'under';
  if (ratio > 1.0) return 'warning-over';
  return 'warning-under';
}

function TargetIndicator({ status }: { status: TargetStatus }) {
  switch (status) {
    case 'good':
      return <ArrowUp className="h-3.5 w-3.5 text-green-500" />;
    case 'over':
      return <ArrowUp className="h-3.5 w-3.5 text-red-500" />;
    case 'under':
      return <ArrowDown className="h-3.5 w-3.5 text-red-500" />;
    case 'warning-over':
      return <ArrowUp className="h-3.5 w-3.5 text-yellow-500" />;
    case 'warning-under':
      return <ArrowDown className="h-3.5 w-3.5 text-yellow-500" />;
    default:
      return null;
  }
}


function NutritionFactsLabel({
  totals,
  targets,
}: {
  totals: {
    calories: number;
    fatG: number;
    saturatedFatG: number;
    transFatG: number;
    cholesterolMg: number;
    sodiumMg: number;
    carbsG: number;
    fiberG: number;
    sugarG: number;
    proteinG: number;
    potassiumMg: number;
  };
  targets: NutritionTargets | null;
}) {
  const rows: {
    label: string;
    value: string;
    dv?: number;
    bold?: boolean;
    indent?: boolean;
    thick?: boolean;
    targetKey?: keyof NutritionTargets;
    actual?: number;
  }[] = [
    {
      label: 'Total Fat',
      value: `${Math.round(totals.fatG)}g`,
      dv: dvPercent(totals.fatG, FDA_DAILY_VALUES.fatG),
      bold: true,
      targetKey: 'fatG',
      actual: totals.fatG,
    },
    {
      label: 'Saturated Fat',
      value: `${Math.round(totals.saturatedFatG)}g`,
      dv: dvPercent(totals.saturatedFatG, FDA_DAILY_VALUES.saturatedFatG),
      indent: true,
    },
    {
      label: 'Trans Fat',
      value: `${Math.round(totals.transFatG)}g`,
      indent: true,
    },
    {
      label: 'Cholesterol',
      value: `${Math.round(totals.cholesterolMg)}mg`,
      dv: dvPercent(totals.cholesterolMg, FDA_DAILY_VALUES.cholesterolMg),
      bold: true,
    },
    {
      label: 'Sodium',
      value: `${Math.round(totals.sodiumMg)}mg`,
      dv: dvPercent(totals.sodiumMg, FDA_DAILY_VALUES.sodiumMg),
      bold: true,
    },
    {
      label: 'Total Carbohydrate',
      value: `${Math.round(totals.carbsG)}g`,
      dv: dvPercent(totals.carbsG, FDA_DAILY_VALUES.carbsG),
      bold: true,
      thick: true,
      targetKey: 'carbsG',
      actual: totals.carbsG,
    },
    {
      label: 'Dietary Fiber',
      value: `${Math.round(totals.fiberG)}g`,
      dv: dvPercent(totals.fiberG, FDA_DAILY_VALUES.fiberG),
      indent: true,
      targetKey: 'fiberG',
      actual: totals.fiberG,
    },
    {
      label: 'Total Sugars',
      value: `${Math.round(totals.sugarG)}g`,
      indent: true,
    },
    {
      label: 'Protein',
      value: `${Math.round(totals.proteinG)}g`,
      dv: dvPercent(totals.proteinG, FDA_DAILY_VALUES.proteinG),
      bold: true,
      thick: true,
      targetKey: 'proteinG',
      actual: totals.proteinG,
    },
    {
      label: 'Potassium',
      value: `${Math.round(totals.potassiumMg)}mg`,
      dv: dvPercent(totals.potassiumMg, FDA_DAILY_VALUES.potassiumMg),
      thick: true,
    },
  ];

  const calStatus = getTargetStatus(totals.calories, targets?.calories);

  return (
    <div className="border-2 border-black bg-white text-black p-2 max-w-sm w-full font-sans">
      <h2 className="text-[2rem] leading-tight font-extrabold tracking-tight">
        Nutrition Facts
      </h2>
      <div className="border-b border-black" />
      <p className="text-sm py-0.5">Daily totals</p>
      <div className="border-b-8 border-black" />

      <div className="flex justify-between items-baseline py-1">
        <span className="text-sm font-bold flex items-center gap-1">
          Calories
          <TargetIndicator status={calStatus} />
        </span>
        <div className="text-right">
          <span className="text-3xl font-extrabold tabular-nums">
            {Math.round(totals.calories)}
          </span>
          {targets?.calories && (
            <span className="text-xs text-gray-500 ml-1.5">
              / {Math.round(targets.calories)}
            </span>
          )}
        </div>
      </div>

      <div className="border-b-4 border-black" />

      <div className="text-right text-xs font-bold py-0.5">% Daily Value*</div>

      <div className="border-b border-black" />

      {rows.map((row) => {
        const status =
          row.targetKey && row.actual != null && targets
            ? getTargetStatus(row.actual, targets[row.targetKey])
            : 'none';
        return (
          <div
            key={row.label}
            className={`flex justify-between py-0.5 text-sm ${
              row.thick ? 'border-t-8 border-black' : 'border-t border-gray-300'
            }`}
          >
            <span className={`flex items-center gap-1 ${row.indent ? 'pl-4' : ''}`}>
              {row.bold ? (
                <span className="font-bold">{row.label}</span>
              ) : (
                row.label
              )}{' '}
              <span className="tabular-nums">{row.value}</span>
              {row.targetKey && targets && targets[row.targetKey] != null && (
                <span className="text-[10px] text-gray-400 ml-0.5">
                  / {Math.round(targets[row.targetKey])}
                </span>
              )}
              <TargetIndicator status={status} />
            </span>
            {row.dv !== undefined ? (
              <span className="font-bold tabular-nums">{row.dv}%</span>
            ) : (
              <span />
            )}
          </div>
        );
      })}

      <div className="border-t-4 border-black mt-1 pt-1">
        <p className="text-xs leading-tight">
          * Percent Daily Values are based on a 2,000 calorie diet.
        </p>
      </div>
    </div>
  );
}


function MacroProgressBars({
  totals,
  goals,
  targets,
}: {
  totals: {
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    fiberG: number;
  };
  goals:
    | {
        calories: number | null;
        proteinG: number | null;
        carbsG: number | null;
        fatG: number | null;
        fiberG: number | null;
      }
    | undefined;
  targets: NutritionTargets | null;
}) {
  const effectiveGoals = targets
    ? {
        calories: targets.calories,
        proteinG: targets.proteinG,
        carbsG: targets.carbsG,
        fatG: targets.fatG,
        fiberG: targets.fiberG,
      }
    : goals;

  const bars: {
    label: string;
    value: number;
    goal: number | null;
    color: string;
    bgColor: string;
    unit: string;
  }[] = [
    { label: 'Calories', value: totals.calories, goal: effectiveGoals?.calories ?? null, color: '#7c3aed', bgColor: 'rgba(124,58,237,0.15)', unit: 'kcal' },
    { label: 'Protein', value: totals.proteinG, goal: effectiveGoals?.proteinG ?? null, color: '#ef4444', bgColor: 'rgba(239,68,68,0.15)', unit: 'g' },
    { label: 'Carbs', value: totals.carbsG, goal: effectiveGoals?.carbsG ?? null, color: '#3b82f6', bgColor: 'rgba(59,130,246,0.15)', unit: 'g' },
    { label: 'Fat', value: totals.fatG, goal: effectiveGoals?.fatG ?? null, color: '#f59e0b', bgColor: 'rgba(245,158,11,0.15)', unit: 'g' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {bars.map((b) => {
        const pct = b.goal ? Math.min(150, Math.round((b.value / b.goal) * 100)) : 0;
        const displayPct = Math.min(100, pct);
        let barColor = b.color;
        if (b.goal) {
          if (pct >= 80 && pct <= 110) barColor = '#10b981';
          else if (pct > 110) barColor = '#ef4444';
          else barColor = '#6b7280';
        }

        return (
          <div key={b.label} className="rounded-xl border border-card-border bg-card-bg p-4">
            <p className="text-xs font-medium text-muted uppercase tracking-wider mb-1">{b.label}</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold tabular-nums text-foreground">{Math.round(b.value)}</span>
              <span className="text-sm text-muted">{b.unit}</span>
            </div>
            {b.goal ? (
              <>
                <div className="mt-2 h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: b.bgColor }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${displayPct}%`, backgroundColor: barColor }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-muted tabular-nums">of {b.goal}{b.unit === 'kcal' ? '' : b.unit}</span>
                  <span className="text-xs font-semibold tabular-nums" style={{ color: barColor }}>{pct}%</span>
                </div>
              </>
            ) : (
              <p className="text-xs text-muted mt-2">No goal set</p>
            )}
          </div>
        );
      })}
    </div>
  );
}


function ComplianceGauge({
  actual,
  target,
}: {
  actual: number;
  target: number;
}) {
  const pct = target > 0 ? Math.min(Math.round((actual / target) * 100), 150) : 0;
  const displayPct = Math.min(pct, 100);
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (displayPct / 100) * circumference;

  let strokeColor = '#10b981';
  if (pct > 110) strokeColor = '#ef4444';
  else if (pct < 80) strokeColor = '#f59e0b';
  else if (pct < 90 || pct > 100) strokeColor = '#3b82f6';

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-28 w-28">
        <svg className="h-28 w-28 -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="var(--sidebar-bg)"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={strokeColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold tabular-nums text-foreground">{pct}%</span>
          <span className="text-[10px] text-muted">of target</span>
        </div>
      </div>
      <p className="mt-1 text-xs text-muted">
        {Math.round(actual)} / {Math.round(target)} kcal
      </p>
    </div>
  );
}


function FoodItemExpanded({ food, onUpdate, onDelete }: {
  food: FoodEntry;
  onUpdate: (foodId: number, data: Record<string, unknown>) => void;
  onDelete: (foodId: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [vals, setVals] = useState({
    description: food.description ?? '', servingSize: food.servingSize ?? '',
    calories: food.calories ?? 0, proteinG: food.proteinG ?? 0, carbsG: food.carbsG ?? 0,
    fatG: food.fatG ?? 0, saturatedFatG: food.saturatedFatG ?? 0, transFatG: food.transFatG ?? 0,
    cholesterolMg: food.cholesterolMg ?? 0, sodiumMg: food.sodiumMg ?? 0,
    fiberG: food.fiberG ?? 0, sugarG: food.sugarG ?? 0, potassiumMg: food.potassiumMg ?? 0,
  });

  const v = editing ? vals : {
    description: food.description ?? '', servingSize: food.servingSize ?? '',
    calories: food.calories ?? 0, proteinG: food.proteinG ?? 0, carbsG: food.carbsG ?? 0,
    fatG: food.fatG ?? 0, saturatedFatG: food.saturatedFatG ?? 0, transFatG: food.transFatG ?? 0,
    cholesterolMg: food.cholesterolMg ?? 0, sodiumMg: food.sodiumMg ?? 0,
    fiberG: food.fiberG ?? 0, sugarG: food.sugarG ?? 0, potassiumMg: food.potassiumMg ?? 0,
  };

  function handleSave() {
    onUpdate(food.id, vals);
    setEditing(false);
  }

  function editField(field: string, value: string) {
    setVals(prev => ({ ...prev, [field]: field === 'description' || field === 'servingSize' ? value : (Number(value) || 0) }));
  }

  function EditableVal({ field, val, unit, className = '' }: { field: string; val: number; unit: string; className?: string }) {
    if (!editing) return <span className={`tabular-nums ${className}`}>{Math.round(val)}{unit}</span>;
    return (
      <input type="number" value={val} onChange={e => editField(field, e.target.value)}
        className={`w-16 bg-yellow-50 border-b border-yellow-400 text-right tabular-nums outline-none text-sm ${className}`} />
    );
  }

  type Row = { label: string; field: string; val: number; unit: string; dvBase?: number; bold?: boolean; indent?: boolean; thick?: boolean };
  const rows: Row[] = [
    { label: 'Total Fat', field: 'fatG', val: v.fatG, unit: 'g', dvBase: FDA_DAILY_VALUES.fatG, bold: true },
    { label: 'Saturated Fat', field: 'saturatedFatG', val: v.saturatedFatG, unit: 'g', dvBase: FDA_DAILY_VALUES.saturatedFatG, indent: true },
    { label: 'Trans Fat', field: 'transFatG', val: v.transFatG, unit: 'g', indent: true },
    { label: 'Cholesterol', field: 'cholesterolMg', val: v.cholesterolMg, unit: 'mg', dvBase: FDA_DAILY_VALUES.cholesterolMg, bold: true },
    { label: 'Sodium', field: 'sodiumMg', val: v.sodiumMg, unit: 'mg', dvBase: FDA_DAILY_VALUES.sodiumMg, bold: true },
    { label: 'Total Carbohydrate', field: 'carbsG', val: v.carbsG, unit: 'g', dvBase: FDA_DAILY_VALUES.carbsG, bold: true, thick: true },
    { label: 'Dietary Fiber', field: 'fiberG', val: v.fiberG, unit: 'g', dvBase: FDA_DAILY_VALUES.fiberG, indent: true },
    { label: 'Total Sugars', field: 'sugarG', val: v.sugarG, unit: 'g', indent: true },
    { label: 'Protein', field: 'proteinG', val: v.proteinG, unit: 'g', dvBase: FDA_DAILY_VALUES.proteinG, bold: true, thick: true },
    { label: 'Potassium', field: 'potassiumMg', val: v.potassiumMg, unit: 'mg', dvBase: FDA_DAILY_VALUES.potassiumMg, thick: true },
  ];

  return (
    <div className="px-4 pb-4 pt-2">
      <div className="border-2 border-black bg-white text-black p-2 max-w-sm w-full font-sans">
        <h2 className="text-[1.4rem] leading-tight font-extrabold tracking-tight">Nutrition Facts</h2>
        <div className="border-b border-black" />
        {editing ? (
          <div className="space-y-1 py-0.5">
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-gray-500 shrink-0">Name:</span>
              <input type="text" value={vals.description} onChange={e => editField('description', e.target.value)}
                className="flex-1 bg-yellow-50 border-b border-yellow-400 text-xs outline-none" />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-gray-500 shrink-0">Serving:</span>
              <input type="text" value={vals.servingSize} onChange={e => editField('servingSize', e.target.value)}
                placeholder="e.g., 3 eggs, 8oz, 2 slices"
                className="flex-1 bg-yellow-50 border-b border-yellow-400 text-xs outline-none" />
            </div>
          </div>
        ) : (
          <div className="py-0.5">
            <p className="text-xs font-medium">{v.description}</p>
            {v.servingSize && <p className="text-[10px] text-gray-500">Serving size: {v.servingSize}</p>}
          </div>
        )}
        <div className="border-b-8 border-black" />
        <div className="flex justify-between items-baseline py-1">
          <span className="text-sm font-bold">Calories</span>
          {editing ? (
            <input type="number" value={vals.calories} onChange={e => editField('calories', e.target.value)}
              className="w-20 bg-yellow-50 border-b border-yellow-400 text-right text-2xl font-extrabold tabular-nums outline-none" />
          ) : (
            <span className="text-2xl font-extrabold tabular-nums">{Math.round(v.calories)}</span>
          )}
        </div>
        <div className="border-b-4 border-black" />
        <div className="text-right text-xs font-bold py-0.5">% Daily Value*</div>
        <div className="border-b border-black" />
        {rows.map((r) => (
          <div key={r.label} className={`flex justify-between py-0.5 text-sm ${r.thick ? 'border-t-8 border-black' : 'border-t border-gray-300'}`}>
            <span className={r.indent ? 'pl-4' : ''}>
              {r.bold ? <span className="font-bold">{r.label}</span> : r.label}{' '}
              <EditableVal field={r.field} val={r.val} unit={r.unit} />
            </span>
            {r.dvBase ? <span className="font-bold tabular-nums">{dvPercent(r.val, r.dvBase)}%</span> : <span />}
          </div>
        ))}
        <div className="border-t-4 border-black mt-1 pt-1">
          <p className="text-[10px] leading-tight">* Percent Daily Values are based on a 2,000 calorie diet.</p>
        </div>
      </div>

      <div className="flex gap-2 mt-3">
        {!editing ? (
          <>
            <button onClick={() => setEditing(true)}
              className="rounded-lg border border-card-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-sidebar-bg transition-colors">
              Edit
            </button>
            <button onClick={() => onDelete(food.id)}
              className="rounded-lg border border-danger/30 px-3 py-1.5 text-xs font-medium text-danger hover:bg-danger/5 transition-colors">
              Remove
            </button>
          </>
        ) : (
          <>
            <button onClick={handleSave} className="rounded-lg bg-primary px-4 py-1.5 text-xs font-medium text-white hover:bg-primary-dark transition-colors">Save Changes</button>
            <button onClick={() => setEditing(false)} className="rounded-lg border border-card-border px-3 py-1.5 text-xs text-muted hover:text-foreground transition-colors">Cancel</button>
          </>
        )}
      </div>
    </div>
  );
}


function MonthCalendar({
  year,
  month,
  dayData,
  calorieGoal,
  onSelectDay,
}: {
  year: number;
  month: number;
  dayData: NutritionDay[];
  calorieGoal: number | null;
  onSelectDay: (date: string) => void;
}) {
  const monthStart = startOfMonth(new Date(year, month, 1));
  const monthEnd = endOfMonth(monthStart);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDow = getDay(monthStart);
  const blanks = Array.from({ length: startDow });

  const calMap = useMemo(() => {
    const m: Record<string, number> = {};
    dayData.forEach((d) => {
      m[d.date] = d.totals.calories;
    });
    return m;
  }, [dayData]);

  function cellColor(cals: number | undefined): string {
    if (cals === undefined || cals === 0) return 'bg-card-bg';
    if (!calorieGoal) return 'bg-blue-50 dark:bg-blue-900/20';
    const ratio = cals / calorieGoal;
    if (ratio >= 0.85 && ratio <= 1.15) return 'bg-green-100 dark:bg-green-900/30';
    if (ratio < 0.85) return 'bg-yellow-100 dark:bg-yellow-900/30';
    return 'bg-red-100 dark:bg-red-900/30';
  }

  return (
    <div className="rounded-lg border border-card-border bg-card-bg p-4">
      <div className="grid grid-cols-7 gap-1 text-center">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="text-xs font-medium text-muted py-1">
            {d}
          </div>
        ))}
        {blanks.map((_, i) => (
          <div key={`blank-${i}`} />
        ))}
        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const cals = calMap[dateStr];
          return (
            <button
              key={dateStr}
              onClick={() => onSelectDay(dateStr)}
              className={`rounded-md p-1 text-center transition-colors hover:ring-2 hover:ring-primary/40 ${cellColor(
                cals
              )} ${isToday(day) ? 'ring-2 ring-primary' : ''} ${
                !isSameMonth(day, monthStart) ? 'opacity-40' : ''
              }`}
            >
              <div className="text-sm font-medium text-foreground tabular-nums">
                {format(day, 'd')}
              </div>
              {cals !== undefined && cals > 0 && (
                <div className="text-[10px] text-muted tabular-nums leading-tight">
                  {Math.round(cals)}
                </div>
              )}
            </button>
          );
        })}
      </div>
      {calorieGoal && (
        <div className="flex items-center justify-center gap-4 mt-3 text-xs text-muted">
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700" />
            Near goal
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700" />
            Under
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700" />
            Over
          </span>
        </div>
      )}
    </div>
  );
}


export default function NutritionPage() {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [expandedMeals, setExpandedMeals] = useState<Set<MealType>>(new Set(MEAL_ORDER));
  const [expandedFoods, setExpandedFoods] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const invalidateNutrition = () => {
    queryClient.invalidateQueries({ queryKey: ['nutrition-day'] });
    queryClient.invalidateQueries({ queryKey: ['nutrition-week'] });
    queryClient.invalidateQueries({ queryKey: ['nutrition-month'] });
    queryClient.invalidateQueries({ queryKey: ['nutrition-goals'] });
  };

  const updateFoodMutation = useMutation({
    mutationFn: ({ foodId, data }: { foodId: number; data: Record<string, unknown> }) =>
      nutritionApi.updateFood(foodId, data),
    onSuccess: invalidateNutrition,
  });

  const deleteFoodMutation = useMutation({
    mutationFn: (foodId: number) => nutritionApi.deleteFood(foodId),
    onSuccess: invalidateNutrition,
  });

  const parsedDate = parseISO(selectedDate);
  const currentYear = parsedDate.getFullYear();
  const currentMonth = parsedDate.getMonth();


  const { data: dayData, isLoading } = useQuery({
    queryKey: ['nutrition-day', selectedDate],
    queryFn: () => nutritionApi.getDay(selectedDate),
    enabled: viewMode === 'day',
  });

  const { data: goals } = useQuery({
    queryKey: ['nutrition-goals'],
    queryFn: () => nutritionApi.getGoals(),
  });

  const { data: profileData } = useQuery<UserProfile>({
    queryKey: ['profile'],
    queryFn: () => profileApi.get(),
  });

  const recommendedTargets = profileData?.recommendedTargets ?? null;

  const weekStart = format(startOfWeek(parsedDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const weekEnd = format(endOfWeek(parsedDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');

  const { data: weekDays } = useQuery({
    queryKey: ['nutrition-week', weekStart, weekEnd],
    queryFn: () => nutritionApi.getDays({ from: weekStart, to: weekEnd }),
    enabled: viewMode === 'day',
  });

  const monthStartStr = format(startOfMonth(parsedDate), 'yyyy-MM-dd');
  const monthEndStr = format(endOfMonth(parsedDate), 'yyyy-MM-dd');

  const { data: monthDays } = useQuery({
    queryKey: ['nutrition-month', monthStartStr, monthEndStr],
    queryFn: () => nutritionApi.getDays({ from: monthStartStr, to: monthEndStr }),
    enabled: viewMode === 'month',
  });


  const effectiveCalorieGoal =
    recommendedTargets?.calories ?? goals?.calories ?? null;

  const stackedChartData = useMemo(() => {
    if (!weekDays) return [];
    return weekDays.map((d: NutritionDay) => ({
      day: format(parseISO(d.date), 'EEE'),
      Protein: Math.round(d.totals.proteinG * 4),
      Carbs: Math.round(d.totals.carbsG * 4),
      Fat: Math.round(d.totals.fatG * 9),
    }));
  }, [weekDays]);

  const weeklyCalorieTrend = useMemo(() => {
    if (!weekDays) return [];
    return weekDays.map((d: NutritionDay) => ({
      day: format(parseISO(d.date), 'EEE'),
      fullDate: format(parseISO(d.date), 'MMM d'),
      Calories: Math.round(d.totals.calories),
    }));
  }, [weekDays]);

  const macroPieData = useMemo(() => {
    if (!dayData) return { actual: [], target: [] };
    const t = dayData.totals;
    const actual = [
      { name: 'Protein', value: Math.round(t.proteinG), color: '#ef4444' },
      { name: 'Carbs', value: Math.round(t.carbsG), color: '#3b82f6' },
      { name: 'Fat', value: Math.round(t.fatG), color: '#f59e0b' },
    ];
    const target = recommendedTargets
      ? [
          {
            name: 'Protein',
            value: Math.round(recommendedTargets.proteinG),
            color: '#ef4444',
          },
          {
            name: 'Carbs',
            value: Math.round(recommendedTargets.carbsG),
            color: '#3b82f6',
          },
          {
            name: 'Fat',
            value: Math.round(recommendedTargets.fatG),
            color: '#f59e0b',
          },
        ]
      : [];
    return { actual, target };
  }, [dayData, recommendedTargets]);

  const simpleTotals = dayData?.totals ?? {
    calories: 0,
    proteinG: 0,
    carbsG: 0,
    fatG: 0,
    fiberG: 0,
  };

  const fullTotals = useMemo(() => {
    if (!dayData) {
      return {
        calories: 0,
        fatG: 0,
        saturatedFatG: 0,
        transFatG: 0,
        cholesterolMg: 0,
        sodiumMg: 0,
        carbsG: 0,
        fiberG: 0,
        sugarG: 0,
        proteinG: 0,
        potassiumMg: 0,
      };
    }
    const t = dayData.totals;
    return {
      calories: t.calories,
      fatG: t.fatG,
      saturatedFatG: t.saturatedFatG,
      transFatG: t.transFatG,
      cholesterolMg: t.cholesterolMg,
      sodiumMg: t.sodiumMg,
      carbsG: t.carbsG,
      fiberG: t.fiberG,
      sugarG: t.sugarG,
      proteinG: t.proteinG,
      potassiumMg: t.potassiumMg,
    };
  }, [dayData]);


  const prevDay = () =>
    setSelectedDate(format(subDays(parsedDate, 1), 'yyyy-MM-dd'));
  const nextDay = () =>
    setSelectedDate(format(addDays(parsedDate, 1), 'yyyy-MM-dd'));

  const prevMonth = () => {
    const d = new Date(currentYear, currentMonth - 1, 1);
    setSelectedDate(format(d, 'yyyy-MM-dd'));
  };
  const nextMonth = () => {
    const d = new Date(currentYear, currentMonth + 1, 1);
    setSelectedDate(format(d, 'yyyy-MM-dd'));
  };

  const toggleMeal = (meal: MealType) => {
    setExpandedMeals((prev) => {
      const next = new Set(prev);
      if (next.has(meal)) next.delete(meal);
      else next.add(meal);
      return next;
    });
  };

  const toggleFood = (foodId: number) => {
    setExpandedFoods((prev) => {
      const next = new Set(prev);
      if (next.has(foodId)) next.delete(foodId);
      else next.add(foodId);
      return next;
    });
  };

  const handleMonthDayClick = (dateStr: string) => {
    setSelectedDate(dateStr);
    setViewMode('day');
  };


  const handleExport = useCallback(async () => {
    let from: string;
    let to: string;
    if (viewMode === 'month') {
      from = monthStartStr;
      to = monthEndStr;
    } else {
      from = weekStart;
      to = weekEnd;
    }
    const token = getToken();
    const url = `${API_BASE}/api/v1/nutrition/export?from=${from}&to=${to}`;
    try {
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `nutrition-${from}-to-${to}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
    }
  }, [viewMode, monthStartStr, monthEndStr, weekStart, weekEnd]);


  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Nutrition</h1>
          <p className="text-sm text-muted">
            Track your daily meals and macros
            {recommendedTargets && (
              <span className="ml-1 inline-flex items-center gap-1 text-primary">
                <Target04 className="h-3 w-3" />
                <span className="text-[11px]">Targets active</span>
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 rounded-lg border border-card-border bg-card-bg px-4 py-2.5 text-sm font-medium text-foreground hover:bg-sidebar-bg transition-colors"
          >
            <Download01 className="h-4 w-4" />
            Export CSV
          </button>
          <Link
            href="/nutrition/entry"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
          >
            <Plus className="h-4 w-4" />
            Log
          </Link>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <div className="inline-flex rounded-lg border border-card-border bg-card-bg p-1">
          <button
            onClick={() => setViewMode('day')}
            className={`inline-flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              viewMode === 'day'
                ? 'bg-primary text-white shadow-sm'
                : 'text-muted hover:text-foreground'
            }`}
          >
            <Clock className="h-4 w-4" />
            Day
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={`inline-flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              viewMode === 'month'
                ? 'bg-primary text-white shadow-sm'
                : 'text-muted hover:text-foreground'
            }`}
          >
            <Calendar className="h-4 w-4" />
            Month
          </button>
        </div>
        <div className="relative">
          <SearchSm className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="w-full sm:w-64 rounded-xl border border-card-border bg-background pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-light outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {viewMode === 'month' && (
        <>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={prevMonth}
              className="rounded-lg border border-card-border bg-card-bg p-2 text-muted hover:text-foreground hover:bg-card-border/30 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="text-center min-w-[180px]">
              <p className="text-lg font-semibold text-foreground">
                {format(parsedDate, 'MMMM yyyy')}
              </p>
            </div>
            <button
              onClick={nextMonth}
              className="rounded-lg border border-card-border bg-card-bg p-2 text-muted hover:text-foreground hover:bg-card-border/30 transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <MonthCalendar
            year={currentYear}
            month={currentMonth}
            dayData={monthDays ?? []}
            calorieGoal={effectiveCalorieGoal}
            onSelectDay={handleMonthDayClick}
          />
        </>
      )}

      {viewMode === 'day' && (
        <>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={prevDay}
              className="rounded-lg border border-card-border bg-card-bg p-2 text-muted hover:text-foreground hover:bg-card-border/30 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="text-center min-w-[180px]">
              <p className="text-lg font-semibold text-foreground">
                {format(parsedDate, 'EEEE')}
              </p>
              <p className="text-sm text-muted">
                {format(parsedDate, 'MMMM d, yyyy')}
              </p>
            </div>
            <button
              onClick={nextDay}
              className="rounded-lg border border-card-border bg-card-bg p-2 text-muted hover:text-foreground hover:bg-card-border/30 transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-10">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          )}

          {!isLoading && (
            <>
              <MacroProgressBars
                totals={simpleTotals}
                goals={goals}
                targets={recommendedTargets}
              />

              <div className="flex flex-col items-center gap-6 lg:flex-row lg:justify-center lg:items-start">
                <NutritionFactsLabel totals={fullTotals} targets={recommendedTargets} />
                {effectiveCalorieGoal && effectiveCalorieGoal > 0 && (
                  <div className="rounded-lg border border-card-border bg-card-bg p-4 flex flex-col items-center gap-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
                      Daily Compliance
                    </h3>
                    <ComplianceGauge
                      actual={simpleTotals.calories}
                      target={effectiveCalorieGoal}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {MEAL_ORDER.map((mealType) => {
                  const allMeals =
                    dayData?.meals.filter((m) => m.mealType === mealType) ?? [];
                  const sq = searchQuery.toLowerCase();
                  const meals = searchQuery
                    ? allMeals
                        .map((m) => ({
                          ...m,
                          foods: (m.foods ?? m.foodEntries ?? []).filter((f) =>
                            f.description.toLowerCase().includes(sq)
                          ),
                        }))
                        .filter((m) => (m.foods ?? m.foodEntries ?? []).length > 0)
                    : allMeals;
                  const isExpanded = expandedMeals.has(mealType);
                  const mealCalories = meals.reduce(
                    (t, m) =>
                      t + (m.foods ?? m.foodEntries ?? []).reduce((ft, f) => ft + (f.calories ?? 0), 0),
                    0
                  );

                  return (
                    <div
                      key={mealType}
                      className="rounded-lg border border-card-border bg-card-bg overflow-hidden"
                    >
                      <button
                        onClick={() => toggleMeal(mealType)}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-sidebar-bg/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-foreground">
                            {MEAL_LABELS[mealType]}
                          </h3>
                          <span className="text-xs text-muted">
                            {meals.reduce((t, m) => t + (m.foods ?? m.foodEntries ?? []).length, 0)} items
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-mono tabular-nums font-medium text-foreground">
                            {Math.round(mealCalories)} kcal
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-muted" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted" />
                          )}
                        </div>
                      </button>
                      {isExpanded && (
                        <div className="border-t border-card-border">
                          {meals.length === 0 ? (
                            <p className="px-4 py-4 text-sm text-muted text-center">
                              No items logged
                            </p>
                          ) : (
                            meals.map((meal) => (
                              <div key={meal.id}>
                                {(meal.foods ?? meal.foodEntries ?? []).map((food) => (
                                  <div key={food.id}>
                                    <button
                                      onClick={() => toggleFood(food.id)}
                                      className="w-full flex items-center justify-between px-4 py-2.5 border-b border-card-border last:border-0 hover:bg-sidebar-bg/30 transition-colors"
                                    >
                                      <div className="min-w-0 flex-1 text-left">
                                        <p className="text-sm font-medium text-foreground truncate">
                                          {food.description}
                                        </p>
                                        {food.servingSize && (
                                          <p className="text-xs text-muted">
                                            {food.servingSize}
                                          </p>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-4 text-xs text-muted shrink-0 ml-4">
                                        <span className="font-mono tabular-nums font-medium text-foreground">
                                          {food.calories ?? 0} kcal
                                        </span>
                                        <span className="hidden sm:inline font-mono tabular-nums">
                                          {food.proteinG ?? 0}P
                                        </span>
                                        <span className="hidden sm:inline font-mono tabular-nums">
                                          {food.carbsG ?? 0}C
                                        </span>
                                        <span className="hidden sm:inline font-mono tabular-nums">
                                          {food.fatG ?? 0}F
                                        </span>
                                        {expandedFoods.has(food.id) ? (
                                          <ChevronUp className="h-3.5 w-3.5" />
                                        ) : (
                                          <ChevronDown className="h-3.5 w-3.5" />
                                        )}
                                      </div>
                                    </button>
                                    {expandedFoods.has(food.id) && (
                                      <FoodItemExpanded
                                        food={food}
                                        onUpdate={(foodId, data) => updateFoodMutation.mutate({ foodId, data })}
                                        onDelete={(foodId) => deleteFoodMutation.mutate(foodId)}
                                      />
                                    )}
                                  </div>
                                ))}
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {weeklyCalorieTrend.length > 0 && (
                  <div className="rounded-lg border border-card-border bg-card-bg p-4">
                    <h3 className="font-semibold text-foreground mb-4">
                      Weekly Calorie Trend
                    </h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={weeklyCalorieTrend}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="var(--card-border)"
                          />
                          <XAxis
                            dataKey="day"
                            tick={{ fontSize: 12, fill: 'var(--muted)' }}
                          />
                          <YAxis tick={{ fontSize: 12, fill: 'var(--muted)' }} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'var(--card-bg)',
                              border: '1px solid var(--card-border)',
                              borderRadius: '8px',
                              fontSize: '12px',
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="Calories"
                            stroke="#7c3aed"
                            strokeWidth={2}
                            dot={{ fill: '#7c3aed', r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                          {effectiveCalorieGoal && (
                            <ReferenceLine
                              y={effectiveCalorieGoal}
                              stroke="#10b981"
                              strokeDasharray="6 4"
                              strokeWidth={2}
                              label={{
                                value: `Goal: ${Math.round(effectiveCalorieGoal)}`,
                                position: 'insideTopRight',
                                fill: '#10b981',
                                fontSize: 11,
                              }}
                            />
                          )}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {(macroPieData.actual.some((d) => d.value > 0) ||
                  macroPieData.target.length > 0) && (
                  <div className="rounded-lg border border-card-border bg-card-bg p-4">
                    <h3 className="font-semibold text-foreground mb-4">
                      Macro Distribution (g)
                    </h3>
                    <div className="flex items-center justify-center gap-6">
                      <div className="flex flex-col items-center">
                        <p className="text-xs text-muted mb-2">Actual</p>
                        <div className="h-40 w-40">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={macroPieData.actual}
                                cx="50%"
                                cy="50%"
                                innerRadius={30}
                                outerRadius={60}
                                dataKey="value"
                                stroke="none"
                              >
                                {macroPieData.actual.map((entry, idx) => (
                                  <Cell key={idx} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip
                                formatter={(value) => [`${value}g`]}
                                contentStyle={{
                                  backgroundColor: 'var(--card-bg)',
                                  border: '1px solid var(--card-border)',
                                  borderRadius: '8px',
                                  fontSize: '12px',
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                      {macroPieData.target.length > 0 && (
                        <div className="flex flex-col items-center">
                          <p className="text-xs text-muted mb-2">Target</p>
                          <div className="h-40 w-40">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={macroPieData.target}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={30}
                                  outerRadius={60}
                                  dataKey="value"
                                  stroke="none"
                                >
                                  {macroPieData.target.map((entry, idx) => (
                                    <Cell key={idx} fill={entry.color} opacity={0.5} />
                                  ))}
                                </Pie>
                                <Tooltip
                                  formatter={(value) => [`${value}g`]}
                                  contentStyle={{
                                    backgroundColor: 'var(--card-bg)',
                                    border: '1px solid var(--card-border)',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                  }}
                                />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-center gap-4 mt-2 text-xs">
                      <span className="flex items-center gap-1">
                        <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" />
                        Protein
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-500" />
                        Carbs
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-500" />
                        Fat
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {stackedChartData.length > 0 && (
                <div className="rounded-lg border border-card-border bg-card-bg p-4">
                  <h3 className="font-semibold text-foreground mb-4">
                    Weekly Calories by Macro
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stackedChartData} barCategoryGap="20%">
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="var(--card-border)"
                        />
                        <XAxis
                          dataKey="day"
                          tick={{ fontSize: 12, fill: 'var(--muted)' }}
                        />
                        <YAxis tick={{ fontSize: 12, fill: 'var(--muted)' }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'var(--card-bg)',
                            border: '1px solid var(--card-border)',
                            borderRadius: '8px',
                            fontSize: '12px',
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <Bar
                          dataKey="Protein"
                          stackId="a"
                          fill="#ef4444"
                          radius={[0, 0, 0, 0]}
                        />
                        <Bar
                          dataKey="Carbs"
                          stackId="a"
                          fill="#3b82f6"
                          radius={[0, 0, 0, 0]}
                        />
                        <Bar
                          dataKey="Fat"
                          stackId="a"
                          fill="#f59e0b"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
