/**
 * Analytics Event Tracker for Manuver
 * Sends events to Firebase Analytics when supported, with safe fallback.
 */

export type AnalyticsEventName =
  | 'login'
  | 'onboarding_complete'
  | 'swipe'
  | 'match'
  | 'message_sent'
  | 'profile_updated';

let firebaseLogEvent: ((analyticsInstance: any, eventName: string, eventParams?: any) => void) | null = null;
let analyticsInstance: any = null;

try {
  // Safe resolution for Firebase JS SDK in Metro bundler
  const { initializeApp } = require('firebase/app');
  const { getAnalytics, logEvent: logEventSdk, isSupported } = require('firebase/analytics');

  const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'AIzaSyDUr9HZ5qOh4_R5x8HcEFVT4dYEW4_Mc_U',
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'manuver-18da2.firebaseapp.com',
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'manuver-18da2',
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'manuver-18da2.firebasestorage.app',
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_SENDER_ID || '422720911032',
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:422720911032:web:dcc56d240efd3130f6264d',
    measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-RY03PKLRHY',
  };

  const app = initializeApp(firebaseConfig);
  firebaseLogEvent = logEventSdk;

  if (typeof isSupported === 'function') {
    isSupported().then((supported: boolean) => {
      if (supported) {
        analyticsInstance = getAnalytics(app);
      }
    }).catch(() => {});
  }
} catch (e) {
  if (__DEV__) {
    console.log('[Analytics] Firebase JS SDK not resolved by Metro, logging locally.');
  }
}

export const logEvent = (eventName: AnalyticsEventName, params?: Record<string, any>) => {
  if (__DEV__) {
    console.log(`[Analytics] Event logged: "${eventName}"`, params || '');
  }

  // 1. Send via Firebase Web SDK if supported
  if (analyticsInstance && firebaseLogEvent) {
    try {
      firebaseLogEvent(analyticsInstance, eventName, params);
    } catch (e) {
      if (__DEV__) console.log('[Analytics] Firebase logEvent skipped:', e);
    }
  }

  // 2. HTTP Fallback Ping for React Native / Expo Go runtime to ensure GA4/Firebase receives events
  const measurementId = process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-RY03PKLRHY';
  if (measurementId) {
    try {
      const clientId = 'user_device_' + Math.random().toString(36).substring(2, 9);
      const endpoint = `https://www.google-analytics.com/g/collect?v=2&tid=${measurementId}&cid=${clientId}&en=${eventName}`;
      fetch(endpoint, { method: 'POST' }).catch(() => {});
    } catch (err) {
      // Silent catch
    }
  }
};
