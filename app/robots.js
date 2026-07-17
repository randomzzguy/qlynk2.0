export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/auth/',
        '/api/',
        '/dashboard/',
        '/admin/',
        '/create',
        '/onboarding',
        '/premium-themes',
        '/preview/',
        '/embed/',
      ],
    },
    sitemap: 'https://www.qlynk.site/sitemap.xml',
  }
}
