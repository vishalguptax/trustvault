/**
 * Safe haptics wrapper. All calls are fire-and-forget.
 * If expo-haptics is unavailable or crashes, calls silently do nothing.
 */

async function getHaptics() {
  try {
    return await import('expo-haptics');
  } catch {
    return null;
  }
}

export async function impactMedium(): Promise<void> {
  try {
    const h = await getHaptics();
    await h?.impactAsync(h.ImpactFeedbackStyle.Medium);
  } catch { /* ignore */ }
}

export async function notifySuccess(): Promise<void> {
  try {
    const h = await getHaptics();
    await h?.notificationAsync(h.NotificationFeedbackType.Success);
  } catch { /* ignore */ }
}

export async function notifyError(): Promise<void> {
  try {
    const h = await getHaptics();
    await h?.notificationAsync(h.NotificationFeedbackType.Error);
  } catch { /* ignore */ }
}

export async function notifyWarning(): Promise<void> {
  try {
    const h = await getHaptics();
    await h?.notificationAsync(h.NotificationFeedbackType.Warning);
  } catch { /* ignore */ }
}
