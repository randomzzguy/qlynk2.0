export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/auth/', '/api/', '/dashboard/', '/admin/'],
    },
    sitemap: 'https://www.qlynk.site/sitemap.xml',
  }
}
