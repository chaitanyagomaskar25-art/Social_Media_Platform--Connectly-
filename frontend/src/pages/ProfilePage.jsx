import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { userService } from '../services/userService';
import { postService } from '../services/postService';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';
import ProfileHeader from '../components/profile/ProfileHeader';
import EditProfileModal from '../components/profile/EditProfileModal';
import FollowersModal from '../components/profile/FollowersModal';
import PostCard from '../components/posts/PostCard';
import ImageLightboxModal from '../components/posts/ImageLightboxModal';
import { ProfileSkeleton, PostSkeleton } from '../components/common/LoadingSkeleton';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import {
  MessageSquare,
  Image as ImageIcon,
  PenLine,
  Lock,
  Grid,
  List,
  Maximize2,
} from 'lucide-react';

export default function ProfilePage() {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const { socket } = useSocket();
  const { showError, showSuccess } = useToast();

  const currentUserId = currentUser?.id || currentUser?._id || currentUser?.userId;
  const isOwnProfile = !id || String(id) === String(currentUserId);
  const targetId = isOwnProfile ? currentUserId : id;

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tabs: 'all' | 'visual' | 'essays'
  const [activeTab, setActiveTab] = useState('all');

  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followRequestPending, setFollowRequestPending] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [followersModalType, setFollowersModalType] = useState(null); // 'followers' | 'following' | null

  // Lightbox modal for gallery clicks
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const fetchProfileAndPosts = useCallback(async () => {
    if (!targetId) return;
    setLoading(true);
    setError(null);

    try {
      // 1. Fetch Profile
      const profileData = await userService.getUserProfile(targetId);
      const userObj = profileData.user || profileData.data || profileData;
      setProfile(userObj);

      if (!isOwnProfile && userObj.privateAccount && !userObj.isFollowing) {
        const requestData = await userService.getFollowRequestStatus(targetId);
        setFollowRequestPending(Boolean(requestData.request));
      } else {
        setFollowRequestPending(false);
      }

      // Check following status
      if (userObj.isFollowing !== undefined) {
        setIsFollowing(Boolean(userObj.isFollowing));
      } else if (Array.isArray(userObj.followers)) {
        setIsFollowing(
          userObj.followers.some(
            (f) =>
              (typeof f === 'object' ? (f.id || f._id) === currentUserId : f === currentUserId)
          )
        );
      }
    } catch (err) {
      if (isOwnProfile && currentUser) {
        setProfile(currentUser);
      } else {
        setError(err.message || 'Failed to load user profile');
      }
    } finally {
      setLoading(false);
    }

    // 2. Fetch User's Posts
    setPostsLoading(true);
    try {
      const postsData = await postService.getUserPosts(targetId);
      const postsList = Array.isArray(postsData)
        ? postsData
        : postsData.posts || postsData.data?.posts || postsData.data || [];
      setPosts(postsList);
      setProfile((prev) =>
        prev ? { ...prev, postsCount: postsData.count ?? postsList.length } : prev
      );
    } catch (err) {
      console.warn('Could not load user posts:', err.message);
      setPosts([]);
    } finally {
      setPostsLoading(false);
    }
  }, [targetId, isOwnProfile, currentUser, currentUserId]);

  useEffect(() => {
    fetchProfileAndPosts();
  }, [fetchProfileAndPosts]);

  // Real-time socket events for follows, users, posts
  useEffect(() => {
    if (!socket || !targetId) return;

    const handleFollowUpdated = (data) => {
      if (String(data.followingId) === String(targetId)) {
        setProfile((prev) => (prev ? { ...prev, followersCount: data.followersCount } : prev));
        if (String(data.followerId) === String(currentUserId)) {
          setIsFollowing(data.action === 'follow');
          setFollowRequestPending(false);
        }
      }
      if (String(data.followerId) === String(targetId)) {
        setProfile((prev) => (prev ? { ...prev, followingCount: data.followingCount } : prev));
      }
    };

    const handleFollowRequestUpdated = (data) => {
      if (
        String(data.recipientId) === String(targetId) &&
        String(data.requesterId) === String(currentUserId)
      ) {
        if (data.action === 'created') setFollowRequestPending(true);
        if (data.action === 'declined') setFollowRequestPending(false);
        if (data.action === 'accept') {
          setFollowRequestPending(false);
          setIsFollowing(true);
        }
      }
    };

    const handleUserUpdated = (data) => {
      const updatedId = data.user?.id || data.user?._id;
      if (String(updatedId) === String(targetId)) {
        setProfile((prev) => (prev ? { ...prev, ...data.user } : prev));
      }
    };

    const handlePostCreated = (data) => {
      const authorId =
        data.post?.author?._id || data.post?.author?.id || data.post?.author;
      if (String(authorId) === String(targetId)) {
        setPosts((prev) => {
          const pid = data.post.id || data.post._id;
          if (prev.some((p) => (p.id || p._id) === pid)) return prev;
          return [data.post, ...prev];
        });
        setProfile((prev) =>
          prev ? { ...prev, postsCount: (prev.postsCount || 0) + 1 } : prev
        );
      }
    };

    const handlePostDeleted = (data) => {
      if (!data?.postId) return;
      setPosts((prev) => {
        const next = prev.filter(
          (p) => String(p.id || p._id) !== String(data.postId)
        );
        if (next.length !== prev.length) {
          setProfile((p) =>
            p ? { ...p, postsCount: Math.max(0, (p.postsCount || 1) - 1) } : p
          );
        }
        return next;
      });
    };

    const handlePostUpdated = (data) => {
      if (!data?.post) return;
      const updatedId = data.post.id || data.post._id;
      setPosts((prev) =>
        prev.map((p) => ((p.id || p._id) === updatedId ? data.post : p))
      );
    };

    socket.on('follow:updated', handleFollowUpdated);
    socket.on('follow_request:updated', handleFollowRequestUpdated);
    socket.on('user:updated', handleUserUpdated);
    socket.on('post:created', handlePostCreated);
    socket.on('post:deleted', handlePostDeleted);
    socket.on('post:updated', handlePostUpdated);

    return () => {
      socket.off('follow:updated', handleFollowUpdated);
      socket.off('follow_request:updated', handleFollowRequestUpdated);
      socket.off('user:updated', handleUserUpdated);
      socket.off('post:created', handlePostCreated);
      socket.off('post:deleted', handlePostDeleted);
      socket.off('post:updated', handlePostUpdated);
    };
  }, [socket, targetId, currentUserId]);

  const handleFollowToggle = async () => {
    if (followLoading || !targetId) return;
    setFollowLoading(true);

    const prevFollowing = isFollowing;
    if (!prevFollowing && profile?.privateAccount) {
      try {
        await userService.sendFollowRequest(targetId);
        setFollowRequestPending(true);
        showSuccess('Follow request sent.');
      } catch (err) {
        showError(err.message || 'Could not send follow request.');
      } finally {
        setFollowLoading(false);
      }
      return;
    }

    setIsFollowing(!prevFollowing);
    setProfile((prev) => {
      if (!prev) return prev;
      const count =
        prev.followersCount ||
        (Array.isArray(prev.followers) ? prev.followers.length : 0);
      return {
        ...prev,
        followersCount: prevFollowing ? Math.max(0, count - 1) : count + 1,
      };
    });

    try {
      if (prevFollowing) {
        await userService.unfollowUser(targetId);
        showSuccess('Unfollowed user');
      } else {
        await userService.followUser(targetId);
        showSuccess('Following user');
      }
    } catch (err) {
      setIsFollowing(prevFollowing);
      showError(err.message || 'Follow action failed');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleDeletePost = (deletedId) => {
    setPosts((prev) => prev.filter((p) => (p.id || p._id) !== deletedId));
  };

  // Filtered posts based on active tab
  const filteredPosts = useMemo(() => {
    if (activeTab === 'visual') {
      return posts.filter(
        (p) => (p.media && p.media.length > 0) || p.imageUrl || p.image
      );
    }
    if (activeTab === 'essays') {
      return posts.filter(
        (p) => (!p.media || p.media.length === 0) && !p.imageUrl && !p.image
      );
    }
    return posts;
  }, [posts, activeTab]);

  const isPrivateLocked =
    !isOwnProfile && profile?.privateAccount && !isFollowing;

  if (loading) {
    return (
      <div className="space-y-6">
        <ProfileSkeleton />
        <PostSkeleton />
      </div>
    );
  }

  if (error && !profile) {
    return (
      <ErrorState
        title="User not found"
        message={error}
        onRetry={fetchProfileAndPosts}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Large Editorial Profile Header */}
      <ProfileHeader
        profile={profile}
        isOwnProfile={isOwnProfile}
        isFollowing={isFollowing}
        onFollowToggle={handleFollowToggle}
        onEditProfile={() => setIsEditModalOpen(true)}
        onOpenFollowers={() => setFollowersModalType('followers')}
        onOpenFollowing={() => setFollowersModalType('following')}
        isFollowLoading={followLoading}
        isFollowRequested={profile?.privateAccount && followRequestPending}
        onReport={async () => {
          const reason = window.prompt('Why are you reporting this account?');
          if (!reason?.trim()) return;
          try {
            await userService.reportContent('user', targetId, reason.trim());
            showSuccess('Account reported for review.');
          } catch (err) {
            showError(err.message || 'Could not report account.');
          }
        }}
        onBlock={async () => {
          if (!window.confirm(`Block @${profile?.username}?`)) return;
          try {
            await userService.blockUser(targetId);
            showSuccess('Account blocked.');
            setProfile(null);
            setError('You blocked this account.');
          } catch (err) {
            showError(err.message || 'Could not block account.');
          }
        }}
      />

      {/* 2. Private Account Gate */}
      {isPrivateLocked ? (
        <div className="rounded-3xl border border-border-subtle bg-surface p-12 text-center shadow-editorial-xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-elevated text-accent border border-border-subtle mb-4">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="font-serif text-xl font-bold text-txt-primary">
            This account is private
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-txt-secondary max-w-sm mx-auto">
            Follow this creator to view their timeline, curated galleries, and published dispatches.
          </p>
        </div>
      ) : (
        /* 3. Content Tabs & Timeline */
        <div className="space-y-5">
          {/* Editorial Content Navigation Tabs */}
          <div className="flex items-center justify-between border-b border-border-subtle pb-2 overflow-x-auto scrollbar-none">
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                  activeTab === 'all'
                    ? 'bg-accent text-white font-semibold shadow-editorial-xs'
                    : 'text-txt-secondary hover:text-txt-primary hover:bg-surface-elevated'
                }`}
              >
                <MessageSquare className={`w-4 h-4 ${activeTab === 'all' ? 'text-white' : 'text-accent'}`} />
                <span>All Dispatches</span>
                <span className={`mono-meta text-[11px] ${activeTab === 'all' ? 'text-white/80' : 'opacity-70'}`}>
                  ({posts.length})
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('visual')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                  activeTab === 'visual'
                    ? 'bg-accent text-white font-semibold shadow-editorial-xs'
                    : 'text-txt-secondary hover:text-txt-primary hover:bg-surface-elevated'
                }`}
              >
                <ImageIcon className={`w-4 h-4 ${activeTab === 'visual' ? 'text-white' : 'text-accent'}`} />
                <span>Visual Works</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('essays')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                  activeTab === 'essays'
                    ? 'bg-accent text-white font-semibold shadow-editorial-xs'
                    : 'text-txt-secondary hover:text-txt-primary hover:bg-surface-elevated'
                }`}
              >
                <PenLine className={`w-4 h-4 ${activeTab === 'essays' ? 'text-white' : 'text-accent'}`} />
                <span>Thoughts & Essays</span>
              </button>
            </div>
          </div>

          {/* Post Presentation Stream */}
          {postsLoading ? (
            <div className="space-y-4">
              <PostSkeleton />
              <PostSkeleton />
            </div>
          ) : filteredPosts.length > 0 ? (
            <div className="space-y-6">
              {filteredPosts.map((post) => (
                <PostCard
                  key={post.id || post._id || Math.random()}
                  post={post}
                  onDelete={handleDeletePost}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={activeTab === 'visual' ? ImageIcon : MessageSquare}
              title={
                activeTab === 'visual'
                  ? 'No visual works published'
                  : activeTab === 'essays'
                  ? 'No written essays yet'
                  : 'No dispatches yet'
              }
              description={
                isOwnProfile
                  ? 'You haven’t published any dispatches under this category yet.'
                  : `${profile?.name || 'This creator'} hasn’t published any content here yet.`
              }
            />
          )}
        </div>
      )}

      {/* Edit Profile Modal */}
      {isOwnProfile && (
        <EditProfileModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onProfileUpdated={(updated) =>
            setProfile((prev) => ({ ...prev, ...updated }))
          }
        />
      )}

      {/* Followers / Following Modal */}
      <FollowersModal
        isOpen={Boolean(followersModalType)}
        onClose={() => setFollowersModalType(null)}
        userId={targetId}
        type={followersModalType || 'followers'}
      />

      {/* Lightbox Modal */}
      <ImageLightboxModal
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        images={lightboxImages}
        initialIndex={lightboxIndex}
        author={profile}
      />
    </div>
  );
}
