import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { AuthProvider } from '@/components/auth/auth-provider';
import { Toaster } from '@/components/ui/toaster';

// GeistSans and GeistMono are font definition objects from the 'geist' package.
// They directly provide `variable` (a class name that sets up the CSS variables)
// and `className` (a class name that applies the font-family directly).

export const metadata: Metadata = {
  title: 'HashDash - Crypto Rig Monitor',
  description: 'Monitor your crypto mining rigs with HashDash.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Add the variable class names to the html tag.
    // This will define CSS variables --font-geist-sans and --font-geist-mono.
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} dark`}>
      {/*
        The body tag uses `antialiased`. The actual font-family is applied via globals.css
        which uses `var(--font-geist-sans)`. This is correct.
        If GeistMono is needed for specific elements, it can be targeted via `var(--font-geist-mono)`
        or by using Tailwind's `font-mono` utility class (which we're configuring below).
      */}
      <body className={`antialiased`}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
