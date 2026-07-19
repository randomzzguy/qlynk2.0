export const SITE_URL = 'https://www.qlynk.site';
export const SITE_NAME = 'Qlynk AI';
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

export const HOME_TITLE = 'Qlynk AI | Turn Your Knowledge Into an AI Agent';
export const HOME_DESCRIPTION =
  'Create an AI agent that answers questions about you, your business, property, product, or process. Control what it knows, how it responds, and share it with one simple link.';

function absoluteUrl(path = '/') {
  return new URL(path, SITE_URL).toString();
}

export function createMetadata({
  title,
  description,
  path = '/',
  image = DEFAULT_OG_IMAGE,
  type = 'website',
  keywords,
}) {
  const canonical = absoluteUrl(path);
  const imageUrl = image.startsWith('http') ? image : absoluteUrl(image);

  return {
    title,
    description,
    ...(keywords ? { keywords } : {}),
    alternates: { canonical },
    openGraph: {
      type,
      url: canonical,
      title,
      description,
      siteName: SITE_NAME,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: 'Qlynk AI agent builder',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

export function breadcrumbSchema(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
