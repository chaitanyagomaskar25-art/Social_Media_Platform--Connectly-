import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { userService } from '../../services/userService';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useToast } from '../../context/ToastContext';
import UserAvatar from '../common/UserAvatar';
import Button from '../common/Button';
import { Sparkles, Users, TrendingUp, Compass, ArrowRight } from 'lucide-react';

export default function RightSidebar() {
  const { user: currentUser } = useAuth();
  const { socket, isUserOnline } = useSocket();
  const { showSuccess, showError } = useToast();
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followingStates, setFollowingStates] = useState({});

  useEffect(() => {
    let isMounted = true;
    const fetchSuggestions = async () => {
      try {
        const res = await userService.getSuggestedUsers();
        if (isMounted) {
          const list = Array.isArray(res) ? res : res.users || res.data || [];
          const currentId = currentUser?.id || currentUser?._id || currentUser?.userId;
          setSuggestedUsers(
            list.filter((u) => (u.id || u._id || u.userId) !== currentId).slice(0, 4)
          );
        }
      } catch (err) {
        console.warn('Could not fetch suggestions:', err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchSuggestions();
    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  useEffect(() => {
    if (!socket) return;
    const handleFollowUpdated = (data) => {
      const currentId = currentUser?.id || currentUser?._id || currentUser?.userId;
      if (String(data.followerId) === String(currentId)) {
        setFollowingStates((prev) => ({
          ...prev,
          [data.followingId]: data.action === 'follow',
        }));
      }
    };
    socket.on('follow:updated', handleFollowUpdated);
    return () => {
      socket.off('follow:updated', handleFollowUpdated);
    };
  }, [socket, currentUser]);

  const handleFollowToggle = async (targetUser) => {
    const targetId = targetUser.id || targetUser._id || targetUser.userId;
    const isCurrentlyFollowing = followingStates[targetId];

    try {
      if (isCurrentlyFollowing) {
        await userService.unfollowUser(targetId);
        setFollowingStates((prev) => ({ ...prev, [targetId]: false }));
        showSuccess(`Unfollowed @${targetUser.username || 'user'}`);
      } else {
        await userService.followUser(targetId);
        setFollowingStates((prev) => ({ ...prev, [targetId]: true }));
        showSuccess(`Followed @${targetUser.username || 'user'}`);
      }
    } catch (err) {
      showError(err.message || 'Action failed');
    }
  };

  const trendingTopics = [
    { tag: 'design', count: '1.2k thoughts' },
    { tag: 'minimalism', count: '890 thoughts' },
    { tag: 'architecture', count: '640 thoughts' },
    { tag: 'editorial', count: '520 thoughts' },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-80 shrink-0 sticky top-20 self-start space-y-5 pb-6">
      {/* Suggested Curators */}
      <div className="bg-surface rounded-3xl p-5 border border-border-subtle shadow-editorial-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-txt-primary font-serif font-bold text-sm tracking-tight">
            <Users className="w-4 h-4 text-accent" />
            <span>Featured Creators</span>
          </div>
          <Link
            to="/explore"
            className="text-[11px] font-medium text-accent hover:underline flex items-center gap-0.5"
          >
            Explore <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between animate-pulse">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-border-medium/60 rounded-full" />
                  <div className="space-y-1">
                    <div className="w-20 h-3 bg-border-medium/60 rounded" />
                    <div className="w-14 h-2.5 bg-border-subtle rounded" />
                  </div>
                </div>
                <div className="w-14 h-7 bg-surface-elevated rounded-full" />
              </div>
            ))}
          </div>
        ) : suggestedUsers.length > 0 ? (
          <div className="space-y-3">
            {suggestedUsers.map((su) => {
              const suId = su.id || su._id || su.userId;
              const isFollowing = followingStates[suId] || su.isFollowing;
              return (
                <div key={suId} className="flex items-center justify-between gap-2">
                  <Link
                    to={`/profile/${suId}`}
                    className="flex items-center gap-2.5 overflow-hidden flex-1 group"
                  >
                    <UserAvatar
                      src={su.avatarUrl || su.avatar || su.profilePicture}
                      name={su.name || su.username}
                      size="sm"
                      statusIndicator={isUserOnline(suId)}
                    />
                    <div className="truncate">
                      <p className="text-xs font-semibold text-txt-primary truncate group-hover:text-accent transition-colors">
                        {su.name || su.username}
                      </p>
                      <p className="text-[11px] text-txt-muted truncate">
                        @{su.username}
                      </p>
                    </div>
                  </Link>

                  <Button
                    size="sm"
                    variant={isFollowing ? 'secondary' : 'outline'}
                    onClick={() => handleFollowToggle(su)}
                    className="rounded-full text-xs px-2.5 py-1 shrink-0"
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </Button>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-txt-muted">Discover more creators in Explore.</p>
        )}
      </div>

      {/* Curated Editorial Topics */}
      <div className="bg-surface rounded-3xl p-5 border border-border-subtle shadow-editorial-xs">
        <div className="flex items-center gap-2 mb-3 text-txt-primary font-serif font-bold text-sm tracking-tight">
          <TrendingUp className="w-4 h-4 text-accent" />
          <span>Trending Perspectives</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {trendingTopics.map((topic) => (
            <Link
              key={topic.tag}
              to={`/explore?q=${topic.tag}`}
              className="inline-flex items-center gap-1.5 rounded-full bg-surface-elevated px-3 py-1.5 text-xs text-txt-secondary hover:text-accent hover:border-accent border border-border-subtle transition-colors"
            >
              <span className="font-medium text-accent">#</span>
              <span>{topic.tag}</span>
              <span className="text-[10px] text-txt-muted">· {topic.count}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Atelier Community card */}
      <div className="bg-surface-elevated/70 rounded-3xl p-5 border border-border-subtle shadow-editorial-xs">
        <div className="flex items-center gap-2 text-accent font-serif font-bold text-xs mb-2 tracking-tight">
          <Sparkles className="w-4 h-4" />
          <span>Connectly Atelier</span>
        </div>
        <p className="text-xs text-txt-secondary leading-relaxed">
          Express ideas, share visual stories, and connect with creative minds in an elevated, distraction-free environment.
        </p>
        <div className="mt-4 text-[11px] text-txt-muted flex flex-wrap gap-2">
          <span>&copy; {new Date().getFullYear()} Connectly</span>
          <span>&bull;</span>
          <span className="hover:text-txt-primary cursor-pointer transition-colors">Privacy</span>
          <span>&bull;</span>
          <span className="hover:text-txt-primary cursor-pointer transition-colors">Terms</span>
        </div>
      </div>
    </aside>
  );
}
