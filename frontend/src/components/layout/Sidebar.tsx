'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  BarChart01,
  Zap,
  Calendar,
  CalendarPlus01,
  Target01,
  Heart,
  Ruler,
  Camera01,
  MedicalCross,
  BookOpen01,
  Moon01,
  Shield01,
  File06,
  X,
  SwitchVertical01,
  Scales02,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
} from '@untitled-ui/icons-react';
import { useUIStore } from '@/lib/stores/ui';
import { useAuthStore } from '@/lib/stores/auth';
import { apiClient } from '@/lib/api/client';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const DEFAULT_NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: BarChart01 },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/therapeutics', label: 'Therapeutics', icon: MedicalCross },
  { href: '/workouts', label: 'Workouts', icon: Zap },
  { href: '/habits', label: 'Habits', icon: Target01 },
  { href: '/nutrition', label: 'Nutrition', icon: Heart },
  { href: '/sleep', label: 'Sleep', icon: Moon01 },
  { href: '/vitals', label: 'Vitals', icon: Activity },
  { href: '/body-metrics', label: 'Body Metrics', icon: Ruler },
  { href: '/appointments', label: 'Appointments', icon: CalendarPlus01 },
  { href: '/medical-records', label: 'Medical Records', icon: File06 },
  { href: '/substance-tracker', label: 'Substance Tracker', icon: Shield01 },
  { href: '/progress-photos', label: 'Progress Photos', icon: Camera01 },
  { href: '/journal', label: 'Journal', icon: BookOpen01 },
];

interface SidebarConfigItem {
  href: string;
  visible: boolean;
}

interface NavSection {
  label: string;
  hrefs: string[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: 'OVERVIEW',
    hrefs: ['/dashboard', '/calendar'],
  },
  {
    label: 'TRACKING',
    hrefs: ['/therapeutics', '/workouts', '/habits', '/nutrition', '/sleep'],
  },
  {
    label: 'HEALTH DATA',
    hrefs: ['/vitals', '/body-metrics'],
  },
  {
    label: 'LIFESTYLE',
    hrefs: ['/appointments', '/medical-records', '/substance-tracker', '/progress-photos', '/journal'],
  },
];

function getIconForHref(href: string): React.ComponentType<{ className?: string }> {
  const item = DEFAULT_NAV_ITEMS.find((n) => n.href === href);
  return item?.icon ?? BarChart01;
}

function getLabelForHref(href: string): string {
  const item = DEFAULT_NAV_ITEMS.find((n) => n.href === href);
  return item?.label ?? href;
}


