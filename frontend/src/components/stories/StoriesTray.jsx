import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Edit2,
  Eye,
  Loader2,
  Plus,
  Share2,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react';
import UserAvatar from '../common/UserAvatar';
import Button from '../common/Button';
import { storyService } from '../../services/storyService';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useToast } from '../../context/ToastContext';

export default function StoriesTray() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { showError, showSuccess } = useToast();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activeGroup, setActiveGroup] = useState(-1);
  const [activeStory, setActiveStory] = useState(0);

  // Edit / Delete / Upload preview states
  const [isEditingStory, setIsEditingStory] = useState(false);
  const [editCaption, setEditCaption] = useState('');
  const [editFile, setEditFile] = useState(null);
  const [editPreviewUrl, setEditPreviewUrl] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isDeletingStory, setIsDeletingStory] = useState(false);
  const [uploadPreview, setUploadPreview] = useState(null);

  // 30-Second Auto-Advance & Live Progress State
  const [storyProgress, setStoryProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const STORY_DURATION_MS = 30000; // Automatically advances after 30 seconds

  // Viewers modal state (only for the author of the story)
  const [viewersModalStoryId, setViewersModalStoryId] = useState(null);
  const [viewersList, setViewersList] = useState([]);
  const [loadingViewers, setLoadingViewers] = useState(false);

  const userId = String(user?._id || user?.id || '');
  const activeStoryItem = groups[activeGroup]?.stories?.[activeStory];
  const isStoryOwner = groups[activeGroup]?.author?.id === userId;
  const isStoryEditable = useMemo(() => {
    if (!isStoryOwner || !activeStoryItem?.createdAt) return false;
    const elapsed = Date.now() - new Date(activeStoryItem.createdAt).getTime();
    return elapsed <= 30 * 60 * 1000;
  }, [isStoryOwner, activeStoryItem?.createdAt]);

  const formatStoryTime = (date) => {
    if (!date) return '';
    const diffSec = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 1000));
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return '24h ago';
  };

  const fetchStories = async () => {
    try {
      const response = await storyService.list();
      const now = Date.now();
      // Enforce 24-hour lifetime: filter out any stories older than 24h
      const validGroups = (response.stories || [])
        .map((group) => ({
          ...group,
          stories: (group.stories || []).filter((s) => {
            const age = now - new Date(s.createdAt).getTime();
            return age < 24 * 60 * 60 * 1000;
          }),
        }))
        .filter((group) => group.stories.length > 0);
      setGroups(validGroups);
    } catch {
      // Quiet fail in feed tray to avoid blocking feed
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStories();
  }, []);

  // Reset editing mode, progress and viewers modal whenever active story changes
  useEffect(() => {
    setIsEditingStory(false);
    setEditCaption(activeStoryItem?.caption || '');
    setEditFile(null);
    setEditPreviewUrl('');
    setViewersModalStoryId(null);
    setViewersList([]);
    setStoryProgress(0);
  }, [activeStoryItem?.id, activeGroup, activeStory]);

  // 30-Second Real-Time Auto-Advance Timer
  useEffect(() => {
    if (activeGroup < 0 || !activeStoryItem) {
      setStoryProgress(0);
      return undefined;
    }

    // Pause timer when holding story, editing caption, or opening viewers modal
    if (isPaused || isEditingStory || viewersModalStoryId) {
      return undefined;
    }

    const intervalMs = 100;
    const step = (intervalMs / STORY_DURATION_MS) * 100;

    const intervalId = setInterval(() => {
      setStoryProgress((prev) => {
        const next = prev + step;
        if (next >= 100) {
          advance(1);
          return 0;
        }
        return next;
      });
    }, intervalMs);

    return () => clearInterval(intervalId);
  }, [activeGroup, activeStory, isPaused, isEditingStory, viewersModalStoryId, activeStoryItem]);

  // Real-time socket events for stories
  useEffect(() => {
    if (!socket) return;

    const handleStoryCreated = () => {
      fetchStories();
    };

    const handleStoryViewed = (data) => {
      if (!data?.storyId) return;

      // Real-time update for viewers modal if open for this story
      if (
        String(data.storyId) === String(viewersModalStoryId) &&
        data.viewer &&
        String(data.authorId) === String(userId)
      ) {
        setViewersList((prev) => {
          if (
            prev.some(
              (v) => String(v.id || v._id) === String(data.viewer.id || data.viewer._id)
            )
          ) {
            return prev;
          }
          return [data.viewer, ...prev];
        });
      }

      setGroups((current) =>
        current.map((group) => {
          let hasChange = false;
          const nextStories = group.stories.map((entry) => {
            if (String(entry.id) === String(data.storyId)) {
              hasChange = true;
              return {
                ...entry,
                viewersCount:
                  typeof data.viewersCount === 'number'
                    ? data.viewersCount
                    : (entry.viewersCount || 0) + 1,
                viewed: String(data.viewerId) === String(userId) ? true : entry.viewed,
              };
            }
            return entry;
          });
          if (!hasChange) return group;
          return {
            ...group,
            hasUnviewed: nextStories.some((e) => !e.viewed),
            stories: nextStories,
          };
        })
      );
    };

    const handleStoryUpdated = (data) => {
      if (!data?.story?.id) return;
      setGroups((current) =>
        current.map((group) => {
          let hasChange = false;
          const nextStories = group.stories.map((entry) => {
            if (String(entry.id) === String(data.story.id)) {
              hasChange = true;
              return {
                ...entry,
                ...data.story,
                viewed: entry.viewed || data.story.viewed,
              };
            }
            return entry;
          });
          if (!hasChange) return group;
          return {
            ...group,
            stories: nextStories,
          };
        })
      );
    };

    const handleStoryDeleted = (data) => {
      if (!data?.storyId) return;
      if (viewersModalStoryId === data.storyId) {
        setViewersModalStoryId(null);
      }
      setGroups((current) => {
        return current
          .map((group) => {
            if (data.authorId && String(group.author.id) !== String(data.authorId)) return group;
            const remaining = group.stories.filter(
              (entry) => String(entry.id) !== String(data.storyId)
            );
            if (remaining.length === 0) return null;
            return {
              ...group,
              hasUnviewed: remaining.some((e) => !e.viewed),
              stories: remaining,
            };
          })
          .filter(Boolean);
      });
    };

    socket.on('story:created', handleStoryCreated);
    socket.on('story:viewed', handleStoryViewed);
    socket.on('story:updated', handleStoryUpdated);
    socket.on('story:deleted', handleStoryDeleted);

    return () => {
      socket.off('story:created', handleStoryCreated);
      socket.off('story:viewed', handleStoryViewed);
      socket.off('story:updated', handleStoryUpdated);
      socket.off('story:deleted', handleStoryDeleted);
    };
  }, [socket, userId, viewersModalStoryId]);

  // Mark viewed when viewer opens a story
  useEffect(() => {
    if (!activeStoryItem || activeStoryItem.viewed || groups[activeGroup]?.author?.id === userId)
      return;
    storyService
      .markViewed(activeStoryItem.id)
      .then(() => {
        setGroups((current) =>
          current.map((group, groupIndex) =>
            groupIndex === activeGroup
              ? {
                  ...group,
                  hasUnviewed: group.stories.some(
                    (entry, idx) => idx !== activeStory && !entry.viewed
                  ),
                  stories: group.stories.map((entry, idx) =>
                    idx === activeStory ? { ...entry, viewed: true } : entry
                  ),
                }
              : group
          )
        );
      })
      .catch(() => {});
  }, [activeStoryItem?.id, activeStoryItem?.viewed, activeGroup, activeStory, userId]);

  const onFileSelected = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    const maxSize = (isVideo ? 50 : 5) * 1024 * 1024;
    if (file.size > maxSize) {
      showError(isVideo ? 'Videos must be 50 MB or smaller.' : 'Images must be 5 MB or smaller.');
      return;
    }

    setUploadPreview({
      file,
      previewUrl: URL.createObjectURL(file),
      isVideo,
      caption: '',
    });
  };

  const handleConfirmUpload = async () => {
    if (!uploadPreview?.file) return;
    setUploading(true);
    try {
      await storyService.create(uploadPreview.file, uploadPreview.caption);
      setUploadPreview(null);
      await fetchStories();
      showSuccess('Story shared! Real-time broadcast sent.');
    } catch (err) {
      showError(err.message || 'Could not upload story.');
    } finally {
      setUploading(false);
    }
  };

  const advance = (direction) => {
    setStoryProgress(0);
    const currentGroup = groups[activeGroup];
    if (!currentGroup) return;

    const nextStory = activeStory + direction;
    if (nextStory >= 0 && nextStory < currentGroup.stories.length) {
      setActiveStory(nextStory);
      return;
    }

    const nextGroup = activeGroup + direction;
    if (nextGroup >= 0 && nextGroup < groups.length) {
      setActiveGroup(nextGroup);
      setActiveStory(direction > 0 ? 0 : groups[nextGroup].stories.length - 1);
      return;
    }

    setActiveGroup(-1);
  };

  const handleShareStory = async () => {
    if (!activeStoryItem) return;
    const authorName = groups[activeGroup]?.author?.username || 'user';
    const shareUrl = window.location.origin + '/stories';
    const shareData = {
      title: `Story by @${authorName}`,
      text: activeStoryItem.caption
        ? `${activeStoryItem.caption} - via DevLink`
        : `Check out @${authorName}'s story on DevLink!`,
      url: shareUrl,
    };

    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareUrl);
        showSuccess('Story link copied to clipboard!');
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        try {
          await navigator.clipboard.writeText(shareUrl);
          showSuccess('Story link copied to clipboard!');
        } catch {
          showError('Could not share story link.');
        }
      }
    }
  };

  const handleDeleteStory = async () => {
    if (!activeStoryItem) return;
    if (!window.confirm('Are you sure you want to delete this story? This cannot be undone.')) {
      return;
    }

    setIsDeletingStory(true);
    try {
      await storyService.deleteStory(activeStoryItem.id);
      showSuccess('Story deleted.');

      const currentGroup = groups[activeGroup];
      if (currentGroup) {
        const remaining = currentGroup.stories.filter(
          (s) => String(s.id) !== String(activeStoryItem.id)
        );
        if (remaining.length === 0) {
          setActiveGroup(-1);
        } else if (activeStory >= remaining.length) {
          setActiveStory(remaining.length - 1);
        }
      }
      await fetchStories();
    } catch (err) {
      showError(err.message || 'Failed to delete story.');
    } finally {
      setIsDeletingStory(false);
    }
  };

  const handleSaveEdit = async (e) => {
    e?.preventDefault();
    if (!activeStoryItem) return;

    if (!isStoryEditable) {
      showError('Stories can only be edited within 30 minutes of being shared.');
      setIsEditingStory(false);
      return;
    }

    setIsSavingEdit(true);
    try {
      const res = await storyService.updateStory(activeStoryItem.id, {
        caption: editCaption,
        file: editFile || undefined,
      });
      showSuccess('Story updated successfully.');
      setIsEditingStory(false);
      setEditFile(null);
      setEditPreviewUrl('');

      if (res?.story) {
        setGroups((current) =>
          current.map((group, gIdx) =>
            gIdx === activeGroup
              ? {
                  ...group,
                  stories: group.stories.map((s, sIdx) =>
                    sIdx === activeStory ? { ...s, ...res.story } : s
                  ),
                }
              : group
          )
        );
      }
    } catch (err) {
      showError(err.message || 'Failed to update story.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Only story owner can load viewers
  const handleOpenViewers = async (storyId) => {
    if (!storyId || !isStoryOwner) return;
    setViewersModalStoryId(storyId);
    setLoadingViewers(true);
    try {
      const res = await storyService.getViewers(storyId);
      setViewersList(res.viewers || []);
    } catch (err) {
      showError(err.message || 'Could not load story viewers.');
      setViewersModalStoryId(null);
    } finally {
      setLoadingViewers(false);
    }
  };

  return (
    <>
      <div className="rounded-2xl border border-border-subtle bg-surface p-4 shadow-editorial-sm transition-colors">
        <div className="flex items-center gap-4 overflow-x-auto pb-1 scrollbar-none">
          {/* Add story / User story button */}
          <div className="flex shrink-0 flex-col items-center gap-1.5">
            <label className="group relative flex h-16 w-16 cursor-pointer items-center justify-center rounded-full border-2 border-dashed border-accent/60 p-0.5 transition hover:border-accent">
              <UserAvatar
                src={user?.avatarUrl}
                name={user?.name || user?.username}
                size="lg"
                className="transition group-hover:opacity-90"
              />
              <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-white shadow-sm ring-2 ring-surface">
                <Plus className="h-4 w-4" />
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
                className="hidden"
                disabled={uploading}
                onChange={onFileSelected}
              />
            </label>
            <span className="max-w-[70px] truncate text-[11px] font-medium text-txt-secondary">
              {uploading ? 'Posting…' : 'Your Story'}
            </span>
          </div>

          {/* Creators' Stories */}
          {groups.map((group, index) => {
            const isSelf = group.author.id === userId;
            return (
              <button
                type="button"
                key={group.author.id}
                onClick={() => {
                  setActiveGroup(index);
                  const firstUnviewed = group.stories.findIndex((s) => !s.viewed);
                  setActiveStory(firstUnviewed >= 0 ? firstUnviewed : 0);
                }}
                className="flex shrink-0 flex-col items-center gap-1.5 text-left transition hover:opacity-95"
              >
                <div
                  className={`rounded-full p-[2.5px] transition-transform active:scale-95 ${
                    group.hasUnviewed
                      ? 'bg-gradient-to-tr from-accent via-editorial-terracotta to-accent-light'
                      : 'bg-border-medium'
                  }`}
                >
                  <div className="rounded-full bg-surface p-0.5">
                    <UserAvatar
                      src={group.author.avatarUrl}
                      name={group.author.name || group.author.username}
                      size="lg"
                    />
                  </div>
                </div>
                <span className="max-w-[72px] truncate text-[11px] font-medium text-txt-secondary">
                  {isSelf ? 'You' : group.author.name?.split(' ')[0] || `@${group.author.username}`}
                </span>
              </button>
            );
          })}

          {!loading && groups.length === 0 && (
            <div className="flex items-center text-xs text-txt-muted">
              <span>Stories shared appear here in real time.</span>
            </div>
          )}
        </div>
      </div>

      {/* Upload Preview & Caption Modal */}
      {uploadPreview && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-xl animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
          aria-label="Story preview"
        >
          <div className="relative flex w-full max-w-sm flex-col overflow-hidden rounded-3xl bg-surface border border-border-subtle shadow-editorial-lg text-txt-primary">
            <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
              <h3 className="text-sm font-semibold font-serif">Share Story Moment</h3>
              <button
                type="button"
                onClick={() => setUploadPreview(null)}
                className="rounded-full p-1 text-txt-tertiary hover:bg-surface-elevated hover:text-txt-primary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="relative flex h-80 w-full items-center justify-center bg-black overflow-hidden">
              {uploadPreview.isVideo ? (
                <video
                  src={uploadPreview.previewUrl}
                  controls
                  playsInline
                  className="max-h-full max-w-full w-full h-full object-cover"
                />
              ) : (
                <img
                  src={uploadPreview.previewUrl}
                  alt="Story preview"
                  className="max-h-full max-w-full w-full h-full object-cover"
                />
              )}
            </div>

            <div className="p-4 space-y-3">
              <input
                type="text"
                value={uploadPreview.caption}
                onChange={(e) =>
                  setUploadPreview((prev) => ({ ...prev, caption: e.target.value }))
                }
                placeholder="Write a brief caption (optional)..."
                maxLength={500}
                className="w-full rounded-xl bg-surface-subtle border border-border-subtle px-3.5 py-2 text-xs text-txt-primary placeholder:text-txt-muted focus:outline-none focus:border-accent"
              />

              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  className="flex-1"
                  onClick={() => setUploadPreview(null)}
                  disabled={uploading}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={handleConfirmUpload}
                  disabled={uploading}
                  isLoading={uploading}
                >
                  Share Story
                </Button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Story Viewer Modal — Rendered into document.body to avoid stacking context clipping */}
      {activeStoryItem && groups[activeGroup] && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-2xl p-0 sm:p-4 select-none animate-in fade-in duration-200"
          onClick={() => setActiveGroup(-1)}
          role="dialog"
          aria-modal="true"
          aria-label="Story viewer"
        >
          <div
            className="relative flex h-full sm:h-[min(92vh,780px)] w-full sm:max-w-md items-center justify-center overflow-hidden sm:rounded-[32px] bg-neutral-950 shadow-2xl border-0 sm:border sm:border-white/15"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={() => setIsPaused(true)}
            onMouseUp={() => setIsPaused(false)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
          >
            {/* Ambient dynamic color backdrop filling the whole card (no empty black box) */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {activeStoryItem.mediaType === 'video' ? (
                <video
                  src={editPreviewUrl || activeStoryItem.mediaUrl}
                  className="w-full h-full object-cover filter blur-3xl opacity-50 scale-125"
                  muted
                  playsInline
                />
              ) : (
                <img
                  src={editPreviewUrl || activeStoryItem.mediaUrl}
                  alt=""
                  className="w-full h-full object-cover filter blur-3xl opacity-50 scale-125"
                  aria-hidden="true"
                />
              )}
              {/* Soft dark vignette gradients for pristine text contrast */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-transparent to-black/85" />
            </div>

            {/* Main Story Media Display */}
            <div className="relative z-0 flex items-center justify-center w-full h-full">
              {activeStoryItem.mediaType === 'video' ? (
                <video
                  src={editPreviewUrl || activeStoryItem.mediaUrl}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={editPreviewUrl || activeStoryItem.mediaUrl}
                  alt="Story"
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            {/* Tap Navigation Zones: Left 30% = Prev, Right 30% = Next, Center = Hold to Pause */}
            <div className="absolute inset-x-0 top-20 bottom-20 z-20 flex">
              <div
                className="w-[30%] h-full cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  advance(-1);
                }}
                aria-label="Previous story"
              />
              <div className="w-[40%] h-full cursor-default" />
              <div
                className="w-[30%] h-full cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  advance(1);
                }}
                aria-label="Next story"
              />
            </div>

            {/* Story progression segments with live 30s auto-advance progress */}
            <div className="absolute left-3.5 right-3.5 top-3.5 z-30 flex gap-1.5 pointer-events-none">
              {groups[activeGroup].stories.map((entry, idx) => {
                let fillWidth = '0%';
                if (idx < activeStory) fillWidth = '100%';
                else if (idx === activeStory) fillWidth = `${storyProgress}%`;

                return (
                  <div
                    key={entry.id}
                    className="h-1 flex-1 rounded-full bg-white/35 overflow-hidden backdrop-blur-xs shadow-sm"
                  >
                    <div
                      className="h-full bg-white rounded-full transition-all duration-100 ease-linear"
                      style={{ width: fillWidth }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Author header */}
            <div className="absolute left-4 right-4 top-8 z-30 flex items-center justify-between text-white pointer-events-auto">
              <div className="flex items-center gap-2.5">
                <div className="ring-2 ring-accent rounded-full p-0.5">
                  <UserAvatar
                    src={groups[activeGroup].author.avatarUrl}
                    name={groups[activeGroup].author.name}
                    size="sm"
                  />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs sm:text-sm font-semibold tracking-tight text-white drop-shadow-md">
                      @{groups[activeGroup].author.username}
                    </span>
                    <span className="px-1.5 py-0.2 rounded-full bg-accent/80 text-[9px] font-mono font-bold uppercase tracking-wider text-white">
                      24h
                    </span>
                  </div>
                  <span className="text-[10px] text-white/80 drop-shadow-sm font-medium">
                    {formatStoryTime(activeStoryItem.createdAt)}
                  </span>
                </div>
              </div>

              {/* Actions (Share, Edit, Delete, Close) */}
              <div className="flex items-center gap-1.5 text-white">
                <button
                  type="button"
                  onClick={handleShareStory}
                  aria-label="Share story"
                  title="Share story"
                  className="rounded-full bg-black/40 hover:bg-black/60 p-2 text-white backdrop-blur-md transition-transform hover:scale-105 active:scale-95 border border-white/10"
                >
                  <Share2 className="h-4 w-4" />
                </button>

                {isStoryOwner && (
                  <>
                    {isStoryEditable && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingStory((prev) => !prev);
                          setEditCaption(activeStoryItem.caption || '');
                          setEditFile(null);
                          setEditPreviewUrl('');
                        }}
                        aria-label="Edit story"
                        title="Edit caption or media (valid within 30 minutes of sharing)"
                        className={`rounded-full p-2 text-white backdrop-blur-md transition-transform hover:scale-105 active:scale-95 border border-white/10 ${
                          isEditingStory ? 'bg-accent' : 'bg-black/40 hover:bg-black/60'
                        }`}
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleDeleteStory}
                      disabled={isDeletingStory}
                      aria-label="Delete story"
                      title="Delete story"
                      className="rounded-full bg-black/40 hover:bg-rose-900/60 p-2 text-rose-300 backdrop-blur-md transition-transform hover:scale-105 active:scale-95 border border-white/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => setActiveGroup(-1)}
                  aria-label="Close story"
                  className="rounded-full bg-black/40 hover:bg-black/60 p-2 text-white backdrop-blur-md transition-transform hover:scale-105 active:scale-95 border border-white/10"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Desktop Navigation Arrows */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                advance(-1);
              }}
              aria-label="Previous story"
              className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 z-30 rounded-full bg-black/40 hover:bg-black/70 p-2 text-white/90 hover:text-white backdrop-blur-md transition-all hover:scale-105 border border-white/10"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                advance(1);
              }}
              aria-label="Next story"
              className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 z-30 rounded-full bg-black/40 hover:bg-black/70 p-2 text-white/90 hover:text-white backdrop-blur-md transition-all hover:scale-105 border border-white/10"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            {/* Edit Story Overlay */}
            {isEditingStory && (
              <form
                onSubmit={handleSaveEdit}
                className="absolute bottom-14 left-4 right-4 z-30 rounded-2xl bg-black/85 p-3.5 backdrop-blur-md border border-white/20 shadow-xl"
              >
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between text-xs text-white/80">
                    <span className="font-semibold text-accent">Edit Story</span>
                    <button
                      type="button"
                      onClick={() => setIsEditingStory(false)}
                      className="text-white/60 hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                  <input
                    type="text"
                    value={editCaption}
                    onChange={(e) => setEditCaption(e.target.value)}
                    placeholder="Update caption..."
                    maxLength={500}
                    className="w-full rounded-xl bg-white/10 px-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-accent"
                    autoFocus
                  />
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex cursor-pointer items-center gap-1.5 text-xs text-accent hover:underline">
                      <UploadCloud className="h-3.5 w-3.5" />
                      <span>{editFile ? 'Media replaced' : 'Change media'}</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setEditFile(file);
                            setEditPreviewUrl(URL.createObjectURL(file));
                          }
                        }}
                      />
                    </label>
                    <button
                      type="submit"
                      disabled={isSavingEdit}
                      className="rounded-xl bg-accent px-3.5 py-1 text-xs font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
                    >
                      {isSavingEdit ? 'Saving…' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Caption display */}
            {!isEditingStory && activeStoryItem.caption && (
              <div className="absolute bottom-14 left-4 right-4 z-20 max-h-24 overflow-y-auto rounded-2xl bg-black/60 px-4 py-2.5 text-xs text-white backdrop-blur-sm border border-white/10">
                <p className="whitespace-pre-wrap break-words">{activeStoryItem.caption}</p>
              </div>
            )}

            {/* View count button - only for the user who created this story */}
            {isStoryOwner && (
              <button
                type="button"
                onClick={() => handleOpenViewers(activeStoryItem.id)}
                className="absolute bottom-4 left-4 z-20 flex items-center gap-1.5 rounded-xl bg-black/60 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-black/80 hover:scale-105 active:scale-95 backdrop-blur-sm border border-white/10"
                title="View people who watched your story"
              >
                <Eye className="h-3.5 w-3.5 text-accent" />
                <span>{activeStoryItem.viewersCount || 0} views</span>
              </button>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* Viewers List Modal (only for the author of this story) */}
      {viewersModalStoryId && isStoryOwner && createPortal(
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 p-4 backdrop-blur-xl animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
          aria-label="Story viewers"
        >
          <div className="relative flex max-h-[80vh] w-full max-w-sm flex-col overflow-hidden rounded-2xl bg-surface shadow-editorial-lg border border-border-subtle text-txt-primary">
            <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-accent" />
                <h3 className="text-sm font-semibold text-txt-primary font-serif">
                  Story Viewers ({viewersList.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewersModalStoryId(null)}
                className="rounded-full p-1 text-txt-muted hover:bg-surface-elevated hover:text-txt-primary transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1 max-h-96">
              {loadingViewers ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-accent" />
                </div>
              ) : viewersList.length === 0 ? (
                <p className="py-10 text-center text-xs text-txt-muted">
                  No viewers yet. People who view your story will show up here.
                </p>
              ) : (
                viewersList.map((viewer) => (
                  <Link
                    key={viewer.id || viewer._id}
                    to={`/profile/${viewer.username}`}
                    onClick={() => {
                      setViewersModalStoryId(null);
                      setActiveGroup(-1);
                    }}
                    className="flex items-center gap-3 rounded-xl p-2.5 transition hover:bg-surface-elevated"
                  >
                    <UserAvatar
                      src={viewer.avatarUrl}
                      name={viewer.name || viewer.username}
                      size="md"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-txt-primary">
                        {viewer.name || viewer.username}
                      </p>
                      <p className="truncate text-[11px] text-txt-muted">
                        @{viewer.username}
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
