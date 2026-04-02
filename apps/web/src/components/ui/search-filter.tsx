'use client';

import { MagnifyingGlass, X } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface FilterOption {
  value: string;
  label: string;
}

interface FilterGroup {
  key: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
}

interface SearchFilterProps {
  search: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
  filterGroups?: FilterGroup[];
  resultCount?: number;
  onClearAll?: () => void;
  hasActiveFilters?: boolean;
}

export function SearchFilter({
  search,
  onSearchChange,
  placeholder = 'Search...',
  filterGroups = [],
  resultCount,
  onClearAll,
  hasActiveFilters = false,
}: SearchFilterProps) {
  return (
    <div className="flex flex-col gap-3 mb-6">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        {/* Search */}
        <div className="relative flex-1 max-w-md w-full">
          <MagnifyingGlass
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <Input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={placeholder}
            className="pl-10 h-10 bg-card"
          />
          {search && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter groups */}
        {filterGroups.length > 0 && (
          <div className="flex gap-1.5 items-center flex-wrap">
            {filterGroups.map((group, groupIndex) => (
              <div key={group.key} className="contents">
                {groupIndex > 0 && (
                  <span className="text-border mx-0.5 hidden sm:inline">|</span>
                )}
                {group.options.map((option) => (
                  <Button
                    key={`${group.key}-${option.value}`}
                    variant={group.value === option.value ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => group.onChange(option.value)}
                    className={cn(
                      'h-8 px-3 text-xs',
                      group.value === option.value
                        ? ''
                        : 'text-muted-foreground'
                    )}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active filter summary */}
      {(hasActiveFilters || search) && resultCount !== undefined && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {resultCount} result{resultCount !== 1 ? 's' : ''}
          </span>
          {onClearAll && (
            <Button
              variant="link"
              size="sm"
              onClick={onClearAll}
              className="h-auto p-0 text-xs"
            >
              Clear
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
