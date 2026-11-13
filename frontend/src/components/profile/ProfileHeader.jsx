import React, { useState } from 'react';
import UserAvatar from '../common/UserAvatar';
import Button from '../common/Button';
import { useSocket } from '../../context/SocketContext';
import { useToast } from '../../context/ToastContext';
import { formatCompactNumber } from '../../utils/formatters';
import { formatEditorialText } from '../../utils/textUtils';
import {
  Edit3,
  UserPlus,
  UserCheck,
  Share2,
  Check,
  Shield,
  MoreVertical,
  Flag,
  Ban,
  Sparkles,
  Lock,
  Calendar,
} from 'lucide-react';

export default function ProfileHeader({
  profile,
  isOwnProfile,
  isFollowing,
  onFollowToggle,
  onEditProfile,
  onOpenFollowers,
  onOpenFollowing,
  isFollowLoading = false,
  followLabel,
  isFollowRequested = false,
  onReport,
  onBlock,
}) {
  const { isUserOnline } = useSocket();
  const { showInfo } = useToast();
  const [copied, setCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const username = profile?.username || 'user';
  const name = profile?.name || username;
  const bio = profile?.bio || profile?.about || '';
  const avatar = profile?.avatarUrl || profile?.avatar || profile?.profilePicture;
  const targetUserId = profile?._id || profile?.id;
  const isOnline = isUserOnline(targetUserId);
  const isAdmin = profile?.role === 'admin';
  const isPrivate = profile?.privateAccount;

  const postsCount = profile?.postsCount ?? profile?.postCount ?? profile?.posts?.length ?? 0;
  const followersCount =
    profile?.followersCount ??
    profile?.followerCount ??
    (Array.isArray(profile?.followers) ? profile.followers.length : 0);
  const followingCount =
    profile?.followingCount ??
    (Array.isArray(profile?.following) ? profile.following.length : 0);

  const handleShareProfile = () => {
    const profileUrl = `${window.location.origin}/profile/${username}`;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(profileUrl)
        .then(() => {
          setCopied(true);
          showInfo('Profile link copied to clipboard!');
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(() => {});
    }
  };

  return (
    <div className="bg-surface rounded-3xl border border-border-subtle shadow-editorial-xs overflow-hidden mb-6 transition-all duration-200">
      {/* 1. Large Architectural Cover Presentation */}
      <div className="relative h-36 sm:h-48 w-full bg-gradient-to-r from-accent via-editorial-terracotta to-accent-dark overflow-hidden">
        {/* Subtle decorative textured grain / overlay */}
        <div className="absolute inset-0 bg-black/10 mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

        {/* Ambient Decorative Large Watermark */}
        <span
          className="absolute right-4 sm:right-8 -bottom-4 sm:-bottom-6 font-serif italic font-black text-6xl sm:text-8xl lg:text-9xl text-white/10 select-none pointer-events-none tracking-tighter uppercase"
          aria-hidden="true"
        >
          {String(name || username).split(' ')[0]}
        </span>

        {/* Modern Editorial Name in Cover Space */}
        <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-8 z-10 pointer-events-none select-none">
          <div className="max-w-xs sm:max-w-md">
            <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-mono uppercase tracking-widest text-white/85 bg-black/25 backdrop-blur-xs px-2.5 py-0.5 rounded-full mb-1 border border-white/15">
              <span>@{username}</span>
            </span>
            <h2 className="font-serif italic font-bold text-2xl sm:text-3xl md:text-4xl text-white drop-shadow-md tracking-tight truncate leading-tight">
              {name}
            </h2>
          </div>
        </div>

        {/* Top Floating Actions over Cover */}
        <div className="absolute top-4 right-4 flex items-center gap-2 z-20 pointer-events-auto">
          <button
            type="button"
            onClick={handleShareProfile}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md text-xs font-medium border border-white/15 transition-all hover:scale-105 active:scale-95"
            title="Share profile"
            aria-label="Share profile"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px] text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span className="text-[11px] hidden sm:inline">Share Profile</span>
              </>
            )}
          </button>

          {!isOwnProfile && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md border border-white/15 transition-all"
                aria-label="More actions"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {showMenu && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-border-subtle bg-surface p-1.5 shadow-editorial-xl z-30 animate-in fade-in zoom-in-95 duration-150">
                    <button
                      type="button"
                      onClick={() => {
                        setShowMenu(false);
                        onReport?.();
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-txt-secondary hover:bg-surface-elevated hover:text-txt-primary transition-colors"
                    >
                      <Flag className="w-3.5 h-3.5 text-accent" />
                      <span>Report Account</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowMenu(false);
                        onBlock?.();
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-rose-500 hover:bg-rose-500/10 transition-colors"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      <span>Block Account</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. Main Profile Bio & Statistics Section */}
      <div className="p-6 sm:p-8 relative">
        <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-5 -mt-16 sm:-mt-20 mb-5">
          {/* Large Avatar with Crest */}
          <div className="relative group rounded-full">
            <UserAvatar
              src={avatar}
              name={name}
              size="2xl"
              statusIndicator={isOnline}
              className="rounded-full ring-4 ring-surface shadow-editorial-lg bg-surface"
            />
          </div>

          {/* Primary Action Button */}
          <div className="flex items-center gap-2.5">
            {isOwnProfile ? (
              <Button
                onClick={onEditProfile}
                variant="outline"
                size="sm"
                icon={Edit3}
                className="rounded-full shadow-editorial-xs px-5"
              >
                Edit Studio Profile
              </Button>
            ) : (
              <Button
                onClick={onFollowToggle}
                variant={isFollowing ? 'secondary' : 'primary'}
                size="sm"
                icon={isFollowing ? UserCheck : UserPlus}
                isLoading={isFollowLoading}
                disabled={isFollowRequested}
                className="rounded-full shadow-editorial-xs px-6"
              >
                {followLabel ||
                  (isFollowRequested ? 'Requested' : isFollowing ? 'Following' : 'Follow')}
              </Button>
            )}
          </div>
        </div>

        {/* Creator Name & Metadata */}
        <div className="text-center sm:text-left space-y-2">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-txt-primary">
              {name}
            </h1>

            {isAdmin && (
              <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-semibold text-accent border border-accent/20">
                <Shield className="w-3 h-3" /> Admin
              </span>
            )}

            {isPrivate && (
              <span className="inline-flex items-center gap-1 rounded-full bg-surface-elevated px-2.5 py-0.5 text-xs font-medium text-txt-muted border border-border-subtle">
                <Lock className="w-3 h-3" /> Private
              </span>
            )}

            {isOnline && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active now
              </span>
            )}
          </div>

          <p className="mono-meta text-xs sm:text-sm text-txt-muted">@{username}</p>

          {/* Bio text with clickable hashtags/mentions */}
          {bio ? (
            <div className="text-xs sm:text-sm text-txt-secondary leading-relaxed max-w-2xl pt-1">
              {formatEditorialText(bio)}
            </div>
          ) : (
            <p className="text-xs text-txt-muted italic pt-1">
              {isOwnProfile
                ? 'Introduce your craft and visual perspectives with a studio bio.'
                : 'No bio shared yet.'}
            </p>
          )}

          {/* Stats Bar */}
          <div className="flex items-center justify-center sm:justify-start gap-4 sm:gap-8 pt-5 border-t border-border-subtle mt-5 text-xs sm:text-sm">
            <div>
              <span className="font-serif font-bold text-base sm:text-lg text-txt-primary">
                {formatCompactNumber(postsCount)}
              </span>{' '}
              <span className="text-txt-muted text-xs uppercase tracking-wider font-mono">
                Dispatches
              </span>
            </div>

            <button
              type="button"
              onClick={onOpenFollowers}
              className="hover:text-accent transition-colors text-left"
            >
              <span className="font-serif font-bold text-base sm:text-lg text-txt-primary">
                {formatCompactNumber(followersCount)}
              </span>{' '}
              <span className="text-txt-muted text-xs uppercase tracking-wider font-mono">
                Followers
              </span>
            </button>

            <button
              type="button"
              onClick={onOpenFollowing}
              className="hover:text-accent transition-colors text-left"
            >
              <span className="font-serif font-bold text-base sm:text-lg text-txt-primary">
                {formatCompactNumber(followingCount)}
              </span>{' '}
              <span className="text-txt-muted text-xs uppercase tracking-wider font-mono">
                Following
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
