'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import type { ListingSummary } from '@/lib/types/listing';
import { MAPBOX_PUBLIC_TOKEN } from '@/lib/mapbox';

declare global {
  interface Window {
    mapboxgl?: typeof import('mapbox-gl');
  }
}

interface ListingsMapProps {
  listings: ListingSummary[];
}

const MAPBOX_STYLE = 'mapbox://styles/mapbox/light-v11';

export function ListingsMap({ listings }: ListingsMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!ready || !containerRef.current) {
      return;
    }

    const mapbox = window.mapboxgl;
    if (!mapbox) {
      return;
    }

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    mapbox.accessToken = MAPBOX_PUBLIC_TOKEN;

    const centerListing = listings[0];
    const defaultCenter = centerListing
      ? [centerListing.location.coordinates.lng, centerListing.location.coordinates.lat]
      : [6.1296, 49.6116];

    const map = new mapbox.Map({
      container: containerRef.current,
      style: MAPBOX_STYLE,
      center: defaultCenter,
      zoom: 10.4
    });

    map.addControl(new mapbox.NavigationControl({ visualizePitch: true }), 'top-right');

    map.on('load', () => {
      listings.forEach((listing) => {
        const coordinates = [
          listing.location.coordinates.lng,
          listing.location.coordinates.lat
        ] as [number, number];

        const popup = new mapbox.Popup({ closeButton: false }).setHTML(
          `<strong>${listing.title}</strong><br/>€${listing.price.toLocaleString('en-US')}`
        );

        new mapbox.Marker({ color: '#0f172a' })
          .setLngLat(coordinates)
          .setPopup(popup)
          .addTo(map);
      });
    });

    mapRef.current = map;

    return () => {
      map.remove();
    };
  }, [listings, ready]);

  return (
    <div className="relative">
      <Script
        src="https://api.mapbox.com/mapbox-gl-js/v3.7.0/mapbox-gl.js"
        strategy="lazyOnload"
        onReady={() => setReady(true)}
      />
      <div
        ref={containerRef}
        className="h-[360px] w-full overflow-hidden rounded-3xl border border-slate-200"
      />
    </div>
  );
}
