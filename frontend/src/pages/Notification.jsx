import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { notificationService } from '../services/notificationService';
import { useSocket } from '../context/SocketContext';
import UserAvatar from '../components/common/UserAvatar';
import Button from '../components/common/Button';
import {
  Bell,
  Check,
  Trash2,
  Heart,
  MessageCircle,
  UserPlus,
  Sparkles,
  ArrowRight,
  Filter,
} from 'lucide-react';

export default function Notifications() {
  const { socket, isUserOnline } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Category Filter: 'all' | 'unread' | 'likes' | 'comments' | 'follows'
  const [filterType, setFilterType] = useState('all');

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const data = await notificationService.getNotifications(page, 20);
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
      setTotalPages(data.pagination?.totalPages || 1);
      window.dispatchEvent(new Event('connectly:notifications-updated'));
    } catch (err) {
      setError(err.data?.message || 'Could not load notifications.');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadNotifications();
    const intervalId = window.setInterval(loadNotifications, 30000);
    return () => window.clearInterval(intervalId);
  }, [loadNotifications]);

  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (data) => {
      if (data?.notification) {
        setNotifications((prev) => {
          const exists = prev.some((n) => n._id === data.notification._id);
          if (exists) {
            return prev.map((n) => (n._id === data.notification._id ? data.notification : n));
          }
          return [data.notification, ...prev];
        });
      }
      if (typeof data?.unreadCount === 'number') {
        setUnreadCount(data.unreadCount);
      } else {
        setUnreadCount((prev) => prev + 1);
      }
    };

    const handleDeleteNotification = (data) => {
      if (data?.filter) {
        setNotifications((prev) =>
          prev.filter((item) => {
            if (
              data.filter.post &&
              String(item.post?._id || item.post) === String(data.filter.post) &&
              item.type === data.filter.type
            ) {
              return false;
            }
            if (
              data.filter.comment &&
              String(item.comment?._id || item.comment) === String(data.filter.comment)
            ) {
              return false;
            }
            return true;
          })
        );
      }
      if (typeof data?.unreadCount === 'number') {
        setUnreadCount(data.unreadCount);
      } else {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    };

    socket.on('notification:new', handleNewNotification);
    socket.on('notification:deleted', handleDeleteNotification);

    return () => {
      socket.off('notification:new', handleNewNotification);
      socket.off('notification:deleted', handleDeleteNotification);
    };
  }, [socket]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications((current) =>
        current.map((notification) =>
          notification._id === notificationId
            ? { ...notification, readAt: new Date().toISOString() }
            : notification
        )
      );
      setUnreadCount((count) => Math.max(0, count - 1));
      window.dispatchEvent(new Event('connectly:notifications-updated'));
    } catch (err) {
      setError(err.data?.message || 'Could not mark notification as read.');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          readAt: notification.readAt || new Date().toISOString(),
        }))
      );
      setUnreadCount(0);
      window.dispatchEvent(new Event('connectly:notifications-updated'));
    } catch (err) {
      setError(err.data?.message || 'Could not mark all notifications as read.');
    }
  };

  const handleDelete = async (notificationId) => {
    const notification = notifications.find((item) => item._id === notificationId);
    try {
      await notificationService.deleteNotification(notificationId);
      setNotifications((current) => current.filter((item) => item._id !== notificationId));
      if (notification && !notification.readAt) {
        setUnreadCount((count) => Math.max(0, count - 1));
      }
      window.dispatchEvent(new Event('connectly:notifications-updated'));
    } catch (err) {
      setError(err.data?.message || 'Could not delete notification.');
    }
  };

  // Filtered notifications
  const filteredNotifications = useMemo(() => {
    if (filterType === 'unread') {
      return notifications.filter((n) => !n.readAt);
    }
    if (filterType === 'likes') {
      return notifications.filter((n) => n.type === 'like');
    }
    if (filterType === 'comments') {
      return notifications.filter(
        (n) => n.type === 'comment' || n.type === 'reply' || n.type === 'mention'
      );
    }
    if (filterType === 'follows') {
      return notifications.filter((n) => n.type === 'follow');
    }
    return notifications;
  }, [notifications, filterType]);

  const getNotificationBadge = (type) => {
    switch (type) {
      case 'like':
        return (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-white shadow-sm ring-2 ring-surface">
            <Heart className="h-3 w-3 fill-white" />
          </span>
        );
      case 'comment':
      case 'reply':
      case 'mention':
        return (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-white shadow-sm ring-2 ring-surface">
            <MessageCircle className="h-3 w-3" />
          </span>
        );
      case 'follow':
        return (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm ring-2 ring-surface">
            <UserPlus className="h-3 w-3" />
          </span>
        );
      default:
        return (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-white shadow-sm ring-2 ring-surface">
            <Bell className="h-3 w-3" />
          </span>
        );
    }
  };

  const getNotificationMessage = (notification) => {
    const sender = notification.sender;
    const name = sender?.name || (sender?.username ? `@${sender.username}` : 'Someone');

    switch (notification.type) {
      case 'follow':
        return (
          <span>
            <strong className="text-txt-primary font-serif">{name}</strong> started following your atelier profile.
          </span>
        );
      case 'like':
        return (
          <span>
            <strong className="text-txt-primary font-serif">{name}</strong> appreciated your dispatch.
          </span>
        );
      case 'comment':
        return (
          <span>
            <strong className="text-txt-primary font-serif">{name}</strong> added a response to your dispatch.
          </span>
        );
      case 'reply':
        return (
          <span>
            <strong className="text-txt-primary font-serif">{name}</strong> replied to your discussion thread.
          </span>
        );
      case 'mention':
        return (
          <span>
            <strong className="text-txt-primary font-serif">{name}</strong> mentioned you in a dispatch.
          </span>
        );
      default:
        return (
          <span>
            <strong className="text-txt-primary font-serif">{name}</strong> interacted with you.
          </span>
        );
    }
  };

  return (
    <main className="space-y-6">
      {/* 1. Header & Quick Actions */}
      <header className="rounded-3xl border border-border-subtle bg-surface p-6 sm:p-7 shadow-editorial-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Activity Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif tracking-tight text-txt-primary">
              Notifications & Mentions
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-txt-secondary leading-relaxed">
              Track community appreciations, dialogue responses, and new connections.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              icon={Check}
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
              className="rounded-full shadow-editorial-xs px-4"
            >
              Mark all read
            </Button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="pt-4 border-t border-border-subtle flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3.5 py-1.5 rounded-full transition-all ${
              filterType === 'all'
                ? 'bg-accent text-white font-medium shadow-editorial-xs'
                : 'bg-surface-elevated/70 text-txt-secondary hover:text-txt-primary border border-border-subtle'
            }`}
          >
            All Activity ({notifications.length})
          </button>

          <button
            type="button"
            onClick={() => setFilterType('unread')}
            className={`px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1 ${
              filterType === 'unread'
                ? 'bg-accent text-white font-medium shadow-editorial-xs'
                : 'bg-surface-elevated/70 text-txt-secondary hover:text-txt-primary border border-border-subtle'
            }`}
          >
            <span>Unread</span>
            {unreadCount > 0 && (
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setFilterType('likes')}
            className={`px-3.5 py-1.5 rounded-full transition-all ${
              filterType === 'likes'
                ? 'bg-accent text-white font-medium shadow-editorial-xs'
                : 'bg-surface-elevated/70 text-txt-secondary hover:text-txt-primary border border-border-subtle'
            }`}
          >
            Appreciations
          </button>

          <button
            type="button"
            onClick={() => setFilterType('comments')}
            className={`px-3.5 py-1.5 rounded-full transition-all ${
              filterType === 'comments'
                ? 'bg-accent text-white font-medium shadow-editorial-xs'
                : 'bg-surface-elevated/70 text-txt-secondary hover:text-txt-primary border border-border-subtle'
            }`}
          >
            Discussions
          </button>

          <button
            type="button"
            onClick={() => setFilterType('follows')}
            className={`px-3.5 py-1.5 rounded-full transition-all ${
              filterType === 'follows'
                ? 'bg-accent text-white font-medium shadow-editorial-xs'
                : 'bg-surface-elevated/70 text-txt-secondary hover:text-txt-primary border border-border-subtle'
            }`}
          >
            Connections
          </button>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs font-medium text-rose-500">
          {error}
        </div>
      )}

      {/* 2. Notification List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-3xl border border-border-subtle bg-surface p-4 flex items-center gap-3.5 animate-pulse"
            >
              <div className="w-11 h-11 bg-border-medium/60 rounded-full shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="w-3/4 h-3 bg-border-medium/60 rounded" />
                <div className="w-1/4 h-2.5 bg-border-subtle rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="rounded-3xl border border-border-subtle bg-surface px-6 py-16 text-center shadow-editorial-xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-elevated text-accent border border-border-subtle mb-3">
            <Bell className="h-6 w-6" />
          </div>
          <h2 className="font-serif text-lg font-bold text-txt-primary">
            {filterType === 'unread' ? 'No unread activity' : 'All caught up'}
          </h2>
          <p className="mt-1 text-xs text-txt-secondary max-w-xs mx-auto">
            {filterType === 'unread'
              ? 'You have reviewed all incoming notifications and appreciations.'
              : 'New discussions, appreciations, and connections will appear here in real time.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => {
            const isUnread = !notification.readAt;
            const senderId = notification.sender?._id || notification.sender?.id;

            return (
              <article
                key={notification._id}
                className={`relative flex items-start gap-3.5 rounded-3xl border p-4 sm:p-5 transition-all duration-200 group ${
                  isUnread
                    ? 'border-accent/40 bg-accent/5 shadow-editorial-xs'
                    : 'border-border-subtle bg-surface hover:border-border-medium'
                }`}
              >
                {/* Unread dot indicator */}
                {isUnread && (
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-accent animate-pulse" />
                )}

                {/* Avatar with Badge */}
                <div className="relative shrink-0 ml-1">
                  <UserAvatar
                    src={
                      notification.sender?.avatarUrl ||
                      notification.sender?.avatar ||
                      notification.sender?.profilePicture
                    }
                    name={notification.sender?.name || notification.sender?.username}
                    size="md"
                    statusIndicator={isUserOnline(senderId)}
                  />
                  <span className="absolute -bottom-1 -right-1">
                    {getNotificationBadge(notification.type)}
                  </span>
                </div>

                {/* Content Details */}
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="text-xs sm:text-sm text-txt-secondary leading-relaxed">
                    {getNotificationMessage(notification)}
                  </p>

                  {/* Post caption preview if applicable */}
                  {notification.post?.caption && (
                    <blockquote className="mt-1.5 rounded-xl bg-surface-elevated/70 border border-border-subtle px-3 py-1.5 text-xs text-txt-muted italic truncate font-serif">
                      "{notification.post.caption}"
                    </blockquote>
                  )}

                  {/* Context Links */}
                  <div className="mt-2 flex items-center gap-3 text-xs">
                    {notification.post?._id && (
                      <Link
                        to={`/posts/${notification.post._id}`}
                        className="inline-flex items-center gap-1 font-semibold text-accent hover:underline"
                      >
                        <span>View dispatch</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    )}

                    {notification.type === 'follow' && senderId && (
                      <Link
                        to={`/profile/${senderId}`}
                        className="inline-flex items-center gap-1 font-semibold text-accent hover:underline"
                      >
                        <span>View profile</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    )}

                    <time
                      className="mono-meta text-[11px] text-txt-muted"
                      dateTime={notification.createdAt}
                    >
                      {new Date(notification.createdAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </time>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex shrink-0 items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  {isUnread && (
                    <button
                      type="button"
                      onClick={() => handleMarkAsRead(notification._id)}
                      className="rounded-xl p-2 text-txt-muted hover:bg-surface-elevated hover:text-accent transition-colors"
                      title="Mark as read"
                      aria-label="Mark as read"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDelete(notification._id)}
                    className="rounded-xl p-2 text-txt-muted hover:bg-rose-500/10 hover:text-rose-500 transition-colors"
                    title="Remove notification"
                    aria-label="Remove notification"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* 3. Pagination Controls */}
      {totalPages > 1 && (
        <nav
          className="flex items-center justify-between rounded-2xl bg-surface border border-border-subtle px-4 py-3 text-xs text-txt-secondary"
          aria-label="Notification pagination"
        >
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((current) => current - 1)}
            className="rounded-full px-4"
          >
            Previous
          </Button>

          <span className="mono-meta">
            Page {page} of {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((current) => current + 1)}
            className="rounded-full px-4"
          >
            Next
          </Button>
        </nav>
      )}
    </main>
  );
}
