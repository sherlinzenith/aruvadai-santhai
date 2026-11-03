import Reveal from "./Reveal";
const items = [
    {
        icon: (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <path d="m9 12 2 2 4-4"/>
      </svg>),
        t: "Manual seller review",
        d: "GSTIN, FSSAI and documents are checked by an admin before a seller is approved.",
    },
    {
        icon: (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="12" cy="12" r="10"/>
        <path d="m9 12 2 2 4-4"/>
      </svg>),
        t: "Verified badge",
        d: "Earned on approval. It resets if business identity details change.",
    },
    {
        icon: (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>),
        t: "Private by design",
        d: "Seller phone and GSTIN are never public. Documents are admin-only.",
    },
    {
        icon: (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
      </svg>),
        t: "Moderated listings",
        d: "Every product moves Draft → Under review → Published only after approval.",
    },
    {
        icon: (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M21.5 2v6h-6"/>
        <path d="M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
      </svg>),
        t: "Audit trail",
        d: "Approvals, rejections and status changes are logged for accountability.",
    },
    {
        icon: (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>),
        t: "Direct enquiries",
        d: "Send quantity, grade, packaging and delivery needs straight to the seller.",
    },
];
export default function Trust() {
    return (<section id="trust" className="sec tint">
      <div className="wrap">
        <Reveal>
          <div className="head">
            <span className="eyebrow">Trust &amp; verification</span>
            <h2>Built so both sides can relax.</h2>
          </div>
        </Reveal>
        <div className="trust-grid">
          {items.map((x, n) => (<Reveal key={x.t} delay={n * 50}>
              <div className="tcard">
                <span className="ti">{x.icon}</span>
                <h3>{x.t}</h3>
                <p>{x.d}</p>
              </div>
            </Reveal>))}
        </div>
      </div>
    </section>);
}
