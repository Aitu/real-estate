import type { ListingSummary } from '@/lib/types/listing';

export const mockListings: ListingSummary[] = [
  {
    id: 'lst-001',
    title: 'Belair garden duplex',
    category: 'duplex',
    price: 1350000,
    priceType: 'sale',
    currency: 'EUR',
    bedrooms: 3,
    bathrooms: 2,
    areaSqm: 148,
    mainImage:
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1280&q=80',
    gallery: [
      {
        id: 'lst-001-img-1',
        url: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1280&q=80',
        isMain: true
      },
      {
        id: 'lst-001-img-2',
        url: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1280&q=80'
      },
      {
        id: 'lst-001-img-3',
        url: 'https://images.unsplash.com/photo-1599423300746-b62533397364?auto=format&fit=crop&w=1280&q=80'
      }
    ],
    location: {
      address: '12 Rue Nicolas Simmer',
      city: 'Luxembourg',
      postalCode: '2538',
      country: 'Luxembourg',
      coordinates: {
        lat: 49.6003,
        lng: 6.1039
      }
    },
    highlights: ['South-facing terrace', 'Private garden', 'Indoor parking']
  },
  {
    id: 'lst-002',
    title: 'Kirchberg skyline apartment',
    category: 'apartment',
    price: 3250,
    priceType: 'rent',
    currency: 'EUR',
    bedrooms: 2,
    bathrooms: 2,
    areaSqm: 102,
    mainImage:
      'https://images.unsplash.com/photo-1505692794403-55b39b5160f4?auto=format&fit=crop&w=1280&q=80',
    gallery: [
      {
        id: 'lst-002-img-1',
        url: 'https://images.unsplash.com/photo-1505692794403-55b39b5160f4?auto=format&fit=crop&w=1280&q=80',
        isMain: true
      },
      {
        id: 'lst-002-img-2',
        url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1280&q=80'
      },
      {
        id: 'lst-002-img-3',
        url: 'https://images.unsplash.com/photo-1523217582562-09d0def993a6?auto=format&fit=crop&w=1280&q=80'
      }
    ],
    location: {
      address: '5 Rue Edward Steichen',
      city: 'Luxembourg',
      postalCode: '2540',
      country: 'Luxembourg',
      coordinates: {
        lat: 49.6297,
        lng: 6.1693
      }
    },
    highlights: ['Skyline views', 'Smart home controls', 'Concierge services']
  },
  {
    id: 'lst-003',
    title: 'Clausen riverside loft',
    category: 'apartment',
    price: 865000,
    priceType: 'sale',
    currency: 'EUR',
    bedrooms: 2,
    bathrooms: 1,
    areaSqm: 118,
    mainImage:
      'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=1280&q=80',
    gallery: [
      {
        id: 'lst-003-img-1',
        url: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=1280&q=80',
        isMain: true
      },
      {
        id: 'lst-003-img-2',
        url: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1280&q=80'
      },
      {
        id: 'lst-003-img-3',
        url: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1280&q=80'
      }
    ],
    location: {
      address: '21 Montée de Clausen',
      city: 'Luxembourg',
      postalCode: '1342',
      country: 'Luxembourg',
      coordinates: {
        lat: 49.6119,
        lng: 6.1399
      }
    },
    highlights: ['River Alzette views', 'Exposed beams', 'Underground parking']
  },
  {
    id: 'lst-004',
    title: 'Limpertsberg penthouse',
    category: 'penthouse',
    price: 1950000,
    priceType: 'sale',
    currency: 'EUR',
    bedrooms: 4,
    bathrooms: 3,
    areaSqm: 210,
    mainImage:
      'https://images.unsplash.com/photo-1549187774-b4e9b0445b05?auto=format&fit=crop&w=1280&q=80',
    gallery: [
      {
        id: 'lst-004-img-1',
        url: 'https://images.unsplash.com/photo-1549187774-b4e9b0445b05?auto=format&fit=crop&w=1280&q=80',
        isMain: true
      },
      {
        id: 'lst-004-img-2',
        url: 'https://images.unsplash.com/photo-1501045661006-fcebe0257c3f?auto=format&fit=crop&w=1280&q=80'
      },
      {
        id: 'lst-004-img-3',
        url: 'https://images.unsplash.com/photo-1536053296545-7a7a5e86f628?auto=format&fit=crop&w=1280&q=80'
      }
    ],
    location: {
      address: '38 Avenue du Bois',
      city: 'Luxembourg',
      postalCode: '1251',
      country: 'Luxembourg',
      coordinates: {
        lat: 49.6194,
        lng: 6.1167
      }
    },
    highlights: ['Wraparound terrace', 'Private lift', 'Two indoor garages']
  },
  {
    id: 'lst-005',
    title: 'Esch modern office loft',
    category: 'office',
    price: 520000,
    priceType: 'sale',
    currency: 'EUR',
    bedrooms: 0,
    bathrooms: 1,
    areaSqm: 165,
    mainImage:
      'https://images.unsplash.com/photo-1505691723518-36a5ac3be353?auto=format&fit=crop&w=1280&q=80',
    gallery: [
      {
        id: 'lst-005-img-1',
        url: 'https://images.unsplash.com/photo-1505691723518-36a5ac3be353?auto=format&fit=crop&w=1280&q=80',
        isMain: true
      },
      {
        id: 'lst-005-img-2',
        url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1280&q=80'
      },
      {
        id: 'lst-005-img-3',
        url: 'https://images.unsplash.com/photo-1454165205744-3b78555e5572?auto=format&fit=crop&w=1280&q=80'
      }
    ],
    location: {
      address: '14 Rue du X septembre',
      city: 'Esch-sur-Alzette',
      postalCode: '4320',
      country: 'Luxembourg',
      coordinates: {
        lat: 49.4955,
        lng: 5.9806
      }
    },
    highlights: ['Open workspace', 'Meeting pods', 'Central station access']
  },
  {
    id: 'lst-006',
    title: 'Grevenmacher vineyard plot',
    category: 'land',
    price: 285000,
    priceType: 'sale',
    currency: 'EUR',
    bedrooms: 0,
    bathrooms: 0,
    areaSqm: 620,
    mainImage:
      'https://images.unsplash.com/photo-1502741338009-cac2772e18bc?auto=format&fit=crop&w=1280&q=80',
    gallery: [
      {
        id: 'lst-006-img-1',
        url: 'https://images.unsplash.com/photo-1502741338009-cac2772e18bc?auto=format&fit=crop&w=1280&q=80',
        isMain: true
      },
      {
        id: 'lst-006-img-2',
        url: 'https://images.unsplash.com/photo-1499678329028-101435549a4e?auto=format&fit=crop&w=1280&q=80'
      },
      {
        id: 'lst-006-img-3',
        url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1280&q=80'
      }
    ],
    location: {
      address: 'Route du Vin',
      city: 'Grevenmacher',
      postalCode: '6733',
      country: 'Luxembourg',
      coordinates: {
        lat: 49.6743,
        lng: 6.4403
      }
    },
    highlights: ['Moselle valley views', 'South exposure', 'Development potential']
  }
];
