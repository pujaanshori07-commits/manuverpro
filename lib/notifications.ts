import * as Notifications from 'expo-notifications';
import { Platform, Alert } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async (): Promise<any> => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermissions() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  return finalStatus === 'granted';
}

export async function scheduleMatchReminder(
  title: string,
  body: string,
  matchDate: Date
) {
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
