'use client';

import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  addDays,
  subDays,
  addWeeks,
  subWeeks,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
} from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  Calendar as CalendarIcon,
  Clock,
} from '@untitled-ui/icons-react';
import { calendarApi } from '@/lib/api/calendar';
import type { CalendarDay, CalendarEvent } from '@/types/calendar';


type ViewMode = 'month' | 'week' | '3day' | 'today';

const VIEW_OPTIONS: { label: string; value: ViewMode }[] = [
  { label: 'Month', value: 'month' },
  { label: 'Week', value: 'week' },
  { label: '3-Day', value: '3day' },
  { label: 'Today', value: 'today' },
];

const EVENT_STYLES: Record<string, { dot: string; bg: string; text: string; pill: string; label: string }> = {
  MEDICATION:  { dot: 'bg-blue-500', bg: 'bg-blue-500/10', text: 'text-blue-500', pill: 'bg-blue-500/20 text-blue-600', label: 'Medication' },
  medication:  { dot: 'bg-blue-500', bg: 'bg-blue-500/10', text: 'text-blue-500', pill: 'bg-blue-500/20 text-blue-600', label: 'Medication' },
  SUPPLEMENT:  { dot: 'bg-emerald-500', bg: 'bg-emerald-500/10', text: 'text-emerald-500', pill: 'bg-emerald-500/20 text-emerald-600', label: 'Supplement' },
  supplement:  { dot: 'bg-emerald-500', bg: 'bg-emerald-500/10', text: 'text-emerald-500', pill: 'bg-emerald-500/20 text-emerald-600', label: 'Supplement' },
  PEPTIDE:     { dot: 'bg-purple-500', bg: 'bg-purple-500/10', text: 'text-purple-500', pill: 'bg-purple-500/20 text-purple-600', label: 'Injectable' },
  peptide:     { dot: 'bg-purple-500', bg: 'bg-purple-500/10', text: 'text-purple-500', pill: 'bg-purple-500/20 text-purple-600', label: 'Injectable' },
  WORKOUT:     { dot: 'bg-orange-500', bg: 'bg-orange-500/10', text: 'text-orange-500', pill: 'bg-orange-500/20 text-orange-600', label: 'Workout' },
  workout:     { dot: 'bg-orange-500', bg: 'bg-orange-500/10', text: 'text-orange-500', pill: 'bg-orange-500/20 text-orange-600', label: 'Workout' },
  SCHEDULED:   { dot: 'bg-orange-500', bg: 'bg-orange-500/10', text: 'text-orange-500', pill: 'bg-orange-500/20 text-orange-600', label: 'Workout' },
  ADHOC:       { dot: 'bg-orange-400', bg: 'bg-orange-400/10', text: 'text-orange-400', pill: 'bg-orange-400/20 text-orange-500', label: 'Workout' },
  HABIT:       { dot: 'bg-teal-500', bg: 'bg-teal-500/10', text: 'text-teal-500', pill: 'bg-teal-500/20 text-teal-600', label: 'Habit' },
  habit:       { dot: 'bg-teal-500', bg: 'bg-teal-500/10', text: 'text-teal-500', pill: 'bg-teal-500/20 text-teal-600', label: 'Habit' },
};

const WEEKDAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getEventStyle(category: string) {
  return EVENT_STYLES[category] ?? { dot: 'bg-muted', bg: 'bg-muted/10', text: 'text-muted', pill: 'bg-muted/20 text-muted', label: category };
}

function getEventLink(event: CalendarEvent): string {
  const cat = event.category?.toUpperCase() ?? '';
  if (cat === 'MEDICATION') return `/therapeutics/${event.referenceId}?type=MEDICATION`;
  if (cat === 'SUPPLEMENT') return `/therapeutics/${event.referenceId}?type=SUPPLEMENT`;
  if (cat === 'PEPTIDE') return `/therapeutics/${event.referenceId}?type=PEPTIDE`;
  if (cat === 'WORKOUT' || cat === 'SCHEDULED' || cat === 'ADHOC') return event.completed ? `/workouts/${event.referenceId}` : '/workouts/templates';
  if (cat === 'HABIT') return `/habits/${event.referenceId}`;
  return '#';
}

function sortByTime(events: CalendarEvent[]): CalendarEvent[] {
  return [...events].sort((a, b) => {
    if (!a.time && !b.time) return 0;
    if (!a.time) return 1;
    if (!b.time) return -1;
    return a.time.localeCompare(b.time);
  });
}

