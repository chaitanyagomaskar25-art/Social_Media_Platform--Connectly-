import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { postService } from '../services/postService';
import CreatePostCard from '../components/posts/CreatePostCard';
import PostCard from '../components/posts/PostCard';
import StoriesTray from '../components/stories/StoriesTray';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { PostSkeleton } from '../components/common/LoadingSkeleton';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import Button from '../components/common/Button';
import {
  MessageSquarePlus,
  RefreshCw,
  Flame,
  Clock,
  Sparkles,
  TrendingUp,
  SlidersHorizontal,
  Compass,
} from 'lucide-react';

export default function FeedPage() {
  const { user } = useAuth();
  const { openCreateModal } = useOutletContext() || {};
  const { socket } = useSocket();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sentinel, setSentinel] = useState(null);

  // Content Discovery Filter States: 'following' | 'popular' | 'latest'
  const [activeTab, setActiveTab] = useState('following');
  const [activeTag, setActiveTag] = useState(null);

  const firstName = user?.name?.split(' ')[0] || user?.username || 'Creator';

  // Dynamic Time-of-Day Editorial Greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const fetchFeed = useCallback(
    async (pageNum = 1, append = false, filterTab = activeTab, filterTag = activeTag) => {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);
      setError(null);

      try {
        let responseData;
        if (filterTag) {
          responseData = await postService.searchPosts({
            hashtag: filterTag,
            page: pageNum,
            limit: 10,
          });
        } else if (filterTab === 'popular') {
          responseData = await postService.searchPosts({
            sort: 'popular',
            page: pageNum,
            limit: 10,
          });
        } else if (filterTab === 'latest') {
          responseData = await postService.searchPosts({
            sort: 'newest',
            page: pageNum,
            limit: 10,
          });
        } else {
          // Default: Chronological Following Feed
          responseData = await postService.getFeed({ page: pageNum, limit: 10 });
        }

        const newPosts = Array.isArray(responseData)
          ? responseData
          : responseData.posts || responseData.data?.posts || responseData.data || [];

        if (append) {
          setPosts((prev) => [...prev, ...newPosts]);
        } else {
          setPosts(newPosts);
        }

        setHasMore(
          responseData.pagination
            ? pageNum < responseData.pagination.totalPages
            : newPosts.length >= 10
        );
        setPage(pageNum);
      } catch (err) {
        setError(err.message || 'Could not load your feed.');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [activeTab, activeTag]
  );

  useEffect(() => {
    fetchFeed(1, false, activeTab, activeTag);
  }, [fetchFeed, activeTab, activeTag]);

  useEffect(() => {
    const handlePostCreated = () => {
      fetchFeed(1, false, activeTab, activeTag);
    };
    const handleUserBlocked = (event) => {
      const blockedId = event.detail?.userId;
      if (!blockedId) return;
      setPosts((current) =>
        current.filter((post) => {
          const authorId =
            post.author?._id || post.author?.id || post.user?._id || post.user?.id;
          return String(authorId) !== String(blockedId);
        })
      );
    };

    window.addEventListener('connectly:post-created', handlePostCreated);
    window.addEventListener('connectly:user-blocked', handleUserBlocked);
    return () => {
      window.removeEventListener('connectly:post-created', handlePostCreated);
      window.removeEventListener('connectly:user-blocked', handleUserBlocked);
    };
  }, [fetchFeed, activeTab, activeTag]);

  // Real-time socket events
  useEffect(() => {
    if (!socket) return;

    const handleRealtimePostCreated = (data) => {
      if (data?.post) {
        setPosts((prev) => {
          const id = data.post.id || data.post._id;
          if (prev.some((p) => (p.id || p._id) === id)) return prev;
          return [data.post, ...prev];
        });
      }
    };

    const handleRealtimePostDeleted = (data) => {
      if (data?.postId) {
        setPosts((prev) => prev.filter((p) => String(p.id || p._id) !== String(data.postId)));
      }
    };

    const handleRealtimePostUpdated = (data) => {
      if (data?.post) {
        const updatedId = data.post.id || data.post._id;
        setPosts((prev) => prev.map((p) => ((p.id || p._id) === updatedId ? data.post : p)));
      }
    };

    socket.on('post:created', handleRealtimePostCreated);
    socket.on('post:deleted', handleRealtimePostDeleted);
    socket.on('post:updated', handleRealtimePostUpdated);

    return () => {
      socket.off('post:created', handleRealtimePostCreated);
      socket.off('post:deleted', handleRealtimePostDeleted);
      socket.off('post:updated', handleRealtimePostUpdated);
    };
  }, [socket]);

  const handleDeletePost = (deletedId) => {
    setPosts((prev) => prev.filter((p) => (p.id || p._id) !== deletedId));
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchFeed(page + 1, true, activeTab, activeTag);
    }
  };

  useEffect(() => {
    if (!sentinel || !hasMore || loadingMore || loading) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) handleLoadMore();
      },
      { rootMargin: '300px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [sentinel, hasMore, loadingMore, loading, page, fetchFeed]);

  const discoverTags = ['design', 'minimalism', 'architecture', 'writing', 'photography'];

  return (
    <div className="space-y-6">
      {/* 1. Distinctive Feed Heading Area */}
      <header className="rounded-3xl border border-border-subtle bg-surface p-6 sm:p-7 shadow-editorial-xs">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Connectly Atelier Edition</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-txt-primary">
              {greeting}, {firstName}.
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-txt-secondary leading-relaxed">
              Curated perspectives, long-form thoughts, and visual moments from your creative circle.
            </p>
          </div>

          <div className="text-right hidden sm:block">
            <span className="mono-meta text-xs text-txt-muted block">
              {new Date().toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>

        {/* Discovery & Feed Filter Controls */}
        <div className="mt-6 pt-4 border-t border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Main Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-surface-elevated/80 border border-border-subtle w-fit">
            <button
              type="button"
              onClick={() => {
                setActiveTab('following');
                setActiveTag(null);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'following' && !activeTag
                  ? 'bg-accent text-white font-semibold shadow-editorial-xs'
                  : 'text-txt-secondary hover:text-txt-primary hover:bg-surface'
              }`}
            >
              <Clock className={`w-3.5 h-3.5 ${activeTab === 'following' && !activeTag ? 'text-white' : 'text-accent'}`} />
              <span>Following</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('popular');
                setActiveTag(null);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'popular' && !activeTag
                  ? 'bg-accent text-white font-semibold shadow-editorial-xs'
                  : 'text-txt-secondary hover:text-txt-primary hover:bg-surface'
              }`}
            >
              <Flame className={`w-3.5 h-3.5 ${activeTab === 'popular' && !activeTag ? 'text-white' : 'text-accent'}`} />
              <span>Highlights</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('latest');
                setActiveTag(null);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'latest' && !activeTag
                  ? 'bg-accent text-white font-semibold shadow-editorial-xs'
                  : 'text-txt-secondary hover:text-txt-primary hover:bg-surface'
              }`}
            >
              <Compass className={`w-3.5 h-3.5 ${activeTab === 'latest' && !activeTag ? 'text-white' : 'text-accent'}`} />
              <span>All Latest</span>
            </button>
          </div>

          {/* Quick Discoverable Topic Tags */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {discoverTags.map((tag) => (
              <button
                type="button"
                key={tag}
                onClick={() => {
                  if (activeTag === tag) {
                    setActiveTag(null);
                  } else {
                    setActiveTag(tag);
                  }
                }}
                className={`shrink-0 rounded-full px-3 py-1 text-xs transition-all ${
                  activeTag === tag
                    ? 'bg-accent text-white font-medium shadow-editorial-xs'
                    : 'bg-surface-elevated/70 text-txt-secondary hover:text-txt-primary hover:bg-surface-elevated border border-border-subtle'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* 2. Visual Stories Tray */}
      <StoriesTray />

      {/* 3. Studio Post Creation Entry Bar */}
      <CreatePostCard onOpenModal={openCreateModal} />

      {/* 4. Asymmetric Editorial Feed Content */}
      {loading ? (
        <div className="space-y-5">
          <PostSkeleton />
          <PostSkeleton />
          <PostSkeleton />
        </div>
      ) : error ? (
        <ErrorState
          title="Could not load dispatches"
          message={error}
          onRetry={() => fetchFeed(1, false, activeTab, activeTag)}
        />
      ) : posts.length === 0 ? (
        <EmptyState
          icon={MessageSquarePlus}
          title={activeTag ? `No dispatches tagged #${activeTag}` : 'Your feed is quiet'}
          description={
            activeTag
              ? 'Be the first creator to share a dispatch under this topic.'
              : 'Be the first to share an update, thought, or visual series with the Connectly community!'
          }
          actionLabel="Publish First Dispatch"
          onAction={openCreateModal}
        />
      ) : (
        <div className="space-y-6">
          {posts.map((post, index) => {
            // First post is rendered with Featured Spotlight styling!
            const isFeatured = index === 0 && !activeTag;

            return (
              <React.Fragment key={post.id || post._id}>
                <PostCard
                  post={post}
                  onDelete={handleDeletePost}
                  variant={isFeatured ? 'featured' : 'default'}
                />

                {/* Editorial Intermission Banner between posts 2 & 3 */}
                {index === 1 && posts.length > 2 && (
                  <div className="rounded-3xl border border-dashed border-accent/40 bg-accent/5 p-5 text-center sm:text-left sm:flex sm:items-center sm:justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-semibold text-accent font-serif">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>Community Dialogue</span>
                      </div>
                      <p className="text-xs text-txt-secondary">
                        Engage in thoughtful discourse. Leave annotations and responses on creators' dispatches.
                      </p>
                    </div>
                    <Link
                      to="/explore"
                      className="mt-3 sm:mt-0 inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline shrink-0"
                    >
                      <span>Explore Curators</span> &rarr;
                    </Link>
                  </div>
                )}
              </React.Fragment>
            );
          })}

          {/* Load More Pagination */}
          {hasMore && (
            <div className="pt-4 flex flex-col items-center gap-2">
              <div ref={setSentinel} aria-hidden="true" className="h-1 w-full" />
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoadMore}
                isLoading={loadingMore}
                icon={RefreshCw}
                className="rounded-full px-6 shadow-editorial-xs"
              >
                Load More Dispatches
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
