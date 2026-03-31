'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Menu01, LogOut01, Bell01, Settings01, Key01, ChevronDown, X, Sun, Moon01 } from '@untitled-ui/icons-react';
import { useUIStore } from '@/lib/stores/ui';
import { API_BASE } from '@/lib/api/client';
import { GlobalSearch } from '@/components/GlobalSearch';
import { useAuthStore } from '@/lib/stores/auth';
import { useThemeStore } from '@/lib/stores/theme';
import { notificationsApi, type NotificationItem } from '@/lib/api/notifications';
import { formatDistanceToNow } from 'date-fns';

const TYPE_COLORS: Record<string, string> = {
  THERAPEUTIC: 'bg-purple/10 text-purple',
  WORKOUT: 'bg-warning/10 text-warning',
  HABIT: 'bg-teal/10 text-teal',
};

export function Header() {
  const { toggleSidebar } = useUIStore();
  const { theme, toggle: toggleTheme } = useThemeStore();
  const { user, logout, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const { data: unread } = useQuery({
    queryKey: ['notifications-unread'],
    queryFn: () => notificationsApi.unreadCount(),
    refetchInterval: 60000,
    enabled: isAuthenticated,
  });

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.list(),
    enabled: dropdownOpen && isAuthenticated,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: number) => notificationsApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
    },
  });

  const dismissMutation = useMutation({
    mutationFn: (id: number) => notificationsApi.dismiss(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
    },
  });

  const dismissAllMutation = useMutation({
    mutationFn: () => notificationsApi.dismissAll(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
      setDropdownOpen(false);
    },
  });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (n: NotificationItem) => {
    if (!n.read) markReadMutation.mutate(n.id);
    if (n.linkUrl) {
      router.push(n.linkUrl);
      setDropdownOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const unreadCount = unread?.count ?? 0;

  return (
    <header
      className="flex h-14 items-center justify-between bg-card-bg px-4 lg:px-6"
      style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)' }}
    >
      <button
        onClick={toggleSidebar}
        className="rounded-md p-1.5 text-muted hover:bg-card-border/30 transition-colors lg:hidden"
      >
        <Menu01 className="h-[18px] w-[18px]" />
      </button>

      <GlobalSearch />

      <div className="flex items-center gap-1.5">

        <button
          onClick={toggleTheme}
          className="rounded-lg p-1.5 text-muted-light hover:text-foreground hover:bg-card-border/30 transition-colors"
          title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        >
          {theme === 'light' ? <Moon01 className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </button>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="relative rounded-lg p-1.5 text-muted-light hover:text-foreground hover:bg-card-border/30 transition-colors"
            title="Notifications"
          >
            <Bell01 className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-danger ring-2 ring-card-bg" />
            )}
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-hidden rounded-xl border border-card-border bg-card-bg shadow-lg z-50">
              <div className="flex items-center justify-between border-b border-card-border px-4 py-2.5">
                <h3 className="text-[13px] font-semibold text-foreground">Notifications</h3>
                <div className="flex gap-1">
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllReadMutation.mutate()}
                      className="rounded px-2 py-0.5 text-[10px] font-medium text-primary hover:bg-primary/10 transition-colors"
                    >
                      Mark all read
                    </button>
                  )}
                  {notifications && notifications.length > 0 && (
                    <button
                      onClick={() => dismissAllMutation.mutate()}
                      className="rounded px-2 py-0.5 text-[10px] font-medium text-muted hover:bg-card-border/50 transition-colors"
                    >
                      Clear all
                    </button>
                  )}
                </div>
              </div>

              <div className="max-h-72 overflow-y-auto">
                {(!notifications || notifications.length === 0) && (
                  <div className="px-4 py-8 text-center">
                    <Bell01 className="mx-auto mb-2 h-5 w-5 text-muted-light/50" />
                    <p className="text-[13px] text-muted-light">No notifications</p>
                  </div>
                )}
                {notifications?.map((n) => (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3 border-b border-card-border/60 px-4 py-3 transition-colors hover:bg-sidebar-bg cursor-pointer ${
                      !n.read ? 'bg-primary/[0.03]' : ''
                    }`}
                    onClick={() => handleNotificationClick(n)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />}
                        <span className={`text-[13px] font-medium truncate ${n.read ? 'text-muted' : 'text-foreground'}`}>
                          {n.title}
                        </span>
                      </div>
                      {n.message && (
                        <p className="mt-0.5 text-[11px] text-muted-light truncate">{n.message}</p>
                      )}
                      <div className="mt-1 flex items-center gap-2">
                        <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium ${
                          TYPE_COLORS[n.notificationType] || 'bg-muted-light/10 text-muted'
                        }`}>
                          {n.notificationType}
                        </span>
                        <span className="text-[10px] text-muted-light">
                          {formatDistanceToNow(new Date(n.scheduledFor), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); dismissMutation.mutate(n.id); }}
                      className="shrink-0 rounded p-1 text-muted-light hover:text-danger hover:bg-danger/10 transition-colors"
                      title="Dismiss"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mx-1 h-5 w-px bg-card-border" />

        {user && (
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              className="group flex items-center gap-2 rounded-lg px-1.5 py-1 transition-all duration-150 hover:bg-card-border/30 cursor-pointer"
            >
              {user.hasAvatar ? (
                <img
                  src={`${API_BASE}/api/v1/profile/avatar?token=${typeof window !== 'undefined' ? localStorage.getItem('auth_token') : ''}`}
                  alt=""
                  className="h-7 w-7 rounded-full object-cover ring-1 ring-card-border group-hover:ring-primary/30 transition-all"
                />
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-[11px] font-semibold ring-1 ring-card-border group-hover:ring-primary/30 transition-all">
                  {(user.firstName || user.username || '?').charAt(0).toUpperCase()}
                </div>
              )}
              <ChevronDown className={`h-3 w-3 text-muted-light group-hover:text-muted transition-all hidden sm:block ${profileMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {profileMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-56 rounded-xl border border-card-border bg-card-bg shadow-lg z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-card-border">
                  <p className="text-[13px] font-semibold text-foreground">
                    {[user.firstName, user.lastName].filter(Boolean).join(' ') || user.username}
                  </p>
                  <p className="text-[11px] text-muted-light mt-0.5">@{user.username}</p>
                </div>
                <div className="py-1">
                  <Link
                    href="/profile"
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-foreground hover:bg-sidebar-bg transition-colors"
                  >
                    <Settings01 className="h-[15px] w-[15px] text-muted" />
                    Profile Settings
                  </Link>
                  <Link
                    href="/profile/integrations"
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-foreground hover:bg-sidebar-bg transition-colors"
                  >
                    <Key01 className="h-[15px] w-[15px] text-muted" />
                    Integrations
                  </Link>
                </div>
                <div className="border-t border-card-border py-1">
                  <button
                    onClick={() => { setProfileMenuOpen(false); handleLogout(); }}
                    className="flex w-full items-center gap-2.5 px-4 py-2 text-[13px] text-danger hover:bg-danger/5 transition-colors"
                  >
                    <LogOut01 className="h-[15px] w-[15px]" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
