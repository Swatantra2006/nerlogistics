import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NER Logistics Intelligence | AI-Powered Smart Logistics Platform',
  description: 'AI-Powered Smart Logistics & Accessibility Intelligence Platform for India\'s North Eastern Region. Optimize routes, predict demand, assess risks, and make data-driven logistics decisions.',
  keywords: 'NER, logistics, AI, accessibility, North Eastern Region, India, route optimization, demand forecasting',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body className="min-h-screen bg-surface-950 text-surface-50 antialiased">
        {children}
      </body>
    </html>
  );
}
