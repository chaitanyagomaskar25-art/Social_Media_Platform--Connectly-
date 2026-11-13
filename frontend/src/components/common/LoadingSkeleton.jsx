import React from 'react';

export function PostSkeleton() {
  return (
    <div className="bg-surface rounded-3xl p-5 border border-border-subtle shadow-editorial-xs space-y-4 animate-content-enter">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full skeleton-shimmer" />
        <div className="space-y-2 flex-1">
          <div className="h-3.5 skeleton-shimmer rounded-lg w-1/4" />
          <div className="h-2.5 skeleton-shimmer rounded-lg w-1/6" />
        </div>
      </div>
      <div className="space-y-2.5 py-2">
        <div className="h-3.5 skeleton-shimmer rounded-lg w-full" />
        <div className="h-3.5 skeleton-shimmer rounded-lg w-5/6" />
        <div className="h-3.5 skeleton-shimmer rounded-lg w-3/4" />
      </div>
      <div className="h-56 skeleton-shimmer rounded-2xl w-full" />
      <div className="flex justify-between pt-2">
        <div className="h-3 skeleton-shimmer rounded-lg w-16" />
        <div className="h-3 skeleton-shimmer rounded-lg w-16" />
        <div className="h-3 skeleton-shimmer rounded-lg w-16" />
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="bg-surface rounded-3xl p-6 border border-border-subtle shadow-editorial-xs space-y-6 animate-content-enter">
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <div className="w-24 h-24 rounded-full skeleton-shimmer" />
        <div className="space-y-3 flex-1 text-center sm:text-left">
          <div className="h-6 skeleton-shimmer rounded-xl w-48 mx-auto sm:mx-0" />
          <div className="h-3.5 skeleton-shimmer rounded-lg w-32 mx-auto sm:mx-0" />
          <div className="flex justify-center sm:justify-start gap-6 pt-2">
            <div className="h-3 skeleton-shimmer rounded-lg w-16" />
            <div className="h-3 skeleton-shimmer rounded-lg w-16" />
            <div className="h-3 skeleton-shimmer rounded-lg w-16" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function UserListSkeleton() {
  return (
    <div className="space-y-3 animate-content-enter">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center justify-between py-2.5 px-3 rounded-2xl border border-border-subtle bg-surface">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full skeleton-shimmer" />
            <div className="space-y-1.5">
              <div className="h-3.5 skeleton-shimmer rounded-lg w-28" />
              <div className="h-2.5 skeleton-shimmer rounded-lg w-20" />
            </div>
          </div>
          <div className="w-16 h-7 skeleton-shimmer rounded-xl" />
        </div>
      ))}
    </div>
  );
}
