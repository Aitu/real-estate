import { stripe } from '../payments/stripe';
import { db } from './drizzle';
import {
  users,
  teams,
  teamMembers,
  listings,
  listingImages,
  propertyFeatures,
} from './schema';
import { hashPassword } from '@/lib/auth/session';
import { eq } from 'drizzle-orm';

async function createStripeProducts() {
  console.log('Creating Stripe products and prices...');

  const baseProduct = await stripe.products.create({
    name: 'Base',
    description: 'Base subscription plan',
  });

  await stripe.prices.create({
    product: baseProduct.id,
    unit_amount: 800, // $8 in cents
    currency: 'usd',
    recurring: {
      interval: 'month',
      trial_period_days: 7,
    },
  });

  const plusProduct = await stripe.products.create({
    name: 'Plus',
    description: 'Plus subscription plan',
  });

  await stripe.prices.create({
    product: plusProduct.id,
    unit_amount: 1200, // $12 in cents
    currency: 'usd',
    recurring: {
      interval: 'month',
      trial_period_days: 7,
    },
  });

  console.log('Stripe products and prices created successfully.');
}

async function seed() {
  const email = 'test@test.com';
  const password = 'admin123';
  const passwordHash = await hashPassword(password);

  let [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    const [insertedUser] = await db
      .insert(users)
      .values({
        email,
        passwordHash,
        role: 'owner',
        name: 'LuxNest Realty',
        phoneNumber: '+352 20 30 40',
      })
      .returning();

    user = insertedUser!;
    console.log('Initial user created.');
  } else {
    console.log('Initial user already exists.');
  }

  let [team] = await db
    .select()
    .from(teams)
    .where(eq(teams.name, 'Test Team'))
    .limit(1);

  if (!team) {
    const [insertedTeam] = await db
      .insert(teams)
      .values({
        name: 'Test Team',
      })
      .returning();

    team = insertedTeam!;
  }

  const existingMembership = await db
    .select()
    .from(teamMembers)
    .where(eq(teamMembers.userId, user.id))
    .limit(1);

  if (existingMembership.length === 0) {
    await db.insert(teamMembers).values({
      teamId: team.id,
      userId: user.id,
      role: 'owner',
    });
  }

  const sampleListings = [
    {
      slug: 'belair-garden-duplex',
      title: 'Belair garden duplex',
      description:
        'Light-filled duplex in Belair with a private garden, outdoor dining terrace, and two indoor parking bays.',
      propertyType: 'duplex',
      transactionType: 'sale' as const,
      status: 'published',
      price: 1350000,
      currency: 'EUR',
      bedrooms: 3,
      bathrooms: 2,
      parkingSpaces: 2,
      area: 148,
      lotArea: 60,
      yearBuilt: 2016,
      energyClass: 'B',
      street: '12 Rue Nicolas Simmer',
      city: 'Luxembourg',
      postalCode: '2538',
      country: 'LU',
      latitude: 49.6003,
      longitude: 6.1039,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1280&q=80',
          alt: 'Belair duplex living room',
        },
        {
          url: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1280&q=80',
          alt: 'Modern kitchen and dining area',
        },
        {
          url: 'https://images.unsplash.com/photo-1599423300746-b62533397364?auto=format&fit=crop&w=1280&q=80',
          alt: 'Primary bedroom with terrace access',
        },
      ],
      features: [
        { label: 'Private garden', value: 'Landscaped 60 m² garden with irrigation', icon: 'Trees' },
        { label: 'Outdoor living', value: '30 m² teak terrace with pergola', icon: 'Sun' },
        { label: 'Parking', value: 'Two indoor parking spaces', icon: 'Car' },
      ],
    },
    {
      slug: 'kirchberg-skyline-apartment',
      title: 'Kirchberg skyline apartment',
      description:
        'Corner apartment on the Kirchberg plateau featuring skyline views, floor-to-ceiling windows, and concierge services.',
      propertyType: 'apartment',
      transactionType: 'rent' as const,
      status: 'published',
      price: 3250,
      currency: 'EUR',
      bedrooms: 2,
      bathrooms: 2,
      parkingSpaces: 1,
      area: 102,
      floor: 12,
      totalFloors: 18,
      yearBuilt: 2020,
      energyClass: 'A',
      street: '5 Rue Edward Steichen',
      city: 'Luxembourg',
      postalCode: '2540',
      country: 'LU',
      latitude: 49.6297,
      longitude: 6.1693,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1505692794403-55b39b5160f4?auto=format&fit=crop&w=1280&q=80',
          alt: 'Living room overlooking Kirchberg skyline',
        },
        {
          url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1280&q=80',
          alt: 'Open-plan kitchen with marble island',
        },
        {
          url: 'https://images.unsplash.com/photo-1523217582562-09d0def993a6?auto=format&fit=crop&w=1280&q=80',
          alt: 'Primary bedroom with panoramic glazing',
        },
      ],
      features: [
        { label: 'Concierge', value: 'Full-service lobby and package room', icon: 'Bell' },
        { label: 'Wellness', value: 'Residents gym and sauna access', icon: 'Dumbbell' },
        { label: 'Smart home', value: 'Integrated climate and lighting controls', icon: 'Cpu' },
      ],
    },
  ];

  for (const sample of sampleListings) {
    const [existingListing] = await db
      .select()
      .from(listings)
      .where(eq(listings.slug, sample.slug))
      .limit(1);

    let listingRecord = existingListing;

    if (!listingRecord) {
      const [inserted] = await db
        .insert(listings)
        .values({
          ownerId: user.id,
          slug: sample.slug,
          title: sample.title,
          description: sample.description,
          propertyType: sample.propertyType,
          transactionType: sample.transactionType,
          status: sample.status,
          price: sample.price,
          currency: sample.currency,
          bedrooms: sample.bedrooms,
          bathrooms: sample.bathrooms,
          parkingSpaces: sample.parkingSpaces,
          area: sample.area,
          lotArea: sample.lotArea,
          yearBuilt: sample.yearBuilt,
          energyClass: sample.energyClass,
          floor: sample.floor,
          totalFloors: sample.totalFloors,
          street: sample.street,
          city: sample.city,
          postalCode: sample.postalCode,
          country: sample.country,
          latitude: sample.latitude,
          longitude: sample.longitude,
          publishedAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      listingRecord = inserted!;
      console.log(`Listing created: ${sample.title}`);
    } else {
      await db
        .update(listings)
        .set({
          title: sample.title,
          description: sample.description,
          propertyType: sample.propertyType,
          transactionType: sample.transactionType,
          status: sample.status,
          price: sample.price,
          currency: sample.currency,
          bedrooms: sample.bedrooms,
          bathrooms: sample.bathrooms,
          parkingSpaces: sample.parkingSpaces,
          area: sample.area,
          lotArea: sample.lotArea,
          yearBuilt: sample.yearBuilt,
          energyClass: sample.energyClass,
          floor: sample.floor,
          totalFloors: sample.totalFloors,
          street: sample.street,
          city: sample.city,
          postalCode: sample.postalCode,
          country: sample.country,
          latitude: sample.latitude,
          longitude: sample.longitude,
          updatedAt: new Date(),
        })
        .where(eq(listings.id, existingListing.id));

      listingRecord = { ...existingListing };
      console.log(`Listing updated: ${sample.title}`);
    }

    await db
      .delete(listingImages)
      .where(eq(listingImages.listingId, listingRecord.id));

    await db
      .delete(propertyFeatures)
      .where(eq(propertyFeatures.listingId, listingRecord.id));

    await db.insert(listingImages).values(
      sample.images.map((image, index) => ({
        listingId: listingRecord!.id,
        url: image.url,
        alt: image.alt,
        isPrimary: index === 0,
        displayOrder: index,
      }))
    );

    await db.insert(propertyFeatures).values(
      sample.features.map((feature, index) => ({
        listingId: listingRecord!.id,
        label: feature.label,
        value: feature.value,
        icon: feature.icon,
        createdAt: new Date(Date.now() + index),
      }))
    );
  }

  await createStripeProducts();
}

seed()
  .catch((error) => {
    console.error('Seed process failed:', error);
    process.exit(1);
  })
  .finally(() => {
    console.log('Seed process finished. Exiting...');
    process.exit(0);
  });
