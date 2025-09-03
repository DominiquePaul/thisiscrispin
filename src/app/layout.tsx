import type { Metadata } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import localFont from 'next/font/local';
import Image from 'next/image';
import Link from "next/link";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react"
import { AuthProvider } from '@/lib/AuthContext';
import AdminPanel from '@/components/AdminPanel';
import { Toaster } from "@/components/ui/toaster";

const ibmPlexSans = IBM_Plex_Sans({ 
  subsets: ["latin"],
  weight: ['400', '500', '600', '700'],
  variable: '--font-ibm-plex-sans'
});

const segoeUI = localFont({
  src: [
    {
      path: '../../public/fonts/Segoe UI.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Segoe UI Bold.ttf',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Segoe UI Italic.ttf',
      weight: '400',
      style: 'italic',
    },
    {
      path: '../../public/fonts/Segoe UI Bold Italic.ttf',
      weight: '700',
      style: 'italic',
    },
  ],
  variable: '--font-segoe-ui',
});

const sfMono = localFont({
  src: '../../public/fonts/SFMonoRegular.otf',
  variable: '--font-sf-mono',
});

export const metadata: Metadata = {
  title: "Dominique Paul - thisiscrispin",
  description: "Dominique Paul's personal website and blog.",
  icons: {
    icon: '/favicon/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${ibmPlexSans.className} ${ibmPlexSans.variable} ${segoeUI.variable} ${sfMono.variable} bg-[#F2F2F2]`}>
        <AuthProvider>
          <div className="absolute top-4 left-4 z-10">
            <Link href="/">
              <Image src="/logo_large.png" alt="Logo" width={64} height={64} />
            </Link>
          </div>
          <AdminPanel />
          {children}
          <Toaster />
          <Analytics />
        </AuthProvider>
      </body>
    </html>
  );
}