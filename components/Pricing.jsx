"use client";
import { useState } from "react";
import Link from "next/link";
import { PRICING } from "@/lib/config";
import Reveal from "./Reveal";
export default function Pricing() {
    const [n, setN] = useState(30);
    const blocks = Math.max(0, Math.ceil((n - PRICING.baseSellerViews) / 10));
    const total = PRICING.buyerBaseFee + blocks * PRICING.buyerAddonFee;
    return (<section id="pricing" className="sec">
      <div className="wrap">
        <Reveal>
          <div className="head text-center mx-auto">
            <span className="eyebrow">Configured in lib/config.ts</span>
            <h2>Simple, transparent pricing. Zero deal commissions.</h2>
            <p>
              ₹365 for buyers unlocks 10 verified sellers. ₹365/month for sellers covers listing.
              Both roles pay ₹365 each.
            </p>
          </div>
        </Reveal>

        <div className="price-grid">
          {/* Buyer Plan */}
          <Reveal>
            <div className="plan">
              <span className="role-pill buyer">For Buyers</span>
              <div className="amt">
                ₹{total}
                <small> / access</small>
              </div>
              <p className="muted">
                ₹{PRICING.buyerBaseFee} covers viewing up to {PRICING.baseSellerViews} sellers. Add 10 more sellers for just ₹{PRICING.buyerAddonFee}.
              </p>

              <div className="calc">
                <div className="row between">
                  <span>Sellers I want to view</span>
                  <b>{n}</b>
                </div>
                <input type="range" min={10} max={200} step={10} value={n} onChange={(e) => setN(+e.target.value)} aria-label="Number of sellers to unlock"/>
                <div className="row between small muted">
                  <span>10</span>
                  <span>200</span>
                </div>
                <div className="breakdown">
                  <div>
                    <span>Base access ({PRICING.baseSellerViews} sellers)</span>
                    <b>₹{PRICING.buyerBaseFee}</b>
                  </div>
                  <div>
                    <span>{blocks} add-on block{blocks === 1 ? "" : "s"} × ₹{PRICING.buyerAddonFee}</span>
                    <b>₹{blocks * PRICING.buyerAddonFee}</b>
                  </div>
                </div>
              </div>

              <ul className="ticks">
                <li>Search with advanced commodity filters</li>
                <li>Unlock verified farmer &amp; processor phone numbers</li>
                <li>Send unlimited direct wholesale enquiries</li>
                <li>Individual (no GSTIN) and Company paths</li>
              </ul>
              <Link href="/register?role=buyer" className="btn primary block">
                Join as Buyer (₹365) →
              </Link>
            </div>
          </Reveal>

          {/* Seller Plan */}
          <Reveal delay={80}>
            <div className="plan hot">
              <span className="role-pill seller">For Sellers</span>
              <div className="amt">
                ₹{PRICING.sellerMonthlyFee}
                <small> / month</small>
              </div>
              <p className="muted">
                A flat monthly subscription to list commodities and be discovered by verified wholesale buyers.
              </p>
              <ul className="ticks">
                <li>Verified Seller badge after admin document review</li>
                <li>List multiple agricultural commodities with MOQ slabs</li>
                <li>Phone and GSTIN stay private from general public</li>
                <li>Direct enquiries with zero commission cuts</li>
                <li>Renewal alerts prior to monthly expiry</li>
              </ul>
              <Link href="/register?role=seller" className="btn amber block">
                Join as Seller (₹365/mo) →
              </Link>
            </div>
          </Reveal>
        </div>

        {/* Dual Role Callout */}
        <Reveal delay={120}>
          <div className="dual-pricing-banner">
            <div>
              <span className="role-pill dual">Both Roles (Dual Account)</span>
              <h3>Need to buy raw crops and sell processed goods?</h3>
              <p className="muted">
                Select <b>Both</b> during onboarding. Both roles pay ₹365 each (Total: ₹{PRICING.buyerBaseFee + PRICING.sellerMonthlyFee}), giving you a seamless dashboard toggle under one login.
              </p>
            </div>
            <Link href="/register?role=both" className="btn ghost sm">
              Register Both Roles →
            </Link>
          </div>
        </Reveal>

        <p className="note">Fees are defined in lib/config.ts. Taxes, if applicable, are shown at checkout.</p>
      </div>
    </section>);
}
