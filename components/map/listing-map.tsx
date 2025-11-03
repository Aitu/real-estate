'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { MAPBOX_PUBLIC_TOKEN } from '@/lib/mapbox';

declare global {
  interface Window {
    mapboxgl?: typeof import('mapbox-gl');
  }
}

interface ListingMapProps {
  title: string;
  priceLabel: string;
  coordinates: {
    lat: number | null;
    lng: number | null;
  };
}

const MAPBOX_STYLE = 'mapbox://styles/mapbox/light-v11';

export function ListingMap({ title, priceLabel, coordinates }: ListingMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!ready || !containerRef.current) {
      return;
    }

    const { lat, lng } = coordinates;
    if (lat == null || lng == null) {
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

    const map = new mapbox.Map({
      container: containerRef.current,
      style: MAPBOX_STYLE,
      center: [lng, lat],
      zoom: 13.2,
    });

    map.addControl(new mapbox.NavigationControl({ visualizePitch: true }), 'top-right');

    const popup = new mapbox.Popup({ closeButton: false }).setHTML(
      `<strong>${title}</strong><br/>${priceLabel}`
    );

    new mapbox.Marker({ color: '#0f172a' })
      .setLngLat([lng, lat])
      .setPopup(popup)
      .addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
    };
  }, [coordinates, priceLabel, ready, title]);

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
