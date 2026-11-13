import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'info', duration = 3800) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const showSuccess = useCallback((msg, duration) => addToast(msg, 'success', duration), [addToast]);
  const showError = useCallback((msg, duration) => addToast(msg, 'error', duration), [addToast]);
  const showInfo = useCallback((msg, duration) => addToast(msg, 'info', duration), [addToast]);

  return (
    <ToastContext.Provider value={{ showSuccess, showError, showInfo }}>
      {children}
      {/* Editorial floating toasts container */}
      <div
        className="fixed top-5 right-5 z-[70] flex flex-col gap-2.5 pointer-events-none max-w-sm w-full px-4 sm:px-0"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl shadow-editorial-lg border backdrop-blur-xl transition-all duration-300 animate-in slide-in-from-top-3 fade-in duration-200 ${
              toast.type === 'success'
                ? 'bg-surface/95 border-emerald-500/30 text-txt-primary'
                : toast.type === 'error'
                ? 'bg-surface/95 border-rose-500/30 text-txt-primary'
                : 'bg-surface/95 border-accent/30 text-txt-primary'
            }`}
          >
            <span className="shrink-0 mt-0.5">
              {toast.type === 'success' && (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 animate-in zoom-in-75 duration-200" />
              )}
              {toast.type === 'error' && (
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 animate-in zoom-in-75 duration-200" />
              )}
              {toast.type === 'info' && (
                <Info className="w-4 h-4 text-accent animate-in zoom-in-75 duration-200" />
              )}
            </span>
            <div className="flex-1 text-xs font-medium leading-relaxed text-txt-primary">
              {toast.message}
            </div>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="shrink-0 text-txt-tertiary hover:text-txt-primary p-1 -mr-1 -mt-1 rounded-lg transition-all duration-150 active:scale-90"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
