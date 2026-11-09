import type { Metadata } from 'next';
import './globals.css';
import { StarfieldCanvas } from '@/components/starfield-canvas';
import { PineForestBackdrop } from '@/components/pine-forest-backdrop';
import { I18nProvider } from '@/i18n';
import { AuthProvider } from '@/lib/auth-context';
import { AdminGuard } from '@/components/admin-guard';
import { AppShell } from '@/components/app-shell';

export const metadata: Metadata = {
  title: 'Central Gateway — SSO & Platform Hub',
  description: 'Single Sign-On IAM Hub, Notifications & Cloud Platform for the ThanhBa Ecosystem',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="relative h-screen overflow-hidden bg-gradient-to-b from-[#130624] via-[#260c46] to-[#421469] text-white antialiased selection:bg-purple-500 selection:text-white">
        {/* Dynamic Starfield Canvas */}
        <StarfieldCanvas />

        {/* Mountain & Pine Forest Silhouettes */}
        <PineForestBackdrop />

        {/* Application Content */}
        <I18nProvider>
          <AuthProvider>
            <AppShell>
              <AdminGuard>{children}</AdminGuard>
            </AppShell>
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
