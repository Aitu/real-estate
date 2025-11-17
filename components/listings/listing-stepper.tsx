'use client';

import { Check } from 'lucide-react';
import type { ListingStepDefinition } from '@/lib/listings/step-definitions';
import { ListingStep } from '@/lib/validation/listing';
import { cn } from '@/lib/utils';

export type ListingStepperStep = ListingStepDefinition;

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
      <ol className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {steps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = step.id === currentStep;
          const isClickable = typeof onStepChange === 'function' && (isCompleted || isCurrent);

          return (
            <li
              key={step.id}
              className={cn(
                'rounded-2xl border bg-white px-4 py-3 transition',
                isCurrent
                  ? 'border-orange-200 bg-orange-50 shadow-sm'
                  : 'border-slate-200 hover:border-orange-200'
              )}
            >
              <button
                type="button"
                onClick={() => isClickable && onStepChange(step.id)}
                className={cn(
                  'flex w-full flex-col gap-2 text-left focus:outline-none',
                  !isClickable && 'cursor-default'
                )}
                disabled={!isClickable}
              >
                <span className="flex items-center gap-3">
                  <span
                    className={cn(
                      'flex size-8 items-center justify-center rounded-full border text-sm font-semibold transition',
                      isCompleted && 'border-orange-500 bg-orange-100 text-orange-600',
                      isCurrent && !isCompleted && 'border-orange-500 bg-white text-orange-600',
                      !isCompleted && !isCurrent && 'border-slate-200 text-orange-600'
                    )}
                  >
                    {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
                  </span>
                  <span
                    className={cn(
                      'text-sm font-semibold',
                      isCurrent ? 'text-orange-700' : 'text-slate-800'
                    )}
                  >
                    {step.title}
                  </span>
                </span>
                {step.description ? (
                  <span className="text-xs text-slate-500">{step.description}</span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
