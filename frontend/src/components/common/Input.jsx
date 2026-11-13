import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function Input({
  label,
  id,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  helperText,
  required = false,
  icon: Icon,
  className = '',
  disabled = false,
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const effectiveType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-xs font-semibold text-txt-primary mb-1.5 tracking-tight">
          {label} {required && <span className="text-accent">*</span>}
        </label>
      )}
      <div className="relative rounded-xl shadow-editorial-xs">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-txt-tertiary">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          id={id}
          type={effectiveType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`block w-full rounded-xl border bg-surface text-txt-primary placeholder-txt-muted text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent disabled:bg-surface-subtle disabled:text-txt-muted ${
            Icon ? 'pl-10' : 'pl-3.5'
          } ${isPassword ? 'pr-10' : 'pr-3.5'} py-2.5 ${
            error
              ? 'border-rose-400 focus:ring-rose-500/20 focus:border-rose-500'
              : 'border-border-medium hover:border-border-strong'
          }`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-txt-tertiary hover:text-txt-primary transition-colors focus:outline-none"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {error && <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium">{error}</p>}
      {helperText && !error && (
        <p className="mt-1 text-xs text-txt-tertiary">{helperText}</p>
      )}
    </div>
  );
}
