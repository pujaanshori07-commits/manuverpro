/**
 * Crash Reporting for Manuver
 * Wraps Sentry to capture exceptions and breadcrumbs in production.
 */
import * as Sentry from '@sentry/react-native';

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN || 'https://20637363d045ba6a1256b6b100515d8f@o4512040256405504.ingest.us.sentry.io/4512040327577600';

export const initCrashReporting = () => {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: __DEV__ ? 'development' : 'production',
    tracesSampleRate: 1.0,
    attachStacktrace: true,
    maxBreadcrumbs: 50,
    enabled: true,
  });

  if (__DEV__) {
    console.log('[CrashReporting] Sentry initialized.');
  }
};

export const captureException = (error: any, context?: Record<string, any>) => {
  if (__DEV__) {
    console.error('[CrashReporting] Captured Exception:', error, context || '');
  }
  Sentry.captureException(error, { extra: context });
};

export const addBreadcrumb = (message: string, category: string = 'ui') => {
  if (__DEV__) {
    console.log(`[Breadcrumb] [${category}] ${message}`);
  }
  Sentry.addBreadcrumb({ message, category, level: 'info' });
};
