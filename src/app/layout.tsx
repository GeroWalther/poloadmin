import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Polo&Lyfestyle Magazine Admin',
  description: 'Admin dashboard for Polo&Lyfestyle Magazine',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <header className='w-full border-b border-gray-200 bg-white'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='h-16 flex items-center justify-center'>
              <h1 className='text-2xl font-bold text-black'>
                Polo&Lifestyle Magazine
              </h1>
            </div>
          </div>
        </header>
        <main className='pt-20'>{children}</main>
      </body>
    </html>
  );
}
