import { useState, useCallback, useEffect } from 'react';
import { AppState, AppStateStatus, Linking, Platform } from 'react-native';
import * as Location from 'expo-location';

export type PermissionState = 
  | 'NOT_DETERMINED' 
  | 'GRANTED' 
  | 'DENIED' 
  | 'BLOCKED' 
  | 'SERVICES_DISABLED' 
  | 'ERROR';

export function useLocationManager() {
  const [permissionState, setPermissionState] = useState<PermissionState>('NOT_DETERMINED');
  const [loading, setLoading] = useState<boolean>(true);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);

  const checkPermissions = useCallback(async () => {
    try {
      setLoading(true);
      
      // First check if device location services are even enabled
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        setPermissionState('SERVICES_DISABLED');
        setLoading(false);
        return 'SERVICES_DISABLED';
      }

      const { status, canAskAgain } = await Location.getForegroundPermissionsAsync();
      
      let newState: PermissionState;
      if (status === 'granted') {
        newState = 'GRANTED';
      } else if (status === 'undetermined') {
        newState = 'NOT_DETERMINED';
      } else if (status === 'denied') {
        if (!canAskAgain) {
          newState = 'BLOCKED';
        } else {
          newState = 'DENIED';
        }
      } else {
        newState = 'ERROR';
      }
      
      setPermissionState(newState);
      setLoading(false);
      return newState;
    } catch (e) {
      console.error('Error checking location permissions:', e);
      setPermissionState('ERROR');
      setLoading(false);
      return 'ERROR';
    }
  }, []);

  const requestPermissions = useCallback(async () => {
    try {
      setLoading(true);
      
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        setPermissionState('SERVICES_DISABLED');
        setLoading(false);
        return 'SERVICES_DISABLED';
      }

      const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
      
      let newState: PermissionState;
      if (status === 'granted') {
        newState = 'GRANTED';
      } else if (status === 'denied') {
        if (!canAskAgain) {
          newState = 'BLOCKED';
        } else {
          newState = 'DENIED';
        }
      } else {
        newState = 'ERROR';
      }
      
      setPermissionState(newState);
      setLoading(false);
      return newState;
    } catch (e) {
      console.error('Error requesting location permissions:', e);
      setPermissionState('ERROR');
      setLoading(false);
      return 'ERROR';
    }
  }, []);

  const openSettings = useCallback(() => {
    if (Platform.OS === 'ios') {
      Linking.openSettings();
    } else {
      Linking.sendIntent('android.settings.LOCATION_SOURCE_SETTINGS');
    }
  }, []);

  const getCurrentLocation = useCallback(async () => {
    try {
      const currentState = await checkPermissions();
      if (currentState !== 'GRANTED') {
        return null;
      }

      // Use Balanced accuracy to get location quickly without draining battery
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation(loc);
      return loc;
    } catch (e) {
      console.warn('Warning: Could not get current location (is GPS enabled?).', e);
      return null;
    }
  }, [checkPermissions]);

  // Re-check permissions when app comes to foreground (e.g. returning from settings)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        checkPermissions();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [checkPermissions]);

  // Initial check on mount
  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  return {
    permissionState,
    loading,
    location,
    checkPermissions,
    requestPermissions,
    openSettings,
    getCurrentLocation,
  };
}
