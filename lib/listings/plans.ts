import Stripe from 'stripe';
import { stripe } from '@/lib/payments/stripe';
import type { ListingPlanTier } from '@/lib/types/listing';

export type ListingPlanOption = {
  priceId: string;
  tier: ListingPlanTier;
  name: string;
  amount: number;
  currency: string;
  baseDurationMonths: number;
  multipliers: number[];
  perks: string[];
};

const MULTIPLIER_METADATA_KEY = 'listing_duration_multipliers';
const TIER_METADATA_KEY = 'listing_tier';
const DURATION_METADATA_KEY = 'listing_duration_months';
const PERKS_METADATA_KEY = 'listing_perks';
const DEFAULT_MULTIPLIERS = [1, 2, 3];

function parseMultipliers(metadataValue?: string | null): number[] {
  if (!metadataValue) {
    return DEFAULT_MULTIPLIERS;
  }

  const parsed = metadataValue
    .split(',')
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isFinite(value) && value > 0);

  return parsed.length > 0 ? parsed : DEFAULT_MULTIPLIERS;
}

function parsePerks(metadataValue?: string | null): string[] {
  if (!metadataValue) {
    return [];
  }

  return metadataValue
    .split('\n')
    .map((value) => value.trim())
    .filter(Boolean);
}

function resolveTier(
  price: Stripe.Price,
  product: Stripe.Product
): ListingPlanTier | null {
  const rawTier =
    price.metadata?.[TIER_METADATA_KEY] ??
    product.metadata?.[TIER_METADATA_KEY] ??
    product.name?.toLowerCase();

  if (!rawTier) {
    return null;
  }

  if (rawTier === 'standard' || rawTier === 'plus' || rawTier === 'premium') {
    return rawTier;
  }

  return null;
}

function resolveDurationMonths(
  price: Stripe.Price,
  product: Stripe.Product
): number | null {
  const raw =
    price.metadata?.[DURATION_METADATA_KEY] ??
    product.metadata?.[DURATION_METADATA_KEY];

  if (!raw) {
    return null;
  }

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return Math.round(parsed);
}

function mapPriceToPlan(price: Stripe.Price): ListingPlanOption | null {
  const product =
    typeof price.product === 'string'
      ? null
      : (price.product as Stripe.Product | null);

  if (!product) {
    return null;
  }

  const tier = resolveTier(price, product);
  const durationMonths = resolveDurationMonths(price, product);

  if (!tier || !durationMonths || price.unit_amount == null || !price.currency) {
    return null;
  }

  return {
    priceId: price.id,
    tier,
    name: product.name ?? tier,
    amount: price.unit_amount,
    currency: price.currency.toUpperCase(),
    baseDurationMonths: durationMonths,
    multipliers: parseMultipliers(
      price.metadata?.[MULTIPLIER_METADATA_KEY] ??
        product.metadata?.[MULTIPLIER_METADATA_KEY]
    ),
    perks: parsePerks(
      price.metadata?.[PERKS_METADATA_KEY] ??
        product.metadata?.[PERKS_METADATA_KEY]
    ),
  };
}

export async function getListingPlansFromStripe(): Promise<ListingPlanOption[]> {
  const prices = await stripe.prices.list({
    active: true,
    type: 'one_time',
    expand: ['data.product'],
  });

  const plans = prices.data
    .map((price) => mapPriceToPlan(price))
    .filter((plan): plan is ListingPlanOption => plan !== null)
    .sort((a, b) => a.amount - b.amount);

  if (plans.length === 0) {
    throw new Error(
      'No Stripe prices configured for listings. Add prices with listing_tier and listing_duration_days metadata.'
    );
  }

  return plans;
}

export async function findListingPlan(priceId: string) {
  const plans = await getListingPlansFromStripe();
  return plans.find((plan) => plan.priceId === priceId) ?? null;
}
