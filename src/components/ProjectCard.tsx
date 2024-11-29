import Image from "next/image";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface ProjectCardProps {
  href?: string;
  imageSrc: string;
  imageAlt: string;
  title: string;
  description: string;
  className?: string;
  isExternal?: boolean;
  onClick?: () => void;
}

export default function ProjectCard({
  href,
  imageSrc,
  imageAlt,
  title,
  description,
  className = "",
  isExternal = false,
  onClick
}: ProjectCardProps) {
  const CardWrapper = onClick ? 
    ({ children }: { children: React.ReactNode }) => (
      <Card className={`relative overflow-hidden group cursor-pointer ${className}`} onClick={onClick}>
        {children}
      </Card>
    ) : 
    ({ children }: { children: React.ReactNode }) => (
      <Card className={`relative overflow-hidden group ${className}`}>
        <Link href={href ?? '#'} className="absolute inset-0 z-10" {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
          {children}
        </Link>
      </Card>
    );

  return (
    <CardWrapper>
      <Image
        src={imageSrc}
        alt={imageAlt}
        fill
        sizes="(max-width: 768px) 100vw, 33vw"
        className="object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent transition-all duration-500 ease-in-out group-hover:from-black/20"></div>
      <div className="absolute bottom-0 left-0 right-0 z-10 p-6 transition-transform duration-300 ease-in-out delay-100 group-hover:translate-y-[-5px]">
        <CardHeader className="p-0 pb-2">
          <CardTitle className="text-white">{title}</CardTitle>
        </CardHeader>
        <CardContent className="text-white p-0">
          {description}
        </CardContent>
      </div>
    </CardWrapper>
  );
}