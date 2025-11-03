'use client';

import useSWR from 'swr';

interface CurrentUserResponse {
  id: number;
  name: string | null;
  email: string;
  avatarUrl?: string | null;
  locale?: string | null;
}

async function fetcher(url: string) {
  const res = await fetch(url);
  if (!res.ok) {
    return null;
  }
  try {
    return (await res.json()) as CurrentUserResponse | null;
  } catch (error) {
    console.error('Failed to parse current user payload', error);
    return null;
  }
}

export function useCurrentUser() {
  const { data, error, isLoading } = useSWR<CurrentUserResponse | null>(
    '/api/user',
    fetcher,
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false
    }
  );

  return {
    user: data ?? null,
    isLoading,
    error
  };
}
