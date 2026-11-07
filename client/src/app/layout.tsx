import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Central Gateway — Platform Console',
  description: 'Central API, Notifications and Platform Services for the ThanhBa ecosystem',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-cyan-500 selection:text-slate-950">
        {children}
      </body>
    </html>
  );
}
