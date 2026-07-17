import './globals.css'
import AnimationControl from '../components/AnimationControl'
import ToasterClient from '../components/ToasterClient'
import QlynkBackground from '../components/QlynkBackground'
import JsonLd from '../components/JsonLd'
import { createMetadata, HOME_DESCRIPTION, HOME_TITLE, SITE_URL } from '../lib/seo'

export const metadata = {
  ...createMetadata({
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    path: '/',
    keywords: [
      'personal AI agent',
      'AI clone',
      'personal AI',
      'AI agent builder',
      'digital twin',
      'AI assistant',
    ],
  }),
  metadataBase: new URL('https://www.qlynk.site'),
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
}

export default function RootLayout({ children }) {
  const schemaGraph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        "name": "Qlynk AI",
        "alternateName": "Qlynk",
        "url": SITE_URL,
        "logo": {
          "@type": "ImageObject",
          "url": `${SITE_URL}/assets/favicon/android-chrome-512x512.png`,
          "width": 512,
          "height": 512
        },
        "description": "Qlynk AI is a personal AI agent platform for professionals, creators, founders, and businesses.",
        "foundingDate": "2026"
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        "name": "Qlynk AI",
        "alternateName": "Qlynk",
        "url": SITE_URL,
        "description": HOME_DESCRIPTION,
        "publisher": { "@id": `${SITE_URL}/#organization` },
        "inLanguage": "en"
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${SITE_URL}/#software`,
        "name": "Qlynk AI",
        "alternateName": ["Qlynk Personal AI", "Qlynk AI Clone", "Qlynk AI Agent"],
        "applicationCategory": "BusinessApplication",
        "applicationSubCategory": "Personal AI agent platform",
        "operatingSystem": "Web",
        "url": SITE_URL,
        "description": HOME_DESCRIPTION,
        "publisher": { "@id": `${SITE_URL}/#organization` },
        "featureList": [
          "Personal AI agent training",
          "Knowledge base and document support",
          "Public AI profile",
          "Embeddable website widget",
          "Conversation analytics"
        ],
        "audience": {
          "@type": "Audience",
          "audienceType": "Creators, professionals, founders, freelancers, and businesses"
        },
        "offers": [
          {
            "@type": "Offer",
            "name": "14-day trial",
            "price": "0",
            "priceCurrency": "USD",
            "url": `${SITE_URL}/pricing`
          },
          {
            "@type": "Offer",
            "name": "Creator monthly plan",
            "price": "9",
            "priceCurrency": "USD",
            "url": `${SITE_URL}/pricing`
          },
          {
            "@type": "Offer",
            "name": "Agency monthly plan",
            "price": "19",
            "priceCurrency": "USD",
            "url": `${SITE_URL}/pricing`
          }
        ]
      }
    ]
  };

  return (
    <html lang="en" className="dark">
      <head>
        <JsonLd data={schemaGraph} />
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
