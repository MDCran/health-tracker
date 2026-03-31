export interface CalendarEvent {
  eventType: string;
  category: string;
  referenceId: number;
  title: string;
  subtitle: string;
  date: string;
  time: string | null;
  completed: boolean;
  color: string;
}

export interface CalendarDay {
  date: string;
  events: CalendarEvent[];
  totalScheduled: number;
  totalCompleted: number;
}
