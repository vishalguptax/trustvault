/**
 * Safe haptics wrapper — expo-haptics crashes with TurboModule errors
 * on some Expo Go versions. This catches and silently ignores failures.
 */

let Haptics: typeof import('expo-haptics') | null = null;

try {
  Haptics = require('expo-haptics');
} catch {
  // expo-haptics not available
}

export async function impactMedium(): Promise<void> {
  try {
    await Haptics?.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch { /* ignore */ }
}

export async function notifySuccess(): Promise<void> {
  try {
    await Haptics?.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch { /* ignore */ }
}

export async function notifyError(): Promise<void> {
  try {
    await Haptics?.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch { /* ignore */ }
}

export async function notifyWarning(): Promise<void> {
  try {
    await Haptics?.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } catch { /* ignore */ }
}
