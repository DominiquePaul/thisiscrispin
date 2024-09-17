import React, { useRef, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

const InteractiveGrainyHero: React.FC = () => {
  const targetRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["end end", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.8]);
  const position = useTransform(scrollYProgress, (pos) =>
    pos >= 1 ? "relative" : "fixed"
  );

  useEffect(() => {
    const updateMousePosition = (ev: MouseEvent) => {
      if (!targetRef.current) return;
      const { clientX, clientY } = ev;
      targetRef.current.style.setProperty("--x", `${clientX}px`);
      targetRef.current.style.setProperty("--y", `${clientY}px`);
    };

    window.addEventListener("mousemove", updateMousePosition);

    return () => {
      window.removeEventListener("mousemove", updateMousePosition);
    };
  }, []);

  const staticNoise = React.useMemo(() => {
    let result = '';
    for (let i = 0; i < 15000; i++) {
      const x = Math.random() * 100;
      const y = Math.random() * 100;
      const opacity = Math.random() * 0.08;  // Slightly increased opacity
      result += `<circle cx="${x}" cy="${y}" r="0.08" fill="currentColor" fill-opacity="${opacity}" />`;
    }
    return result;
  }, []);

  return (
    <motion.section
      ref={targetRef}
      style={{ opacity }}
      className="relative mb-[8rem] h-screen py-16 text-white overflow-hidden
                 before:pointer-events-none before:fixed before:inset-0 before:z-0 
                 before:bg-[radial-gradient(circle_farthest-side_at_var(--x,_100px)_var(--y,_100px),_rgba(255,255,255,0.15)_0%,_transparent_100%)] 
                 before:opacity-70"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-600 to-red-600 opacity-90" />
      
      <svg
        className="absolute inset-0 w-full h-full mix-blend-soft-light"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          <filter id="noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.80" numOctaves="4" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
            <feGaussianBlur stdDeviation="0.5" /> {/* Added blur */}
          </filter>
          <filter id="blur">
            <feGaussianBlur stdDeviation="1" />
          </filter>
        </defs>
        <rect width="100%" height="100%" filter="url(#noise)" opacity="0.08" />
        <g filter="url(#blur)" dangerouslySetInnerHTML={{ __html: staticNoise }} />
        <rect width="100%" height="100%" fill="url(#grain)" opacity="0.1" /> {/* Additional grain layer */}
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.60" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </svg>
      
      <div className="absolute inset-0 bg-white opacity-10" /> {/* Haze overlay */}
      
      <motion.div
        style={{ position, scale, x: "-50%" }}
        className="fixed left-1/2 z-10 flex flex-col items-center"
      >
        <h1 className="mb-12 text-center font-bold text-5xl leading-[1] text-shadow-lg">
          Interactive
          <br />
          Hazy Hero
        </h1>
        
        <p className="text-xl font-light text-shadow">
          Scroll to see the magic happen
        </p>
      </motion.div>
    </motion.section>
  );
};

export default InteractiveGrainyHero;