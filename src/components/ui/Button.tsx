import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react';
import { Link, type LinkProps } from 'react-router';
import { cn } from '../../lib/cn';
import { Spinner } from './Spinner';

export type ButtonVariant = 'primary' | 'buy' | 'secondary' | 'dark' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap select-none ' +
  'transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-55 aria-disabled:cursor-not-allowed aria-disabled:opacity-55';

const variants: Record<ButtonVariant, string> = {
  // Amazon's yellow pill: the single most recognisable action colour.
  primary: 'bg-brand text-ink border border-brand-border hover:bg-brand-hover active:bg-[#f0b800]',
  // Orange is reserved for "skip the cart" actions (Buy Now), mirroring Amazon.
  buy: 'bg-accent text-ink border border-[#ff8f00] hover:bg-accent-hover',
  secondary: 'bg-surface text-ink border border-line hover:bg-canvas-soft active:bg-line-soft',
  dark: 'bg-nav-2 text-white border border-nav-2 hover:bg-nav-3',
  ghost: 'bg-transparent text-link border border-transparent hover:bg-canvas-soft hover:text-link-hover',
};

// Touch targets: md/lg meet the 44px minimum; sm is for dense desktop rows only.
const sizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[13px]',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-[15px]',
};

export function buttonClasses({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
}: { variant?: ButtonVariant; size?: ButtonSize; fullWidth?: boolean; className?: string } = {}) {
  return cn(base, variants[variant], sizes[size], fullWidth && 'w-full', className);
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  /** React 19 passes ref as a prop; it lands on the <button> via ...rest. */
  ref?: Ref<HTMLButtonElement>;
}

export function Button({
  variant,
  size,
  fullWidth,
  loading = false,
  icon,
  className,
  children,
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses({ variant, size, fullWidth, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Spinner size={16} /> : icon}
      {children}
    </button>
  );
}

interface ButtonLinkProps extends LinkProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  ref?: Ref<HTMLAnchorElement>;
}

export function ButtonLink({ variant, size, fullWidth, className, ...rest }: ButtonLinkProps) {
  return <Link className={buttonClasses({ variant, size, fullWidth, className: className as string | undefined })} {...rest} />;
}
