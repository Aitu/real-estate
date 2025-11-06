import * as React from 'react';
import { cn } from '@/lib/utils';

type BaseTextareaProps = Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  'value'
>;

export type TextareaProps = BaseTextareaProps & {
    value?: string | number | readonly string[] | null;
  };

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, value, ...props }, ref) => {
    const normalizedValue =
      value === undefined ? undefined : value ?? '';

    return (
      <textarea
        ref={ref}
        className={cn(
          'flex min-h-[120px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
        {...(normalizedValue === undefined ? null : { value: normalizedValue })}
      />
    );
  }
);

Textarea.displayName = 'Textarea';