function SidebarSettingsModal({
  config,
  onSave,
  onClose,
}: {
  config: SidebarConfigItem[];
  onSave: (config: SidebarConfigItem[]) => void;
  onClose: () => void;
}) {
  const [items, setItems] = useState<SidebarConfigItem[]>(config);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const moveUp = (index: number) => {
    if (index === 0) return;
    setItems((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  };

  const moveDown = (index: number) => {
    if (index >= items.length - 1) return;
    setItems((prev) => {
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  };

  const toggleVisibility = (index: number) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, visible: !item.visible } : item))
    );
  };

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === dropIndex) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }
    setItems((prev) => {
      const next = [...prev];
      const [dragged] = next.splice(dragIndex, 1);
      next.splice(dropIndex, 0, dragged);
      return next;
    });
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleSave = () => {
    onSave(items);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-xl border border-card-border bg-card-bg shadow-2xl mx-4">
        <div className="flex items-center justify-between border-b border-card-border px-4 py-3">
          <h3 className="text-[13px] font-semibold text-foreground">Customize Sidebar</h3>
          <button onClick={onClose} className="rounded-md p-1 text-muted hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-2">
          <ul className="space-y-0.5">
            {items.map((item, index) => {
              const Icon = getIconForHref(item.href);
              const label = getLabelForHref(item.href);
              return (
                <li
                  key={item.href}
                  draggable={true}
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] transition-colors ${
                    item.visible ? 'bg-sidebar-bg' : 'bg-sidebar-bg/50 opacity-40'
                  } ${dragIndex === index ? 'opacity-40' : ''} ${
                    dragOverIndex === index && dragIndex !== index
                      ? 'border-t-2 border-primary'
                      : 'border-t-2 border-transparent'
                  }`}
                >
                  <svg
                    className="h-4 w-4 shrink-0 cursor-grab text-muted/50"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                  >
                    <circle cx="5.5" cy="3.5" r="1.5" />
                    <circle cx="10.5" cy="3.5" r="1.5" />
                    <circle cx="5.5" cy="8" r="1.5" />
                    <circle cx="10.5" cy="8" r="1.5" />
                    <circle cx="5.5" cy="12.5" r="1.5" />
                    <circle cx="10.5" cy="12.5" r="1.5" />
                  </svg>
                  <Icon className="h-4 w-4 shrink-0 text-muted" />
                  <span className="flex-1 text-foreground">{label}</span>
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => moveUp(index)}
                      disabled={index === 0}
                      className="rounded p-1 text-muted hover:text-foreground disabled:opacity-20 transition-colors"
                      title="Move up"
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => moveDown(index)}
                      disabled={index === items.length - 1}
                      className="rounded p-1 text-muted hover:text-foreground disabled:opacity-20 transition-colors"
                      title="Move down"
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => toggleVisibility(index)}
                      className="rounded p-1 text-muted hover:text-foreground transition-colors"
                      title={item.visible ? 'Hide' : 'Show'}
                    >
                      {item.visible ? (
                        <Eye className="h-3.5 w-3.5" />
                      ) : (
                        <EyeOff className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="flex justify-end gap-2 border-t border-card-border px-4 py-3">
          <button
            onClick={onClose}
            className="rounded-lg px-3.5 py-1.5 text-[13px] font-medium text-muted hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="rounded-lg bg-primary px-3.5 py-1.5 text-[13px] font-medium text-white hover:bg-primary-dark transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}


function LogoIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M16 28S3 20.5 3 12.5C3 8.36 6.36 5 10.5 5c2.54 0 4.78 1.26 6.15 3.18L16 7.12C17.37 5.06 19.46 4 21.5 4 25.64 4 29 7.36 29 11.5c0 8-13 16.5-13 16.5Z"
        fill="currentColor"
        opacity="0.15"
      />
      <path
        d="M16 28S3 20.5 3 12.5C3 8.36 6.36 5 10.5 5c2.54 0 4.78 1.26 6.15 3.18L16 7.12C17.37 5.06 19.46 4 21.5 4 25.64 4 29 7.36 29 11.5c0 8-13 16.5-13 16.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M5 16h5.5l2-4 3 8 2.5-6 2 2H26"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}


export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen } = useUIStore();
  const { user } = useAuthStore();
  const [sidebarConfig, setSidebarConfig] = useState<SidebarConfigItem[] | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showLegalMenu, setShowLegalMenu] = useState(false);

  useEffect(() => {
    if (user?.sidebarConfig) {
      try {
        const parsed = JSON.parse(user.sidebarConfig);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const configHrefs = new Set(parsed.map((c: SidebarConfigItem) => c.href));
          const merged: SidebarConfigItem[] = [
            ...parsed,
            ...DEFAULT_NAV_ITEMS
              .filter((n) => !configHrefs.has(n.href))
              .map((n) => ({ href: n.href, visible: true })),
          ];
          setSidebarConfig(merged);
          return;
        }
      } catch {
      }
    }
    setSidebarConfig(DEFAULT_NAV_ITEMS.map((n) => ({ href: n.href, visible: true })));
  }, [user?.sidebarConfig]);

  const handleSaveConfig = useCallback(
    async (config: SidebarConfigItem[]) => {
      setSidebarConfig(config);
      try {
        await apiClient('/api/v1/profile/sidebar-config', {
          method: 'PUT',
          body: config,
        });
      } catch {
      }
    },
    []
  );

  const visibleHrefs = new Set(
    (sidebarConfig ?? DEFAULT_NAV_ITEMS.map((n) => ({ href: n.href, visible: true })))
      .filter((c) => c.visible)
      .map((c) => c.href)
  );

  const sectionsWithItems = NAV_SECTIONS.map((section) => ({
    label: section.label,
    items: section.hrefs
      .filter((href) => visibleHrefs.has(href))
      .map((href) => DEFAULT_NAV_ITEMS.find((n) => n.href === href))
      .filter(Boolean) as NavItem[],
  })).filter((section) => section.items.length > 0);

  return (
    <>
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col bg-sidebar-bg transition-transform lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          borderRight: '1px solid var(--sidebar-border)',
          boxShadow: 'inset 0 8px 16px -8px rgba(0, 0, 0, 0.06)',
        }}
      >
        <div className="flex items-center justify-between px-5 py-4">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-gradient-to-br from-primary to-primary-dark text-white shadow-md shadow-primary/20 transition-shadow group-hover:shadow-lg group-hover:shadow-primary/30">
              <LogoIcon className="h-[18px] w-[18px]" />
            </div>
            <span className="text-sm font-bold tracking-tight text-foreground">Health Tracker</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="rounded-md p-1 text-muted hover:bg-card-border/30 transition-colors lg:hidden">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mx-4 border-t border-sidebar-border" />

        <nav className="flex-1 overflow-y-auto px-3 pt-3 pb-2">
          {sectionsWithItems.map((section, sectionIndex) => (
            <div key={section.label} className={sectionIndex > 0 ? 'mt-5' : ''}>
              <div className="mb-1.5 px-3">
                <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-light">
                  {section.label}
                </span>
              </div>
              <ul className="space-y-0.5">
                {section.items.map(({ href, label, icon: Icon }) => {
                  const isActive = pathname?.startsWith(href);
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        onClick={() => setSidebarOpen(false)}
                        className={`group relative flex items-center gap-2.5 rounded-lg px-3 py-[7px] text-[13px] font-medium transition-all duration-150 ${
                          isActive
                            ? 'bg-primary/8 text-primary'
                            : 'text-muted hover:bg-card-border/30 hover:text-foreground'
                        }`}
                      >
                        {isActive && (
                          <div
                            className="absolute left-0 top-1/2 -translate-y-1/2 h-[18px] w-[3px] rounded-r-full bg-primary"
                          />
                        )}
                        <Icon className="h-[18px] w-[18px] shrink-0" />
                        {label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-sidebar-border px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-light">v0.1</span>
              <a href="https://mdcran.com" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center rounded-full bg-primary/10 px-2 py-[2px] text-[9px] font-semibold tracking-wide text-primary hover:bg-primary/20 transition-colors">
                by MDCran
              </a>
            </div>
            <div className="flex items-center gap-0.5">
              <div className="relative">
                <button
                  onClick={() => setShowLegalMenu(!showLegalMenu)}
                  className="rounded-md p-1.5 text-muted-light hover:text-foreground hover:bg-card-border/30 transition-colors"
                  title="Legal"
                >
                  <Scales02 className="h-3.5 w-3.5" />
                </button>
                {showLegalMenu && (
                  <>
                    <div className="fixed inset-0 z-[60]" onClick={() => setShowLegalMenu(false)} />
                    <div className="absolute bottom-full right-0 mb-1 z-[61] w-44 rounded-lg border border-card-border bg-card-bg shadow-xl py-1">
                      <Link
                        href="/legal/terms"
                        onClick={() => { setShowLegalMenu(false); setSidebarOpen(false); }}
                        className="flex items-center px-3 py-2 text-[13px] text-muted hover:text-foreground hover:bg-card-border/30 transition-colors"
                      >
                        Terms of Service
                      </Link>
                      <Link
                        href="/legal/privacy"
                        onClick={() => { setShowLegalMenu(false); setSidebarOpen(false); }}
                        className="flex items-center px-3 py-2 text-[13px] text-muted hover:text-foreground hover:bg-card-border/30 transition-colors"
                      >
                        Privacy Policy
                      </Link>
                    </div>
                  </>
                )}
              </div>
              <button
                onClick={() => setShowSettings(true)}
                className="rounded-md p-1.5 text-muted-light hover:text-foreground hover:bg-card-border/30 transition-colors"
                title="Customize sidebar"
              >
                <SwitchVertical01 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {showSettings && sidebarConfig && (
        <SidebarSettingsModal
          config={sidebarConfig}
          onSave={handleSaveConfig}
          onClose={() => setShowSettings(false)}
        />
      )}
    </>
  );
}
