/**
 * ARQ Feature Flags Utility
 * 
 * Centralized control for rolling out major capabilities.
 * In a V1, this relies on environment variables. 
 * In future iterations, this could connect to a service like LaunchDarkly or PostHog.
 */

export const FLAGS = {
  ADAPTIVE_JOURNEY: process.env.NEXT_PUBLIC_FF_ADAPTIVE_JOURNEY === 'true',
  STUDENT_AI: process.env.NEXT_PUBLIC_FF_STUDENT_AI === 'true',
  NEW_LESSON_UI: process.env.NEXT_PUBLIC_FF_NEW_LESSON_UI === 'true',
  NEW_ANALYTICS: process.env.NEXT_PUBLIC_FF_NEW_ANALYTICS === 'true',
  FACILITATOR_COPILOT: process.env.NEXT_PUBLIC_FF_FACILITATOR_COPILOT !== 'false', // Default true for M7 testing
};

/**
 * Helper to check if a feature is enabled.
 * Can be used in both Server Components and Client Components (if NEXT_PUBLIC_ is used).
 */
export function isFeatureEnabled(flagName: keyof typeof FLAGS): boolean {
  return FLAGS[flagName] ?? false;
}
