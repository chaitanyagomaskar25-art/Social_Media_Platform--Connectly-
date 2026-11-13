import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { userService } from '../services/userService';
import { postService } from '../services/postService';
import UserAvatar from '../components/common/UserAvatar';
import PostCard from '../components/posts/PostCard';
import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';
import {
  Search,
  Compass,
  Users,
  Loader2,
  TrendingUp,
  X,
  History,
  Sparkles,
  ArrowRight,
  Flame,
  Clock,
  Filter,
} from 'lucide-react';

const RECENT_SEARCHES_KEY = 'connectly_recent_searches';

export default function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const { socket, isUserOnline } = useSocket();
  const { showError, showSuccess } = useToast();

  const [query, setQuery] = useState(initialQuery);
  const [selectedTag, setSelectedTag] = useState(
    initialQuery.startsWith('#') ? initialQuery.slice(1) : ''
  );
  const [searchedUsers, setSearchedUsers] = useState([]);
  const [explorePosts, setExplorePosts] = useState([]);
  const [suggestedCreators, setSuggestedCreators] = useState([]);
  const [trendingTags, setTrendingTags] = useState([]);
  const [sort, setSort] = useState('newest'); // 'newest' | 'popular'
  const [resultFilter, setResultFilter] = useState('all'); // 'all' | 'creators' | 'dispatches'
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const saveRecentSearch = useCallback((term) => {
    const trimmed = term.trim();
    if (!trimmed || trimmed.length < 2) return;
    setRecentSearches((prev) => {
      const next = [trimmed, ...prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase())].slice(0, 6);
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const removeRecentSearch = (term) => {
    setRecentSearches((prev) => {
      const next = prev.filter((item) => item !== term);
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {}
  };

  // Synchronize when query changes from URL
  useEffect(() => {
    const urlQuery = searchParams.get('q') || '';
    if (urlQuery !== query) {
      setQuery(urlQuery);
      if (urlQuery.startsWith('#')) {
        setSelectedTag(urlQuery.slice(1));
      } else {
        setSelectedTag('');
      }
    }
  }, [searchParams]);

  // Load Suggested Creators for the Explore view
  useEffect(() => {
    let isMounted = true;
    userService
      .getSuggestedUsers()
      .then((res) => {
        if (isMounted) {
          const list = Array.isArray(res) ? res : res.users || res.data || [];
          setSuggestedCreators(list.slice(0, 6));
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch trending hashtags
  useEffect(() => {
    let isMounted = true;
    postService
      .getTrendingHashtags({ days: 7, limit: 12 })
      .then((result) => {
        if (isMounted) setTrendingTags(result.hashtags || []);
      })
      .catch((error) => {
        if (isMounted) {
          setTrendingTags([]);
          showError(error.message || 'Trending hashtags could not be loaded.');
        }
      });
    return () => {
      isMounted = false;
    };
  }, [showError]);

  // Main search / explore query executor
  useEffect(() => {
    const activeQuery = query.trim();
    let active = true;
    setPage(1);

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const [userResult, postResult] = await Promise.all([
          activeQuery
            ? userService.searchUsers(activeQuery, 1, 8)
            : Promise.resolve({ users: [] }),
          postService.searchPosts({
            ...(activeQuery
              ? activeQuery.startsWith('#')
                ? { hashtag: activeQuery.slice(1) }
                : { q: activeQuery }
              : {}),
            sort,
            page: 1,
            limit: 12,
          }),
        ]);

        const users = userResult.users || [];
        const posts = postResult.posts || [];

        if (active) {
          setSearchedUsers(users);
          setExplorePosts(posts);
          setPage(1);
          setTotalPages(postResult.pagination?.totalPages || 1);

          if (activeQuery) {
            saveRecentSearch(activeQuery);
          }
        }
      } catch (error) {
        if (active) {
          setSearchedUsers([]);
          setExplorePosts([]);
          setTotalPages(1);
          showError(error.message || 'Discovery search could not be completed.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }, 350);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, sort, showError, saveRecentSearch]);

  // Socket synchronization for real-time post deletions and edits
  useEffect(() => {
    if (!socket) return;

    const handlePostDeleted = (data) => {
      if (data?.postId) {
        setExplorePosts((prev) =>
          prev.filter((p) => String(p.id || p._id) !== String(data.postId))
        );
      }
    };

    const handlePostUpdated = (data) => {
      if (data?.post) {
        const uid = data.post.id || data.post._id;
        setExplorePosts((prev) =>
          prev.map((p) => ((p.id || p._id) === uid ? data.post : p))
        );
      }
    };

    socket.on('post:deleted', handlePostDeleted);
    socket.on('post:updated', handlePostUpdated);

    return () => {
      socket.off('post:deleted', handlePostDeleted);
      socket.off('post:updated', handlePostUpdated);
    };
  }, [socket]);

  // Pagination loader
  const loadMore = async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      const activeQuery = query.trim();
      const [userResult, postResult] = await Promise.all([
        activeQuery
          ? userService.searchUsers(activeQuery, page + 1, 8)
          : Promise.resolve({ users: [] }),
        postService.searchPosts({
          ...(activeQuery
            ? activeQuery.startsWith('#')
              ? { hashtag: activeQuery.slice(1) }
              : { q: activeQuery }
            : {}),
          sort,
          page: page + 1,
          limit: 12,
        }),
      ]);

      setSearchedUsers((current) => [...current, ...(userResult.users || [])]);
      setExplorePosts((current) => [...current, ...(postResult.posts || [])]);
      setTotalPages(postResult.pagination?.totalPages || 1);
      setPage((current) => current + 1);
    } catch (error) {
      showError(error.message || 'Could not load more results.');
    } finally {
      setLoadingMore(false);
    }
  };

  const handleTagClick = (tag) => {
    if (selectedTag === tag) {
      setSelectedTag('');
      setQuery('');
      setSearchParams({});
    } else {
      setSelectedTag(tag);
      setQuery(`#${tag}`);
      setSearchParams({ q: `#${tag}` });
    }
  };

  const handleClearQuery = () => {
    setQuery('');
    setSelectedTag('');
    setSearchParams({});
  };

  const isSearching = Boolean(query.trim());

  return (
    <div className="space-y-6">
      {/* 1. Visually Impressive Discovery & Search Header */}
      <header className="rounded-3xl border border-border-subtle bg-surface p-6 sm:p-7 shadow-editorial-xs">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold mb-2">
              <Compass className="w-3.5 h-3.5" />
              <span>Explore & Discovery</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-txt-primary">
              {isSearching ? `Search & Perspectives` : `Curated Atelier Discovery`}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-txt-secondary leading-relaxed">
              Explore influential creators, long-form thoughts, and visual series across the creative network.
            </p>
          </div>
        </div>

        {/* Studio Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-txt-muted pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (e.target.value) {
                setSearchParams({ q: e.target.value });
              } else {
                setSearchParams({});
              }
            }}
            placeholder="Search creators, thoughts, topics, or #tags..."
            className="w-full bg-surface-elevated/70 border border-border-subtle text-txt-primary placeholder-txt-muted text-sm sm:text-base pl-11 pr-11 py-3.5 rounded-2xl outline-none focus:bg-surface focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all shadow-editorial-xs"
          />

          {query && (
            <button
              type="button"
              onClick={handleClearQuery}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full text-txt-muted hover:bg-surface-elevated hover:text-txt-primary transition-colors"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Recent Searches Pills */}
        {!isSearching && recentSearches.length > 0 && (
          <div className="mt-4 pt-3 border-t border-border-subtle/60 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <span className="mono-meta text-txt-muted flex items-center gap-1 shrink-0">
                <History className="w-3 h-3 text-accent" /> Recent:
              </span>
              {recentSearches.map((term) => (
                <div
                  key={term}
                  className="flex items-center gap-1 shrink-0 rounded-full bg-surface-elevated px-2.5 py-1 text-xs text-txt-secondary hover:text-txt-primary border border-border-subtle"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setQuery(term);
                      setSearchParams({ q: term });
                    }}
                    className="font-medium"
                  >
                    {term}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeRecentSearch(term);
                    }}
                    className="text-txt-muted hover:text-txt-primary ml-0.5"
                    aria-label={`Remove ${term}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={clearRecentSearches}
              className="mono-meta text-[11px] text-txt-muted hover:text-rose-500 shrink-0 ml-2"
            >
              Clear
            </button>
          </div>
        )}

        {/* Trending Hashtag Pills */}
        <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-1 text-xs scrollbar-none">
          <span className="mono-meta text-txt-muted font-medium shrink-0 flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-accent" /> Trending:
          </span>
          {trendingTags.map(({ hashtag, postCount }) => (
            <button
              key={hashtag}
              type="button"
              onClick={() => handleTagClick(hashtag)}
              className={`mono-meta shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                selectedTag === hashtag
                  ? 'bg-accent text-white shadow-editorial-xs'
                  : 'bg-surface-elevated/80 text-txt-secondary hover:text-txt-primary border border-border-subtle hover:border-accent/40'
              }`}
            >
              #{hashtag} <span className="opacity-70 text-[10px]">({postCount})</span>
            </button>
          ))}
        </div>
      </header>

      {/* 2. Featured Creators Row (displayed when in default Explore mode) */}
      {!isSearching && suggestedCreators.length > 0 && (
        <section className="bg-surface rounded-3xl p-5 border border-border-subtle shadow-editorial-xs">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2 text-txt-primary font-serif font-bold text-sm tracking-tight">
              <Sparkles className="w-4 h-4 text-accent" />
              <span>Influential Voices</span>
            </div>
            <span className="mono-meta text-xs text-txt-muted">Curators to follow</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {suggestedCreators.map((creator) => {
              const cId = creator.id || creator._id || creator.userId;
              return (
                <Link
                  key={cId}
                  to={`/profile/${cId}`}
                  className="flex items-center gap-2.5 p-3 rounded-2xl bg-surface-elevated/50 border border-border-subtle hover:border-accent/40 hover:bg-surface-elevated transition-all group"
                >
                  <UserAvatar
                    src={creator.avatarUrl || creator.avatar || creator.profilePicture}
                    name={creator.name || creator.username}
                    size="sm"
                    statusIndicator={isUserOnline(cId)}
                  />
                  <div className="truncate min-w-0">
                    <p className="text-xs font-semibold text-txt-primary group-hover:text-accent truncate font-serif">
                      {creator.name || creator.username}
                    </p>
                    <p className="text-[11px] text-txt-muted truncate">@{creator.username}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* 3. Search Results: Matched Creators Category */}
      {isSearching && (resultFilter === 'all' || resultFilter === 'creators') && (
        <section className="bg-surface rounded-3xl p-5 border border-border-subtle shadow-editorial-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-txt-primary uppercase tracking-wider">
              <Users className="w-4 h-4 text-accent" />
              <span>Creators matching “{query}”</span>
            </div>
            <span className="mono-meta text-xs text-txt-muted">
              {searchedUsers.length} found
            </span>
          </div>

          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-accent" />
            </div>
          ) : searchedUsers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {searchedUsers.map((u) => {
                const uId = u.id || u._id || u.userId;
                return (
                  <Link
                    key={uId}
                    to={`/profile/${uId}`}
                    className="flex items-center justify-between p-3 bg-surface-elevated/40 hover:bg-surface-elevated rounded-2xl border border-border-subtle hover:border-border-medium transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <UserAvatar
                        src={u.avatarUrl || u.avatar || u.profilePicture}
                        name={u.name || u.username}
                        size="md"
                        statusIndicator={isUserOnline(uId)}
                      />
                      <div className="truncate">
                        <p className="text-sm font-semibold text-txt-primary group-hover:text-accent transition-colors font-serif truncate">
                          {u.name || u.username}
                        </p>
                        <p className="mono-meta text-xs text-txt-muted truncate">@{u.username}</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-accent group-hover:translate-x-1 transition-transform shrink-0 ml-2">
                      &rarr;
                    </span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-txt-muted py-2">No creators found matching “{query}”.</p>
          )}
        </section>
      )}

      {/* 4. Filter & Sort Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-bold text-txt-primary font-serif">
          {isSearching ? (
            <Search className="w-4 h-4 text-accent" />
          ) : (
            <Compass className="w-4 h-4 text-accent" />
          )}
          <span>
            {isSearching ? `Dispatches matching “${query}”` : 'Curated Community Feed'}
          </span>
          <span className="text-xs font-mono font-normal text-txt-muted">
            ({explorePosts.length})
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Tab Filter if searching */}
          {isSearching && (
            <div className="flex items-center gap-1 p-0.5 rounded-xl bg-surface-elevated border border-border-subtle text-xs">
              <button
                type="button"
                onClick={() => setResultFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  resultFilter === 'all'
                    ? 'bg-surface text-txt-primary font-semibold shadow-editorial-xs'
                    : 'text-txt-muted hover:text-txt-primary'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setResultFilter('creators')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  resultFilter === 'creators'
                    ? 'bg-surface text-txt-primary font-semibold shadow-editorial-xs'
                    : 'text-txt-muted hover:text-txt-primary'
                }`}
              >
                Creators
              </button>
              <button
                type="button"
                onClick={() => setResultFilter('dispatches')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  resultFilter === 'dispatches'
                    ? 'bg-surface text-txt-primary font-semibold shadow-editorial-xs'
                    : 'text-txt-muted hover:text-txt-primary'
                }`}
              >
                Posts
              </button>
            </div>
          )}

          {/* Sort Selector */}
          <label className="flex items-center gap-1.5 text-xs text-txt-secondary">
            <TrendingUp className="h-3.5 w-3.5 text-accent" />
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              className="rounded-xl border border-border-subtle bg-surface px-2.5 py-1 text-xs text-txt-primary outline-none focus:border-accent"
            >
              <option value="newest">Newest first</option>
              <option value="popular">Most appreciated</option>
            </select>
          </label>
        </div>
      </div>

      {/* 5. Asymmetric Content Grid for Dispatches */}
      {loading ? (
        <div className="rounded-3xl border border-border-subtle bg-surface p-12 text-center text-sm text-txt-muted shadow-editorial-xs">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-accent" />
          <p className="mt-3 font-serif">Curating community dispatches…</p>
        </div>
      ) : explorePosts.length > 0 && resultFilter !== 'creators' ? (
        <div className="space-y-6">
          {explorePosts.map((post, index) => {
            // First post receives Featured Spotlight layout
            const isFeatured = index === 0 && !isSearching;
            return (
              <PostCard
                key={post.id || post._id}
                post={post}
                variant={isFeatured ? 'featured' : 'default'}
              />
            );
          })}

          {page < totalPages && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                size="sm"
                isLoading={loadingMore}
                onClick={loadMore}
                className="rounded-full px-6 shadow-editorial-xs"
              >
                Load More Dispatches
              </Button>
            </div>
          )}
        </div>
      ) : (
        !loading &&
        resultFilter !== 'creators' && (
          <EmptyState
            icon={Compass}
            title={isSearching ? 'No matching dispatches' : 'No explore dispatches yet'}
            description={
              isSearching
                ? 'Try searching with another keyword or explore trending hashtags above.'
                : 'When new dispatches are published across Connectly, they will appear here.'
            }
          />
        )
      )}
    </div>
  );
}
