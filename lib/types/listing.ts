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
  isMain?: boolean;
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
