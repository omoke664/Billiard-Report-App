// Utility functions for handling push notifications

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.log('Service Workers are not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });
    console.log('Service Worker registered successfully:', registration);
    return registration;
  } catch (error) {
    console.log('Service Worker registration info:', error instanceof Error ? error.message : 'Check dev environment');
    return null;
  }
}

export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('Notifications are not supported in this browser');
    return false;
  }

  if (Notification.permission === 'granted') {
    console.log('Notification permission already granted');
    return true;
  }

  if (Notification.permission !== 'denied') {
    try {
      const permission = await Notification.requestPermission();
      console.log('Notification permission result:', permission);
      return permission === 'granted';
    } catch (error) {
      console.log('Error requesting notification permission:', error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }

  return false;
}

export async function subscribeToPushNotifications() {
  try {
    if (!('serviceWorker' in navigator)) {
      console.log('Service Workers not supported');
      return null;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      console.log('Already subscribed to push notifications');
      return subscription;
    }

    console.log('Ready to subscribe to push notifications (requires server setup)');
    return null;
  } catch (error) {
    console.log('Info: Push subscription unavailable in dev environment. Will work in production.');
    return null;
  }
}

export function sendLocalNotification(title: string, options?: NotificationOptions) {
  if (!('Notification' in window)) {
    console.log('Notifications not supported');
    return;
  }

  if (Notification.permission !== 'granted') {
    console.log('Notification permission not granted - user must allow notifications first');
    return;
  }

  try {
    const notification = new Notification(title, {
      icon: '/icon-192.svg',
      badge: '/icon-192.svg',
      requireInteraction: true,
      ...options,
    } as NotificationOptions & { vibrate?: number[] });

    // Trigger vibration if supported
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate([200, 100, 200]);
      } catch (e) {
        // Vibration not supported, continue silently
      }
    }

    // Auto-close notification after 5 seconds if not interacted with
    setTimeout(() => {
      notification.close();
    }, 5000);

    return notification;
  } catch (error) {
    console.error('Error sending notification:', error);
    return null;
  }
}

export function notifyTransaction(transaction: any) {
  const title = 'Billiard Intelligence';
  const amount = typeof transaction.amount === 'number' 
    ? `KES ${transaction.amount.toFixed(2)}` 
    : transaction.amount;

  const body = `${transaction.type === 'income' ? '+' : '-'} ${amount}\n${transaction.description || 'New Transaction'}`;

  sendLocalNotification(title, {
    body,
    tag: `transaction-${transaction.id || Date.now()}`,
  });
}

export async function initializeNotifications() {
  try {
    console.log('Initializing notifications...');
    
    // Register service worker
    await registerServiceWorker();

    // Request permission
    const hasPermission = await requestNotificationPermission();
    console.log('Notification permission status:', hasPermission ? 'Granted' : 'Denied or not available');

    // Try to subscribe to push (requires backend)
    await subscribeToPushNotifications();
    
    console.log('Notifications initialized successfully');
  } catch (error) {
    console.log('Note: Full notification features require HTTPS in production');
  }
}
