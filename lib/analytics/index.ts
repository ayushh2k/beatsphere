/**
 * Analytics library barrel export.
 *
 * @example
 * ```typescript
 * import analytics from '@/lib/analytics';
 *
 * await analytics.initialize();
 * analytics.track('button_clicked', { button_name: 'submit' });
 * ```
 */

export { default } from './service';
export * from './types';
