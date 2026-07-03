export function resolveApiBase(defaultBase = 'http://localhost:5000'): string {
  const raw = (process.env.NEXT_PUBLIC_API_URL || defaultBase).trim();
  const withoutTrailingSlash = raw.replace(/\/+$/, '');
  return withoutTrailingSlash.replace(/\/api$/, '');
}
