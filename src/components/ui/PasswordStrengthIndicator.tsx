import React from 'react';
import { Check, X, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface PasswordStrength {
  score: number; // 0-4
  label: string;
  color: string;
  feedback: string[];
}

export const calculatePasswordStrength = (password: string): PasswordStrength => {
  if (!password) {
    return {
      score: 0,
      label: 'No password',
      color: 'text-muted-foreground',
      feedback: ['Enter a password to see strength']
    };
  }

  let score = 0;
  const feedback: string[] = [];

  // Length check
  if (password.length >= 8) {
    score++;
  } else {
    feedback.push('At least 8 characters required');
  }

  if (password.length >= 12) {
    score++;
  }

  // Character variety checks
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const varietyCount = [hasLowercase, hasUppercase, hasNumber, hasSpecial].filter(Boolean).length;
  
  if (varietyCount >= 3) {
    score++;
  } else {
    if (!hasLowercase) feedback.push('Add lowercase letters');
    if (!hasUppercase) feedback.push('Add uppercase letters');
    if (!hasNumber) feedback.push('Add numbers');
    if (!hasSpecial) feedback.push('Add special characters (!@#$%^&*)');
  }

  // Extra points for strong passwords
  if (password.length >= 16 && varietyCount === 4) {
    score++;
  }

  // Determine label and color based on score
  let label = '';
  let color = '';

  if (score === 0 || password.length < 8) {
    label = 'Too weak';
    color = 'text-destructive';
  } else if (score === 1) {
    label = 'Weak';
    color = 'text-destructive';
  } else if (score === 2) {
    label = 'Fair';
    color = 'text-orange-500';
  } else if (score === 3) {
    label = 'Good';
    color = 'text-yellow-500';
  } else {
    label = 'Strong';
    color = 'text-green-500';
  }

  return { score, label, color, feedback };
};

interface PasswordStrengthIndicatorProps {
  password: string;
  showRequirements?: boolean;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ 
  password,
  showRequirements = true 
}) => {
  const strength = calculatePasswordStrength(password);
  const progressValue = password ? (strength.score / 4) * 100 : 0;

  // Determine progress bar color class
  let progressColorClass = '';
  if (strength.score === 0 || password.length < 8) {
    progressColorClass = 'bg-destructive';
  } else if (strength.score <= 2) {
    progressColorClass = 'bg-orange-500';
  } else if (strength.score === 3) {
    progressColorClass = 'bg-yellow-500';
  } else {
    progressColorClass = 'bg-green-500';
  }

  const requirements = [
    { met: password.length >= 8, label: 'At least 8 characters' },
    { met: /[a-z]/.test(password), label: 'One lowercase letter' },
    { met: /[A-Z]/.test(password), label: 'One uppercase letter' },
    { met: /[0-9]/.test(password), label: 'One number' },
    { met: /[^A-Za-z0-9]/.test(password), label: 'One special character' },
  ];

  if (!password && !showRequirements) return null;

  return (
    <div className="space-y-2">
      {password && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Password strength:</span>
            <span className={`font-medium ${strength.color}`}>{strength.label}</span>
          </div>
          <div className="relative">
            <Progress value={progressValue} className="h-2" />
            <div 
              className={`absolute top-0 left-0 h-2 rounded-full transition-all duration-300 ${progressColorClass}`}
              style={{ width: `${progressValue}%` }}
            />
          </div>
        </div>
      )}

      {showRequirements && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground font-medium">Password requirements:</p>
          <ul className="space-y-0.5">
            {requirements.map((req, index) => (
              <li key={index} className="flex items-center gap-2 text-xs">
                {req.met ? (
                  <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                ) : (
                  <X className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                )}
                <span className={req.met ? 'text-foreground' : 'text-muted-foreground'}>
                  {req.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {password && strength.feedback.length > 0 && strength.score < 3 && (
        <div className="flex items-start gap-2 p-2 rounded-md bg-muted/50">
          <AlertCircle className="h-4 w-4 text-orange-500 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground">
            <span className="font-medium">Suggestions: </span>
            {strength.feedback.join(', ')}
          </div>
        </div>
      )}
    </div>
  );
};

export default PasswordStrengthIndicator;
