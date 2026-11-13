import React, { useEffect, useState } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { notificationService } from '../../services/notificationService';
import UserAvatar from '../common/UserAvatar';
import ThemeToggle from '../common/ThemeToggle';
import {
  Home,
  Compass,
  Bookmark,
  Camera,
  BarChart3,
  Bell,
  Settings,
  ShieldCheck,
  Plus,
  LogOut,
  User,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

export default function NavigationRail({ onOpenCreatePost }) {
  const { user, logout, isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const currentUserId = user?.id || user?._id || user?.userId;
  const username = user?.username || 'user';

  // Notification count listener
  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }
    let active = true;
    const fetchUnread = async () => {
      try {
        const res = await notificationService.getUnreadCount();
        if (active) setUnreadCount(res.unreadCount || 0);
      } catch {
        if (active) setUnreadCount(0);
      }
    };
    fetchUnread();

    const handleUpdate = (e) => {
      if (typeof e.detail?.unreadCount === 'number') {
        setUnreadCount(e.detail.unreadCount);
      } else {
        fetchUnread();
      }
    };
    window.addEventListener('connectly:notifications-updated', handleUpdate);
    return () => {
      active = false;
      window.removeEventListener('connectly:notifications-updated', handleUpdate);
    };
  }, [isAuthenticated]);

  // Primary destinations
  const navItems = [
    { label: 'Feed', path: '/feed', icon: Home, shortcut: '1' },
    { label: 'Explore', path: '/explore', icon: Compass, shortcut: '2' },
    { label: 'Stories', path: '/stories', icon: Camera, shortcut: '3' },
    { label: 'Saved', path: '/saved', icon: Bookmark, shortcut: '4' },
    { label: 'Insights', path: '/analytics', icon: BarChart3, shortcut: '5' },
    {
      label: 'Activity',
      path: '/notifications',
      icon: Bell,
      badge: unreadCount,
      shortcut: '6',
    },
    { label: 'Messages', path: '/messages', icon: MessageSquare, shortcut: 'M' },
    { label: 'Settings', path: '/settings', icon: Settings, shortcut: '7' },
    ...(user?.role === 'admin'
      ? [{ label: 'Moderation', path: '/admin', icon: ShieldCheck, shortcut: 'A' }]
      : []),
  ];

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await logout();
    navigate('/login');
  };

  return (
    <aside
      className="hidden md:flex fixed left-4 top-4 bottom-4 w-[72px] lg:w-20 z-40 bg-surface/90 backdrop-blur-xl border border-border-subtle rounded-3xl shadow-editorial-md flex-col items-center py-5 justify-between select-none transition-all duration-200"
      aria-label="Sidebar navigation"
    >
      {/* Top Brand Monogram */}
      <div className="flex flex-col items-center gap-3">
        <Link
          to="/feed"
          className="group relative flex h-11 w-11 items-center justify-center rounded-2xl bg-accent text-white shadow-editorial-sm transition-all duration-200 hover:scale-105 hover:shadow-editorial-glow active:scale-95"
          title="Connectly Atelier"
        >
          <span className="font-serif text-2xl font-bold tracking-tight text-white select-none leading-none">
            C
          </span>
          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-surface shadow-sm" />

          {/* Tooltip */}
          <span className="pointer-events-none absolute left-[calc(100%+14px)] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-xl border border-border-subtle bg-surface px-3 py-1.5 text-xs font-semibold text-txt-primary opacity-0 shadow-editorial-md transition-all duration-150 group-hover:opacity-100 group-hover:translate-x-1 z-50">
            Connectly Atelier
          </span>
        </Link>
      </div>

      {/* Central Navigation Rail */}
      <nav className="flex flex-col items-center gap-1.5 my-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isCurrentRoute =
            location.pathname === item.path ||
            (item.path === '/saved' && location.pathname.startsWith('/collections'));

          return (
            <div key={item.path} className="group relative flex items-center">
              <NavLink
                to={item.path}
                className={({ isActive: isNavActive }) => {
                  const active = isNavActive || isCurrentRoute;
                  return `relative flex h-11 w-11 items-center justify-center rounded-2xl transition-all duration-200 active:scale-95 ${
                    active
                      ? 'bg-accent text-white shadow-editorial-sm scale-105'
                      : 'text-txt-secondary hover:bg-surface-elevated hover:text-txt-primary hover:scale-105'
                  }`;
                }}
                aria-label={item.label}
              >
                {({ isActive: isNavActive }) => {
                  const active = isNavActive || isCurrentRoute;
                  return (
                    <>
                      {active && (
                        <span className="absolute -left-3 top-2.5 bottom-2.5 w-1 rounded-r-full bg-accent animate-in fade-in duration-200" />
                      )}
                      <Icon
                        className={`h-5 w-5 transition-colors duration-200 ${
                          active ? 'text-white' : 'text-txt-secondary group-hover:text-txt-primary'
                        }`}
                      />

                      {/* Badge indicator */}
                      {item.badge > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-surface animate-pulse">
                          {item.badge > 99 ? '99+' : item.badge}
                        </span>
                      )}
                    </>
                  );
                }}
              </NavLink>

              {/* Tooltip flyout on hover */}
              <div className="pointer-events-none absolute left-[calc(100%+14px)] top-1/2 -translate-y-1/2 flex items-center gap-2 rounded-xl border border-border-subtle bg-surface px-3 py-1.5 text-xs font-medium text-txt-primary opacity-0 shadow-editorial-md transition-all duration-150 group-hover:opacity-100 group-hover:translate-x-1 z-50">
                <span className="whitespace-nowrap font-medium">{item.label}</span>
                {item.shortcut && (
                  <kbd className="hidden lg:inline-block rounded bg-surface-elevated px-1.5 py-0.5 text-[10px] font-mono text-txt-muted border border-border-subtle">
                    ⌘{item.shortcut}
                  </kbd>
                )}
              </div>
            </div>
          );
        })}

        {/* Distinctive Create Post Button */}
        <div className="group relative pt-2">
          <button
            type="button"
            onClick={onOpenCreatePost}
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-elevated text-accent border border-accent/40 shadow-editorial-xs transition-all duration-200 hover:bg-accent hover:text-white hover:scale-110 active:scale-95"
            aria-label="Create new post"
          >
            <Plus className="h-5 w-5 transition-transform duration-200 group-hover:rotate-90" />
          </button>

          {/* Tooltip */}
          <div className="pointer-events-none absolute left-[calc(100%+14px)] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-xl border border-border-subtle bg-surface px-3 py-1.5 text-xs font-semibold text-accent opacity-0 shadow-editorial-md transition-all duration-150 group-hover:opacity-100 group-hover:translate-x-1 z-50">
            Publish Thought / Post
          </div>
        </div>
      </nav>

      {/* Bottom Rail Actions: Theme Toggle & User Flyout */}
      <div className="flex flex-col items-center gap-3">
        {/* Compact Theme Toggle */}
        <div className="group relative">
          <ThemeToggle variant="icon" />
          <div className="pointer-events-none absolute left-[calc(100%+14px)] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-xl border border-border-subtle bg-surface px-3 py-1.5 text-xs font-medium text-txt-primary opacity-0 shadow-editorial-md transition-all duration-150 group-hover:opacity-100 group-hover:translate-x-1 z-50">
            Toggle Theme
          </div>
        </div>

        {/* User Profile Avatar & Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="group relative flex h-10 w-10 items-center justify-center rounded-full ring-2 ring-transparent transition-all duration-200 hover:ring-accent/40 focus:outline-none"
            aria-label="User account menu"
            aria-expanded={userMenuOpen}
          >
            <UserAvatar
              src={user?.avatarUrl || user?.avatar || user?.profilePicture}
              name={user?.name || username}
              size="sm"
            />
          </button>

          {/* User Menu Modal / Flyout */}
          {userMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setUserMenuOpen(false)}
              />
              <div className="absolute left-[calc(100%+16px)] bottom-0 w-60 rounded-2xl border border-border-subtle bg-surface p-2 shadow-editorial-xl z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2.5 border-b border-border-subtle">
                  <p className="text-sm font-semibold text-txt-primary truncate">
                    {user?.name || username}
                  </p>
                  <p className="text-xs text-txt-muted truncate">@{username}</p>
                </div>

                <div className="py-1">
                  <Link
                    to={`/profile/${currentUserId}`}
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-txt-secondary hover:bg-surface-elevated hover:text-txt-primary transition-colors"
                  >
                    <User className="h-4 w-4 text-accent" />
                    <span>View Profile</span>
                  </Link>

                  <Link
                    to="/saved"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-txt-secondary hover:bg-surface-elevated hover:text-txt-primary transition-colors"
                  >
                    <Bookmark className="h-4 w-4 text-accent" />
                    <span>Saved Archives</span>
                  </Link>

                  <Link
                    to="/settings"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-txt-secondary hover:bg-surface-elevated hover:text-txt-primary transition-colors"
                  >
                    <Settings className="h-4 w-4 text-accent" />
                    <span>Preferences & Theme</span>
                  </Link>
                </div>

                <div className="border-t border-border-subtle pt-1">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-rose-500 hover:bg-rose-500/10 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
