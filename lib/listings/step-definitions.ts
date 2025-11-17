import { ListingStep } from '@/lib/validation/listing';

export type ListingStepDefinition = {
  id: ListingStep;
  title: string;
  description?: string;
};

export const LISTING_STEP_DEFINITIONS: ListingStepDefinition[] = [
  {
    id: 'metadata',
    title: 'General',
    description: 'Describe the property',
  },
  {
    id: 'details',
    title: 'Details',
    description: 'Add characteristics',
  },
  {
    id: 'media',
    title: 'Media',
    description: 'Upload photos',
  },
  {
    id: 'finishing',
    title: 'Pricing & contact',
    description: 'Set price and how to reach you.',
  },
  {
    id: 'payment',
    title: 'Payment',
    description: 'Pick a tier and pay.',
  },
  {
    id: 'review',
    title: 'Review & publish',
    description: 'Final check',
  },
];

export const LISTING_STEP_IDS: ListingStep[] = LISTING_STEP_DEFINITIONS.map((step) => step.id);
