import Link from "next/link";
export default function Hero() {
    return (<section id="top" className="hero">
      <div className="blob b1"/>
      <div className="blob b2"/>
      <div className="wrap hero-wrap">
        <div className="hero-copy">
          <span className="pill"><i className="dot"/> Farm to Market · Verified Wholesale Agri</span>
          <h1>
            Where the <em>farm gate</em> meets the <span className="u">factory floor.</span>
          </h1>
          <p className="lead">
            UlavanSanthai links farmers, manufacturers, processors and bulk buyers in one verified marketplace. Real sellers, private documents, direct enquiries, no middle layers.
          </p>
          <div className="cta-row">
            <Link href="/register?role=buyer" className="btn primary lg">
              Join as buyer <span aria-hidden>→</span>
            </Link>
            <Link href="/register?role=seller" className="btn amber lg">
              Join as seller <span aria-hidden>→</span>
            </Link>
          </div>
          <ul className="hero-facts">
            <li><b>1 account</b><span>Buyer, Seller or both</span></li>
            <li><b>100%</b><span>Admin-reviewed sellers</span></li>
            <li><b>Private</b><span>Phone and GSTIN hidden</span></li>
          </ul>
        </div>
      </div>
    </section>);
}
