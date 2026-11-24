import { memo } from 'react';
import { ICON_OPTIONS, type IconName } from '@/lib/iconRegistry';
import { cn } from '@/lib/utils';

interface IconPickerProps {
  value: IconName;
  onChange: (icon: IconName) => void;
  className?: string;
}

function IconPicker({ value, onChange, className }: IconPickerProps) {
  return (
    <div
      className={cn('grid grid-cols-4 sm:grid-cols-8 gap-1.5', className)}
      role="radiogroup"
      aria-label="Pilih Ikon"
    >
      {ICON_OPTIONS.map(({ name, label, Icon }) => {
        const active = value === name;
        return (
          <button
            key={name}
            type="button"
            role="radio"
            aria-checked={active}
            title={label}
            aria-label={label}
            onClick={() => onChange(name)}
            className={cn(
              'h-10 sm:h-9 rounded-lg border flex items-center justify-center transition-colors cursor-pointer',
              active
                ? 'border-primary bg-primary text-primary-foreground shadow-xs'
                : 'border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground',
            )}
          >
            <Icon className="size-4" />
          </button>
        );
      })}
    </div>
  );
}

export default memo(IconPicker);
