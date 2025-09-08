import { useState, useCallback } from 'react';
import { 
  validatePasswordComplexity, 
  sanitizeText, 
  sanitizeHtml,
  validateEmail,
  validatePhoneNumber,
  rateLimiter,
  logSecurityEvent,
  SecurityEventType,
  DEFAULT_PASSWORD_REQUIREMENTS,
  type PasswordRequirements
} from '@/lib/security';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedValue?: string;
}

export const useSecurityValidation = () => {
  const [validationState, setValidationState] = useState<Record<string, ValidationResult>>({});

  const validatePassword = useCallback((
    password: string, 
    requirements: PasswordRequirements = DEFAULT_PASSWORD_REQUIREMENTS
  ): ValidationResult => {
    const result = validatePasswordComplexity(password, requirements);
    
    setValidationState(prev => ({
      ...prev,
      password: result
    }));

    return result;
  }, []);

  const validateAndSanitizeText = useCallback((
    input: string,
    fieldName: string,
    maxLength?: number
  ): ValidationResult => {
    const errors: string[] = [];
    
    if (!input || input.trim().length === 0) {
      errors.push(`${fieldName} is required`);
    }
    
    if (maxLength && input.length > maxLength) {
      errors.push(`${fieldName} must be less than ${maxLength} characters`);
    }

    const sanitizedValue = sanitizeText(input);
    
    const result: ValidationResult = {
      isValid: errors.length === 0,
      errors,
      sanitizedValue
    };

    setValidationState(prev => ({
      ...prev,
      [fieldName]: result
    }));

    return result;
  }, []);

  const validateAndSanitizeHtml = useCallback((
    input: string,
    fieldName: string,
    maxLength?: number
  ): ValidationResult => {
    const errors: string[] = [];
    
    if (maxLength && input.length > maxLength) {
      errors.push(`${fieldName} must be less than ${maxLength} characters`);
    }

    const sanitizedValue = sanitizeHtml(input);
    
    const result: ValidationResult = {
      isValid: errors.length === 0,
      errors,
      sanitizedValue
    };

    setValidationState(prev => ({
      ...prev,
      [fieldName]: result
    }));

    return result;
  }, []);

  const validateEmailField = useCallback((
    email: string,
    fieldName: string = 'email'
  ): ValidationResult => {
    const errors: string[] = [];
    
    if (!email || email.trim().length === 0) {
      errors.push('Email is required');
    } else if (!validateEmail(email)) {
      errors.push('Please enter a valid email address');
    }

    const sanitizedValue = sanitizeText(email);
    
    const result: ValidationResult = {
      isValid: errors.length === 0,
      errors,
      sanitizedValue
    };

    setValidationState(prev => ({
      ...prev,
      [fieldName]: result
    }));

    return result;
  }, []);

  const validatePhoneField = useCallback((
    phone: string,
    fieldName: string = 'phone'
  ): ValidationResult => {
    const errors: string[] = [];
    
    if (phone && !validatePhoneNumber(phone)) {
      errors.push('Please enter a valid phone number');
    }

    const sanitizedValue = sanitizeText(phone);
    
    const result: ValidationResult = {
      isValid: errors.length === 0,
      errors,
      sanitizedValue
    };

    setValidationState(prev => ({
      ...prev,
      [fieldName]: result
    }));

    return result;
  }, []);

  const checkRateLimit = useCallback((
    identifier: string,
    action: string,
    maxAttempts: number = 5,
    windowMs: number = 15 * 60 * 1000 // 15 minutes
  ): boolean => {
    const isLimited = rateLimiter.isRateLimited(identifier, maxAttempts, windowMs);
    
    if (isLimited) {
      logSecurityEvent(SecurityEventType.SUSPICIOUS_ACTIVITY, {
        action,
        identifier,
        reason: 'rate_limit_exceeded'
      });
    } else {
      rateLimiter.recordAttempt(identifier);
    }

    return isLimited;
  }, []);

  const clearValidation = useCallback((fieldName?: string) => {
    if (fieldName) {
      setValidationState(prev => {
        const newState = { ...prev };
        delete newState[fieldName];
        return newState;
      });
    } else {
      setValidationState({});
    }
  }, []);

  const getValidationErrors = useCallback((fieldName: string): string[] => {
    return validationState[fieldName]?.errors || [];
  }, [validationState]);

  const isFieldValid = useCallback((fieldName: string): boolean => {
    return validationState[fieldName]?.isValid !== false;
  }, [validationState]);

  return {
    validatePassword,
    validateAndSanitizeText,
    validateAndSanitizeHtml,
    validateEmailField,
    validatePhoneField,
    checkRateLimit,
    clearValidation,
    getValidationErrors,
    isFieldValid,
    validationState
  };
};

export default useSecurityValidation;