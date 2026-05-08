import './globals.css'
import AnimationControl from '../components/AnimationControl'
import ToasterClient from '../components/ToasterClient'
import QlynkBackground from '../components/QlynkBackground'

export const metadata = {
  title: 'qlynk - Your AI clone, in a blink',
  description: 'Create your digital identity in seconds',
  icons: {
    icon: [
      { url: '/assets/favicon/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/assets/favicon/favicon-32x32.png', sizes: '32x32', type: 'image/png' }
    ],
    apple: [
      { url: '/assets/favicon/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
    ]
  },
  manifest: '/assets/favicon/site.webmanifest'
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body>
        <QlynkBackground />
        <AnimationControl />
        <ToasterClient />
        {children}
      </body>
    </html>
  )
}
