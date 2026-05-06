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
  ({ className, label, error, icon, rightIcon, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
      <div className="relative">
        {icon && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span>}
        <input
          ref={ref}
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
  )
);

Input.displayName = 'Input';
export default Input;
