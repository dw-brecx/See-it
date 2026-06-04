import * as Haptics from 'expo-haptics';

/**
 * Thin wrappers so screens don't have to remember which feedback type is
 * appropriate. Calls are safe no-ops on web.
 */
export const tapLight = () => {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
};
export const tapMedium = () => {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
};
export const tapHeavy = () => {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
};
export const selection = () => {
  void Haptics.selectionAsync().catch(() => {});
};
export const success = () => {
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
};
export const warning = () => {
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
};
export const error = () => {
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
};
