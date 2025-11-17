import { ListingStep } from '@/lib/validation/listing';

export type ListingStepDefinition = {
  id: ListingStep;
  title: string;
  description?: string;
};

export const LISTING_STEP_DEFINITIONS: ListingStepDefinition[] = [
  {
    id: 'metadata',
    title: 'Listing metadata',
    description: 'Describe the property and choose its type.',
  },
  {
    id: 'details',
    title: 'Property details',
    description: 'Provide location and amenity information.',
  },
  {
    id: 'media',
    title: 'Media',
    description: 'Upload high quality photos to showcase the listing.',
  },
  {
    id: 'finishing',
    title: 'Finishing touches',
    description: 'Set pricing and decide how buyers can contact you.',
  },
  {
    id: 'payment',
    title: 'Payment',
    description: 'Choose a tier to promote your ad and proceed to checkout.',
  },
  {
    id: 'review',
    title: 'Review & publish',
    description: 'Double-check every section before publishing.',
  },
];

export const LISTING_STEP_IDS: ListingStep[] = LISTING_STEP_DEFINITIONS.map((step) => step.id);
