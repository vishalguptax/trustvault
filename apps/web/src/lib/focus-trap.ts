import type { KeyboardEvent } from 'react';

/**
 * Traps focus within a dialog container on Tab/Shift+Tab keydown.
 * Attach as an onKeyDown handler to the dialog content container.
 */
export function trapFocus(event: KeyboardEvent<HTMLElement>): void {
  if (event.key !== 'Tab') return;

  const container = event.currentTarget;
  const focusableElements = container.querySelectorAll<HTMLElement>(
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );

  if (focusableElements.length === 0) return;

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  if (event.shiftKey) {
    if (document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    }
  } else {
    if (document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }
}
