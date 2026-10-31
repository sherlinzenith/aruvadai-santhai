import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="foot">
      <div className="wrap foot-in">
        <div>
          <Link href="/" className="logo light" aria-label="UlavanSanthai home">
            <Image
              src="/logo-light.png"
              alt="UlavanSanthai"
              width={188}
              height={42}
              className="brand-logo"
            />
          </Link>
          <p style={{ marginTop: "10px" }}>Verified wholesale agri marketplace.</p>
        </div>
        <nav>
          <Link href="/login">Sign in</Link>
          <Link href="/register">Register</Link>
          <Link href="/dashboard">Portal</Link>
          <a href="#paths">Paths</a>
          <a href="#how">How it works</a>
          <a href="#pricing">Pricing</a>
          <a href="#faq">FAQ</a>
        </nav>
        <small>© {new Date().getFullYear()} UlavanSanthai. All rights reserved.</small>
      </div>
    </footer>
  );
}
