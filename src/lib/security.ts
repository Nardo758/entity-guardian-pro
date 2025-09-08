import DOMPurify from 'dompurify';

/**
 * Security utilities for input validation and sanitization
 */

// Password complexity requirements
export interface PasswordRequirements {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
}

export const DEFAULT_PASSWORD_REQUIREMENTS: PasswordRequirements = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
};

/**
 * Validates password complexity
 */
export const validatePasswordComplexity = (
  password: string,
  requirements: PasswordRequirements = DEFAULT_PASSWORD_REQUIREMENTS
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (password.length < requirements.minLength) {
    errors.push(`Password must be at least ${requirements.minLength} characters long`);
  }

  if (requirements.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (requirements.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (requirements.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (requirements.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Sanitizes HTML input to prevent XSS attacks
 */
export const sanitizeHtml = (input: string): string => {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: [],
  });
};

/**
 * Sanitizes plain text input
 */
export const sanitizeText = (input: string): string => {
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
};

/**
 * Validates email format
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates phone number format (basic validation)
 */
export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
};

/**
 * Rate limiting utility
 */
class RateLimiter {
  private attempts: Map<string, number[]> = new Map();

  isRateLimited(identifier: string, maxAttempts: number, windowMs: number): boolean {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    const userAttempts = this.attempts.get(identifier) || [];
    
    // Filter out attempts outside the window
    const recentAttempts = userAttempts.filter(time => time > windowStart);
    
    // Update the attempts list
    this.attempts.set(identifier, recentAttempts);
    
    return recentAttempts.length >= maxAttempts;
  }

  recordAttempt(identifier: string): void {
    const now = Date.now();
    const userAttempts = this.attempts.get(identifier) || [];
    userAttempts.push(now);
    this.attempts.set(identifier, userAttempts);
  }

  reset(identifier: string): void {
    this.attempts.delete(identifier);
  }
}

export const rateLimiter = new RateLimiter();

/**
 * Security event types for logging
 */
export enum SecurityEventType {
  LOGIN_ATTEMPT = 'login_attempt',
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILURE = 'login_failure',
  PASSWORD_CHANGE = 'password_change',
  PROFILE_UPDATE = 'profile_update',
  ADMIN_ACTION = 'admin_action',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  SESSION_TIMEOUT = 'session_timeout',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
}

/**
 * Logs security events for monitoring
 */
export const logSecurityEvent = async (
  eventType: SecurityEventType,
  metadata: Record<string, any> = {}
) => {
  // This would typically send to your security monitoring service
  console.log('[SECURITY EVENT]', {
    type: eventType,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    ...metadata,
  });
  
  // In a real implementation, you'd send this to your security service
  // await sendToSecurityService({ eventType, metadata });
};

/**
 * Detects potentially suspicious activity patterns
 */
export const detectSuspiciousActivity = (
  events: Array<{ type: string; timestamp: number; metadata?: any }>
): boolean => {
  // Multiple failed login attempts
  const recentFailures = events.filter(
    e => e.type === SecurityEventType.LOGIN_FAILURE && 
    Date.now() - e.timestamp < 5 * 60 * 1000 // 5 minutes
  );
  
  if (recentFailures.length >= 3) {
    return true;
  }

  // Rapid succession of different activities
  const recentActivities = events.filter(
    e => Date.now() - e.timestamp < 60 * 1000 // 1 minute
  );
  
  if (recentActivities.length >= 10) {
    return true;
  }

  return false;
};