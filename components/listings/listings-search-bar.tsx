'use client';

import { FormEvent, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

type ListingsSearchBarProps = {
  placeholder: string;
  buttonLabel: string;
};

export function ListingsSearchBar({ placeholder, buttonLabel }: ListingsSearchBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [value, setValue] = useState('');

  useEffect(() => {
    setValue(params.get('q') ?? '');
  }, [params]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next = new URLSearchParams(params.toString());
    const trimmed = value.trim();

    if (trimmed) {
      next.set('q', trimmed);
    } else {
      next.delete('q');
    }

    next.delete('page');

    const query = next.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:p-5"
    >
      <label className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-600 focus-within:border-slate-400">
        <Search className="h-4 w-4 text-slate-400" aria-hidden="true" />
        <input
          type="text"
          name="q"
          placeholder={placeholder}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
        />
      </label>
      <Button type="submit" className="w-full rounded-2xl sm:w-auto">
        {buttonLabel}
      </Button>
    </form>
  );
}
