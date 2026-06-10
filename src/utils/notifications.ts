import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Reminder } from '../types';
import { t } from '../localization/i18n';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request permission for local notifications
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      return false;
    }
    
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('reminders', {
        name: 'Reminders',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
    
    return true;
  } catch (error) {
    console.error('Failed to get notification permissions', error);
    return false;
  }
}

/**
 * Schedule a date-based reminder notification.
 * Fires at 09:00 AM on the target date.
 */
export async function scheduleReminderNotification(reminder: Reminder, vehicleName: string): Promise<string | undefined> {
  if (reminder.type !== 'date' || !reminder.targetDate) return undefined;
  
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return undefined;
  
  // Parse target date YYYY-MM-DD
  const [year, month, day] = reminder.targetDate.split('-').map(Number);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return undefined;
  
  // Set trigger time to 09:00:00 on that date
  const triggerDate = new Date(year, month - 1, day, 9, 0, 0);
  
  if (triggerDate.getTime() <= Date.now()) {
    // If the target date is today or in the past, don't schedule a future notification
    return undefined;
  }
  
  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `${vehicleName} - ${t('warning')}`,
        body: reminder.title,
        sound: true,
        data: { reminderId: reminder.id, vehicleId: reminder.vehicleId },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerDate },
    });
    return id;
  } catch (error) {
    console.error('Failed to schedule notification', error);
    return undefined;
  }
}

/**
 * Cancel a scheduled reminder notification
 */
export async function cancelReminderNotification(notificationId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.error('Failed to cancel notification', error);
  }
}

/**
 * Immediately trigger a notification for odometer target achieved.
 */
export async function triggerOdometerNotification(reminder: Reminder, vehicleName: string): Promise<void> {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;
  
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${vehicleName} - ${t('warning')}`,
        body: `${reminder.title} (${reminder.targetOdometer?.toLocaleString()} KM)`,
        sound: true,
        data: { reminderId: reminder.id, vehicleId: reminder.vehicleId },
      },
      trigger: null, // trigger immediately
    });
  } catch (error) {
    console.error('Failed to trigger odometer notification', error);
  }
}
