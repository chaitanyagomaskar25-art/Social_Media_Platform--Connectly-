import React from 'react';
import Button from './Button';
import { FolderOpen } from 'lucide-react';

export default function EmptyState({
  icon: Icon = FolderOpen,
  title = 'No items found',
  description = 'There is nothing to display here yet.',
  actionLabel,
  onAction,
}) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-surface rounded-3xl border border-dashed border-border-medium shadow-editorial-xs animate-content-enter">
      <div className="w-14 h-14 rounded-2xl bg-accent-subtle flex items-center justify-center text-accent mb-4 ring-1 ring-accent/20 animate-float shadow-editorial-xs">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="editorial-heading text-lg font-medium text-txt-primary">{title}</h3>
      <p className="mt-1.5 text-xs text-txt-secondary max-w-sm leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} size="sm" className="mt-5">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
