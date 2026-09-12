import { Ionicons } from '@expo/vector-icons';

export interface Option {
  value: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

export const FREQUENCY_OPTIONS: readonly Option[] = [
  { value: '1x_week', label: '1x a week', icon: 'calendar-outline' },
  { value: '2-3x_week', label: '2-3x a week', icon: 'calendar' },
  { value: '4-5x_week', label: '4-5x a week', icon: 'flame-outline' },
  { value: 'daily', label: 'Daily', icon: 'flame' },
] as const;

export const PREFERRED_TIME_OPTIONS: readonly Option[] = [
  { value: 'early_morning', label: 'Early Morning', icon: 'partly-sunny-outline' },
  { value: 'morning', label: 'Morning', icon: 'sunny-outline' },
  { value: 'afternoon', label: 'Afternoon', icon: 'sunny' },
  { value: 'evening', label: 'Evening', icon: 'moon-outline' },
  { value: 'night', label: 'Night', icon: 'moon' },
  { value: 'flexible', label: 'Flexible', icon: 'time-outline' },
] as const;

export const SPORT_ROLE_OPTIONS: readonly Option[] = [
  { value: 'player', label: 'Player', icon: 'body-outline' },
  { value: 'beginner_learning', label: 'Learning', icon: 'school-outline' },
  { value: 'experienced_mentor', label: 'Can Mentor', icon: 'ribbon-outline' },
  { value: 'coach', label: 'Coach/Trainer', icon: 'megaphone-outline' },
] as const;
