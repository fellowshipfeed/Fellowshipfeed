import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Anchor',
  description: 'The operating system for faith communities',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
