/**
 * Push Notification Helper for Manuver
 * Uses Expo Push Notification Service for free push relay.
 * Safely guards against Expo Go limitations on Android SDK 53+.
 */
import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { supabase } from './supabase';

export async function registerForPushNotifications(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return null;
    }

    const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
    if (isExpoGo) {
      console.log('[PushNotif] Push notifications are disabled in Expo Go on Android. Use a Development Build (EAS Build) for testing remote push.');
      return null;
    }

    const Device = await import('expo-device');
    if (!Device.isDevice) {
      console.log('[PushNotif] Requires physical device for push tokens.');
      return null;
    }

    const Notifications = await import('expo-notifications');

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('[PushNotif] Push notification permission denied');
      return null;
    }

    const token = (await Notifications.getExpoPushTokenAsync()).data;

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF572F',
      });
    }

    return token;
  } catch (error) {
    console.log('[PushNotif] Development notice:', error);
    return null;
  }
}

export async function savePushToken(userId: string, token: string) {
  try {
    await supabase
      .from('profiles')
      .update({ push_token: token })
      .eq('id', userId);
  } catch (e) {
    console.error('[PushNotif] Failed saving push token:', e);
  }
}
