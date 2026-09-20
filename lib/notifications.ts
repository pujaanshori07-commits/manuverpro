import { Platform, Alert } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

let Notifications: any = null;
try {
  const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
  if (!isExpoGo) {
    Notifications = require('expo-notifications');
    Notifications.setNotificationHandler({
      handleNotification: async (): Promise<any> => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
  }
} catch (e) {
  console.warn('expo-notifications is not available in this environment', e);
}

export async function requestNotificationPermissions() {
  if (!Notifications) return false;
  
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    return finalStatus === 'granted';
  } catch (e) {
    return false;
  }
}

export async function scheduleMatchReminder(
  title: string,
  body: string,
  matchDate: Date
) {
  if (!Notifications) {
    console.warn('Push notifications are disabled in Expo Go.');
    return false;
  }

  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) {
    Alert.alert(
      'Izin Ditolak',
      'Aktifkan notifikasi di pengaturan HP Anda agar kami bisa mengingatkan jadwal sparing.'
    );
    return false;
  }

  // Set reminder for 2 hours before the match
  const reminderTime = new Date(matchDate.getTime() - 2 * 60 * 60 * 1000);
  
  // Only schedule if the reminder time is in the future
  if (reminderTime > new Date()) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: false,
        },
        trigger: reminderTime as any,
      });
      return true;
    } catch (error) {
      console.error('Error scheduling notification', error);
      return false;
    }
  }
  
  return false;
}
