import { CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type StepStatus = 'complete' | 'current' | 'upcoming';

interface Step {
  id: number;
  name: string;
  status: StepStatus;
}

interface ProgressStepsProps {
  currentStep: number;
  steps?: string[];
  isProcessing?: boolean;
}

export function ProgressSteps({ 
  currentStep, 
  steps = ['Select Plan', 'Payment', 'Confirmation'],
  isProcessing = false 
}: ProgressStepsProps) {
  const progressSteps: Step[] = steps.map((name, index) => ({
    id: index + 1,
    name,
    status: index + 1 < currentStep ? 'complete' : 
            index + 1 === currentStep ? 'current' : 
            'upcoming'
  }));

  return (
    <nav aria-label="Progress" className="w-full">
      <ol role="list" className="flex items-center justify-between">
        {progressSteps.map((step, stepIdx) => (
          <li
            key={step.id}
            className={cn(
              stepIdx !== progressSteps.length - 1 ? 'flex-1 pr-8 sm:pr-20' : '',
              'relative'
            )}
          >
            {step.status === 'complete' ? (
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  {stepIdx !== progressSteps.length - 1 && (
                    <div className="h-0.5 w-full bg-primary" />
                  )}
                </div>
                <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-primary hover:bg-primary/90 transition-colors">
                  <CheckCircle2 className="h-5 w-5 text-primary-foreground" aria-hidden="true" />
                  <span className="sr-only">{step.name} - Complete</span>
                </div>
              </>
            ) : step.status === 'current' ? (
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  {stepIdx !== progressSteps.length - 1 && (
                    <div className="h-0.5 w-full bg-muted" />
                  )}
                </div>
                <div 
                  className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary bg-background"
                  aria-current="step"
                >
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 text-primary animate-spin" aria-hidden="true" />
                  ) : (
                    <span className="h-2.5 w-2.5 rounded-full bg-primary" aria-hidden="true" />
                  )}
                  <span className="sr-only">{step.name} - Current</span>
                </div>
              </>
            ) : (
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  {stepIdx !== progressSteps.length - 1 && (
                    <div className="h-0.5 w-full bg-muted" />
                  )}
                </div>
                <div className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-muted bg-background group hover:border-muted-foreground transition-colors">
                  <Circle className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" aria-hidden="true" />
                  <span className="sr-only">{step.name} - Upcoming</span>
                </div>
              </>
            )}
            <span className={cn(
              'mt-2 block text-xs font-medium text-center',
              step.status === 'complete' ? 'text-primary' : '',
              step.status === 'current' ? 'text-foreground font-semibold' : '',
              step.status === 'upcoming' ? 'text-muted-foreground' : ''
            )}>
              {step.name}
            </span>
          </li>
        ))}
      </ol>
    </nav>
  );
}
