import { useState, useCallback } from 'react';
import DOMPurify from 'dompurify';

interface ValidationRule {
  test: (value: string) => boolean;
  message: string;
}

interface ValidationRules {
  [key: string]: ValidationRule[];
}

export const useInputValidation = () => {
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Common validation rules
  const validationRules = {
    email: [
      {
        test: (value: string) => !!value.trim(),
        message: 'Email is required'
      },
      {
        test: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        message: 'Please enter a valid email address'
      },
      {
        test: (value: string) => value.length <= 254,
        message: 'Email address is too long'
      }
    ],
    password: [
      {
        test: (value: string) => !!value,
        message: 'Password is required'
      },
      {
        test: (value: string) => value.length >= 8,
        message: 'Password must be at least 8 characters long'
      },
      {
        test: (value: string) => /[A-Z]/.test(value),
        message: 'Password must contain at least one uppercase letter'
      },
      {
        test: (value: string) => /[a-z]/.test(value),
        message: 'Password must contain at least one lowercase letter'
      },
      {
        test: (value: string) => /\d/.test(value),
        message: 'Password must contain at least one number'
      },
      {
        test: (value: string) => /[!@#$%^&*(),.?":{}|<>]/.test(value),
        message: 'Password must contain at least one special character'
      }
    ],
    name: [
      {
        test: (value: string) => !!value.trim(),
        message: 'Name is required'
      },
      {
        test: (value: string) => value.trim().length >= 2,
        message: 'Name must be at least 2 characters long'
      },
      {
        test: (value: string) => value.length <= 100,
        message: 'Name is too long'
      },
      {
        test: (value: string) => /^[a-zA-Z\s'-]+$/.test(value),
        message: 'Name can only contain letters, spaces, hyphens, and apostrophes'
      }
    ],
    phone: [
      {
        test: (value: string) => !value || /^\+?[\d\s\-\(\)]+$/.test(value),
        message: 'Phone number contains invalid characters'
      },
      {
        test: (value: string) => !value || value.replace(/\D/g, '').length >= 10,
        message: 'Phone number must be at least 10 digits'
      }
    ],
    currency: [
      {
        test: (value: string) => !!value,
        message: 'Amount is required'
      },
      {
        test: (value: string) => /^\d+(\.\d{1,2})?$/.test(value),
        message: 'Please enter a valid amount (e.g., 199.99)'
      },
      {
        test: (value: string) => parseFloat(value) > 0,
        message: 'Amount must be greater than 0'
      },
      {
        test: (value: string) => parseFloat(value) <= 999999.99,
        message: 'Amount is too large'
      }
    ],
    url: [
      {
        test: (value: string) => {
          if (!value) return true; // Optional field
          try {
            new URL(value);
            return true;
          } catch {
            return false;
          }
        },
        message: 'Please enter a valid URL'
      }
    ],
    text: [
      {
        test: (value: string) => value.length <= 5000,
        message: 'Text is too long (maximum 5000 characters)'
      }
    ]
  };

  // SQL injection prevention patterns
  const sqlInjectionPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
    /['"`;\\]/,
    /-{2,}/,
    /\/\*[\s\S]*?\*\//,
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi
  ];

  // XSS prevention
  const sanitizeInput = useCallback((input: string): string => {
    if (typeof input !== 'string') return '';
    
    // Remove potential XSS vectors
    const sanitized = DOMPurify.sanitize(input, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: []
    });
    
    return sanitized.trim();
  }, []);

  // Check for SQL injection attempts
  const containsSqlInjection = useCallback((input: string): boolean => {
    return sqlInjectionPatterns.some(pattern => pattern.test(input));
  }, []);

  // Validate single field
  const validateField = useCallback((
    fieldName: string,
    value: string,
    rules: ValidationRule[] = []
  ): string | null => {
    // Sanitize input first
    const sanitizedValue = sanitizeInput(value);
    
    // Check for SQL injection
    if (containsSqlInjection(sanitizedValue)) {
      return 'Invalid characters detected';
    }
    
    // Apply validation rules
    const applicableRules = rules.length > 0 ? rules : validationRules[fieldName] || [];
    
    for (const rule of applicableRules) {
      if (!rule.test(sanitizedValue)) {
        return rule.message;
      }
    }
    
    return null;
  }, [sanitizeInput, containsSqlInjection]);

  // Validate multiple fields
  const validateFields = useCallback((
    fields: { [key: string]: { value: string; rules?: ValidationRule[] } }
  ): { isValid: boolean; errors: { [key: string]: string } } => {
    const newErrors: { [key: string]: string } = {};
    
    Object.entries(fields).forEach(([fieldName, { value, rules }]) => {
      const error = validateField(fieldName, value, rules);
      if (error) {
        newErrors[fieldName] = error;
      }
    });
    
    setErrors(newErrors);
    return {
      isValid: Object.keys(newErrors).length === 0,
      errors: newErrors
    };
  }, [validateField]);

  // Clear errors for specific field
  const clearFieldError = useCallback((fieldName: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  // Clear all errors
  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  // Validate form data with type safety
  const validateFormData = useCallback(<T extends Record<string, any>>(
    formData: T,
    validationSchema: { [K in keyof T]?: ValidationRule[] }
  ): { isValid: boolean; errors: { [key: string]: string }; sanitizedData: T } => {
    const sanitizedData = {} as T;
    const fields: { [key: string]: { value: string; rules?: ValidationRule[] } } = {};
    
    // Prepare fields for validation and sanitize data
    Object.entries(formData).forEach(([key, value]) => {
      const stringValue = typeof value === 'string' ? value : String(value || '');
      const sanitizedValue = sanitizeInput(stringValue);
      
      sanitizedData[key as keyof T] = sanitizedValue as T[keyof T];
      fields[key] = {
        value: sanitizedValue,
        rules: validationSchema[key as keyof T]
      };
    });
    
    const validation = validateFields(fields);
    
    return {
      isValid: validation.isValid,
      errors: validation.errors,
      sanitizedData
    };
  }, [validateFields, sanitizeInput]);

  return {
    errors,
    validationRules,
    validateField,
    validateFields,
    validateFormData,
    clearFieldError,
    clearAllErrors,
    sanitizeInput,
    containsSqlInjection
  };
};