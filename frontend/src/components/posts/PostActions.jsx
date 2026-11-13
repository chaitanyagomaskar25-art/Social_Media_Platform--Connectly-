import React, { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, Share2, Check, Bookmark } from 'lucide-react';
import { formatCompactNumber } from '../../utils/formatters';

export default function PostActions({
  isLiked,
  likeCount = 0,
  commentCount = 0,
  onLikeToggle,
  onCommentToggle,
  onShare,
  isLiking = false,
  isSaved,
  onSaveToggle,
}) {
  const [copied, setCopied] = useState(false);
  const [justLiked, setJustLiked] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const prevLiked = useRef(isLiked);
  const prevSaved = useRef(isSaved);

  useEffect(() => {
    if (isLiked && !prevLiked.current) {
      setJustLiked(true);
      const timer = setTimeout(() => setJustLiked(false), 500);
      return () => clearTimeout(timer);
    }
    prevLiked.current = isLiked;
  }, [isLiked]);

  useEffect(() => {
    if (isSaved && !prevSaved.current) {
      setJustSaved(true);
      const timer = setTimeout(() => setJustSaved(false), 450);
      return () => clearTimeout(timer);
    }
    prevSaved.current = isSaved;
  }, [isSaved]);

  const handleShareClick = (e) => {
    e.stopPropagation();
    onShare?.();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center justify-between pt-3.5 border-t border-border-subtle text-txt-secondary select-none">
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Like Button with Heartbeat Pop */}
        <button
          type="button"
          onClick={onLikeToggle}
          disabled={isLiking}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium group transition-all duration-200 active:scale-90 ${
            isLiked
              ? 'text-rose-500 font-semibold bg-rose-500/10'
              : 'hover:text-rose-500 hover:bg-rose-500/10'
          }`}
          title={isLiked ? 'Unlike dispatch' : 'Like dispatch'}
          aria-label={isLiked ? 'Unlike' : 'Like'}
        >
          <Heart
            className={`w-4 h-4 transition-transform duration-200 ${
              isLiked ? 'fill-rose-500 text-rose-500' : 'group-hover:scale-110'
            } ${justLiked ? 'animate-heart-pop' : ''}`}
          />
          <span className="mono-meta text-[11px] font-medium">
            {formatCompactNumber(likeCount)}
          </span>
        </button>

        {/* Comment Button */}
        <button
          type="button"
          onClick={onCommentToggle}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium hover:text-accent hover:bg-accent/10 group transition-all duration-200 active:scale-95"
          title="Responses & discussion"
          aria-label="Responses"
        >
          <MessageCircle className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
          <span className="mono-meta text-[11px] font-medium">
            {formatCompactNumber(commentCount)}
          </span>
        </button>

        {/* Share Button with copied feedback */}
        <button
          type="button"
          onClick={handleShareClick}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium hover:text-accent hover:bg-accent/10 group transition-all duration-200 active:scale-95"
          title="Copy dispatch link"
          aria-label="Share"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-500 animate-in zoom-in-75 duration-150" />
              <span className="text-[11px] text-emerald-500 font-medium">Copied</span>
            </>
          ) : (
            <Share2 className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
          )}
        </button>
      </div>

      {/* Save Toggle Shortcut with Pop */}
      {onSaveToggle && (
        <button
          type="button"
          onClick={onSaveToggle}
          className={`p-1.5 rounded-full transition-all duration-200 active:scale-90 ${
            isSaved
              ? 'text-accent bg-accent/10'
              : 'text-txt-muted hover:text-accent hover:bg-surface-elevated'
          }`}
          title={isSaved ? 'Saved in archives' : 'Save to archive'}
          aria-label={isSaved ? 'Saved' : 'Save'}
        >
          <Bookmark
            className={`w-4 h-4 transition-transform ${
              isSaved ? 'fill-accent' : ''
            } ${justSaved ? 'animate-bookmark-pop' : ''}`}
          />
        </button>
      )}
    </div>
  );
}
