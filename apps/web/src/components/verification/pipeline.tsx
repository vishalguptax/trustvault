'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Key, Clock, ShieldCheck, Handshake, Shield, CheckCircle, XCircle } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface PipelineCheck {
  name: string;
  label: string;
  passed: boolean;
}

interface VerificationPipelineProps {
  checks: PipelineCheck[];
  className?: string;
}

const checkIcons: Record<string, React.ReactNode> = {
  signature: <Key size={20} weight="fill" />,
  expiration: <Clock size={20} weight="fill" />,
  status: <ShieldCheck size={20} weight="fill" />,
  trust: <Handshake size={20} weight="fill" />,
  policy: <Shield size={20} weight="fill" />,
};

export function VerificationPipeline({ checks, className }: VerificationPipelineProps) {
  const [activeIndex, setActiveIndex] = useState(-1);

  const isComplete = activeIndex >= checks.length - 1;
  const passedCount = isComplete
    ? checks.filter((c) => c.passed).length
    : 0;

  useEffect(() => {
    if (checks.length === 0) return;

    const timers: ReturnType<typeof setTimeout>[] = [];
    checks.forEach((_, i) => {
      const timer = setTimeout(() => {
        setActiveIndex(i);
      }, (i + 1) * 300);
      timers.push(timer);
    });

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [checks]);

  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      <div className="flex items-center justify-center gap-0">
        {checks.map((check, index) => {
          const isRevealed = index <= activeIndex;
          const isCurrentlyAnimating = index === activeIndex;
          const icon = checkIcons[check.name] ?? checkIcons.policy;

          return (
            <div key={check.name} className="flex items-center">
              {/* Node */}
              <motion.div
                className="flex flex-col items-center gap-2"
                initial={{ opacity: 0.4 }}
                animate={{ opacity: isRevealed ? 1 : 0.4 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div
                  className={cn(
                    'w-14 h-14 rounded-xl flex items-center justify-center border-2 relative transition-colors duration-300',
                    !isRevealed && 'bg-muted/30 border-muted text-muted-foreground',
                    isRevealed && check.passed && 'bg-success/10 border-success text-success',
                    isRevealed && !check.passed && 'bg-destructive/10 border-destructive text-destructive'
                  )}
                  initial={{ scale: 0.8 }}
                  animate={{
                    scale: isRevealed ? 1 : 0.8,
                    boxShadow: isCurrentlyAnimating && !isComplete
                      ? check.passed
                        ? '0 0 16px 4px rgba(16, 185, 129, 0.35)'
                        : '0 0 16px 4px rgba(239, 68, 68, 0.35)'
                      : '0 0 0 0 transparent',
                  }}
                  transition={{ duration: 0.3, type: 'spring', stiffness: 300 }}
                >
                  {icon}

                  {/* Result indicator */}
                  <AnimatePresence>
                    {isRevealed && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.1, type: 'spring', stiffness: 400 }}
                        className={cn(
                          'absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center',
                          check.passed ? 'bg-success text-white' : 'bg-destructive text-white'
                        )}
                      >
                        {check.passed ? <CheckCircle size={14} weight="fill" /> : <XCircle size={14} weight="fill" />}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                <span className={cn(
                  'text-xs font-medium text-center whitespace-nowrap',
                  !isRevealed && 'text-muted-foreground',
                  isRevealed && check.passed && 'text-success',
                  isRevealed && !check.passed && 'text-destructive'
                )}>
                  {check.label}
                </span>
              </motion.div>

              {/* Connector line */}
              {index < checks.length - 1 && (
                <div className="w-8 mx-1 flex items-center -mt-6">
                  <motion.div
                    className={cn(
                      'h-0.5 w-full rounded transition-colors duration-300',
                      index < activeIndex
                        ? checks[index].passed
                          ? 'bg-success'
                          : 'bg-destructive'
                        : 'bg-muted'
                    )}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: index < activeIndex ? 1 : 0.3 }}
                    transition={{ duration: 0.3, delay: index < activeIndex ? 0 : 0 }}
                    style={{ transformOrigin: 'left' }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Completion summary */}
      <AnimatePresence>
        {isComplete && (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className={cn(
              'text-sm font-medium',
              passedCount === checks.length ? 'text-success' : 'text-destructive'
            )}
            role="status"
            aria-live="polite"
          >
            {passedCount}/{checks.length} checks passed
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
