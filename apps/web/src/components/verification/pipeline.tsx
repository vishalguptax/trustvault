'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  signature: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
      <path d="M232,168H63.86c2.66-5.24,5.33-10.63,8-16.11,14.94,1.65,32.62-1.34,52.7-8.94,28.08-10.63,36.36-30.06,24.6-57.78C137.43,58.5,112.33,36.94,88,40.64c-17.5,2.66-29.71,17.29-36.29,43.46C37.7,134.49,23.27,168.05,23.27,168a8,8,0,0,0,7.32,11.26L232,179.31A8,8,0,0,0,232,168Z" />
    </svg>
  ),
  expiration: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
      <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm64-88a8,8,0,0,1-8,8H128a8,8,0,0,1-8-8V72a8,8,0,0,1,16,0v48h48A8,8,0,0,1,192,128Z" />
    </svg>
  ),
  status: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
      <path d="M208,40H48A16,16,0,0,0,32,56v58.77c0,89.62,75.82,119.34,91,124.38a15.44,15.44,0,0,0,10,0c15.2-5.05,91-34.77,91-124.39V56A16,16,0,0,0,208,40Zm-34.34,69.66-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35a8,8,0,0,1,11.32,11.32Z" />
    </svg>
  ),
  trust: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
      <path d="M244.8,150.4a8,8,0,0,1-11.2-1.6A51.6,51.6,0,0,0,192,128a8,8,0,0,1,0-16,24,24,0,1,0-23.6-28.5,8,8,0,1,1-15.7-3A40,40,0,1,1,212,128a67.88,67.88,0,0,1,34.4,21.6A8,8,0,0,1,244.8,150.4ZM190.92,212a8,8,0,1,1-13.84,8,57,57,0,0,0-98.16,0,8,8,0,1,1-13.84-8,72.06,72.06,0,0,1,33.74-29.92,48,48,0,1,1,58.36,0A72.06,72.06,0,0,1,190.92,212ZM128,176a32,32,0,1,0-32-32A32,32,0,0,0,128,176Z" />
    </svg>
  ),
  policy: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
      <path d="M176,128a8,8,0,0,1-8,8H88a8,8,0,0,1,0-16h80A8,8,0,0,1,176,128Zm-8,24H88a8,8,0,0,0,0,16h80a8,8,0,0,0,0-16ZM216,40V216a16,16,0,0,1-16,16H56a16,16,0,0,1-16-16V40A16,16,0,0,1,56,24h48a8,8,0,0,1,0,16H56V216H200V40H152a8,8,0,0,1,0-16h48A16,16,0,0,1,216,40Z" />
    </svg>
  ),
};

function CheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 256 256">
      <path d="M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34Z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 256 256">
      <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z" />
    </svg>
  );
}

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
                        {check.passed ? <CheckIcon /> : <XIcon />}
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
