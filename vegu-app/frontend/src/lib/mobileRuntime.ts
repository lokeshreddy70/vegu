import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource, PermissionStatus as CameraPermissionStatus } from '@capacitor/camera';
import { Geolocation, PermissionStatus as LocationPermissionStatus } from '@capacitor/geolocation';
import { PushNotifications, PermissionStatus as PushPermissionStatus } from '@capacitor/push-notifications';

export const isNativeMobile = () => Capacitor.isNativePlatform();

export async function requestLocationPermission(): Promise<LocationPermissionStatus | null> {
  if (!isNativeMobile()) return null;
  return Geolocation.requestPermissions();
}

export async function requestPushPermission(): Promise<PushPermissionStatus | null> {
  if (!isNativeMobile()) return null;
  return PushNotifications.requestPermissions();
}

export async function requestCameraPermission(): Promise<CameraPermissionStatus | null> {
  if (!isNativeMobile()) return null;
  return Camera.requestPermissions({ permissions: ['camera', 'photos'] });
}

export async function captureDeliveryPhoto(): Promise<string | null> {
  if (!isNativeMobile()) return null;
  const photo = await Camera.getPhoto({
    quality: 75,
    resultType: CameraResultType.DataUrl,
    source: CameraSource.Camera,
    saveToGallery: false,
    correctOrientation: true,
  });
  return photo.dataUrl || null;
}
