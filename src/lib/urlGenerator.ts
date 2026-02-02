export const URL_TYPES = [
  'homepage',
  'pricing',
  'product',
  'solutions',
  'about',
  'blog',
  'case-studies',
  'integrations',
] as const;

export type UrlType = (typeof URL_TYPES)[number];

const URL_TYPE_PATHS: Record<UrlType, string> = {
  homepage: '',
  pricing: '/pricing',
  product: '/product',
  solutions: '/solutions',
  about: '/about',
  blog: '/blog',
  'case-studies': '/case-studies',
  integrations: '/integrations',
};

const URL_TYPE_LABELS: Record<UrlType, string> = {
  homepage: 'Homepage',
  pricing: 'Pricing',
  product: 'Product',
  solutions: 'Solutions',
  about: 'About',
  blog: 'Blog',
  'case-studies': 'Case Studies',
  integrations: 'Integrations',
};

export function generatePageUrl(slug: string, type: UrlType): string {
  const path = URL_TYPE_PATHS[type] || '';
  return `https://www.${slug}.com${path}`;
}

export function getUrlTypeLabel(type: string): string {
  return URL_TYPE_LABELS[type as UrlType] || type;
}
