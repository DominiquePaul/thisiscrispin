"use client"
import Image from "next/image";
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Link from "next/link";
// import InteractiveGrainyHero from '@/components/InteractiveGrainyHero';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen overflow-auto">
      {/* <InteractiveGrainyHero /> */}
      <section className="flex-grow-0 pt-[45vh] pl-[5%] sm:pl-[10%]">
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
              className="absolute bottom-full left-[50%] w-auto h-auto max-h-[40vh]"
              width={400}
              height={400}
              priority
            />
            <p className="w-full pr-[10%] text-lg" style={{ fontFamily: 'var(--font-sf-mono)' }}>
              I&apos;m a product builder, computer scientist and statistician interested in how we can design intelligent systems (computers) so that not-so-intelligent systems (us humans) can use them. I&apos;ve done research on statistical learning methods and ML at ETH Zurich, <a href="https://openreview.net/forum?id=IbiiNw4oRj" >published work on tabular foundation models at NeurIPS</a>, and am now exploring a new product idea.
            </p>
          </div>
          <div className="pl-[30px] mt-2.5">
            <div className="w-9/12 font-['SF_Mono']">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                {/* <div className="space-x-[15px] font-segoe-ui mb-2 sm:mb-0 pb-5">
                  <a href="/about" className="text-black">About</a>
                  <span>·</span>
                  <a href="/freelance" className="text-black">Freelance</a>
                </div> */}
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
                  {/* <a href="https://www.strava.com/athletes/36221013" target="_blank" rel="noopener noreferrer nofollow">
                    <Image alt="strava icon" src="/logos/grey/strava.png" width={20} height={20} className="w-5" />
                  </a> */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="flex-grow mt-32 mb-32 px-[10%]">
      
      <style jsx global>{`
        :root {
          --gradient-opacity: 0.5;
          --gradient-color: rgba(0, 0, 0, var(--gradient-opacity));
          --hover-gradient-opacity: 0.2;
          --hover-gradient-color: rgba(0, 0, 0, var(--hover-gradient-opacity));
        }
        .card-overlay {
          background: linear-gradient(to top, var(--gradient-color) 0%, transparent 100%);
          transition: background-color 0.5s ease 0.1s, opacity 0.3s ease;
        }
        .bento-card:hover .card-overlay {
          background: linear-gradient(to top, var(--hover-gradient-color) 0%, transparent 100%);
        }
        .bento-card img {
          transition: transform 0.5s ease;
        }
        .bento-card:hover img {
          transform: scale(1.05);
        }
        .bento-card .card-content {
          transition: transform 0.3s ease 0.1s;
        }
        .bento-card:hover .card-content {
          transform: translateY(-5px);
        }
      `}</style>
      
      <div className="grid grid-cols-12 grid-rows-5 gap-4 h-full">
        {/* Row 1 (60% height) */}
        <Card className="col-span-7 row-span-3 relative overflow-hidden bento-card group">
          <Link href="/p/research-and-publications" className="absolute inset-0 z-10">
            <Image
              src="https://images.ctfassets.net/2jl6ez2z7dm3/6ZgFqsuw5gsWmBHZs2oD0f/b12b806c9242e32e9e6e5e198687b4b5/neurips.JPG?fm=webp&q=80"
              alt="Research & Publications"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
            <div className="card-overlay absolute inset-0"></div>
            <div className="card-content relative z-10">
              <CardHeader>
                <CardTitle className="text-white">Publications at NeurIPS and in Nature Communications</CardTitle>
              </CardHeader>
              <CardContent className="text-white">
                Short summaries of the three papers I&apos;ve written in non-technical language.
              </CardContent>
            </div>
          </Link>
        </Card>

        <Card className="col-span-5 row-span-3 relative overflow-hidden bento-card group">
          <Link href="/p/sierra-leone-hockey" className="absolute inset-0 z-10">
            <Image
              src="https://images.ctfassets.net/2jl6ez2z7dm3/4U1eqV4GxEEJKGTnD2Hqn4/5a8e9314b26c77950ed5f2ca427dd0a3/hockey.JPG?fm=webp&q=80"
              alt="Recent Updates"
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover"
            />
            <div className="card-overlay absolute inset-0"></div>
            <div className="card-content relative z-10">
              <CardHeader>
                <CardTitle className="text-white">Building Hockey in Sierra Leone</CardTitle>
              </CardHeader>
              <CardContent className="text-white">
                  How I lived in Freetown for 6 months, built the country&apos;s first artificial turf, and our plans for bringing Sierra Leone to the Africa Cup of Nations.
              </CardContent>
            </div>
          </Link>
        </Card>

        {/* Row 2 (40% height) */}
        <Card className="col-span-4 row-span-2 relative overflow-hidden bento-card group">
          <Link href="/p/open-source-projects" className="absolute inset-0 z-10">
            <Image
              src="https://images.ctfassets.net/2jl6ez2z7dm3/PKHStba23dM4bOGNr9dyt/f1ce250f41d91eabcfa7180c98610fa9/coding2.JPG?fm=webp&q=80"
              alt="Quick Links"
              fill
              sizes="(max-width: 768px) 100vw, 25vw"
              className="object-cover"
            />
            <div className="card-overlay absolute inset-0"></div>
            <div className="card-content relative z-10">
              <CardHeader>
                <CardTitle className="text-white">Open source projects</CardTitle>
              </CardHeader>
              <CardContent className="text-white">
                  How I built a whatsapp bot to stay in touch with my 100-year old grandma and more.
              </CardContent>
              </div>
          </Link>
        </Card>

        <Card className="col-span-4 row-span-2 relative overflow-hidden bento-card group">
          <Link href="/shots" className="absolute inset-0 z-10">
            <Image
              src="https://images.ctfassets.net/2jl6ez2z7dm3/6XZVhquaJdepzhinfh7Ctx/2087ec76df461d48afd800b5836784d8/photography.jpg?fm=webp&q=80"
              alt="Shots"
              fill
              sizes="(max-width: 768px) 100vw, 25vw"
              className="object-cover"
            />
            <div className="card-overlay absolute inset-0"></div>
            <div className="card-content relative z-10">
              <CardHeader>
                <CardTitle className="text-white">Shots</CardTitle>
              </CardHeader>
              <CardContent className="text-white">
                Photographs of nature and friends.
              </CardContent>
              </div>
          </Link>
        </Card>
        
        {/* Box 5 with vertical split */}
        <div className="col-span-4 row-span-2 grid grid-rows-2 gap-4">
          <Card className="relative overflow-hidden bento-card group cursor-pointer" onClick={() => window.open('https://thisiscrispin.substack.com', '_blank')}>
            <Image
              src="https://images.ctfassets.net/2jl6ez2z7dm3/5B22yhakl46JVxU4nR5hFW/3fc0e197806dde5bacc766d518687b94/writing.jpg?fm=webp&q=80"
              alt="Follow me on Substack"
              fill
              sizes="(max-width: 768px) 100vw, 25vw"
              className="object-cover"
            />
            <div className="card-overlay absolute inset-0"></div>
            <div className="card-content relative z-10">
              <CardHeader>
                <CardTitle className="text-white">My Substack</CardTitle>
              </CardHeader>
              <CardContent className="text-white">
                See past newsletters and follow what I&apos;m up to.
              </CardContent>
            </div>
          </Card>
          <Card className="relative overflow-hidden bento-card group cursor-pointer" onClick={() => window.location.href = 'mailto:dominique.c.a.paul@gmail.com'}>
            <Image
              src="https://images.ctfassets.net/2jl6ez2z7dm3/5oFWtdiHvWHzu1IqSWvzSd/1b7d189e2cd59642b2293212979ceef8/email2.jpg?fm=webp&q=80"
              alt="Contact Us"
              fill
              sizes="(max-width: 768px) 100vw, 25vw"
              className="object-cover"
            />
            <div className="card-overlay absolute inset-0"></div>
            <div className="card-content relative z-10">
              <CardHeader>
                <CardTitle className="text-white">Send me an email</CardTitle>
              </CardHeader>
              <CardContent className="text-white">
                
              </CardContent>
            </div>
          </Card>
        </div>
      </div>
      </section>
    </div>
  );
}