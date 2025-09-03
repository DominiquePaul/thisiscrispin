"use client"

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Bebas_Neue, Raleway, Archivo_Black, Questrial, Bodoni_Moda, Playfair_Display } from 'next/font/google'
import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";

const bebasNeue = Bebas_Neue({
    weight: '400',
    subsets: ['latin'],
    display: 'swap',
  })

const raleway = Raleway({
    weight: '800',
    subsets: ['latin'],
    display: 'swap',
  })

const archivoBlack = Archivo_Black({
    weight: '400',
    subsets: ['latin'],
    display: 'swap',
  })

const questrial = Questrial({
    weight: '400',
    subsets: ['latin'],
    display: 'swap',
  })

const bodoniModa = Bodoni_Moda({
  weight: '700',
  subsets: ['latin'],
  display: 'swap',
})

const playfairDisplay = Playfair_Display({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
})

interface CarouselImageProps {
  src: string;
  alt: string;
  rotation: number;
}

const CarouselImage: React.FC<CarouselImageProps & { index: number }> = ({ src, alt, rotation, index }) => {
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);

  const handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.target as HTMLImageElement;
    setAspectRatio(img.naturalWidth / img.naturalHeight);
  };

  const getImageSizeClass = () => {
    if (aspectRatio === null) return '';
    if (aspectRatio > 1.2) return 'max-w-[80vw] max-h-[55vh] sm:max-w-[80vw] sm:max-h-[70vh]'; // Landscape
    if (aspectRatio < 0.8) return 'max-w-[80vw] max-h-[75vh] sm:max-w-[80vw] sm:max-h-[80vh]'; // Portrait
    return 'max-w-[70vw] max-h-[70vh] sm:max-w-[80vw] sm:max-h-[80vh]'; // Square-ish
  };

  return (
    <div className={`absolute left-1/2 top-1/2 transform -translate-x-1/2 translate-y-1/3 transition-all duration-100 ease-in-out`}
         style={{
           zIndex: 3 - index,
           opacity: index === 0 ? 1 : 1,
           transform: `translate(-50%, -52%) rotate(${rotation}deg) scale(${1 - index * 0.1})`,
         }}>
      <div className="relative inline-block">
        <Image
          className={`border-8 border-[#F9F9F9] ${getImageSizeClass()}`}
          src={src}
          width={1200}
          height={1200}
          style={{ width: 'auto', height: 'auto' }}
          alt={alt}
          onLoad={handleImageLoad}
        />
      </div>
    </div>
  );
};

interface Album {
  title: string;
  headerImage: string;
  images: {
    src: string;
    alt: string;
    rotation: number;
  }[];
}

const albums: Album[] = [
  {
    title: "Bintumani",
    headerImage: "https://images.ctfassets.net/2jl6ez2z7dm3/5ZK8w5bIujvQB3iFLjaO9w/c55cbb9fa801ca8d05bf4af85a1f23f8/Bintumani_BW.jpg",
    images: [
      {
        src: "https://images.ctfassets.net/2jl6ez2z7dm3/48ph6XV8uyChrjzxFijQhx/a3b2d865136ce8379684f78b06f6b615/Bintumani-1.jpg",
        alt: "Bintumani 1",
        rotation: 10,
      },
      {
        src: "https://images.ctfassets.net/2jl6ez2z7dm3/4EY40CmurlBkZxg1YveFyN/9e60a28627c4b8beccfef6fc76bd9af0/Bintumani-2.jpg",
        alt: "Bintumani 2",
        rotation: 3,
      },
      {
        src: "https://images.ctfassets.net/2jl6ez2z7dm3/5pEsZOIMP3igfdTHHIxGm7/759ddcac731fb6bde3133d778915fefd/Bintumani-3.jpg",
        alt: "Bintumani 3",
        rotation: -7,
      },
      {
        src: "https://images.ctfassets.net/2jl6ez2z7dm3/7a622laCU4P28ySPLtVQDt/accb7e7411fa6a9abf70d15147993a60/Bintumani-4.jpg",
        alt: "Bintumani 4",
        rotation: 4,
      },
      {
        src: "https://images.ctfassets.net/2jl6ez2z7dm3/12Ch72Do6Q3PDkKiUypADN/621c18a29d4e902aa6e06237dfa563a5/Bintumani-5.jpg",
        alt: "Bintumani 5",
        rotation: -3,
      },
      {
        src: "https://images.ctfassets.net/2jl6ez2z7dm3/59wf2SRHeDnUBMInJic7J1/b4cfa7d3ffc66bff0957c45edd95283c/Bintumani-6.jpg",
        alt: "Bintumani 6",
        rotation: 8,
      },
      {
        src: "https://images.ctfassets.net/2jl6ez2z7dm3/2jPOW159TXr98mTIVVOBb0/6ca1edd75061adaa0f6ae804e71e2d15/Bintumani-7.jpg",
        alt: "Bintumani 7",
        rotation: 1,
      },
    ],
  },
  // {
  //   title: "Mexico & Brasil",
  //   headerImage: "https://example.com/ghana-header.jpg",
  //   images: [
  //     {
  //       src: "https://example.com/ghana1.jpg",
  //       alt: "Ghana 1",
  //       rotation: 5,
  //     },
  //     {
  //       src: "https://example.com/ghana2.jpg",
  //       alt: "Ghana 2",
  //       rotation: -3,
  //     },
  //   ],
  // },
  // {
  //   title: "Japan",
  //   headerImage: "https://example.com/nigeria-header.jpg",
  //   images: [
  //     {
  //       src: "https://example.com/nigeria1.jpg",
  //       alt: "Nigeria 1",
  //       rotation: 8,
  //     },
  //     {
  //       src: "https://example.com/nigeria2.jpg",
  //       alt: "Nigeria 2",
  //       rotation: -5,
  //     },
  //   ],
  // },
  // {
  //   title: "Sierra Leone Hockey",
  //   headerImage: "https://example.com/kenya-header.jpg",
  //   images: [
  //     {
  //       src: "https://example.com/kenya1.jpg",
  //       alt: "Kenya 1",
  //       rotation: 6,
  //     },
  //     {
  //       src: "https://example.com/kenya2.jpg",
  //       alt: "Kenya 2",
  //       rotation: -4,
  //     },
  //   ],
  // },
];

