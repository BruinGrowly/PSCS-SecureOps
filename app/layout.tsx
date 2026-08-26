import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PSCS SecureOps',
  description: 'Authority-safe WebMCP for AI-assisted IT operations.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
