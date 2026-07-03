export function openAppSettingsHint(): string {
  return 'Open Android Settings > Apps > VEGU > Permissions and enable required access.';
}

export function permissionDeniedMessage(permission: 'location' | 'camera' | 'notifications'): string {
  if (permission === 'location') {
    return 'Location access is required for delivery address accuracy and rider tracking.';
  }
  if (permission === 'camera') {
    return 'Camera access is required to capture delivery proof photos.';
  }
  return 'Notification access is required to receive order and delivery updates.';
}
