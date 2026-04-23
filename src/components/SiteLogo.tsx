"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SiteLogo() {
  const pathname = usePathname();
  if (pathname?.startsWith("/writer")) return null;
  return (
    <div className="absolute top-4 left-4 z-10">
      <Link href="/">
        <Image src="/logo_large.png" alt="Logo" width={64} height={64} />
      </Link>
    </div>
  );
}
