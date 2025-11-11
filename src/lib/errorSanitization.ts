/**
 * Security utility for sanitizing error messages before displaying to users.
 * 
 * This prevents information leakage by mapping internal error messages to
 * safe, user-friendly messages while logging full details server-side.
 * 
 * @module errorSanitization
 */

export interface SanitizedError {
  /** Safe message to display to user */
  message: string;
  /** Original error message for server-side logging */
  originalMessage?: string;
  /** Error code if applicable */
  code?: string;
}

/**
 * Known error patterns and their safe user-facing messages
 */
const ERROR_PATTERNS: Record<string, string> = {
  // Authentication errors
  'Invalid login': 'Invalid email or password',
  'invalid_credentials': 'Invalid email or password',
  'Email not confirmed': 'Please verify your email address before signing in',
  'Email rate limit': 'Too many attempts. Please try again later',
  'User already registered': 'This email is already registered',
  'already registered': 'This email is already registered',
  
  // Database constraint errors
  '23505': 'A record with this information already exists',
  '23503': 'Cannot complete this action due to related records',
  '23502': 'Required information is missing',
  'duplicate key': 'This information is already in use',
  'violates foreign key': 'Cannot complete this action due to related records',
  'violates unique constraint': 'This information is already in use',
  'violates check constraint': 'Invalid data provided',
  
  // Permission errors
  'permission denied': 'You do not have permission to perform this action',
  'insufficient permissions': 'You do not have permission to perform this action',
  'row-level security': 'You do not have access to this resource',
  
  // Network/API errors
  'Failed to fetch': 'Unable to connect. Please check your internet connection',
  'Network request failed': 'Unable to connect. Please check your internet connection',
  'timeout': 'The request took too long. Please try again',
  
  // Rate limiting
  'rate limit': 'Too many requests. Please slow down and try again',
  'too many requests': 'Too many requests. Please slow down and try again',
  
  // Stripe/Payment errors
  'card_declined': 'Your card was declined. Please try a different payment method',
  'insufficient_funds': 'Insufficient funds. Please try a different payment method',
  'payment_intent': 'Payment processing error. Please try again',
  
  // Validation errors
  'invalid email': 'Please provide a valid email address',
  'invalid phone': 'Please provide a valid phone number',
  'password too weak': 'Password must be stronger',
};

/**
 * Sanitizes an error for safe display to users.
 * 
 * Maps known error patterns to user-friendly messages while preserving
 * the original error for server-side logging.
 * 
 * @param error - The error to sanitize (Error object, string, or unknown)
 * @returns A sanitized error object with safe message
 * 
 * @example
 * ```typescript
 * try {
 *   await supabase.from('users').insert(data);
 * } catch (error) {
 *   const safe = getSafeError(error);
 *   toast.error(safe.message); // Show to user
 *   console.error('[ERROR]', safe.originalMessage); // Log for debugging
 * }
 * ```
 */
export function getSafeError(error: unknown): SanitizedError {
  // Extract error message
  const originalMessage = error instanceof Error 
    ? error.message 
    : typeof error === 'string' 
    ? error 
    : 'An unknown error occurred';
  
  // Check for known error patterns
  for (const [pattern, safeMessage] of Object.entries(ERROR_PATTERNS)) {
    if (originalMessage.toLowerCase().includes(pattern.toLowerCase())) {
      // Log the original error server-side for debugging
      console.error('[SECURITY] Sanitized error:', {
        pattern,
        original: originalMessage,
        timestamp: new Date().toISOString(),
      });
      
      return {
        message: safeMessage,
        originalMessage,
        code: pattern,
      };
    }
  }
  
  // For unmapped errors, log and return generic message
  console.error('[SECURITY] Unmapped error detected:', {
    originalMessage,
    timestamp: new Date().toISOString(),
    stack: error instanceof Error ? error.stack : undefined,
  });
  
  return {
    message: 'An unexpected error occurred. Please try again or contact support if the problem persists.',
    originalMessage,
  };
}

/**
 * Extracts a safe error message string from any error type.
 * Convenience wrapper around getSafeError() that returns just the message.
 * 
 * @param error - The error to sanitize
 * @returns A safe error message string
 * 
 * @example
 * ```typescript
 * toast.error(getSafeErrorMessage(error));
 * ```
 */
export function getSafeErrorMessage(error: unknown): string {
  return getSafeError(error).message;
}

/**
 * Checks if an error message contains a specific pattern.
 * Useful for conditional error handling.
 * 
 * @param error - The error to check
 * @param pattern - The pattern to look for
 * @returns True if the error contains the pattern
 * 
 * @example
 * ```typescript
 * if (isErrorPattern(error, 'already registered')) {
 *   // Handle duplicate registration
 * }
 * ```
 */
export function isErrorPattern(error: unknown, pattern: string): boolean {
  const originalMessage = error instanceof Error 
    ? error.message 
    : typeof error === 'string' 
    ? error 
    : '';
  
  return originalMessage.toLowerCase().includes(pattern.toLowerCase());
}