function groupEventsByCategory(events: CalendarEvent[]) {
  const groups: Record<string, CalendarEvent[]> = {};
  events.forEach((event) => {
    const cat = event.category;
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(event);
  });
  const order = ['MEDICATION', 'medication', 'SUPPLEMENT', 'supplement', 'PEPTIDE', 'peptide', 'WORKOUT', 'workout', 'SCHEDULED', 'ADHOC', 'HABIT', 'habit'];
  return Object.entries(groups).sort(([a], [b]) => {
    const ai = order.indexOf(a);
    const bi = order.indexOf(b);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
}


function EventPill({ event }: { event: CalendarEvent }) {
  const style = getEventStyle(event.category);
  return (
    <Link
      href={getEventLink(event)}
      className={`flex items-center gap-1.5 truncate rounded-md px-1.5 py-0.5 text-[10px] font-medium leading-tight transition-opacity hover:opacity-80 ${style.pill}`}
    >
      <span className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${style.dot}`} />
      <span className="truncate">{event.title}</span>
    </Link>
  );
}

function EventDetailCard({ event }: { event: CalendarEvent }) {
  const style = getEventStyle(event.category);
  return (
    <Link
      href={getEventLink(event)}
      className={`flex items-center justify-between rounded-lg ${style.bg} px-4 py-3 hover:opacity-80 transition-opacity`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className={`inline-block h-2.5 w-2.5 rounded-full shrink-0 ${style.dot}`} />
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{event.title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            {event.time && (
              <span className="flex items-center gap-1 text-xs text-muted">
                <Clock className="h-3 w-3" />
                {event.time}
              </span>
            )}
            {event.subtitle && (
              <span className="text-xs text-muted truncate">{event.subtitle}</span>
            )}
          </div>
        </div>
      </div>
      <div className={`shrink-0 rounded-full p-1 ${
        event.completed
          ? 'bg-success text-white'
          : 'border border-card-border text-muted'
      }`}>
        <Check className="h-3.5 w-3.5" />
      </div>
    </Link>
  );
}

function DayDetailPanel({
  dateStr,
  dayData,
  onClose,
}: {
  dateStr: string;
  dayData: CalendarDay | undefined;
  onClose: () => void;
}) {
  const grouped = useMemo(
    () => (dayData ? groupEventsByCategory(dayData.events) : []),
    [dayData],
  );

  return (
    <div className="rounded-lg border border-card-border bg-card-bg overflow-hidden">
      <div className="flex items-center justify-between border-b border-card-border bg-sidebar-bg px-4 py-3">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-muted" />
          <h3 className="font-semibold text-foreground">
            {format(parseISO(dateStr), 'EEEE, MMMM d, yyyy')}
          </h3>
          {dayData && dayData.totalScheduled > 0 && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
              {dayData.totalCompleted}/{dayData.totalScheduled} done
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="rounded p-1 text-muted hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="p-4">
        {!dayData || dayData.events.length === 0 ? (
          <p className="text-sm text-muted text-center py-6">No events on this day</p>
        ) : (
          <div className="space-y-4">
            {grouped.map(([category, events]) => {
              const style = getEventStyle(category);
              return (
                <div key={category}>
                  <h4 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${style.text}`}>
                    {style.label}
                  </h4>
                  <ul className="space-y-1.5">
                    {events.map((event, i) => (
                      <li key={`${event.referenceId}-${i}`}>
                        <EventDetailCard event={event} />
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}


function MonthView({
  currentDate,
  dayMap,
  selectedDay,
  setSelectedDay,
}: {
  currentDate: Date;
  dayMap: Record<string, CalendarDay>;
  selectedDay: string | null;
  setSelectedDay: (d: string | null) => void;
}) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const rangeStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const rangeEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: rangeStart, end: rangeEnd });

  return (
    <div className="rounded-lg border border-card-border bg-card-bg overflow-hidden">
      <div className="grid grid-cols-7 border-b border-card-border bg-sidebar-bg">
        {WEEKDAYS_SHORT.map((wd) => (
          <div key={wd} className="px-2 py-3 text-center text-xs font-semibold text-muted uppercase tracking-wider">
            {wd}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const calDay = dayMap[dateStr];
          const isCurrentMonth = isSameMonth(day, currentDate);
          const todayDate = isToday(day);
          const isSelected = selectedDay === dateStr;
          const events = calDay?.events ?? [];
          const pills = events.slice(0, 3);
          const overflow = events.length - 3;

          return (
            <button
              key={dateStr}
              onClick={() => setSelectedDay(isSelected ? null : dateStr)}
              className={`relative flex flex-col min-h-[100px] border-b border-r border-card-border p-2 text-left transition-colors hover:bg-sidebar-bg/50 ${
                !isCurrentMonth ? 'opacity-30' : ''
              } ${isSelected ? 'bg-primary/5' : ''} ${
                todayDate ? 'ring-2 ring-inset ring-primary/40' : ''
              }`}
            >
              <span
                className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${
                  todayDate
                    ? 'bg-primary text-white'
                    : isSelected
                      ? 'text-primary'
                      : 'text-foreground'
                }`}
              >
                {format(day, 'd')}
              </span>

              {pills.length > 0 && (
                <div className="mt-1.5 flex flex-col gap-0.5 w-full overflow-hidden">
                  {pills.map((event, i) => (
                    <EventPill key={`${event.category}-${event.referenceId}-${i}`} event={event} />
                  ))}
                  {overflow > 0 && (
                    <p className="text-[9px] text-muted px-1.5 mt-0.5">+{overflow} more</p>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}


function WeekView({
  currentDate,
  dayMap,
  selectedDay,
  setSelectedDay,
}: {
  currentDate: Date;
  dayMap: Record<string, CalendarDay>;
  selectedDay: string | null;
  setSelectedDay: (d: string | null) => void;
}) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  return (
    <div className="rounded-lg border border-card-border bg-card-bg overflow-hidden">
      <div className="grid grid-cols-7 border-b border-card-border bg-sidebar-bg">
        {days.map((day) => {
          const todayDate = isToday(day);
          return (
            <div key={day.toISOString()} className="px-2 py-3 text-center">
              <p className="text-[10px] font-semibold text-muted uppercase tracking-wider">
                {format(day, 'EEE')}
              </p>
              <p className={`mt-0.5 text-lg font-semibold ${todayDate ? 'text-primary' : 'text-foreground'}`}>
                {format(day, 'd')}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-7">
        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const calDay = dayMap[dateStr];
          const todayDate = isToday(day);
          const isSelected = selectedDay === dateStr;
          const events = sortByTime(calDay?.events ?? []);

          return (
            <button
              key={dateStr}
              onClick={() => setSelectedDay(isSelected ? null : dateStr)}
              className={`relative flex flex-col min-h-[140px] border-r border-card-border p-2 text-left transition-colors hover:bg-sidebar-bg/50 ${
                isSelected ? 'bg-primary/5' : ''
              } ${todayDate ? 'ring-2 ring-inset ring-primary/40' : ''}`}
            >
              {events.length === 0 ? (
                <p className="text-[10px] text-muted/50 mt-4 text-center w-full">No events</p>
              ) : (
                <div className="flex flex-col gap-1 w-full overflow-hidden">
                  {events.map((event, i) => (
                    <div key={`${event.category}-${event.referenceId}-${i}`}>
                      {event.time && (
                        <p className="text-[9px] text-muted px-1 mb-0.5">{event.time}</p>
                      )}
                      <EventPill event={event} />
                    </div>
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}


function ThreeDayView({
  currentDate,
  dayMap,
  selectedDay,
  setSelectedDay,
}: {
  currentDate: Date;
  dayMap: Record<string, CalendarDay>;
  selectedDay: string | null;
  setSelectedDay: (d: string | null) => void;
}) {
  const days = [
    subDays(currentDate, 1),
    currentDate,
    addDays(currentDate, 1),
  ];

  return (
    <div className="rounded-lg border border-card-border bg-card-bg overflow-hidden">
      <div className="grid grid-cols-3 border-b border-card-border bg-sidebar-bg">
        {days.map((day) => {
          const todayDate = isToday(day);
          return (
            <div key={day.toISOString()} className="px-3 py-3 text-center">
              <p className="text-xs font-semibold text-muted uppercase tracking-wider">
                {format(day, 'EEEE')}
              </p>
              <p className={`mt-0.5 text-xl font-bold ${todayDate ? 'text-primary' : 'text-foreground'}`}>
                {format(day, 'MMM d')}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-3">
        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const calDay = dayMap[dateStr];
          const todayDate = isToday(day);
          const isSelected = selectedDay === dateStr;
          const events = sortByTime(calDay?.events ?? []);

          return (
            <button
              key={dateStr}
              onClick={() => setSelectedDay(isSelected ? null : dateStr)}
              className={`relative flex flex-col min-h-[200px] border-r border-card-border p-3 text-left transition-colors hover:bg-sidebar-bg/50 ${
                isSelected ? 'bg-primary/5' : ''
              } ${todayDate ? 'ring-2 ring-inset ring-primary/40' : ''}`}
            >
              {events.length === 0 ? (
                <p className="text-xs text-muted/50 mt-8 text-center w-full">No events</p>
              ) : (
                <div className="flex flex-col gap-1.5 w-full overflow-hidden">
                  {events.map((event, i) => {
                    const style = getEventStyle(event.category);
                    return (
                      <Link
                        key={`${event.category}-${event.referenceId}-${i}`}
                        href={getEventLink(event)}
                        onClick={(e) => e.stopPropagation()}
                        className={`rounded-lg ${style.bg} px-2.5 py-1.5 transition-opacity hover:opacity-80`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${style.dot}`} />
                          <span className="text-xs font-medium text-foreground truncate">{event.title}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 pl-3.5">
                          {event.time && (
                            <span className="text-[10px] text-muted">{event.time}</span>
                          )}
                          {event.subtitle && (
                            <span className="text-[10px] text-muted truncate">{event.subtitle}</span>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}


function TodayView({
  dayMap,
}: {
  dayMap: Record<string, CalendarDay>;
}) {
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const dayData = dayMap[todayStr];
  const grouped = useMemo(
    () => (dayData ? groupEventsByCategory(sortByTime(dayData.events)) : []),
    [dayData],
  );

  return (
    <div className="rounded-lg border border-card-border bg-card-bg overflow-hidden">
      <div className="flex items-center justify-between border-b border-card-border bg-sidebar-bg px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white">
            <CalendarIcon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">
              {format(new Date(), 'EEEE, MMMM d')}
            </h3>
            <p className="text-xs text-muted">
              {dayData
                ? `${dayData.totalCompleted} of ${dayData.totalScheduled} completed`
                : 'No events scheduled'}
            </p>
          </div>
        </div>
        {dayData && dayData.totalScheduled > 0 && (
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">
              {Math.round((dayData.totalCompleted / dayData.totalScheduled) * 100)}%
            </p>
            <p className="text-[10px] text-muted uppercase tracking-wider">Complete</p>
          </div>
        )}
      </div>

      <div className="p-5">
        {!dayData || dayData.events.length === 0 ? (
          <div className="text-center py-12">
            <CalendarIcon className="mx-auto h-10 w-10 text-muted/30 mb-3" />
            <p className="text-sm text-muted">No events scheduled for today</p>
          </div>
        ) : (
          <div className="space-y-5">
            {grouped.map(([category, events]) => {
              const style = getEventStyle(category);
              return (
                <div key={category}>
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className={`inline-block h-2.5 w-2.5 rounded-full ${style.dot}`} />
                    <h4 className={`text-xs font-semibold uppercase tracking-wider ${style.text}`}>
                      {style.label}
                    </h4>
                    <span className="text-[10px] text-muted">({events.length})</span>
                  </div>
                  <ul className="space-y-2">
                    {events.map((event, i) => (
                      <li key={`${event.referenceId}-${i}`}>
                        <EventDetailCard event={event} />
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}


export default function CalendarPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const { rangeStart, rangeEnd } = useMemo(() => {
    switch (viewMode) {
      case 'month': {
        const ms = startOfMonth(currentDate);
        const me = endOfMonth(currentDate);
        return {
          rangeStart: startOfWeek(ms, { weekStartsOn: 0 }),
          rangeEnd: endOfWeek(me, { weekStartsOn: 0 }),
        };
      }
      case 'week': {
        return {
          rangeStart: startOfWeek(currentDate, { weekStartsOn: 0 }),
          rangeEnd: endOfWeek(currentDate, { weekStartsOn: 0 }),
        };
      }
      case '3day': {
        return {
          rangeStart: subDays(currentDate, 1),
          rangeEnd: addDays(currentDate, 1),
        };
      }
      case 'today': {
        const today = new Date();
        return { rangeStart: today, rangeEnd: today };
      }
    }
  }, [viewMode, currentDate]);

  const fromStr = format(rangeStart, 'yyyy-MM-dd');
  const toStr = format(rangeEnd, 'yyyy-MM-dd');

  const { data: calendarDays, isLoading } = useQuery({
    queryKey: ['calendar', fromStr, toStr],
    queryFn: () => calendarApi.getRange(fromStr, toStr),
  });

  const dayMap = useMemo(() => {
    const map: Record<string, CalendarDay> = {};
    calendarDays?.forEach((d) => { map[d.date] = d; });
    return map;
  }, [calendarDays]);

  const goBack = useCallback(() => {
    setSelectedDay(null);
    switch (viewMode) {
      case 'month':
        setCurrentDate((d) => subMonths(d, 1));
        break;
      case 'week':
        setCurrentDate((d) => subWeeks(d, 1));
        break;
      case '3day':
        setCurrentDate((d) => subDays(d, 3));
        break;
      case 'today':
        setCurrentDate((d) => subDays(d, 1));
        break;
    }
  }, [viewMode]);

  const goForward = useCallback(() => {
    setSelectedDay(null);
    switch (viewMode) {
      case 'month':
        setCurrentDate((d) => addMonths(d, 1));
        break;
      case 'week':
        setCurrentDate((d) => addWeeks(d, 1));
        break;
      case '3day':
        setCurrentDate((d) => addDays(d, 3));
        break;
      case 'today':
        setCurrentDate((d) => addDays(d, 1));
        break;
    }
  }, [viewMode]);

  const goToday = useCallback(() => {
    setCurrentDate(new Date());
    setSelectedDay(format(new Date(), 'yyyy-MM-dd'));
  }, []);

  const navTitle = useMemo(() => {
    switch (viewMode) {
      case 'month':
        return format(currentDate, 'MMMM yyyy');
      case 'week': {
        const ws = startOfWeek(currentDate, { weekStartsOn: 0 });
        const we = endOfWeek(currentDate, { weekStartsOn: 0 });
        return `${format(ws, 'MMM d')} - ${format(we, 'MMM d, yyyy')}`;
      }
      case '3day': {
        const d1 = subDays(currentDate, 1);
        const d3 = addDays(currentDate, 1);
        return `${format(d1, 'MMM d')} - ${format(d3, 'MMM d, yyyy')}`;
      }
      case 'today':
        return format(currentDate, 'EEEE, MMMM d, yyyy');
    }
  }, [viewMode, currentDate]);

  const selectedDayData = selectedDay ? dayMap[selectedDay] : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-foreground">Calendar</h1>
        <button
          onClick={goToday}
          className="rounded-lg border border-card-border bg-card-bg px-4 py-2 text-sm font-medium text-foreground hover:bg-card-border/30 transition-colors"
        >
          Today
        </button>
      </div>

      <div className="flex items-center gap-1 rounded-lg border border-card-border bg-sidebar-bg p-1 w-fit">
        {VIEW_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => {
              setViewMode(opt.value);
              setSelectedDay(null);
              if (opt.value === 'today') {
                setCurrentDate(new Date());
              }
            }}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              viewMode === opt.value
                ? 'bg-primary text-white shadow-sm'
                : 'text-muted hover:text-foreground hover:bg-card-bg'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={goBack}
          className="rounded-lg border border-card-border bg-card-bg p-2 text-muted hover:text-foreground hover:bg-card-border/30 transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h2 className="text-lg font-semibold text-foreground">
          {navTitle}
        </h2>
        <button
          onClick={goForward}
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

      {!isLoading && viewMode === 'month' && (
        <MonthView
          currentDate={currentDate}
          dayMap={dayMap}
          selectedDay={selectedDay}
          setSelectedDay={setSelectedDay}
        />
      )}

      {!isLoading && viewMode === 'week' && (
        <WeekView
          currentDate={currentDate}
          dayMap={dayMap}
          selectedDay={selectedDay}
          setSelectedDay={setSelectedDay}
        />
      )}

      {!isLoading && viewMode === '3day' && (
        <ThreeDayView
          currentDate={currentDate}
          dayMap={dayMap}
          selectedDay={selectedDay}
          setSelectedDay={setSelectedDay}
        />
      )}

      {!isLoading && viewMode === 'today' && (
        <TodayView dayMap={dayMap} />
      )}

      <div className="flex flex-wrap gap-4">
        {Object.entries(EVENT_STYLES).map(([key, val]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span className={`inline-block h-2.5 w-2.5 rounded-full ${val.dot}`} />
            <span className="text-xs text-muted">{val.label}</span>
          </div>
        ))}
      </div>

      {selectedDay && viewMode !== 'today' && (
        <DayDetailPanel
          dateStr={selectedDay}
          dayData={selectedDayData ?? undefined}
          onClose={() => setSelectedDay(null)}
        />
      )}
    </div>
  );
}
