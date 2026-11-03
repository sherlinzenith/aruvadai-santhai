"use client";
import { useState } from "react";
import Link from "next/link";
import Reveal from "./Reveal";
const ACCOUNTS = [
    {
        id: "individual",
        label: "Individual",
        tag: "Personal or small-scale buyer",
        badge: "No GSTIN Required",
        badgeType: "green",
        summary: "Skip all commercial tax questions and corporate paperwork.",
        explanation: "As an Individual, you never meet a GSTIN field or corporate verification hurdle. Simply provide your name, shipping address, and purpose of purchase to unlock verified sellers.",
        needs: [
            { field: "Full name", status: "Required" },
            { field: "Shipping address & pincode", status: "Required" },
            { field: "Purpose of purchase", status: "Required for buyers" },
            { field: "Business category", status: "Skipped", off: true },
            { field: "GSTIN (15 characters)", status: "No field shown at all", highlight: true, off: true },
            { field: "Corporate verification documents", status: "Not required", off: true },
        ],
    },
    {
        id: "company",
        label: "Company",
        tag: "Bakery, processor, mill, trader",
        badge: "GSTIN Required",
        badgeType: "amber",
        summary: "Commercial invoicing and high-volume procurement or listing.",
        explanation: "A Company must provide a valid 15-character GSTIN. Format is checked instantly, and the platform administrator cross-checks the number against government records and payment before activation.",
        needs: [
            { field: "Legal company name", status: "Required" },
            { field: "Registered business address", status: "Required" },
            { field: "Business category", status: "Required (9 choices)" },
            { field: "GSTIN (15 characters)", status: "Required & format checked", highlight: true },
            { field: "Admin GSTIN & payment match", status: "Verified simultaneously" },
            { field: "Commercial tax invoices", status: "Included" },
        ],
    },
    {
        id: "group",
        label: "Group",
        tag: "FPO, cooperative, grower cluster",
        badge: "GSTIN Required",
        badgeType: "amber",
        summary: "Aggregated grower collectives and agricultural societies.",
        explanation: "Groups and Farmer Producer Organisations (FPO) represent multiple growers under one commercial umbrella. A valid 15-character GSTIN is required and verified before listings go live.",
        needs: [
            { field: "Group / Cooperative name", status: "Required" },
            { field: "Contact person & designation", status: "Required" },
            { field: "Registered society address", status: "Required" },
            { field: "GSTIN (15 characters)", status: "Required & format checked", highlight: true },
            { field: "Business category", status: "Required" },
            { field: "Admin identity verification", status: "Verified simultaneously" },
        ],
    },
];
export default function PathSelector() {
    const [selected, setSelected] = useState("individual");
    const current = ACCOUNTS.find((a) => a.id === selected);
    return (<section id="paths" className="sec tint">
      <div className="wrap">
        <Reveal>
          <div className="head text-center mx-auto">
            <span className="eyebrow">Interactive Filter</span>
            <h2>Who are you? Pick your account type.</h2>
            <p>
              The filter sits before payment so you know exactly what is required.
              An Individual never sees a GSTIN field; a Company or Group cannot continue without a valid GSTIN.
            </p>
          </div>
        </Reveal>

        <Reveal delay={60}>
          <div className="paths">
            {/* 3 Interactive Tabs */}
            <div className="tabs" role="tablist">
              {ACCOUNTS.map((item) => (<button key={item.id} role="tab" aria-selected={selected === item.id} className={selected === item.id ? "on" : ""} onClick={() => setSelected(item.id)}>
                  <div className="tab-title-row">
                    <b>{item.label}</b>
                    <span className={`badge-subtle ${item.badgeType}`}>{item.badge}</span>
                  </div>
                  <small>{item.tag}</small>
                </button>))}
            </div>

            {/* Content Panel */}
            <div className="panel" key={selected}>
              <div className="panel-info">
                <h3>{current.label} Onboarding Requirements</h3>
                <p className="summary-text">{current.summary}</p>
                <p className="expl-text muted">{current.explanation}</p>

                <div className="cta-lane-box mt">
                  <Link href={`/register?accountType=${selected}`} className="btn primary sm">
                    Start {current.label} Registration →
                  </Link>
                </div>
              </div>

              <div className="sees">
                <small className="sees-heading">Form Fields &amp; Validation</small>
                <div className="mini">
                  {current.needs.map((n) => (<div key={n.field} className={`fld ${n.off ? "off" : ""} ${n.highlight ? "highlight-fld" : ""}`}>
                      <span>{n.field}</span>
                      <i className={n.highlight ? "highlight-txt" : ""}>{n.status}</i>
                    </div>))}
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>);
}
