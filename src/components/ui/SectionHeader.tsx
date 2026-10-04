import { Link } from 'react-router';
import { Icon } from './Icon';

interface SectionHeaderProps {
  id: string;
  title: string;
  description?: string;
  /** Optional "See all" style link on the right. */
  action?: { to: string; label: string };
}

export function SectionHeader({ id, title, description, action }: SectionHeaderProps) {
  return (
    <div className="mb-3 flex items-end justify-between gap-4 sm:mb-4">
      <div className="min-w-0">
        <h2 id={id} className="text-xl leading-7 font-bold sm:text-2xl sm:leading-8">
          {title}
        </h2>
        {description && <p className="mt-0.5 text-[13px] text-ink-muted sm:text-sm">{description}</p>}
      </div>
      {action && (
        <Link to={action.to} className="link inline-flex min-h-10 shrink-0 items-center gap-0.5 text-sm font-medium">
          {action.label}
          <Icon name="chevron-right" size={16} />
        </Link>
      )}
    </div>
  );
}
