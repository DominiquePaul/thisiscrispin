"use client";

import Image from 'next/image';
import Link from "next/link";
import { Analytics } from "@vercel/analytics/react";
import { useEffect, useState } from 'react';

interface ClientLayoutProps {
  children: React.ReactNode;
  className: string;
}

export default function ClientLayout({ children, className }: ClientLayoutProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className={className}>
      <div className="absolute top-4 left-4 z-10">
        <Link href="/">
          <Image 
            src="/logo_large.png" 
            alt="Logo" 
            width={64} 
            height={64} 
            priority
          />
        </Link>
      </div>
      {children}
      <Analytics />
    </div>
  );
} 