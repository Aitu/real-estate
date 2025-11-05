export type ListingCategory =
  | 'apartment'
  | 'house'
  | 'duplex'
  | 'penthouse'
  | 'office'
  | 'land';

export interface ListingImage {
  id: string;
  url: string;
  alt?: string | null;
  isMain?: boolean;
  displayOrder?: number;
}

export interface ListingLocation {
  address: string;
  city: string;
  postalCode: string;
  country: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface ListingSummary {
  id: string;
  title: string;
  category: ListingCategory;
  price: number;
  priceType: 'sale' | 'rent';
  currency: 'EUR';
  bedrooms: number;
  bathrooms: number;
  areaSqm: number;
  mainImage: string;
  gallery: ListingImage[];
  location: ListingLocation;
  highlights?: string[];
}

export interface PropertyFeatureItem {
  id: string;
  label: string;
  value?: string | null;
  icon?: string | null;
}

export interface ListingDetail {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  propertyType: string;
  transactionType: 'sale' | 'rent';
  status: string;
  price: number;
  currency: string;
  bedrooms: number | null;
  bathrooms: number | null;
  parkingSpaces: number | null;
  area: number | null;
  lotArea: number | null;
  yearBuilt: number | null;
  energyClass: string | null;
  floor: number | null;
  totalFloors: number | null;
  location: {
    street: string | null;
    city: string;
    postalCode: string;
    country: string;
    coordinates: {
      lat: number | null;
      lng: number | null;
    };
  };
  images: Array<{
    id: number;
    url: string;
    alt: string | null;
    isPrimary: boolean;
    displayOrder: number;
  }>;
  features: PropertyFeatureItem[];
  owner: {
    id: number;
    name: string | null;
    email: string;
    phoneNumber: string | null;
    avatarUrl: string | null;
    locale: string | null;
  };
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ListingStatus = 'draft' | 'published' | 'inactive';

export interface OwnerListing {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  propertyType: string;
  transactionType: 'sale' | 'rent';
  status: ListingStatus;
  price: number;
  currency: string;
  city: string;
  postalCode: string;
  country: string;
  street: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  area: number | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
