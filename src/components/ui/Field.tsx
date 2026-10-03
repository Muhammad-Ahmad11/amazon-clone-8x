import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';
import { Icon } from './Icon';

const control =
  'w-full rounded-lg border bg-surface px-3 text-[15px] text-ink placeholder:text-ink-subtle ' +
  'shadow-[inset_0_1px_2px_rgb(15_17_17/0.12)] transition-colors ' +
  'focus:border-focus focus:outline-none focus:ring-3 focus:ring-focus/20 disabled:bg-canvas-soft';

interface FieldShellProps {
  id: string;
  label: string;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
  children: ReactNode;
  className?: string;
}

function FieldShell({ id, label, hint, error, optional, children, className }: FieldShellProps) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <label htmlFor={id} className="text-sm font-semibold text-ink">
        {label}
        {optional && <span className="font-normal text-ink-muted"> (optional)</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="flex items-center gap-1 text-[13px] text-warning" role="alert">
          <Icon name="alert" size={14} /> {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-[13px] text-ink-muted">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
  containerClassName?: string;
}

export function TextField({ label, hint, error, optional, containerClassName, className, ...rest }: TextFieldProps) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} optional={optional} className={containerClassName}>
      <input
        id={id}
        className={cn(control, 'h-11', error ? 'border-warning' : 'border-[#888c8c]', className)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        {...rest}
      />
    </FieldShell>
  );
}

interface SelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> {
  label: string;
  hint?: ReactNode;
  error?: string;
  containerClassName?: string;
}

export function SelectField({ label, hint, error, containerClassName, className, children, ...rest }: SelectFieldProps) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} className={containerClassName}>
      <div className="relative">
        <select
          id={id}
          className={cn(control, 'h-11 appearance-none pr-9', error ? 'border-warning' : 'border-[#888c8c]', className)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          {...rest}
        >
          {children}
        </select>
        <Icon name="chevron-down" size={18} className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-ink-muted" />
      </div>
    </FieldShell>
  );
}

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode;
}

export function Checkbox({ label, className, ...rest }: CheckboxProps) {
  return (
    <label className={cn('inline-flex min-h-8 cursor-pointer items-center gap-2 text-sm text-ink', className)}>
      <input type="checkbox" className="size-4 shrink-0 cursor-pointer rounded accent-focus" {...rest} />
      <span>{label}</span>
    </label>
  );
}
