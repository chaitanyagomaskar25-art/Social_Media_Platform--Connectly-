import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import UserAvatar from '../common/UserAvatar';
import Button from '../common/Button';
import ThemeToggle from '../common/ThemeToggle';
import {
  Plus,
  LogOut,
  User,
  Compass,
  Bell,
  Sparkles,
  Camera,
  Home,
  Bookmark,
} from 'lucide-react';
import { notificationService } from '../../services/notificationService';
import { useSocket } from '../../context/SocketContext';
import { useToast } from '../../context/ToastContext';

export default function Navbar({ onOpenCreatePost }) {
  const { user, logout, isAuthenticated } = useAuth();
  const { socket } = useSocket();
  const { showInfo } = useToast();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return undefined;
    }
    let active = true;
    const loadUnreadCount = async () => {
      try {
        const result = await notificationService.getUnreadCount();
        if (active) setUnreadCount(result.unreadCount || 0);
      } catch {
        if (active) setUnreadCount(0);
      }
    };
    loadUnreadCount();
    const refresh = () => loadUnreadCount();
    const intervalId = window.setInterval(loadUnreadCount, 30000);
    window.addEventListener('connectly:notifications-updated', refresh);
    return () => {
      active = false;
      window.clearInterval(intervalId);
      window.removeEventListener('connectly:notifications-updated', refresh);
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!socket || !isAuthenticated) return;

    const handleNewNotification = (data) => {
      if (typeof data.unreadCount === 'number') {
        setUnreadCount(data.unreadCount);
      } else {
        setUnreadCount((prev) => prev + 1);
      }

      const n = data?.notification;
      if (n) {
        const username = n.sender?.username
          ? `@${n.sender.username}`
          : n.sender?.name || 'Someone';
        if (n.type === 'like') {
          showInfo(`❤️ ${username} liked your post.`);
        } else if (n.type === 'comment') {
          showInfo(`💬 ${username} commented on your post.`);
        } else if (n.type === 'reply') {
          showInfo(`↪️ ${username} replied to your comment.`);
        } else if (n.type === 'mention') {
          showInfo(`🏷️ ${username} mentioned you in a comment.`);
        } else if (n.type === 'follow') {
          showInfo(`👤 ${username} started following you.`);
        }
      }

      window.dispatchEvent(new CustomEvent('connectly:notifications-updated', { detail: data }));
    };

    const handleDeleteNotification = (data) => {
      if (typeof data.unreadCount === 'number') {
        setUnreadCount(data.unreadCount);
      } else {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      window.dispatchEvent(new CustomEvent('connectly:notifications-updated', { detail: data }));
    };

    socket.on('notification:new', handleNewNotification);
    socket.on('notification:deleted', handleDeleteNotification);

    return () => {
      socket.off('notification:new', handleNewNotification);
      socket.off('notification:deleted', handleDeleteNotification);
    };
  }, [socket, isAuthenticated, showInfo]);

  // Global keyboard shortcut for quick navigation (Cmd/Ctrl + K to Explore)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        navigate('/explore');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
    navigate('/login');
  };

  // Dynamic Contextual Section Title
  const getContextualHeading = () => {
    const p = location.pathname;
    if (p === '/feed') return { title: 'Editorial Feed', subtitle: 'Curated dispatches & stories' };
    if (p === '/explore') return { title: 'Explore & Discover', subtitle: 'Trending conversations & curators' };
    if (p === '/stories') return { title: 'Visual Stories', subtitle: 'Ephemeral moments from creators' };
    if (p.startsWith('/saved') || p.startsWith('/collections'))
      return { title: 'Saved Archives', subtitle: 'Personal collections & bookmarks' };
    if (p === '/analytics') return { title: 'Creator Insights', subtitle: 'Engagement & audience analytics' };
    if (p === '/notifications') return { title: 'Activity', subtitle: 'Recent notifications & interactions' };
    if (p === '/messages') return { title: 'Direct Messages', subtitle: 'Private atelier inquiries' };
    if (p === '/settings') return { title: 'Preferences', subtitle: 'Account settings & appearance' };
    if (p === '/admin') return { title: 'Moderation Studio', subtitle: 'Community safety & review' };
    if (p.startsWith('/profile')) return { title: 'Creator Profile', subtitle: 'Personal portfolio & timeline' };
    if (p.startsWith('/posts')) return { title: 'Editorial Thread', subtitle: 'Discussion & comments' };
    return { title: 'Connectly', subtitle: 'Creative community' };
  };

  const { title } = getContextualHeading();
  const currentUserId = user?.id || user?._id || user?.userId;
  const username = user?.username || user?.email?.split('@')[0] || 'User';

  const isFeed = location.pathname === '/feed';
  const isStories = location.pathname === '/stories';
  const isExplore = location.pathname === '/explore';

  return (
    <header className="sticky top-0 z-30 bg-canvas/85 backdrop-blur-xl border-b border-border-subtle py-2.5 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3 sm:gap-4">
          {/* Left Brand & Contextual Title */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <Link to="/feed" className="flex items-center gap-2.5 shrink-0 group" title="Connectly Atelier">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-accent to-accent-hover text-white shadow-editorial-xs transition-transform duration-200 group-hover:scale-105">
                <span className="font-serif text-lg font-bold text-white select-none leading-none">C</span>
              </div>
              <span className="font-serif text-lg sm:text-xl font-bold tracking-tight text-txt-primary group-hover:text-accent transition-colors">
                Connectly
              </span>
            </Link>

            {/* Desktop Contextual Breadcrumb */}
            <div className="hidden xl:flex flex-col border-l border-border-subtle/80 pl-3">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-txt-muted">
                  Atelier
                </span>
                <span className="text-txt-muted text-xs">/</span>
                <span className="text-xs font-semibold text-accent font-serif tracking-wide">
                  {title}
                </span>
              </div>
            </div>
          </div>

          {/* Center Modern Atelier Capsule Navigator */}
          {isAuthenticated && (
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Sleek Floating Pill Segmented Control */}
              <nav
                className="flex items-center p-1 rounded-full bg-surface-subtle/80 backdrop-blur-md border border-border-subtle shadow-editorial-xs"
                aria-label="Atelier Navigation"
              >
                {/* Home Tab */}
                <Link
                  to="/feed"
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                    isFeed
                      ? 'bg-surface text-accent shadow-editorial-xs border border-border-subtle/60'
                      : 'text-txt-secondary hover:text-txt-primary hover:bg-surface/50'
                  }`}
                >
                  <Home className={`w-3.5 h-3.5 ${isFeed ? 'text-accent' : 'text-txt-tertiary'}`} />
                  <span>Home</span>
                </Link>

                {/* Story Tab */}
                <Link
                  to="/stories"
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 relative ${
                    isStories
                      ? 'bg-surface text-accent shadow-editorial-xs border border-border-subtle/60'
                      : 'text-txt-secondary hover:text-txt-primary hover:bg-surface/50'
                  }`}
                >
                  <Camera className={`w-3.5 h-3.5 ${isStories ? 'text-accent' : 'text-txt-tertiary'}`} />
                  <span>Story</span>
                  {/* Subtle 24h glowing pulse dot */}
                  <span className="flex h-1.5 w-1.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent" />
                  </span>
                </Link>

                {/* Explore Tab */}
                <Link
                  to="/explore"
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                    isExplore
                      ? 'bg-surface text-accent shadow-editorial-xs border border-border-subtle/60'
                      : 'text-txt-secondary hover:text-txt-primary hover:bg-surface/50'
                  }`}
                >
                  <Compass className={`w-3.5 h-3.5 ${isExplore ? 'text-accent' : 'text-txt-tertiary'}`} />
                  <span>Explore</span>
                </Link>
              </nav>

              {/* Real-time Live Atelier Status Pill */}
              <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-surface-subtle/60 border border-border-subtle text-[10px] font-mono text-txt-tertiary">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Atelier Live</span>
              </div>
            </div>
          )}

          {/* Right Action Cluster */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Quick Create Action */}
            {isAuthenticated && (
              <Button
                onClick={onOpenCreatePost}
                size="sm"
                icon={Plus}
                className="hidden sm:inline-flex rounded-full px-3.5 py-1.5 text-xs font-semibold shadow-editorial-xs bg-accent hover:bg-accent-hover text-white"
              >
                New Post
              </Button>
            )}

            {/* Notifications Bell */}
            {isAuthenticated && (
              <Link
                to="/notifications"
                className="relative p-2 rounded-xl text-txt-secondary hover:text-txt-primary hover:bg-surface-elevated transition-colors"
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-surface">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>
            )}

            {/* Quick Theme Toggle */}
            <ThemeToggle variant="icon" />

            {/* Profile Avatar & Quick Dropdown */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 p-0.5 rounded-full ring-2 ring-transparent hover:ring-accent/40 focus:outline-none transition-all"
                  aria-expanded={dropdownOpen}
                  aria-label="User menu"
                >
                  <UserAvatar
                    src={user?.avatarUrl || user?.avatar || user?.profilePicture}
                    name={user?.name || username}
                    size="sm"
                  />
                </button>

                {dropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-surface rounded-2xl shadow-editorial-xl border border-border-subtle py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-4 py-3 border-b border-border-subtle">
                        <p className="text-sm font-semibold text-txt-primary truncate">
                          {user?.name || username}
                        </p>
                        <p className="text-xs text-txt-muted truncate font-mono">
                          @{username}
                        </p>
                      </div>

                      <div className="py-1">
                        <Link
                          to={`/profile/${currentUserId}`}
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-txt-secondary hover:bg-surface-elevated hover:text-txt-primary transition-colors"
                        >
                          <User className="w-4 h-4 text-accent" />
                          <span>View Profile</span>
                        </Link>
                        <Link
                          to="/explore"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-txt-secondary hover:bg-surface-elevated hover:text-txt-primary transition-colors"
                        >
                          <Compass className="w-4 h-4 text-accent" />
                          <span>Explore Community</span>
                        </Link>
                        <Link
                          to="/saved"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-txt-secondary hover:bg-surface-elevated hover:text-txt-primary transition-colors"
                        >
                          <Bookmark className="w-4 h-4 text-accent" />
                          <span>Saved Archives</span>
                        </Link>
                        <Link
                          to="/notifications"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center justify-between gap-2.5 px-4 py-2 text-xs font-medium text-txt-secondary hover:bg-surface-elevated hover:text-txt-primary transition-colors"
                        >
                          <span className="flex items-center gap-2.5">
                            <Bell className="w-4 h-4 text-accent" />
                            <span>Notifications</span>
                          </span>
                          {unreadCount > 0 && (
                            <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-white">
                              {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                          )}
                        </Link>
                      </div>

                      <div className="border-t border-border-subtle pt-1">
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-rose-500 hover:bg-rose-500/10 transition-colors text-left"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Log out</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="outline" size="sm" className="px-3.5 font-semibold shadow-editorial-xs">
                    Log In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm" className="px-3.5 font-semibold bg-accent hover:bg-accent-hover text-white shadow-editorial-sm">
                    Register
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
