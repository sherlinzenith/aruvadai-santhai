"use client";
import { useMemo, useState } from "react";
import Image from "next/image";
import { categories, products } from "@/lib/content";
import Reveal from "./Reveal";

export default function Marketplace() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [grade, setGrade] = useState("Any");
  const [organic, setOrganic] = useState(false);
  const [limited, setLimited] = useState(false);

  const list = useMemo(
    () =>
      products.filter(
        (p) =>
          (cat === "All" || p.cat === cat) &&
          (grade === "Any" || p.grade === grade) &&
          (!organic || p.organic) &&
          (!limited || p.avail === "Limited") &&
          (p.name + p.seller + p.origin).toLowerCase().includes(q.toLowerCase())
      ),
    [q, cat, grade, organic, limited]
  );

  return (
    <section id="market" className="sec">
      <div className="wrap">
        <Reveal>
          <div className="head">
            <span className="eyebrow">Search the marketplace</span>
            <h2>Filter by what actually matters to a buyer.</h2>
            <p>Product, category, origin, grade, MOQ, availability and organic status. Try the live preview below.</p>
          </div>
        </Reveal>

        <Reveal delay={60}>
          <div className="filters">
            <label className="search">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="search-icon">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search product, seller or origin" />
            </label>
            <select value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Category">
              <option>All</option>
              {categories.map((c) => <option key={c.n}>{c.n}</option>)}
            </select>
            <select value={grade} onChange={(e) => setGrade(e.target.value)} aria-label="Grade">
              <option value="Any">Any grade</option>
              <option value="A">Grade A</option>
              <option value="B">Grade B</option>
              <option value="C">Grade C</option>
            </select>
            <button className={`toggle ${organic ? "on" : ""}`} onClick={() => setOrganic(!organic)}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
              </svg>
              <span>Organic</span>
            </button>
            <button className={`toggle ${limited ? "on" : ""}`} onClick={() => setLimited(!limited)}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>Limited stock</span>
            </button>
          </div>
        </Reveal>

        <div className="grid">
          {list.map((p) => (
            <article className="pcard" key={p.name}>
              <div className="pimg">
                <Image
                  src={p.image}
                  alt={p.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px"
                  className="pimg-photo"
                />
                <span className="g">Grade {p.grade}</span>
                {p.organic && <span className="o">Organic</span>}
              </div>
              <div className="pbody">
                <h3>{p.name}</h3>
                <p className="muted">{p.origin}</p>
                <div className="price">{p.price}</div>
                <div className="row between small">
                  <span>MOQ {p.moq} {p.unit}</span>
                  <span className={p.avail === "Limited" ? "warn" : "okc"}>● {p.avail}</span>
                </div>
                <div className="seller">
                  <span className="badge ok">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Verified
                  </span>
                  <span>{p.seller}</span>
                </div>
                <div className="lock">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <span>Contact unlocks with your plan</span>
                </div>
              </div>
            </article>
          ))}
          {list.length === 0 && <p className="empty">No products match these filters. Try clearing one.</p>}
        </div>
        <p className="note">Sample listings shown for preview only.</p>
      </div>
    </section>
  );
}
