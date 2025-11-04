export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function generateDraftSlug(base?: string): string {
  const normalized = base ? slugify(base) : '';
  const randomSuffix = Math.random().toString(36).slice(2, 8);
  return normalized ? `${normalized}-${randomSuffix}` : `listing-${randomSuffix}`;
}
