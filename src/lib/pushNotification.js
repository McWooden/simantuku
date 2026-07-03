import OneSignal from 'react-onesignal';

export async function initOneSignal(employeeId) {
  if (typeof window === 'undefined') return;
  
  try {
    await OneSignal.init({
      appId: "453e6b01-0e27-487c-8d3e-06bbda224c7f",
      allowLocalhostAsSecureOrigin: true,
      serviceWorkerParam: { scope: "/" },
      serviceWorkerPath: "OneSignalSDKWorker.js"
    });

    if (employeeId) {
      await OneSignal.login(employeeId);
    }
  } catch (err) {
    console.error("OneSignal initialization failed:", err);
  }
}

export async function setPushEnabledState(enabled) {
  if (typeof window === 'undefined') return;
  
  try {
    if (enabled) {
      await OneSignal.Notifications?.requestPermission();
      await OneSignal.User?.pushSubscription?.optIn();
    } else {
      await OneSignal.User?.pushSubscription?.optOut();
    }
  } catch (err) {
    console.error("Failed to set push enabled state:", err);
  }
}

export async function getPushSubscriptionState() {
  if (typeof window === 'undefined') return false;
  
  try {
    const isOptedIn = OneSignal.User?.pushSubscription?.optedIn || false;
    const permission = OneSignal.Notifications?.permission || false;
    return permission && isOptedIn;
  } catch (err) {
    console.error("Failed to get push state:", err);
    return false;
  }
}
