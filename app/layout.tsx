import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://pscs-secureops.warek21.chatgpt.site'),
  title: 'PSCS SecureOps',
  description: 'Authority-safe WebMCP for AI-assisted IT operations.',
  openGraph: {
    title: 'PSCS SecureOps',
    description: 'Meaning informs. Authority decides.',
    images: [{ url: '/og.png', width: 1680, height: 945, alt: 'PSCS SecureOps authority-boundary diagram' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PSCS SecureOps',
    description: 'Meaning informs. Authority decides.',
    images: ['/og.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
