import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Marquee from "@/components/Marquee";
import ThreeWays from "@/components/ThreeWays";
import PathSelector from "@/components/PathSelector";
import HowItWorks from "@/components/HowItWorks";
import Marketplace from "@/components/Marketplace";
import Pricing from "@/components/Pricing";
import Trust from "@/components/Trust";
import Faq from "@/components/Faq";
import Footer from "@/components/Footer";
export default function Home() {
    return (<>
      <Navbar />
      <main>
        {/* 1. Hero with two CTAs (Join as buyer, Join as seller) */}
        <Hero />
        <Marquee />

        {/* 2. "One login, three ways to join" cards for Buyer, Seller, Both */}
        <ThreeWays />

        {/* 3. Interactive "Who are you?" selector (Individual: no GSTIN; Company/Group: GSTIN required) */}
        <PathSelector />

        {/* 4. How it works in 6 steps */}
        <HowItWorks />

        {/* Live Marketplace Preview with real photography */}
        <Marketplace />

        {/* 5. Pricing (set in lib/config.ts) */}
        <Pricing />

        {/* 6. Trust section (admin-verified sellers, GSTIN & FSSAI checked, documents private) */}
        <Trust />

        {/* 7. FAQ */}
        <Faq />
      </main>
      <Footer />
    </>);
}
