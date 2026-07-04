'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, rightIcon, type = 'text', autoCapitalize, autoCorrect, spellCheck, inputMode, ...props }, ref) => {
    const tokens = [props.name, props.id, props.placeholder, props.autoComplete].join(' ').toLowerCase();
    const isPassword = type === 'password';
    const isEmail = type === 'email' || tokens.includes('email');
    const isPhone = type === 'tel' || /\b(phone|mobile|whatsapp|contact)\b/.test(tokens);
    const isUrl = type === 'url' || /\b(url|website|link|image)\b/.test(tokens);
    const isSearch = type === 'search' || tokens.includes('search');
    const isNumeric = type === 'number' || /\b(price|amount|stock|quantity|qty|discount|postal|zip|pin)\b/.test(tokens);
    const resolvedInputMode = inputMode ?? (isEmail ? 'email' : isPhone ? 'tel' : isUrl ? 'url' : type === 'number' ? 'decimal' : undefined);
    const resolvedAutoCapitalize = autoCapitalize ?? (isPassword || isEmail || isPhone || isUrl || isSearch || isNumeric ? 'none' : 'words');
    const resolvedAutoCorrect = autoCorrect ?? (isPassword || isEmail || isPhone || isUrl || isSearch || isNumeric ? 'off' : 'on');
    const resolvedSpellCheck = spellCheck ?? !(isPassword || isEmail || isPhone || isUrl || isSearch || isNumeric);

    return (
      <div className="space-y-1.5">
        {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
        <div className="relative">
          {icon && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span>}
        <input
          ref={ref}
          type={type}
          inputMode={resolvedInputMode}
          autoCapitalize={resolvedAutoCapitalize}
          autoCorrect={resolvedAutoCorrect}
          spellCheck={resolvedSpellCheck}
          className={cn(
            'w-full py-3 rounded-2xl border bg-white text-gray-900 placeholder:text-gray-400 transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500',
            error ? 'border-red-400 focus:ring-red-500/30 focus:border-red-500' : 'border-gray-200',
            icon ? 'pl-11 pr-4' : 'px-4',
            rightIcon ? 'pr-11' : '',
            className
          )}
          {...props}
        />
          {rightIcon && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">{rightIcon}</span>}
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
