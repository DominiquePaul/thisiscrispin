import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from 'next/font/local';
import Image from 'next/image';
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

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
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${segoeUI.variable} ${sfMono.variable}`}>
        <div className="absolute top-4 left-4">
          <Image src="/logo_large.png" alt="Logo" width={64} height={64} />
        </div>
        {children}
      </body>
    </html>
  );
}