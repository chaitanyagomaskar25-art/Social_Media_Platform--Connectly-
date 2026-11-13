import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { notificationService } from '../../services/notificationService';
import { Home, Compass, Plus, Bell, User } from 'lucide-react';
import UserAvatar from '../common/UserAvatar';

export default function MobileNavigation({ onOpenCreatePost }) {
  const { user, isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const currentUserId = user?.id || user?._id || user?.userId;

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

  return (
    <nav
      className="md:hidden fixed bottom-4 inset-x-4 max-w-md mx-auto z-40 bg-surface/90 backdrop-blur-2xl border border-border-subtle rounded-full shadow-editorial-xl py-1.5 px-4 transition-all duration-200"
      aria-label="Mobile bottom navigation"
    >
      <div className="flex items-center justify-between">
        {/* Feed */}
        <NavLink
          to="/feed"
          className={({ isActive }) =>
            `relative flex flex-col items-center justify-center p-2 rounded-full transition-all duration-200 ${
              isActive ? 'text-accent scale-110' : 'text-txt-secondary hover:text-txt-primary'
            }`
          }
          aria-label="Feed"
        >
          {({ isActive }) => (
            <>
              <Home className={`w-5 h-5 ${isActive ? 'text-accent stroke-[2.2]' : 'text-txt-secondary'}`} />
              {isActive && (
                <span className="absolute -bottom-0.5 h-1 w-1 rounded-full bg-accent animate-in zoom-in-75 duration-150" />
              )}
            </>
          )}
        </NavLink>

        {/* Explore */}
        <NavLink
          to="/explore"
          className={({ isActive }) =>
            `relative flex flex-col items-center justify-center p-2 rounded-full transition-all duration-200 ${
              isActive ? 'text-accent scale-110' : 'text-txt-secondary hover:text-txt-primary'
            }`
          }
          aria-label="Explore"
        >
          {({ isActive }) => (
            <>
              <Compass className={`w-5 h-5 ${isActive ? 'text-accent stroke-[2.2]' : 'text-txt-secondary'}`} />
              {isActive && (
                <span className="absolute -bottom-0.5 h-1 w-1 rounded-full bg-accent animate-in zoom-in-75 duration-150" />
              )}
            </>
          )}
        </NavLink>

        {/* Center Floating Create Post Action */}
        <button
          type="button"
          onClick={onOpenCreatePost}
          className="flex h-11 w-11 items-center justify-center -my-2 rounded-full bg-accent text-white shadow-editorial-md transition-transform duration-200 hover:scale-110 active:scale-95"
          aria-label="Create post"
        >
          <Plus className="w-6 h-6 text-white" />
        </button>

        {/* Notifications */}
        <NavLink
          to="/notifications"
          className={({ isActive }) =>
            `relative flex flex-col items-center justify-center p-2 rounded-full transition-all duration-200 ${
              isActive ? 'text-accent scale-110' : 'text-txt-secondary hover:text-txt-primary'
            }`
          }
          aria-label="Notifications"
        >
          {({ isActive }) => (
            <>
              <Bell className={`w-5 h-5 ${isActive ? 'text-accent stroke-[2.2]' : 'text-txt-secondary'}`} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-2 w-2 rounded-full bg-rose-500 ring-2 ring-surface" />
              )}
              {isActive && (
                <span className="absolute -bottom-0.5 h-1 w-1 rounded-full bg-accent animate-in zoom-in-75 duration-150" />
              )}
            </>
          )}
        </NavLink>

        {/* Profile */}
        <NavLink
          to={`/profile/${currentUserId}`}
          className={({ isActive }) =>
            `relative flex flex-col items-center justify-center p-1.5 rounded-full transition-all duration-200 ${
              isActive ? 'ring-2 ring-accent' : 'opacity-80 hover:opacity-100'
            }`
          }
          aria-label="Your Profile"
        >
          <UserAvatar
            src={user?.avatarUrl || user?.avatar || user?.profilePicture}
            name={user?.name || user?.username}
            size="xs"
          />
        </NavLink>
      </div>
    </nav>
  );
}
