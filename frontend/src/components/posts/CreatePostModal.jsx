import React, { useEffect, useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import UserAvatar from '../common/UserAvatar';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { postService } from '../../services/postService';
import { Image, Video, X, Sparkles, Hash, AtSign, Film } from 'lucide-react';

export default function CreatePostModal({ isOpen, onClose, onPostCreated }) {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [content, setContent] = useState('');
  const [imageFiles, setImageFiles] = useState([]);
  const [videoFile, setVideoFile] = useState(null);
  const [mediaPreviews, setMediaPreviews] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const files = videoFile ? [videoFile] : imageFiles;
    const urls = files.map((file) => ({
      url: URL.createObjectURL(file),
      type: file.type,
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(1),
    }));
    setMediaPreviews(urls);
    return () => urls.forEach(({ url }) => URL.revokeObjectURL(url));
  }, [imageFiles, videoFile]);

  const handleImageFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length) {
      if (files.some((file) => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type))) {
        showError('Choose JPEG, PNG, or WebP images.');
        e.target.value = '';
        return;
      }
      if (files.some((file) => file.size > 5 * 1024 * 1024)) {
        showError('Each post image must be 5 MB or smaller.');
        e.target.value = '';
        return;
      }
      if (files.length + imageFiles.length > 10) {
        showError('A post can include up to 10 images.');
        e.target.value = '';
        return;
      }
      setVideoFile(null);
      setImageFiles((current) => [...current, ...files]);
      e.target.value = '';
    }
  };

  const handleVideoFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['video/mp4', 'video/webm', 'video/quicktime'].includes(file.type)) {
      showError('Choose an MP4, WebM, or MOV video.');
      event.target.value = '';
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      showError('Videos must be 50 MB or smaller.');
      event.target.value = '';
      return;
    }
    setImageFiles([]);
    setVideoFile(file);
    event.target.value = '';
  };

  const removeMediaItem = (index) => {
    if (videoFile) {
      setVideoFile(null);
    } else {
      setImageFiles((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const clearAllMedia = () => {
    setImageFiles([]);
    setVideoFile(null);
  };

  const insertTagOrMention = (prefix) => {
    setContent((prev) => {
      const spacer = prev.length && !prev.endsWith(' ') ? ' ' : '';
      return `${prev}${spacer}${prefix}`;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !imageFiles.length && !videoFile) {
      showError('Please write some thoughts or attach an image.');
      return;
    }

    setIsSubmitting(true);
    try {
      const createdPost = await postService.createPost({
        caption: content.trim(),
        images: imageFiles,
        video: videoFile,
      });

      showSuccess('Post created successfully!');
      setContent('');
      clearAllMedia();
      onClose();
      if (onPostCreated) {
        onPostCreated(createdPost?.post || createdPost?.data || createdPost);
      }
    } catch (err) {
      showError(err.message || 'Failed to create post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const charLimit = 2000;
  const charsRemaining = charLimit - content.length;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Compose Story">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Creator Identity & Meta */}
        <div className="flex items-center gap-3">
          <UserAvatar
            src={user?.avatarUrl || user?.avatar || user?.profilePicture}
            name={user?.name || user?.username}
            size="md"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-txt-primary">
                {user?.name || user?.username}
              </span>
              <span className="editorial-chip text-[10px] py-0 px-1.5">
                Draft
              </span>
            </div>
            <p className="text-xs text-txt-tertiary">
              @{user?.username || 'user'} • Visible to your audience
            </p>
          </div>
        </div>

        {/* Studio Composer Textarea */}
        <div className="relative rounded-2xl border border-border-subtle bg-surface-subtle/50 p-3 transition-colors focus-within:border-accent focus-within:bg-surface">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={charLimit}
            placeholder="Share an insight, craft a reflection, or publish a visual note..."
            rows={5}
            className="w-full resize-none border-0 bg-transparent text-sm leading-relaxed text-txt-primary placeholder:text-txt-muted focus:outline-none focus:ring-0"
            autoFocus
          />

          {/* Quick inline insert pills */}
          <div className="flex items-center justify-between pt-2 border-t border-border-subtle/60 text-xs text-txt-tertiary">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => insertTagOrMention('#')}
                className="flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-surface-elevated hover:text-accent transition-colors"
                title="Add hashtag"
              >
                <Hash className="w-3.5 h-3.5" />
                <span>tag</span>
              </button>
              <button
                type="button"
                onClick={() => insertTagOrMention('@')}
                className="flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-surface-elevated hover:text-accent transition-colors"
                title="Mention someone"
              >
                <AtSign className="w-3.5 h-3.5" />
                <span>mention</span>
              </button>
            </div>
            <span
              className={`font-mono text-[11px] ${
                charsRemaining < 50
                  ? 'text-rose-500 font-semibold'
                  : 'text-txt-tertiary'
              }`}
            >
              {charsRemaining} left
            </span>
          </div>
        </div>

        {/* Media Preview Gallery */}
        {mediaPreviews.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-txt-secondary">
              <span>Attached Media ({mediaPreviews.length})</span>
              <button
                type="button"
                onClick={clearAllMedia}
                className="text-[11px] text-rose-500 hover:underline"
              >
                Clear all
              </button>
            </div>

            <div
              className={`grid gap-2 ${
                mediaPreviews.length === 1
                  ? 'grid-cols-1'
                  : mediaPreviews.length === 2
                  ? 'grid-cols-2'
                  : 'grid-cols-3'
              }`}
            >
              {mediaPreviews.map((preview, index) => (
                <div
                  key={preview.url}
                  className="group relative overflow-hidden rounded-2xl border border-border-subtle bg-black/5"
                >
                  {preview.type.startsWith('video/') ? (
                    <video
                      src={preview.url}
                      controls
                      className="h-44 w-full rounded-2xl bg-black object-contain"
                    />
                  ) : (
                    <img
                      src={preview.url}
                      alt={`Upload ${index + 1}`}
                      className="h-32 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => removeMediaItem(index)}
                    className="absolute right-2 top-2 rounded-full bg-surface/90 p-1 text-txt-primary shadow-editorial-xs backdrop-blur-sm transition-all hover:bg-rose-500 hover:text-white"
                    aria-label="Remove item"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                  <div className="absolute bottom-1 left-2 font-mono text-[10px] text-white/90 drop-shadow-md">
                    {preview.size}MB
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Composer Controls & Publish Button */}
        <div className="flex items-center justify-between pt-3 border-t border-border-subtle">
          <div className="flex items-center gap-1.5">
            <label
              className="flex items-center gap-1.5 cursor-pointer rounded-xl px-2.5 py-1.5 text-xs font-medium text-txt-secondary hover:bg-surface-elevated hover:text-accent transition-colors"
              title="Attach images (up to 10)"
            >
              <Image className="w-4 h-4 text-accent" />
              <span>Photo</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handleImageFileChange}
                className="hidden"
                disabled={Boolean(videoFile) || isSubmitting}
              />
            </label>

            <label
              className="flex items-center gap-1.5 cursor-pointer rounded-xl px-2.5 py-1.5 text-xs font-medium text-txt-secondary hover:bg-surface-elevated hover:text-accent transition-colors"
              title="Attach video (up to 50MB)"
            >
              <Film className="w-4 h-4 text-accent" />
              <span>Video</span>
              <input
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                onChange={handleVideoFileChange}
                className="hidden"
                disabled={imageFiles.length > 0 || isSubmitting}
              />
            </label>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              isLoading={isSubmitting}
              disabled={!content.trim() && !imageFiles.length && !videoFile}
              icon={Sparkles}
            >
              Publish
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
