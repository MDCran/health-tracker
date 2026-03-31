export type WellnessRealm =
  | 'SPIRITUAL' | 'PHYSICAL' | 'MENTAL' | 'EMOTIONAL'
  | 'FINANCIAL' | 'SOCIAL' | 'PURPOSE';

export const REALMS: { key: WellnessRealm; label: string; icon: string; color: string }[] = [
  { key: 'SPIRITUAL', label: 'Spiritual', icon: 'Star01', color: '#8b5cf6' },
  { key: 'PHYSICAL', label: 'Physical', icon: 'HeartCircle', color: '#ef4444' },
  { key: 'MENTAL', label: 'Mental', icon: 'Lightbulb01', color: '#f59e0b' },
  { key: 'EMOTIONAL', label: 'Emotional', icon: 'Heart', color: '#ec4899' },
  { key: 'FINANCIAL', label: 'Financial', icon: 'CurrencyDollar', color: '#10b981' },
  { key: 'SOCIAL', label: 'Social', icon: 'Users01', color: '#3b82f6' },
  { key: 'PURPOSE', label: 'Purpose', icon: 'Compass', color: '#14b8a6' },
];

export interface RealmRating {
  realm: WellnessRealm;
  rating: number;
  likertResponses: Record<string, number> | null;
  notes: string | null;
}

export interface JournalEntry {
  id: number;
  date: string;
  reflection: string | null;
  gratitude: string | null;
  overallRating: number | null;
  realmRatings: RealmRating[];
}

export interface RealmAverage {
  realm: WellnessRealm;
  averageRating: number;
  count: number;
}
