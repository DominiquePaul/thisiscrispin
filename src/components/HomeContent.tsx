"use client";

import Image from "next/image";
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Link from "next/link";
import BlogContent from '@/components/BlogContent';
import { Button } from '@/components/ui/button';
import ProjectCard from '@/components/ProjectCard';


interface HomeContentProps {
    articles: any[]; // Replace 'any' with your actual article type
    allTags: string[];
  }
  
export default function HomeContent({ articles, allTags }: HomeContentProps) {

  return (
    <div className="flex flex-col min-h-screen overflow-auto">
      {/* <InteractiveGrainyHero /> */}
      <section className="flex-grow-0 pt-[45vh] pl-[5%] sm:pl-[10%] 2xl:pl-[20%]">
        <div className="relative ">
          <div className="relative z-10">
            <h4 className="text-[rgb(100,100,100)] text-base z-10">
              thisiscrispin
            </h4>
            <h1 className="text-[rgb(35,35,44)] font-bold text-5xl sm:text-7xl mb-4 z-10">
              Dominique Paul
            </h1>
          </div>
          <div className="relative bg-[linear-gradient(57.09deg,rgba(245,250,28,0.9)_0%,rgba(252,255,101,0)_37.99%),linear-gradient(162.34deg,rgb(106,255,201)_25.23%,rgba(70,255,188,0)_70.88%),linear-gradient(95.09deg,rgb(252,255,109)_1.14%,rgba(101,220,176,0.86)_33.44%,rgba(253,125,225,0.86)_62.8%,rgba(211,155,255,0.58)_99.02%)] p-[30px]">
            <Image
              src="https://images.ctfassets.net/2jl6ez2z7dm3/60e2epJPiz2xl7SQ6qrVB/c2ec5203690ff15cb11d776a0f04f470/website-profile_cropped.webp"
              alt="Decorative top image"
              className="absolute bottom-full -z-10 left-[40%] sm:left-[45%] w-auto h-auto max-h-[50vh]"
              width={600}
              height={600}
            />
            <p className="w-full pr-[20%] text-lg" style={{ fontFamily: 'var(--font-sf-mono)' }}>
              I&apos;m a hacker, extrovert, nerd and dreamer. I believe spending a weekend coding is a weekend well spent, but I also love getting my hands dirty like in 2023 when I spent half a year in Sierra Leone clearing freight containers. I studied statistics at ETH Zurich, <a href="https://openreview.net/forum?id=IbiiNw4oRj" >published at NeurIPS</a> and spent 2024 building ML pipelines as a freelancer. Right now I&apos;m working out how I can build a product and company around my passion for machine learning engineering and research.
            </p>
          </div>
          <div className="pl-[30px] mt-2.5">
            <div className="w-9/12 font-['SF_Mono']">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                <div className="flex space-x-[30px] sm:space-x-[20px] pb-10">
                  <a href="https://thisiscrispin.substack.com" target="_blank" rel="noopener noreferrer">
                    <Image alt="substack icon" src="/logos/grey/substack.png" width={20} height={20} className="w-5" />
                  </a>
                  <a href="https://github.com/dominiquePaul" target="_blank" rel="noopener noreferrer">
                    <Image alt="github icon" src="/logos/grey/github.png" width={20} height={20} className="w-5" />
                  </a>
                  <a href="https://www.linkedin.com/in/dominique-paul/" target="_blank" rel="noopener noreferrer">
                    <Image alt="linkedin icon" src="/logos/grey/linkedin.png" width={20} height={20} className="w-5" />
                  </a>
                  <a href="https://twitter.com/dominiquecapaul" target="_blank" rel="noopener noreferrer">
                    <Image alt="twitter icon" src="/logos/grey/twitter.png" width={20} height={20} className="w-5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Blog Section */}
      <section className="px-[10%] 2xl:px-[20%] py-24">
        <h1 className="text-5xl font-bold mb-12">Writing</h1>
        <BlogContent articles={articles} allTags={allTags} isTeaser={true} maxArticles={3} />
        
        <div className="mt-8 text-center">
          <Link href="/p">
            <Button variant="outline" size="lg">
              See all posts
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}