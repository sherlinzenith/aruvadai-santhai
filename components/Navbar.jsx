"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useOnboarding } from "@/lib/onboarding-context";
const links = [
    ["How it works", "#how"],
    ["Who can join", "#who"],
    ["Pricing", "#pricing"],
    ["FAQ", "#faq"],
];
export default function Navbar() {
    const { state } = useOnboarding();
    const [scrolled, setScrolled] = useState(false);
    const [open, setOpen] = useState(false);
    useEffect(() => {
        const f = () => setScrolled(window.scrollY > 12);
        f();
        window.addEventListener("scroll", f, { passive: true });
        return () => window.removeEventListener("scroll", f);
    }, []);
    const isSignedIn = !!state.user && state.otpVerified;
    return (<header className={`nav ${scrolled ? "scrolled" : ""}`}>
      <div className="wrap nav-in">
        <Link href="/" className="logo" aria-label="UlavanSanthai home">
          <Image src="/logo.png" alt="UlavanSanthai" width={188} height={42} priority className="brand-logo"/>
        </Link>

        <nav className={`links ${open ? "open" : ""}`}>
          {links.map(([label, href]) => (<a key={href} href={href} onClick={() => setOpen(false)}>
              {label}
            </a>))}
        </nav>

        <div className="nav-cta">
          {isSignedIn ? (<Link href="/dashboard" className="btn primary sm">
              Dashboard ({state.user?.name?.split(" ")[0] || "Trader"}) →
            </Link>) : (<>
              <Link href="/signin" className="btn ghost sm">
                Sign in
              </Link>
              <Link href="/register" className="btn primary sm">
                Register
              </Link>
            </>)}

          <button className="burger" aria-label="Menu" onClick={() => setOpen(!open)}>
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>
    </header>);
}
