export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.qlynk.site').replace(/\/$/, '');
export const SITE_NAME = 'Qlynk AI';
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

export const HOME_TITLE = 'Qlynk AI | Trusted AI Agents From Approved Knowledge';
export const HOME_DESCRIPTION =
  'Build and share a focused AI agent from approved knowledge. Creator is free forever with 5,000 messages per month. Qlynk is open source under MIT.';

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
