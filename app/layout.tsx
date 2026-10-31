import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Gap-Mining — scored market gaps, weekly',
  description: 'Each week: market gaps with evidence, scores and a product idea you can sell.',
  icons: { icon: '/icon.svg' },
};
export const viewport: Viewport = { themeColor: '#000000' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <body>
        <nav aria-label="Main">
          <a href="/"><strong>Gap-Mining™</strong></a>
          <a href="/gaps">Gaps</a>
          <a href="/login">Sign in</a>
        </nav>
        {children}
        <footer className="muted">
          © VibPulse · <a href="/legal/privacy">Privacy</a> · <a href="/legal/terms">Terms</a> · Payments processed by Stripe
        </footer>
      </body>
    </html>
  );
}
