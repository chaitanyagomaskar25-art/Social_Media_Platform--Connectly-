import React from 'react';
import UserAvatar from '../common/UserAvatar';
import { useAuth } from '../../context/AuthContext';
import { Image, PenLine, Sparkles, Film } from 'lucide-react';

export default function CreatePostCard({ onOpenModal }) {
  const { user } = useAuth();
  const firstName = user?.name?.split(' ')[0] || user?.username || 'Creator';

  return (
    <div className="bg-surface rounded-3xl p-4 sm:p-5 border border-border-subtle shadow-editorial-xs transition-all duration-200 hover:border-border-medium hover:shadow-editorial">
      <div className="flex items-center gap-3.5">
        <UserAvatar
          src={user?.avatarUrl || user?.avatar || user?.profilePicture}
          name={user?.name || user?.username}
          size="md"
        />

        {/* Studio Composer Trigger Bar */}
        <button
          type="button"
          onClick={onOpenModal}
          className="flex-1 min-w-0 text-left px-3.5 sm:px-4 py-2.5 bg-surface-elevated/70 hover:bg-surface-elevated rounded-2xl text-xs sm:text-sm font-medium text-txt-muted hover:text-txt-primary transition-all border border-border-subtle focus:outline-none focus:ring-2 focus:ring-accent/20"
        >
          <span className="truncate block">
            Share a dispatch, thought, or visual note, {firstName}…
          </span>
        </button>
      </div>

      {/* Quick Action Badges */}
      <div className="mt-3 pt-3 border-t border-border-subtle/60 flex items-center justify-between text-xs text-txt-secondary">
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={onOpenModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-surface-elevated text-txt-secondary hover:text-accent transition-colors"
          >
            <PenLine className="w-3.5 h-3.5 text-accent" />
            <span className="font-medium">Essay</span>
          </button>

          <button
            type="button"
            onClick={onOpenModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-surface-elevated text-txt-secondary hover:text-accent transition-colors"
          >
            <Image className="w-3.5 h-3.5 text-accent" />
            <span className="font-medium">Visual</span>
          </button>

          <button
            type="button"
            onClick={onOpenModal}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-surface-elevated text-txt-secondary hover:text-accent transition-colors"
          >
            <Film className="w-3.5 h-3.5 text-accent" />
            <span className="font-medium">Motion</span>
          </button>
        </div>

        <span className="hidden sm:flex items-center gap-1 text-[11px] text-txt-muted font-serif italic">
          <Sparkles className="w-3 h-3 text-accent" />
          Atelier Studio
        </span>
      </div>
    </div>
  );
}