function ImageCarousel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [currentAlbumIndex, setCurrentAlbumIndex] = useState(0);
  const [order, setOrder] = useState(1);

  const updateURL = useCallback((albumIndex: number, imageOrder: number) => {
    const albumTitle = albums[albumIndex].title.toLowerCase().replace(/ /g, '-');
    return `?album=${albumTitle}&image=${imageOrder}`;
  }, []);

  const handleNext = useCallback(() => {
    setOrder(prevOrder => {
      const newOrder = prevOrder < albums[currentAlbumIndex].images.length ? prevOrder + 1 : 1;
      return newOrder;
    });
  }, [currentAlbumIndex]);

  const handlePrev = useCallback(() => {
    setOrder(prevOrder => {
      const newOrder = prevOrder > 1 ? prevOrder - 1 : albums[currentAlbumIndex].images.length;
      return newOrder;
    });
  }, [currentAlbumIndex]);

  useEffect(() => {
    const albumParam = searchParams.get('album');
    const imageParam = searchParams.get('image');
    
    const albumIndex = albumParam ? albums.findIndex(a => a.title.toLowerCase() === albumParam.toLowerCase()) : 0;
    setCurrentAlbumIndex(albumIndex >= 0 ? albumIndex : 0);
    
    const imageIndex = imageParam ? parseInt(imageParam, 10) : 1;
    setOrder(prevOrder => {
      const maxOrder = albums[albumIndex >= 0 ? albumIndex : 0].images.length;
      return imageIndex > 0 && imageIndex <= maxOrder ? imageIndex : 1;
    });
  }, [searchParams]);

  useEffect(() => {
    const newURL = updateURL(currentAlbumIndex, order);
    router.push(`/shots${newURL}`, { scroll: false });
  }, [currentAlbumIndex, order, router, updateURL]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") {
        handleNext();
      } else if (event.key === "ArrowLeft") {
        handlePrev();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleNext, handlePrev]);

  const currentAlbum = albums[currentAlbumIndex];
  const orderedImages = [...currentAlbum.images.slice(order - 1), ...currentAlbum.images.slice(0, order - 1)];

  return (
    <div className="relative h-screen overflow-hidden">
      {/* Background frame */}
      <div className="absolute inset-0 bg-cover bg-center"
           style={{ backgroundImage: `url(${currentAlbum.headerImage})` }}>
        {/* White cutout */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-[88vw] h-[90vh] bg-white"></div>
        </div>
      </div>

      {/* Title */}
      <div className="absolute inset-0 flex justify-center items-center pointer-events-none">
        {/* White text (visible on the frame) */}
        <h1 className={`text-[14vw] font-bold text-[#ededed] whitespace-nowrap overflow-hidden text-center ${playfairDisplay.className}`}>
          {currentAlbum.title.toUpperCase()}
        </h1>
        {/* Black text (visible in the white center) */}
        <h1 className={`text-[14vw] font-bold text-[#262626] whitespace-nowrap overflow-hidden text-center ${playfairDisplay.className} absolute inset-0 flex justify-center items-center`}
            style={{
              WebkitMaskImage: 'linear-gradient(to right, transparent 10%, white 10% 90%, transparent 90%)',
              maskImage: 'linear-gradient(to right, transparent 10%, white 10% 90%, transparent 90%)',
            }}>
          {currentAlbum.title.toUpperCase()}
        </h1>
      </div>

      {/* Image stack */}
      <div 
        className="absolute inset-0 flex justify-center items-center cursor-pointer"
        onClick={handleNext}
      >
        {orderedImages.map((image, index) => (
          <CarouselImage key={image.src} {...image} index={index} />
        ))}
      </div>

      {/* Album selection buttons */}
      <div className="absolute bottom-[8vh] left-[10vw] right-[10vw] flex justify-between items-center px-10">
        {albums.map((album, index) => (
          <button
            key={album.title}
            className={`text-lg ${playfairDisplay.className} transition-all duration-300 px-4 ${
              index === currentAlbumIndex
                ? 'text-black font-bold'
                : 'text-gray-400 hover:text-gray-600'
            } hover:underline focus:outline-none`}
            onClick={() => {
              setCurrentAlbumIndex(index);
              setOrder(1);
              updateURL(index, 1);
            }}
          >
            {album.title}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ShotsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ImageCarousel />
    </Suspense>
  );
}