export function isNativeApp(): boolean {
  return !!(window as any).Capacitor?.isNativePlatform();
}

export function isWeb(): boolean {
  return !isNativeApp();
}
