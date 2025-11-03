'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Expand, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GalleryImage {
  id: number | string;
  url: string;
  alt?: string | null;
  isPrimary?: boolean;
  displayOrder?: number;
}

interface ListingGalleryProps {
  title: string;
  images: GalleryImage[];
  openLabel: string;
  previousLabel: string;
  nextLabel: string;
  closeLabel: string;
}

export function ListingGallery({
  title,
  images,
  openLabel,
  previousLabel,
  nextLabel,
  closeLabel
}: ListingGalleryProps) {
  const sortedImages = useMemo(() => {
    return [...images].sort((a, b) => {
      const orderDiff = (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
      if (orderDiff !== 0) {
        return orderDiff;
      }
      if (a.isPrimary) {
        return -1;
      }
      if (b.isPrimary) {
        return 1;
      }
      return 0;
    });
  }, [images]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [isModalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (!isModalOpen) {
      document.body.style.removeProperty('overflow');
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isModalOpen]);

  useEffect(() => {
    setActiveIndex(0);
  }, [sortedImages]);

  const showModal = useCallback(
    (index: number) => {
      setActiveIndex(index);
      setModalOpen(true);
    },
    []
  );

  const hideModal = useCallback(() => {
    setModalOpen(false);
  }, []);

  const goToPrevious = useCallback(() => {
    setActiveIndex((current) =>
      current === 0 ? sortedImages.length - 1 : current - 1
    );
  }, [sortedImages.length]);

  const goToNext = useCallback(() => {
    setActiveIndex((current) =>
      current === sortedImages.length - 1 ? 0 : current + 1
    );
  }, [sortedImages.length]);

  useEffect(() => {
    if (!isModalOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        hideModal();
      }
      if (event.key === 'ArrowLeft') {
        goToPrevious();
      }
      if (event.key === 'ArrowRight') {
        goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [goToNext, goToPrevious, hideModal, isModalOpen]);

  const activeImage = sortedImages[activeIndex] ?? sortedImages[0];

  if (!activeImage) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative overflow-hidden rounded-3xl border border-slate-200">
        <div className="relative aspect-[4/3] w-full">
          <Image
            src={activeImage.url}
            alt={activeImage.alt ?? title}
            fill
            sizes="(min-width: 768px) 640px, 100vw"
            className="object-cover"
            priority
          />
        </div>
        {sortedImages.length > 1 && (
          <div className="absolute bottom-4 right-4 flex gap-2">
            <button
              type="button"
              onClick={goToPrevious}
              aria-label={previousLabel}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow transition hover:bg-white"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={goToNext}
              aria-label={nextLabel}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow transition hover:bg-white"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
        <button
          type="button"
          onClick={() => showModal(activeIndex)}
          className="absolute left-4 bottom-4 inline-flex items-center gap-2 rounded-full bg-slate-900/80 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white backdrop-blur transition hover:bg-slate-900"
        >
          <Expand className="h-4 w-4" aria-hidden="true" />
          {openLabel}
        </button>
      </div>

      {sortedImages.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {sortedImages.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={cn(
                'relative h-20 w-28 flex-shrink-0 overflow-hidden rounded-2xl border transition',
                activeIndex === index
                  ? 'border-slate-900 ring-2 ring-slate-900'
                  : 'border-transparent hover:border-slate-300'
              )}
            >
              <Image
                src={image.url}
                alt={image.alt ?? `${title} thumbnail ${index + 1}`}
                fill
                sizes="160px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-10"
        >
          <button
            type="button"
            onClick={hideModal}
            className="absolute right-6 top-6 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow transition hover:bg-white"
            aria-label={closeLabel}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>

          <div className="relative flex w-full max-w-4xl flex-col gap-6">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-white/20 bg-black/20">
              <Image
                src={activeImage.url}
                alt={activeImage.alt ?? title}
                fill
                sizes="(min-width: 768px) 896px, 100vw"
                className="object-contain"
                priority
              />
              {sortedImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={goToPrevious}
                    aria-label={previousLabel}
                    className="absolute left-4 top-1/2 inline-flex -translate-y-1/2 items-center justify-center rounded-full bg-white/90 p-3 text-slate-700 shadow transition hover:bg-white"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={goToNext}
                    aria-label={nextLabel}
                    className="absolute right-4 top-1/2 inline-flex -translate-y-1/2 items-center justify-center rounded-full bg-white/90 p-3 text-slate-700 shadow transition hover:bg-white"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>

            {sortedImages.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-1">
                {sortedImages.map((image, index) => (
                  <button
                    key={`modal-${image.id}`}
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    className={cn(
                      'relative h-24 w-32 flex-shrink-0 overflow-hidden rounded-2xl border transition',
                      activeIndex === index
                        ? 'border-white ring-2 ring-white'
                        : 'border-transparent hover:border-white/60'
                    )}
                  >
                    <Image
                      src={image.url}
                      alt={image.alt ?? `${title} gallery image ${index + 1}`}
                      fill
                      sizes="200px"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
