'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { ListingSummary } from '@/lib/types/listing';
import { MAPBOX_PUBLIC_TOKEN } from '@/lib/mapbox';

interface ListingsMapProps {
  listings: ListingSummary[];
}

const MAPBOX_STYLE = 'mapbox://styles/mapbox/light-v11';

mapboxgl.accessToken = MAPBOX_PUBLIC_TOKEN;

type MapInstance = InstanceType<(typeof mapboxgl)['Map']>;

export function ListingsMap({ listings }: ListingsMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapInstance | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const centerListing = listings[0];
    const defaultCenter = centerListing
      ? [centerListing.location.coordinates.lng, centerListing.location.coordinates.lat]
      : [6.1296, 49.6116];

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: MAPBOX_STYLE,
      center: defaultCenter as [number, number],
      zoom: 10.4
    }) as MapInstance;

    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'top-right');

    map.on('load', () => {
      listings.forEach((listing) => {
        const coordinates = [
          listing.location.coordinates.lng,
          listing.location.coordinates.lat
        ] as [number, number];

        const popup = new mapboxgl.Popup({ closeButton: false }).setHTML(
          `<strong>${listing.title}</strong><br/>€${listing.price.toLocaleString('en-US')}`
        );

        new mapboxgl.Marker({ color: '#0f172a' })
          .setLngLat(coordinates)
          .setPopup(popup)
          .addTo(map);
      });
    });

    mapRef.current = map;

    return () => {
      map.remove();
    };
  }, [listings]);

  return (
    <div
      ref={containerRef}
      className="h-[360px] w-full overflow-hidden rounded-3xl border border-slate-200"
    />
  );
}
