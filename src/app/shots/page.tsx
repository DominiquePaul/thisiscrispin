"use client"

import React, { Suspense, useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from 'next/navigation';
import { Bebas_Neue, Raleway, Archivo_Black, Questrial, Playfair_Display } from 'next/font/google'
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

const CarouselImage: React.FC<CarouselImageProps & { index: number; onImageLoaded?: (src: string) => void }> = ({ src, alt, rotation, index, onImageLoaded }) => {
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
          loading="eager"
          onLoad={handleImageLoad}
          onLoadingComplete={() => onImageLoaded?.(src)}
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
  {
    title: "SF",
    headerImage: "https://images.ctfassets.net/2jl6ez2z7dm3/78E3VcngxUYzW5AdbGg5tB/155836f3fee8ab3abc5c874b1e5fdb38/DSCF4909.jpg?w=2000&fm=webp&q=80",
    images: [
      {
        src: "https://images.ctfassets.net/2jl6ez2z7dm3/78E3VcngxUYzW5AdbGg5tB/155836f3fee8ab3abc5c874b1e5fdb38/DSCF4909.jpg?w=2000&fm=webp&q=80",
        alt: "San Francisco skyline with morning fog",
        rotation: 8,
      },
      {
        src: "https://images.ctfassets.net/2jl6ez2z7dm3/1jcA8m0hZWIKOKQmqWJ1bY/6150452d67386ac1de6f60ea147be45e/DSCF5120.jpg?w=2000&fm=webp&q=80",
        alt: "Afternoon light over San Francisco street",
        rotation: -4,
      },
      {
        src: "https://images.ctfassets.net/2jl6ez2z7dm3/17BANijMWm2zUlaCYT7OlC/37f8dbf0dc53e4564a77e015fc2f6b20/DSCF5642.jpg?w=2000&fm=webp&q=80",
        alt: "Golden Gate Bridge enveloped in fog",
        rotation: 5,
      },
      {
        src: "https://images.ctfassets.net/2jl6ez2z7dm3/4HC4bffxmzT403H4INDEq1/48b91acb533a8a31272f8e000bed05bf/DSCF4981.jpg?w=2000&fm=webp&q=80",
        alt: "Reflections on San Francisco bay",
        rotation: -6,
      },
      {
        src: "https://images.ctfassets.net/2jl6ez2z7dm3/5NWpKFsIwhWfgBflHMY8za/3336a66d49b411cfa5a219fc8ab19c35/DSCF5137.jpg?w=2000&fm=webp&q=80",
        alt: "Evening street scene in San Francisco",
        rotation: 6,
      },
      {
        src: "https://images.ctfassets.net/2jl6ez2z7dm3/5IlJq69gV2iScREqktNf64/332e7bacac3c1503e01d267f4b5dffad/DSCF5719.jpg?w=2000&fm=webp&q=80",
        alt: "Sunset over San Francisco hills",
        rotation: -3,
      },
      {
        src: "https://images.ctfassets.net/2jl6ez2z7dm3/tBuIRH7jvR6rA2K7atB8A/5a763fe15a77398d2d3ea1bc3a66ad9e/DSCF5105.jpg?w=2000&fm=webp&q=80",
        alt: "Cables and car in San Francisco",
        rotation: 7,
      },
      {
        src: "https://images.ctfassets.net/2jl6ez2z7dm3/5WcKu13CdfqaZyMNPEylkj/e998150171f96ea4d9d18ce4c03d7ee8/DSCF4972.jpg?w=2000&fm=webp&q=80",
        alt: "Golden light on San Francisco architecture",
        rotation: -5,
      },
      {
        src: "https://images.ctfassets.net/2jl6ez2z7dm3/5g086FgJ8pWeddb9MrUrYA/17c9d160efe9ea088ea43bf7fa0c5c8b/DSCF7801.JPG?w=2000&fm=webp&q=80",
        alt: "Sun-soaked San Francisco overlook",
        rotation: 9,
      },
      {
        src: "https://images.ctfassets.net/2jl6ez2z7dm3/7v11FnbrgDC3BaJBVSdz5f/03d8722fb0b0ec9f1a78f7ec1402d5f6/DSCF7886.JPG?w=2000&fm=webp&q=80",
        alt: "Candlestick glow on a San Francisco street",
        rotation: -7,
      },
      {
        src: "https://images.ctfassets.net/2jl6ez2z7dm3/4fLROQfkC4354LZhJXsc7X/2c2109cd2ac025419b8d151c51ae6c1b/DSCF7897.JPG?w=2000&fm=webp&q=80",
        alt: "Evening reflections near the Embarcadero",
        rotation: 4,
      },
      {
        src: "https://images.ctfassets.net/2jl6ez2z7dm3/cSSODlgULmr8L9DMJWvd1/a3303c720e66da9aa8707ec44882a18c/DSCF7769.JPG?w=2000&fm=webp&q=80",
        alt: "Golden Gate pylons rising through fog",
        rotation: -6,
      },
      {
        src: "https://images.ctfassets.net/2jl6ez2z7dm3/3sMIMBKdP8KGEprA59r9S3/12e568d2757fee6c071e2b7356514702/DSCF7857.JPG?w=2000&fm=webp&q=80",
        alt: "Dusk light spilling across San Francisco rooftops",
        rotation: 7,
      },
      {
        src: "https://images.ctfassets.net/2jl6ez2z7dm3/7kAGbHspwmOoknCAlUIj46/84be4d502e15a22658f9655aac5204b0/DSCF8015.JPG?w=2000&fm=webp&q=80",
        alt: "Streetcar cables crisscrossing the evening sky",
        rotation: -4,
      },
      {
        src: "https://images.ctfassets.net/2jl6ez2z7dm3/YepFNq6K0zcdWFGbSDhUb/69fa3c2412b091e8da27078807ba91b5/DSCF7995.JPG?w=2000&fm=webp&q=80",
        alt: "Rolling fog over Twin Peaks",
        rotation: 6,
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
  const [isReady, setIsReady] = useState(false);
  const [backgroundSrc, setBackgroundSrc] = useState(albums[0]?.headerImage ?? "");
  const [pendingBackground, setPendingBackground] = useState<{ src: string; albumIndex: number } | null>(null);
  const trackedSourcesRef = useRef<Set<string>>(
    new Set([
      albums[0].headerImage,
      ...albums[0].images.map((image) => image.src),
    ]),
  );
  const loadedSourcesRef = useRef<Set<string>>(new Set());
  const totalTracked = trackedSourcesRef.current.size;
  const [loadedCount, setLoadedCount] = useState(0);

  const loadingProgress = useMemo(() => {
    if (totalTracked === 0) {
      return 100;
    }
    const ratio = loadedCount / totalTracked;
    const bounded = Math.max(0, Math.min(1, ratio));
    return Math.round(bounded * 100);
  }, [loadedCount, totalTracked]);

  const handleTrackedImageLoaded = useCallback((src: string) => {
    if (!trackedSourcesRef.current.has(src) || loadedSourcesRef.current.has(src)) {
      return;
    }

    loadedSourcesRef.current.add(src);
    setLoadedCount((prev) => {
      const next = prev + 1;
      return next > totalTracked ? totalTracked : next;
    });
  }, [totalTracked]);

  useEffect(() => {
    if (isReady) {
      return;
    }

    if (totalTracked === 0) {
      setIsReady(true);
      return;
    }

    if (loadedCount >= totalTracked) {
      const timeout = window.setTimeout(() => setIsReady(true), 400);
      return () => window.clearTimeout(timeout);
    }
  }, [loadedCount, totalTracked, isReady]);

  useEffect(() => {
    const album = albums[currentAlbumIndex];
    if (!album) {
      return;
    }

    const sourcesToTrack = [album.headerImage, ...album.images.map((image) => image.src)];
    sourcesToTrack.forEach((source) => {
      if (!trackedSourcesRef.current.has(source)) {
        trackedSourcesRef.current.add(source);
      }
    });

    if (album.headerImage && album.headerImage !== backgroundSrc && album.headerImage !== pendingBackground?.src) {
      setPendingBackground({ src: album.headerImage, albumIndex: currentAlbumIndex });
    }

    if (!backgroundSrc && album.headerImage) {
      setBackgroundSrc(album.headerImage);
    }
  }, [currentAlbumIndex, backgroundSrc, pendingBackground?.src]);

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
  const getAlbumTitleForHeader = useCallback(
    (src: string) => albums.find((album) => album.headerImage === src)?.title ?? currentAlbum.title,
    [currentAlbum.title],
  );
  const orderedImages = [...currentAlbum.images.slice(order - 1), ...currentAlbum.images.slice(0, order - 1)];

  const isLoading = !isReady;

  return (
    <>
      <div
        className={`relative h-screen overflow-hidden transition-opacity duration-700 ease-out ${
          isLoading ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        {/* Background frame */}
        <div className="absolute inset-0">
          {backgroundSrc && (
            <Image
              key={backgroundSrc}
              src={backgroundSrc}
              alt={`${getAlbumTitleForHeader(backgroundSrc)} header`}
              fill
              className="object-cover filter grayscale transition-opacity duration-500"
              priority={!isReady}
              loading="eager"
              onLoadingComplete={() => handleTrackedImageLoaded(backgroundSrc)}
            />
          )}
          {pendingBackground && (
            <Image
              key={`${pendingBackground.src}-pending`}
              src={pendingBackground.src}
              alt={`${albums[pendingBackground.albumIndex].title} header`}
              fill
              className="object-cover filter grayscale opacity-0"
              priority={!isReady}
              loading="eager"
              onLoadingComplete={() => {
                handleTrackedImageLoaded(pendingBackground.src);
                setBackgroundSrc(pendingBackground.src);
                setPendingBackground(null);
              }}
            />
          )}
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
            <CarouselImage
              key={image.src}
              {...image}
              index={index}
              onImageLoaded={handleTrackedImageLoaded}
            />
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

      {isLoading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-[#0d0d0d] px-8 py-20 text-white">
          <div className="flex flex-1 flex-col items-center justify-center gap-10 uppercase tracking-[0.4em]">
            <div className="relative text-center">
              <span className={`block text-[22vw] leading-none md:text-[14vw] ${playfairDisplay.className}`}>
                Loading
              </span>
            </div>
            <p className={`text-[0.6rem] md:text-xs tracking-[0.6em] text-white/60 ${questrial.className}`}>
              Occasional Photography
            </p>
          </div>
          <div className="flex flex-col items-center gap-3">
            <div className="relative h-px w-48 overflow-hidden bg-white/20 md:w-64">
              <span
                className="absolute inset-y-0 left-0 bg-white transition-all duration-500 ease-out"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
            <span className="text-[0.55rem] uppercase tracking-[0.45em] text-white/45">
              {loadingProgress}%
            </span>
          </div>
        </div>
      )}
    </>
  );
}

export default function ShotsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ImageCarousel />
    </Suspense>
  );
}