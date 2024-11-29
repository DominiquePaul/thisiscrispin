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
              src="https://images.ctfassets.net/2jl6ez2z7dm3/6AkXaLJsPO9nIr392g2Zyo/a5ca0fa0f635941da88473cd57274615/profile.png?fm=webp&q=80"
              alt="Decorative top image"
              className="absolute bottom-full left-[40%] sm:left-[60%] w-auto h-auto max-h-[40vh]"
              width={400}
              height={400}
            />
            <p className="w-full pr-[20%] text-lg" style={{ fontFamily: 'var(--font-sf-mono)' }}>
              I&apos;m a product builder, computer scientist and statistician interested in how we can design intelligent systems (computers) so that not-so-intelligent systems (us humans) can use them. I&apos;ve done research on statistical learning methods and ML at ETH Zurich, <a href="https://openreview.net/forum?id=IbiiNw4oRj" >published work on tabular foundation models at NeurIPS</a>, and am now exploring a new product idea.
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
      
      {/* Projects Section */}
      <section className="flex-grow px-[10%] 2xl:px-[20%] py-24">
        <h1 className="text-5xl font-bold mb-12">Projects I care about</h1>
        <div className="grid grid-cols-4 md:grid-cols-12 gap-4 auto-rows-min md:grid-rows-[400px_300px] h-full">
          {/* Row 1 */}
          <ProjectCard
            href="/p/research-and-publications"
            imageSrc="https://images.ctfassets.net/2jl6ez2z7dm3/6ZgFqsuw5gsWmBHZs2oD0f/b12b806c9242e32e9e6e5e198687b4b5/neurips.JPG?fm=webp&q=80"
            imageAlt="Research & Publications"
            title="Publications at NeurIPS and in Nature Communications"
            description="Short summaries of the three papers I've written in non-technical language."
            className="col-span-4 md:col-span-7 h-[400px]"
          />

          <ProjectCard
            href="/p/sierra-leone-hockey"
            imageSrc="https://images.ctfassets.net/2jl6ez2z7dm3/4U1eqV4GxEEJKGTnD2Hqn4/5a8e9314b26c77950ed5f2ca427dd0a3/hockey.JPG?fm=webp&q=80"
            imageAlt="Recent Updates"
            title="Building Hockey in Sierra Leone"
            description="How I lived in Freetown for 6 months, built the country's first artificial turf, and our plans for bringing Sierra Leone to the Africa Cup of Nations."
            className="col-span-4 md:col-span-5 h-[400px]"
          />

          {/* Row 2 */}
          <ProjectCard
            href="/p/open-source-projects"
            imageSrc="https://images.ctfassets.net/2jl6ez2z7dm3/PKHStba23dM4bOGNr9dyt/f1ce250f41d91eabcfa7180c98610fa9/coding2.JPG?fm=webp&q=80"
            imageAlt="Quick Links"
            title="Open source projects"
            description="How I built a whatsapp bot to stay in touch with my 100-year old grandma and more."
            className="col-span-4 md:col-span-4 h-[300px]"
          />

          <ProjectCard
            href="/shots"
            imageSrc="https://images.ctfassets.net/2jl6ez2z7dm3/6XZVhquaJdepzhinfh7Ctx/2087ec76df461d48afd800b5836784d8/photography.jpg?fm=webp&q=80"
            imageAlt="Shots"
            title="Shots"
            description="Photographs of nature and friends."
            className="col-span-4 md:col-span-4 h-[300px]"
          />

          {/* Box 5 with vertical split */}
          <div className="col-span-4 md:col-span-4 grid grid-rows-2 gap-4 h-[300px]">
            <ProjectCard
              href="https://thisiscrispin.substack.com"
              imageSrc="https://images.ctfassets.net/2jl6ez2z7dm3/5B22yhakl46JVxU4nR5hFW/3fc0e197806dde5bacc766d518687b94/writing.jpg?fm=webp&q=80"
              imageAlt="Follow me on Substack"
              title="My Substack"
              description="See past newsletters and follow what I'm up to."
              className="h-[142px]"
              isExternal={true}
            />

            <ProjectCard
              href=""
              imageSrc="https://images.ctfassets.net/2jl6ez2z7dm3/5oFWtdiHvWHzu1IqSWvzSd/1b7d189e2cd59642b2293212979ceef8/email2.jpg?fm=webp&q=80"
              imageAlt="Contact Us"
              title="Contact me via email"
              description=""
              className="h-[142px]"
              onClick={() => window.location.href = 'mailto:dominique.c.a.paul@gmail.com'}
            />
          </div>
        </div>
      </section>
      
      {/* Blog Section */}
      <section className="px-[10%] 2xl:px-[20%] py-24">
        <h1 className="text-5xl font-bold mb-12">Latest Posts</h1>
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