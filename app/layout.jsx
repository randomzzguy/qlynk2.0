import './globals.css'
import AnimationControl from '../components/AnimationControl'
import ToasterClient from '../components/ToasterClient'
import QlynkBackground from '../components/QlynkBackground'

export const metadata = {
  title: 'Qlynk – Create Your AI Clone in Minutes | Personal AI Agent',
  description: 'Build a personal AI agent that represents you 24/7. Upload your bio, resume & expertise — Qlynk creates an AI clone that answers questions, shares your work, and books meetings while you sleep. Free 14-day trial.',
  keywords: 'AI clone, personal AI agent, digital twin, AI assistant, AI avatar, personal AI, create AI clone, AI agent builder, digital identity, AI presence',
  openGraph: {
    type: 'website',
    url: 'https://www.qlynk.site/',
    title: 'Qlynk – Your AI Clone, in a Blink',
    description: 'Create a personal AI agent trained on your knowledge. Answer questions, share your expertise, and engage visitors 24/7 — all from your own qlynk.site/username link.',
    siteName: 'Qlynk',
    images: [{
      url: 'https://www.qlynk.site/og-image.png',
      width: 1200,
      height: 630,
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Qlynk – Your AI Clone, in a Blink',
    description: 'Create a personal AI agent trained on your knowledge. Answer questions, share your expertise, and engage visitors 24/7.',
    images: ['https://www.qlynk.site/og-image.png'],
  },
  icons: {
    icon: [
      { url: '/assets/favicon/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/assets/favicon/favicon-32x32.png', sizes: '32x32', type: 'image/png' }
    ],
    apple: [
      { url: '/assets/favicon/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
    ]
  },
  manifest: '/assets/favicon/site.webmanifest',
  alternates: {
    canonical: 'https://www.qlynk.site/',
  }
}

export default function RootLayout({ children }) {
  const schemaOrg = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Qlynk",
    "url": "https://www.qlynk.site",
    "logo": "https://www.qlynk.site/logo.png",
    "description": "Create your AI clone in minutes. Qlynk lets you build a personal AI agent that represents you 24/7 — answering questions, sharing your expertise, and engaging visitors.",
    "foundingDate": "2026",
    "sameAs": [
      "https://twitter.com/qlynk",
      "https://linkedin.com/company/qlynk",
      "https://producthunt.com/products/qlynk"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "url": "https://www.qlynk.site"
    }
  };

  const schemaSoftware = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Qlynk",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "url": "https://www.qlynk.site",
    "description": "Create your personal AI clone in minutes. Upload your bio, resume, and expertise — get an AI agent that represents you 24/7.",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "description": "14-day free trial, no charge today"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "50"
    }
  };

  const schemaWebSite = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Qlynk",
    "url": "https://www.qlynk.site",
    "description": "Create your AI clone in a blink. Personal AI agent that represents you 24/7.",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://www.qlynk.site/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <html lang="en" className="dark">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrg) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaSoftware) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaWebSite) }}
        />
      </head>
      <body>
        <QlynkBackground />
        <AnimationControl />
        <ToasterClient />
        {children}
      </body>
    </html>
  )
}
