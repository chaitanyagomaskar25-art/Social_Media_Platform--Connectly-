import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Modal from '../common/Modal';
import UserAvatar from '../common/UserAvatar';
import Button from '../common/Button';
import { userService } from '../../services/userService';
import { useSocket } from '../../context/SocketContext';
import { Loader2 } from 'lucide-react';

export default function FollowersModal({
  isOpen,
  onClose,
  userId,
  type = 'followers', // 'followers' or 'following'
}) {
  const { socket, isUserOnline } = useSocket();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    if (!isOpen || !userId) return;

    const fetchUsers = async () => {
      setLoading(true);
      setError('');
      setPage(1);
      try {
        const res =
          type === 'followers'
            ? await userService.getFollowers(userId, 1)
            : await userService.getFollowing(userId, 1);

        if (isMounted) {
          const list = Array.isArray(res)
            ? res
            : type === 'followers'
              ? res.followers || []
              : res.following || [];
          setUsers(list);
          setHasMore(list.length === 20);
        }
      } catch (err) {
        if (isMounted) setError(err.message || 'Could not load this list.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchUsers();
    return () => {
      isMounted = false;
    };
  }, [isOpen, userId, type]);

  useEffect(() => {
    if (!isOpen || !userId || !socket) return;

    const handleFollowUpdated = (data) => {
      if (
        (type === 'followers' && String(data.followingId) === String(userId)) ||
        (type === 'following' && String(data.followerId) === String(userId))
      ) {
        userService[type === 'followers' ? 'getFollowers' : 'getFollowing'](userId, 1)
          .then((res) => {
            const list = Array.isArray(res)
              ? res
              : type === 'followers'
                ? res.followers || []
                : res.following || [];
            setUsers(list);
          })
          .catch(() => {});
      }
    };

    socket.on('follow:updated', handleFollowUpdated);
    return () => {
      socket.off('follow:updated', handleFollowUpdated);
    };
  }, [isOpen, userId, type, socket]);

  const loadMore = async () => {
    const nextPage = page + 1;
    setLoadingMore(true);
    setError('');
    try {
      const response = type === 'followers'
        ? await userService.getFollowers(userId, nextPage)
        : await userService.getFollowing(userId, nextPage);
      const nextUsers = type === 'followers'
        ? response.followers || []
        : response.following || [];
      setUsers((current) => [...current, ...nextUsers]);
      setPage(nextPage);
      setHasMore(nextUsers.length === 20);
    } catch (err) {
      setError(err.message || 'Could not load more users.');
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={type === 'followers' ? 'Followers' : 'Following'}
    >
      <div className="max-h-80 overflow-y-auto space-y-3">
        {error && <p className="rounded-xl bg-rose-500/10 p-2 text-xs text-rose-700 dark:text-rose-300 border border-rose-500/20">{error}</p>}
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-accent" />
          </div>
        ) : users.length > 0 ? (
          users.map((u) => {
            const uId = u.id || u._id || u.userId;
            return (
              <div key={uId} className="flex items-center justify-between py-1">
                <Link
                  to={`/profile/${uId}`}
                  onClick={onClose}
                  className="flex items-center gap-3 overflow-hidden flex-1 group"
                >
                  <UserAvatar
                    src={u.avatarUrl || u.avatar || u.profilePicture}
                    name={u.name || u.username}
                    size="sm"
                    statusIndicator={isUserOnline(uId)}
                  />
                  <div className="truncate">
                    <p className="text-xs font-semibold text-txt-primary group-hover:text-accent truncate transition-colors">
                      {u.name || u.username}
                    </p>
                    <p className="mono-meta text-[11px] text-txt-tertiary truncate">
                      @{u.username}
                    </p>
                  </div>
                </Link>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8 text-xs text-txt-tertiary">
            No {type} found.
          </div>
        )}
        {!loading && hasMore && (
          <div className="flex justify-center py-2">
            <Button size="sm" variant="outline" isLoading={loadingMore} onClick={loadMore}>Load more</Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
