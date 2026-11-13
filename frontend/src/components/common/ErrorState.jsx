import React from 'react';
import Button from './Button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function ErrorState({
  title = 'Something went wrong',
  message = 'An error occurred while fetching data from the server.',
  onRetry,
}) {
  return (
    <div className="flex flex-col items-center justify-center p-10 text-center bg-rose-500/5 dark:bg-rose-500/10 rounded-3xl border border-rose-500/20 shadow-editorial-xs">
      <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400 mb-3.5 ring-1 ring-rose-500/20">
        <AlertTriangle className="w-5 h-5" />
      </div>
      <h3 className="editorial-heading text-lg font-medium text-rose-950 dark:text-rose-200">{title}</h3>
      <p className="mt-1 text-xs text-rose-700/80 dark:text-rose-300/80 max-w-md leading-relaxed">{message}</p>
      {onRetry && (
        <Button
          onClick={onRetry}
          variant="outline"
          size="sm"
          icon={RefreshCw}
          className="mt-4 border-rose-500/30 text-rose-700 dark:text-rose-300 hover:bg-rose-500/10"
        >
          Try Again
        </Button>
      )}
    </div>
  );
}
