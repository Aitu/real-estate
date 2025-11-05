'use client';

import { Check } from 'lucide-react';
import { ListingStep } from '@/lib/validation/listing';
import { cn } from '@/lib/utils';

export type ListingStepperStep = {
  id: ListingStep;
  title: string;
  description?: string;
};

interface ListingStepperProps {
  steps: ListingStepperStep[];
  currentStep: ListingStep;
  onStepChange?: (step: ListingStep) => void;
}

export function ListingStepper({
  steps,
  currentStep,
  onStepChange,
}: ListingStepperProps) {
  const currentIndex = steps.findIndex((step) => step.id === currentStep);

  return (
    <nav aria-label="Listing creation progress" className="w-full">
      <ol className="flex flex-col gap-4 md:flex-row md:items-start md:gap-6">
        {steps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = step.id === currentStep;
          const isClickable = typeof onStepChange === 'function' && (isCompleted || isCurrent);

          return (
            <li
              key={step.id}
              className={cn(
                'flex flex-1 flex-col gap-2 rounded-3xl border border-transparent p-3 transition',
                isCurrent && 'border-orange-200 bg-orange-50 shadow-sm'
              )}
            >
              <button
                type="button"
                onClick={() => isClickable && onStepChange(step.id)}
                className={cn(
                  'flex items-center gap-3 text-left focus:outline-none',
                  !isClickable && 'cursor-default'
                )}
                disabled={!isClickable}
              >
                <span
                  className={cn(
                    'flex size-8 items-center justify-center rounded-full border text-sm font-semibold transition',
                    isCompleted && 'border-orange-500 bg-orange-500 text-white',
                    isCurrent && !isCompleted && 'border-orange-500 text-orange-600',
                    !isCompleted && !isCurrent && 'border-slate-200 text-slate-500'
                  )}
                >
                  {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
                </span>
                <span>
                  <span
                    className={cn(
                      'block text-sm font-semibold',
                      isCurrent ? 'text-orange-600' : 'text-slate-700'
                    )}
                  >
                    {step.title}
                  </span>
                  {step.description ? (
                    <span className="mt-1 block text-xs text-slate-500">
                      {step.description}
                    </span>
                  ) : null}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
