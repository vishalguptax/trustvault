'use client';

import { X } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';

interface BulkAction {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'destructive' | 'outline';
  disabled?: boolean;
}

interface BulkActionBarProps {
  selectedCount: number;
  actions: BulkAction[];
  onClear: () => void;
}

export function BulkActionBar({ selectedCount, actions, onClear }: BulkActionBarProps) {
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          className="flex items-center gap-3 px-6 py-2.5 bg-primary/10 border-b border-primary/20"
        >
          <span className="text-xs font-medium text-primary">{selectedCount} selected</span>
          <div className="flex items-center gap-1.5">
            {actions.map((action) => (
              <Button
                key={action.label}
                variant={action.variant === 'destructive' ? 'destructive' : 'outline'}
                size="sm"
                className="h-7 text-xs px-2.5"
                onClick={action.onClick}
                disabled={action.disabled}
              >
                {action.label}
              </Button>
            ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 ml-auto text-muted-foreground hover:text-foreground"
            onClick={onClear}
            aria-label="Clear selection"
          >
            <X size={14} />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
