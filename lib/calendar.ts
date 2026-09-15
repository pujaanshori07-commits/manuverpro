import * as Calendar from 'expo-calendar';
import { Platform, Alert } from 'react-native';

async function getDefaultCalendarId() {
  try {
    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    if (Platform.OS === 'ios') {
      const defaultCalendar = calendars.find(
        (cal) => cal.isPrimary || cal.title === 'Calendar' || cal.source.name === 'Default'
      );
      return defaultCalendar ? defaultCalendar.id : calendars[0].id;
    } else {
      const primaryCalendar = calendars.find(
        (cal) => cal.isPrimary && cal.accessLevel === Calendar.CalendarAccessLevel.OWNER
      );
      if (primaryCalendar) {
        return primaryCalendar.id;
      }
      return calendars.length > 0 ? calendars[0].id : null;
    }
  } catch (error) {
    console.error('Error getting calendars', error);
    return null;
  }
}

export async function addMatchToCalendar({
  title,
  startDate,
  endDate,
  location,
  notes,
}: {
  title: string;
  startDate: Date;
  endDate: Date;
  location: string;
  notes?: string;
}) {
  try {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        'Izin Ditolak',
        'Kami membutuhkan akses ke Kalender untuk menyimpan jadwal sparing Anda.'
      );
      return false;
    }

    const calendarId = await getDefaultCalendarId();

    if (!calendarId) {
      Alert.alert('Gagal', 'Tidak ada kalender default yang ditemukan di perangkat ini.');
      return false;
    }

    const eventId = await Calendar.createEventAsync(calendarId, {
      title,
      startDate,
      endDate,
      location,
      notes,
      timeZone: 'Asia/Jakarta',
      alarms: [
        {
          relativeOffset: -120, // 2 hours before
          method: Calendar.AlarmMethod.ALERT,
        }
      ]
    });

    return !!eventId;
  } catch (error: any) {
    console.error('Add to calendar error:', error);
    Alert.alert('Gagal', 'Terjadi kesalahan saat menyimpan jadwal: ' + error.message);
    return false;
  }
}
