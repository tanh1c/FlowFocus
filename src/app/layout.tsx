import type { Metadata, Viewport } from 'next';
import { Inter, Orbitron, Dancing_Script } from 'next/font/google';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import '@/styles/globals.css';

const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-inter',
  display: 'swap',
});

const orbitron = Orbitron({
  subsets: ['latin'],
  variable: '--font-orbitron',
  display: 'swap',
  weight: ['500', '600', '700'],
});

const dancingScript = Dancing_Script({
  subsets: ['latin'],
  variable: '--font-dancing',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Focus Flow - Focus, Relax & Get Things Done',
  description:
    'Focus Flow helps you stay focused, relaxed, and productive. Manage your tasks effortlessly with Pomodoro timer, ambient sounds, and smart task boards.',
  applicationName: 'Focus Flow',
  authors: [{ name: 'Focus Flow Team', url: 'https://focusflow.com' }],
  keywords: [
    'pomodoro timer',
    'focus app',
    'productivity',
    'task management',
    'ambient sounds',
    'focus music',
    'work timer',
    'study timer',
  ],
  creator: 'Focus Flow',
  publisher: 'Focus Flow',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://focusflow.com',
    siteName: 'Focus Flow',
    title: 'Focus Flow - Focus, Relax & Get Things Done',
    description:
      'Focus Flow helps you stay focused, relaxed, and productive.',
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@focusflow',
    title: 'Focus Flow - Focus, Relax & Get Things Done',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '256x256' },
      { url: '/new-icon.webp', sizes: '512x512', type: 'image/webp' },
    ],
    apple: [{ url: '/new-icon.webp', sizes: '512x512', type: 'image/webp' }],
  },
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#000000',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${orbitron.variable} ${dancingScript.variable} antialiased dark`}
    >
      <body className="antialiased bg-black">
        <AntdRegistry>{children}</AntdRegistry>
      </body>
    </html>
  );
}
