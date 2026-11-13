import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import UserAvatar from '../common/UserAvatar';
import PostActions from './PostActions';
import CommentSection from './CommentSection';
import SavePostModal from './SavePostModal';
import EditPostModal from './EditPostModal';
import ImageLightboxModal from './ImageLightboxModal';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useToast } from '../../context/ToastContext';
import { postService } from '../../services/postService';
import { userService } from '../../services/userService';
import { formatRelativeTime } from '../../utils/dateUtils';
import { formatEditorialText } from '../../utils/textUtils';
import {
  Bookmark,
  MoreHorizontal,
  Pencil,
  Trash2,
  Flag,
  Ban,
  Sparkles,
  Clock,
  Maximize2,
} from 'lucide-react';

export default function PostCard({
  post: initialPost,
  onDelete,
  onRemoveFromCollection,
  removeLabel = 'Remove post',
  onSavedChange,
  variant = 'default', // 'featured' | 'default'
}) {
  const { user } = useAuth();
  const { socket, isUserOnline } = useSocket();
  const { showSuccess, showError, showInfo } = useToast();
  const [post, setPost] = useState(initialPost);
  const [expandedContent, setExpandedContent] = useState(false);

  // Lightbox State
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const postId = post.id || post._id;
  const currentUserId = user?.id || user?._id || user?.userId;

  // Extract author info safely
  const author = post.user || post.author || {};
  const authorId = author.id || author._id || author.userId;
  const authorName = author.name || author.username || post.authorName || 'Anonymous';
  const authorUsername = author.username || 'user';
  const authorAvatar = author.avatarUrl || author.avatar || author.profilePicture || post.authorAvatar;

  // Determine initial like state
  const isPostLikedInitially = Boolean(
    post.isLiked ||
      (Array.isArray(post.likes) &&
        post.likes.some((l) =>
          typeof l === 'object' ? (l.id || l._id) === currentUserId : l === currentUserId
        ))
  );

  const [isLiked, setIsLiked] = useState(isPostLikedInitially);
  const [likeCount, setLikeCount] = useState(
    Array.isArray(post.likes) ? post.likes.length : Number(post.likesCount || post.likeCount || 0)
  );
  const [commentCount, setCommentCount] = useState(
    Array.isArray(post.comments) ? post.comments.length : Number(post.commentsCount || post.commentCount || 0)
  );
  const [showComments, setShowComments] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaved, setIsSaved] = useState(Boolean(initialPost.isSaved || initialPost.savedPostId));

  const handleCommentCountChange = useCallback((count) => {
    setCommentCount(count);
  }, []);

  useEffect(() => {
    setPost(initialPost);
    setIsSaved(Boolean(initialPost.isSaved || initialPost.savedPostId));
    setCommentCount(Number(initialPost.commentCount ?? initialPost.commentsCount ?? 0));
    setLikeCount(Number(initialPost.likesCount ?? initialPost.likeCount ?? initialPost.likes?.length ?? 0));
  }, [initialPost]);

  useEffect(() => {
    if (!socket || !postId) return;

    const handleLikeUpdate = (data) => {
      if (String(data.postId) !== String(postId)) return;
      if (typeof data.likesCount === 'number') {
        setLikeCount(data.likesCount);
      }
      if (String(data.userId) === String(currentUserId)) {
        setIsLiked(data.action === 'like');
      }
    };

    const handleCommentAdded = (data) => {
      if (String(data.postId) !== String(postId)) return;
      if (typeof data.commentCount === 'number') {
        setCommentCount(data.commentCount);
      } else {
        setCommentCount((prev) => prev + 1);
      }
    };

    const handleCommentDeleted = (data) => {
      if (String(data.postId) !== String(postId)) return;
      if (typeof data.commentCount === 'number') {
        setCommentCount(data.commentCount);
      } else {
        setCommentCount((prev) => Math.max(0, prev - 1));
      }
    };

    const handlePostUpdated = (data) => {
      if (String(data.post?.id || data.post?._id) !== String(postId)) return;
      setPost(data.post);
    };

    const handleSavedUpdated = (data) => {
      if (String(data.postId) === String(postId)) {
        setIsSaved(data.isSaved);
      }
    };

    socket.on('post:like_updated', handleLikeUpdate);
    socket.on('comment:added', handleCommentAdded);
    socket.on('comment:deleted', handleCommentDeleted);
    socket.on('post:updated', handlePostUpdated);
    socket.on('saved_post:updated', handleSavedUpdated);

    return () => {
      socket.off('post:like_updated', handleLikeUpdate);
      socket.off('comment:added', handleCommentAdded);
      socket.off('comment:deleted', handleCommentDeleted);
      socket.off('post:updated', handlePostUpdated);
      socket.off('saved_post:updated', handleSavedUpdated);
    };
  }, [socket, postId, currentUserId]);

  const isOwner = String(authorId) === String(currentUserId);

  const handleLikeToggle = async () => {
    if (isLiking) return;
    setIsLiking(true);

    const previousLiked = isLiked;
    const previousCount = likeCount;

    setIsLiked(!previousLiked);
    setLikeCount((prev) => (previousLiked ? Math.max(0, prev - 1) : prev + 1));

    try {
      if (previousLiked) {
        await postService.unlikePost(postId);
      } else {
        await postService.likePost(postId);
      }
    } catch (err) {
      setIsLiked(previousLiked);
      setLikeCount(previousCount);
      showError(err.message || 'Could not update like status');
    } finally {
      setIsLiking(false);
    }
  };

  const handleDeletePost = async () => {
    if (isDeleting) return;
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    setIsDeleting(true);
    try {
      await postService.deletePost(postId);
      onDelete?.(postId);
      showSuccess('Post deleted successfully.');
    } catch (err) {
      showError(err.message || 'Could not delete post. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleShare = () => {
    const postUrl = `${window.location.origin}/posts/${postId}`;
    if (!navigator.clipboard?.writeText) {
      showError('Clipboard access is unavailable in this browser.');
      return;
    }
    navigator.clipboard.writeText(postUrl)
      .then(() => showInfo('Post link copied to clipboard!'))
      .catch(() => showError('Could not copy the post link.'));
  };

  const canEdit = isOwner && post.createdAt &&
    Date.now() - new Date(post.createdAt).getTime() <= 15 * 60 * 1000;

  const mediaItems = post.media?.length
    ? post.media
    : post.imageUrl || post.image
      ? [{ url: post.imageUrl || post.image, type: 'image' }]
      : [];

  const caption = post.content || post.caption || post.text || '';
  const isTextOnly = mediaItems.length === 0;
  const isLongForm = caption.length > 280;
  const wordCount = caption.trim() ? caption.trim().split(/\s+/).length : 0;
  const estimatedReadTime = Math.max(1, Math.ceil(wordCount / 180));
  const isFeatured = variant === 'featured';

  const openLightbox = (index = 0) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <>
      <article
        className={`rounded-3xl border transition-all duration-300 ${
          isFeatured
            ? 'bg-gradient-to-b from-surface via-surface to-surface-elevated/40 border-accent/30 p-6 sm:p-7 shadow-editorial-md'
            : 'bg-surface border-border-subtle p-5 sm:p-6 shadow-editorial-xs hover:shadow-editorial hover:border-border-medium'
        }`}
      >
        {/* Editorial Spotlight Banner for Featured Posts */}
        {isFeatured && (
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border-subtle">
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-accent/10 text-accent text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Curator's Spotlight</span>
            </div>
            <span className="text-[11px] text-txt-muted font-mono">
              {estimatedReadTime} min dispatch
            </span>
          </div>
        )}

        {/* Post Header */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <Link to={`/profile/${authorId}`} className="flex items-center gap-3 group">
            <UserAvatar
              src={authorAvatar}
              name={authorName}
              size={isFeatured ? 'lg' : 'md'}
              statusIndicator={isUserOnline(authorId)}
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm sm:text-base text-txt-primary group-hover:text-accent transition-colors tracking-tight font-serif">
                  {authorName}
                </span>
                <span className="text-xs text-txt-muted">&bull;</span>
                <time
                  className="mono-meta text-[11px] text-txt-muted"
                  dateTime={post.createdAt || post.timestamp}
                >
                  {formatRelativeTime(post.createdAt || post.timestamp)}
                </time>
              </div>
              <p className="mono-meta text-[11px] text-txt-muted">@{authorUsername}</p>
            </div>
          </Link>

          {/* Header Actions Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="text-txt-muted hover:text-txt-primary p-2 rounded-xl hover:bg-surface-elevated transition-colors"
              aria-label="Post options"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {showMenu && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 mt-1 w-48 bg-surface rounded-2xl shadow-editorial-lg border border-border-medium py-1.5 z-30 animate-in fade-in zoom-in-95 duration-150">
                  {canEdit && (
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        setShowEditModal(true);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-txt-primary hover:bg-surface-elevated transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit Post
                    </button>
                  )}
                  {isOwner && (
                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={() => {
                        setShowMenu(false);
                        handleDeletePost();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-500 hover:bg-rose-500/10 transition-colors disabled:cursor-wait disabled:opacity-60"
                    >
                      <Trash2 className={`w-3.5 h-3.5 ${isDeleting ? 'animate-spin' : ''}`} />
                      {isDeleting ? 'Deleting…' : 'Delete Post'}
                    </button>
                  )}
                  {onRemoveFromCollection && (
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onRemoveFromCollection(postId);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-txt-primary hover:bg-surface-elevated transition-colors"
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                      {removeLabel}
                    </button>
                  )}
                  {!isOwner && (
                    <>
                      <button
                        type="button"
                        onClick={async () => {
                          setShowMenu(false);
                          const reason = window.prompt('Why are you reporting this post?');
                          if (!reason?.trim()) return;
                          try {
                            await userService.reportContent('post', postId, reason.trim());
                            showSuccess('Report submitted for review.');
                          } catch (error) {
                            showError(error.message || 'Could not submit report.');
                          }
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-txt-primary hover:bg-surface-elevated transition-colors"
                      >
                        <Flag className="h-3.5 w-3.5" /> Report post
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          setShowMenu(false);
                          if (!window.confirm(`Block @${authorUsername}?`)) return;
                          try {
                            await userService.blockUser(authorId);
                            showSuccess('Account blocked.');
                            window.dispatchEvent(
                              new CustomEvent('connectly:user-blocked', {
                                detail: { userId: String(authorId) },
                              })
                            );
                            onDelete?.(postId);
                          } catch (error) {
                            showError(error.message || 'Could not block account.');
                          }
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-rose-500 hover:bg-rose-500/10 transition-colors"
                      >
                        <Ban className="h-3.5 w-3.5" /> Block @{authorUsername}
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Content Layout Variant 1: Text-Only with Linkified Hashtags & Mentions */}
        {isTextOnly && caption && (
          <div className="mb-4">
            <div
              className={`relative ${
                caption.length < 160 ? 'pl-4 border-l-2 border-accent/60 py-1' : 'py-1'
              }`}
            >
              <div
                className={`font-serif leading-relaxed text-txt-primary ${
                  isFeatured || caption.length < 160
                    ? 'text-lg sm:text-xl font-normal'
                    : 'text-base sm:text-[17px] font-normal'
                }`}
              >
                {isLongForm && !expandedContent ? (
                  <>
                    {formatEditorialText(caption.slice(0, 260))}…
                    <button
                      type="button"
                      onClick={() => setExpandedContent(true)}
                      className="ml-2 inline-block text-xs font-semibold text-accent hover:underline font-sans"
                    >
                      Read full dispatch
                    </button>
                  </>
                ) : (
                  <>
                    {formatEditorialText(caption)}
                    {isLongForm && (
                      <button
                        type="button"
                        onClick={() => setExpandedContent(false)}
                        className="ml-2 inline-block text-xs font-semibold text-txt-muted hover:underline font-sans"
                      >
                        Show less
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
            {wordCount > 30 && (
              <div className="mt-2 flex items-center gap-1.5 text-[11px] font-mono text-txt-muted">
                <Clock className="w-3 h-3" />
                <span>{wordCount} words &bull; {estimatedReadTime} min read</span>
              </div>
            )}
          </div>
        )}

        {/* Content Layout Variant 2: Media with Linkified Caption & Lightbox Trigger */}
        {!isTextOnly && (
          <div className="space-y-3 mb-4">
            {caption && (
              <div className="text-sm sm:text-base text-txt-primary leading-relaxed whitespace-pre-line font-normal">
                {formatEditorialText(caption)}
              </div>
            )}

            {/* Single Media Item */}
            {mediaItems.length === 1 && (
              <div
                className="group relative cursor-pointer overflow-hidden rounded-2xl border border-border-subtle bg-surface-elevated/40"
                onClick={() => openLightbox(0)}
              >
                {mediaItems[0].type === 'video' ? (
                  <video
                    src={mediaItems[0].url}
                    controls
                    playsInline
                    className="max-h-[540px] w-full bg-black object-contain"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <>
                    <img
                      src={mediaItems[0].url}
                      alt={caption || 'Post visual'}
                      loading="lazy"
                      className="max-h-[540px] w-full object-cover transition-transform duration-500 group-hover:scale-[1.01]"
                    />
                    <div className="absolute top-3 right-3 p-2 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      <Maximize2 className="w-4 h-4" />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Multiple Images Grid with Lightbox */}
            {mediaItems.length > 1 && (
              <div
                className={`grid gap-2 overflow-hidden rounded-2xl ${
                  mediaItems.length === 2
                    ? 'grid-cols-2'
                    : mediaItems.length === 3
                    ? 'grid-cols-2 sm:grid-cols-3'
                    : 'grid-cols-2'
                }`}
              >
                {mediaItems.slice(0, 4).map((media, index) => (
                  <div
                    key={media.publicId || media.url || index}
                    onClick={() => openLightbox(index)}
                    className={`group relative cursor-pointer overflow-hidden rounded-xl border border-border-subtle bg-surface-elevated/40 ${
                      mediaItems.length === 3 && index === 0
                        ? 'col-span-2 sm:col-span-1 h-64 sm:h-full'
                        : 'h-48 sm:h-56'
                    }`}
                  >
                    {media.type === 'video' ? (
                      <video
                        src={media.url}
                        controls
                        playsInline
                        className="h-full w-full object-cover bg-black"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <>
                        <img
                          src={media.url}
                          alt={`Post visual ${index + 1}`}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                          <Maximize2 className="w-3.5 h-3.5" />
                        </div>
                      </>
                    )}

                    {/* Counter for 4+ images */}
                    {index === 3 && mediaItems.length > 4 && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white backdrop-blur-xs font-serif font-bold text-lg">
                        +{mediaItems.length - 4} more
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Post Actions (Like, Comment, Share, Save) */}
        <PostActions
          isLiked={isLiked}
          likeCount={likeCount}
          commentCount={commentCount}
          onLikeToggle={handleLikeToggle}
          onCommentToggle={() => setShowComments(!showComments)}
          onShare={handleShare}
          isLiking={isLiking}
          isSaved={isSaved}
          onSaveToggle={() => setShowSaveModal(true)}
        />

        {/* Expandable Comment Section */}
        {showComments && (
          <div className="mt-4 pt-3 border-t border-border-subtle animate-in fade-in slide-in-from-top-2 duration-250">
            <CommentSection
              postId={postId}
              postAuthorId={authorId}
              initialComments={post.comments || []}
              onCommentCountChange={handleCommentCountChange}
            />
          </div>
        )}

        {/* Save Modal */}
        <SavePostModal
          isOpen={showSaveModal}
          onClose={() => setShowSaveModal(false)}
          postId={postId}
          onSavedChange={(saved) => {
            setIsSaved(saved);
            onSavedChange?.(postId, saved);
          }}
        />

        {/* Edit Modal */}
        {canEdit && (
          <EditPostModal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            post={post}
            onUpdated={(updatedPost) => setPost(updatedPost)}
          />
        )}
      </article>

      {/* Full-Screen Image Lightbox Preview Modal */}
      <ImageLightboxModal
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        images={mediaItems}
        initialIndex={lightboxIndex}
        caption={caption}
        author={author}
      />
    </>
  );
}
