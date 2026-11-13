import React, { useEffect, useMemo, useRef, useState } from 'react';
import { commentService } from '../../services/commentService';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useToast } from '../../context/ToastContext';
import UserAvatar from '../common/UserAvatar';
import Button from '../common/Button';
import { formatRelativeTime } from '../../utils/dateUtils';
import { formatEditorialText } from '../../utils/textUtils';
import {
  CornerDownRight,
  Flag,
  Loader2,
  MessageCircle,
  Pencil,
  Send,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { userService } from '../../services/userService';

const getId = (value) => {
  if (!value) return '';
  if (typeof value === 'object') return String(value._id || value.id || '');
  return String(value);
};

const sortByCreatedAt = (first, second) =>
  new Date(first.createdAt || first.timestamp || 0) -
  new Date(second.createdAt || second.timestamp || 0);

const buildCommentThreads = (comments) => {
  const commentsById = new Map(
    comments.map((comment) => [
      getId(comment),
      { ...comment, replies: [] },
    ])
  );
  const roots = [];

  for (const comment of comments) {
    const node = commentsById.get(getId(comment));
    const parentId = getId(comment.parentComment);
    const parent = parentId ? commentsById.get(parentId) : null;
    if (parent) parent.replies.push(node);
    else roots.push(node);
  }

  const sortReplies = (comment) => {
    comment.replies.sort(sortByCreatedAt);
    comment.replies.forEach(sortReplies);
  };
  roots.forEach(sortReplies);
  roots.sort((first, second) => sortByCreatedAt(second, first));
  return roots;
};

export default function CommentSection({
  postId,
  postAuthorId,
  initialComments = [],
  onCommentCountChange,
}) {
  const { user } = useAuth();
  const { socket, isUserOnline } = useSocket();
  const { showError, showSuccess } = useToast();
  const [comments, setComments] = useState(initialComments);
  const [newComment, setNewComment] = useState('');
  const [replyText, setReplyText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingTo, setSubmittingTo] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [collapsedThreads, setCollapsedThreads] = useState(() => new Set());
  const replyInputRef = useRef(null);
  const currentUserId = user?.id || user?._id || user?.userId;
  const threads = useMemo(() => buildCommentThreads(comments), [comments]);

  useEffect(() => {
    let active = true;
    const fetchComments = async () => {
      if (!postId) return;
      setIsLoading(true);
      try {
        const response = await commentService.getComments(postId);
        if (!active) return;
        const list = Array.isArray(response) ? response : response.comments || [];
        setComments(list);
        onCommentCountChange?.(list.length);
      } catch (error) {
        if (active) showError(error.message || 'Could not load comments.');
      } finally {
        if (active) setIsLoading(false);
      }
    };

    fetchComments();
    return () => { active = false; };
  }, [postId, onCommentCountChange, showError]);

  useEffect(() => {
    if (!socket || !postId) return;

    socket.emit('join_post', postId);

    const handleCommentAdded = (data) => {
      if (String(data.postId) !== String(postId) || !data.comment) return;
      setComments((prev) => {
        const newId = getId(data.comment);
        if (prev.some((c) => getId(c) === newId)) return prev;
        const next = [...prev, data.comment];
        onCommentCountChange?.(typeof data.commentCount === 'number' ? data.commentCount : next.length);
        return next;
      });
    };

    const handleCommentDeleted = (data) => {
      if (String(data.postId) !== String(postId)) return;
      const targetIds = new Set((data.commentIds || [data.commentId]).map(String));
      setComments((prev) => {
        const next = prev.filter((c) => !targetIds.has(getId(c)));
        onCommentCountChange?.(typeof data.commentCount === 'number' ? data.commentCount : next.length);
        return next;
      });
    };

    const handleCommentUpdated = (data) => {
      if (String(data.postId) !== String(postId) || !data.comment) return;
      const updatedId = getId(data.comment);
      setComments((prev) =>
        prev.map((c) => (getId(c) === updatedId ? data.comment : c))
      );
    };

    socket.on('comment:added', handleCommentAdded);
    socket.on('comment:deleted', handleCommentDeleted);
    socket.on('comment:updated', handleCommentUpdated);

    return () => {
      socket.emit('leave_post', postId);
      socket.off('comment:added', handleCommentAdded);
      socket.off('comment:deleted', handleCommentDeleted);
      socket.off('comment:updated', handleCommentUpdated);
    };
  }, [socket, postId, onCommentCountChange]);

  useEffect(() => {
    if (replyingTo) replyInputRef.current?.focus();
  }, [replyingTo]);

  const submitComment = async (event, parentCommentId = null) => {
    event.preventDefault();
    const content = (parentCommentId ? replyText : newComment).trim();
    if (!content || isSubmitting) return;

    setIsSubmitting(true);
    setSubmittingTo(parentCommentId);
    try {
      const response = await commentService.addComment(postId, {
        content,
        parentCommentId: parentCommentId || undefined,
      });
      if (!response.comment) throw new Error('The server did not return the new comment.');

      setComments((prev) => {
        const newId = getId(response.comment);
        if (prev.some((c) => getId(c) === newId)) return prev;
        const updated = [...prev, response.comment];
        onCommentCountChange?.(updated.length);
        return updated;
      });
      if (parentCommentId) {
        setReplyText('');
        setReplyingTo(null);
        showSuccess('Reply posted.');
      } else {
        setNewComment('');
        showSuccess('Comment posted.');
      }
    } catch (error) {
      showError(error.message || (parentCommentId ? 'Could not post your reply.' : 'Could not post your comment.'));
    } finally {
      setIsSubmitting(false);
      setSubmittingTo(null);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this response and its replies?')) return;
    try {
      await commentService.deleteComment(postId, commentId);
      const removedIds = new Set([commentId]);
      let foundNewDescendant = true;
      while (foundNewDescendant) {
        foundNewDescendant = false;
        for (const comment of comments) {
          if (removedIds.has(getId(comment.parentComment)) && !removedIds.has(getId(comment))) {
            removedIds.add(getId(comment));
            foundNewDescendant = true;
          }
        }
      }
      const updatedComments = comments.filter((comment) => !removedIds.has(getId(comment)));
      setComments(updatedComments);
      onCommentCountChange?.(updatedComments.length);
      showSuccess('Response removed.');
    } catch (error) {
      showError(error.message || 'Could not delete the response.');
    }
  };

  const handleUpdateComment = async (commentId) => {
    if (!editingText.trim() || isUpdating) return;
    setIsUpdating(true);
    try {
      const response = await commentService.updateComment(postId, commentId, editingText.trim());
      const updatedComment = response.comment;
      setComments((current) => current.map((comment) =>
        getId(comment) === commentId ? updatedComment : comment
      ));
      setEditingId(null);
      setEditingText('');
      showSuccess('Response updated.');
    } catch (error) {
      showError(error.message || 'Could not update the response.');
    } finally {
      setIsUpdating(false);
    }
  };

  const reportComment = async (commentId) => {
    const reason = window.prompt('Why are you reporting this comment?');
    if (!reason?.trim()) return;
    try {
      await userService.reportContent('comment', commentId, reason.trim());
      showSuccess('Response reported for review.');
    } catch (error) {
      showError(error.message || 'Could not report the response.');
    }
  };

  const renderComment = (comment, depth = 0) => {
    const commentId = getId(comment);
    const author = comment.user || comment.author || {};
    const authorId = getId(author);
    const authorName = author.name || author.username || 'Creator';
    const username = author.username || 'creator';
    const isAuthor = authorId === String(currentUserId);
    const isPostAuthor = String(postAuthorId) === authorId;
    const isEditing = editingId === commentId;
    const isReplying = replyingTo === commentId;
    const isCollapsed = collapsedThreads.has(commentId);
    const canEdit = comment.createdAt &&
      Date.now() - new Date(comment.createdAt).getTime() <= 15 * 60 * 1000;

    return (
      <li
        key={commentId}
        className={
          depth
            ? 'relative ml-3 sm:ml-6 border-l-2 border-border-subtle pl-3 sm:pl-4 transition-colors'
            : ''
        }
      >
        <article className="group rounded-2xl border border-border-subtle bg-surface-elevated/40 p-3 sm:p-4 transition-all hover:bg-surface-elevated/80 hover:border-border-medium">
          <div className="flex items-start gap-2.5 sm:gap-3">
            <UserAvatar
              src={author.avatarUrl || author.avatar || author.profilePicture}
              name={authorName}
              size={depth ? 'xs' : 'sm'}
              statusIndicator={isUserOnline(authorId)}
            />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span className="text-xs sm:text-sm font-semibold text-txt-primary font-serif">
                  {authorName}
                </span>

                {/* Author Badge if this commenter created the original post */}
                {isPostAuthor && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-accent/15 px-2 py-0.2 text-[10px] font-bold text-accent">
                    Author
                  </span>
                )}

                <span className="text-[11px] text-txt-muted">@{username}</span>
                <span aria-hidden="true" className="text-txt-muted text-xs">&bull;</span>
                <time
                  className="mono-meta text-[11px] text-txt-muted"
                  dateTime={comment.createdAt || undefined}
                >
                  {formatRelativeTime(comment.createdAt || comment.timestamp)}
                </time>
              </div>

              {isEditing ? (
                <div className="mt-2 space-y-2">
                  <textarea
                    value={editingText}
                    onChange={(event) => setEditingText(event.target.value)}
                    maxLength={1000}
                    rows={3}
                    aria-label="Edit comment"
                    className="w-full resize-y rounded-xl border border-border-subtle bg-surface p-3 text-sm text-txt-primary outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      className="rounded-lg px-3 py-1.5 text-xs text-txt-muted hover:bg-surface"
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </button>
                    <Button
                      size="sm"
                      isLoading={isUpdating}
                      disabled={!editingText.trim()}
                      onClick={() => handleUpdateComment(commentId)}
                    >
                      Save changes
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-1 whitespace-pre-wrap break-words text-xs sm:text-sm leading-relaxed text-txt-primary">
                  {formatEditorialText(comment.text || comment.content)}
                </div>
              )}
            </div>

            {/* Options (Edit/Delete/Report) */}
            <div className="flex shrink-0 items-center gap-0.5 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
              {isAuthor ? (
                <>
                  {canEdit && !isEditing && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(commentId);
                        setEditingText(comment.text || comment.content || '');
                      }}
                      className="rounded-lg p-1.5 text-txt-muted hover:bg-accent/10 hover:text-accent transition-colors"
                      title="Edit response"
                      aria-label="Edit response"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDeleteComment(commentId)}
                    className="rounded-lg p-1.5 text-txt-muted hover:bg-rose-500/10 hover:text-rose-500 transition-colors"
                    title="Delete response"
                    aria-label="Delete response"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => reportComment(commentId)}
                  className="rounded-lg p-1.5 text-txt-muted hover:bg-surface hover:text-txt-primary transition-colors"
                  title="Report response"
                  aria-label="Report response"
                >
                  <Flag className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {!isEditing && (
            <div className="ml-8 sm:ml-10 mt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setReplyText('');
                  setReplyingTo((current) => (current === commentId ? null : commentId));
                }}
                aria-expanded={isReplying}
                className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-medium transition-colors ${
                  isReplying
                    ? 'bg-accent/10 text-accent font-semibold'
                    : 'text-txt-muted hover:bg-surface hover:text-accent'
                }`}
              >
                <CornerDownRight className="h-3 w-3" />
                {isReplying ? 'Cancel' : 'Reply'}
              </button>

              {comment.replies.length > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    setCollapsedThreads((current) => {
                      const next = new Set(current);
                      if (next.has(commentId)) next.delete(commentId);
                      else next.add(commentId);
                      return next;
                    })
                  }
                  aria-expanded={!isCollapsed}
                  className="text-xs font-medium text-accent hover:underline"
                >
                  {isCollapsed
                    ? `Show ${comment.replies.length} ${
                        comment.replies.length === 1 ? 'reply' : 'replies'
                      }`
                    : `Hide replies (${comment.replies.length})`}
                </button>
              )}
            </div>
          )}

          {/* Inline Reply Composer */}
          {isReplying && (
            <form
              onSubmit={(event) => submitComment(event, commentId)}
              className="ml-8 sm:ml-10 mt-3 rounded-2xl border border-accent/20 bg-accent/5 p-3"
            >
              <div className="mb-2 flex items-center gap-1.5 text-xs text-txt-secondary">
                <CornerDownRight className="h-3 w-3 text-accent" />
                Replying to <span className="font-semibold text-accent">@{username}</span>
              </div>
              <div className="flex items-end gap-2">
                <UserAvatar
                  src={user?.avatarUrl || user?.avatar || user?.profilePicture}
                  name={user?.name || user?.username}
                  size="xs"
                />
                <textarea
                  ref={replyInputRef}
                  value={replyText}
                  onChange={(event) => setReplyText(event.target.value)}
                  maxLength={1000}
                  rows={2}
                  placeholder={`Write an annotation for @${username}…`}
                  aria-label={`Reply to ${username}`}
                  className="min-h-10 flex-1 resize-y rounded-xl border border-border-subtle bg-surface px-3 py-2 text-xs sm:text-sm text-txt-primary outline-none transition placeholder:text-txt-muted focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
                <Button
                  type="submit"
                  size="sm"
                  icon={Send}
                  isLoading={isSubmitting && submittingTo === commentId}
                  disabled={!replyText.trim() || isSubmitting}
                  aria-label="Post reply"
                  className="shrink-0"
                >
                  Reply
                </Button>
              </div>
            </form>
          )}

          {/* Threaded Nested Replies */}
          {comment.replies.length > 0 && !isCollapsed && (
            <ol className="mt-3 space-y-2.5">
              {comment.replies.map((reply) => renderComment(reply, depth + 1))}
            </ol>
          )}
        </article>
      </li>
    );
  };

  return (
    <section aria-label="Post responses" className="space-y-4 pt-1">
      {/* Primary Comment Composer */}
      <form
        onSubmit={(event) => submitComment(event)}
        className="rounded-2xl border border-border-subtle bg-surface-elevated/50 p-3 sm:p-4 shadow-editorial-xs"
      >
        <div className="flex items-start gap-2.5 sm:gap-3">
          <UserAvatar
            src={user?.avatarUrl || user?.avatar || user?.profilePicture}
            name={user?.name || user?.username}
            size="sm"
          />
          <div className="min-w-0 flex-1">
            <label
              htmlFor={`comment-input-${postId}`}
              className="mb-1.5 block text-xs font-semibold text-txt-primary tracking-tight font-serif"
            >
              Add your perspective
            </label>
            <textarea
              id={`comment-input-${postId}`}
              value={newComment}
              onChange={(event) => setNewComment(event.target.value)}
              maxLength={1000}
              rows={2}
              placeholder="Leave an annotation, thoughtful critique, or reaction…"
              className="w-full resize-y rounded-xl border border-border-subtle bg-surface px-3 py-2.5 text-xs sm:text-sm text-txt-primary outline-none transition placeholder:text-txt-muted focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="mono-meta text-[10px] text-txt-muted">
                {newComment.length}/1000
              </span>
              <Button
                type="submit"
                size="sm"
                icon={MessageCircle}
                isLoading={isSubmitting && submittingTo === null}
                disabled={!newComment.trim() || isSubmitting}
              >
                Publish Response
              </Button>
            </div>
          </div>
        </div>
      </form>

      {/* Comment Thread List */}
      {isLoading ? (
        <div className="flex justify-center py-6" role="status" aria-label="Loading responses">
          <Loader2 className="h-5 w-5 animate-spin text-accent" />
        </div>
      ) : threads.length > 0 ? (
        <ol className="max-h-[34rem] space-y-3 overflow-y-auto pr-1">
          {threads.map((comment) => renderComment(comment))}
        </ol>
      ) : (
        <div className="rounded-2xl border border-dashed border-border-subtle px-4 py-8 text-center bg-surface-elevated/20">
          <MessageCircle className="mx-auto h-5 w-5 text-txt-muted" />
          <p className="mt-2 text-xs sm:text-sm font-medium text-txt-primary font-serif">
            No responses yet
          </p>
          <p className="mt-0.5 text-xs text-txt-muted">
            Be the first creator to leave a thoughtful annotation.
          </p>
        </div>
      )}
    </section>
  );
}
