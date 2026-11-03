import Link from "next/link";
import Reveal from "./Reveal";
import { PRICING } from "@/lib/config";
export default function ThreeWays() {
    return (<section id="who" className="sec">
      <div className="wrap">
        <Reveal>
          <div className="head text-center mx-auto">
            <span className="eyebrow">Participation Model</span>
            <h2>One login, three ways to join.</h2>
            <p>
              Whether you only purchase, only produce, or run a processing company that does both, your account shapes to fit your operation.
            </p>
          </div>
        </Reveal>

        <div className="ways-grid">
          {/* Card 1: Buyer */}
          <Reveal delay={40}>
            <div className="way-card">
              <div className="way-head">
                <span className="role-pill buyer">Buyer</span>
                <div className="way-amt">
                  ₹{PRICING.buyerBaseFee}
                  <small> / 10 sellers</small>
                </div>
              </div>
              <h3>Source Wholesale Commodities</h3>
              <p className="way-desc">
                For individuals, home users, bakeries, flour mills, food processors and institutional buyers.
              </p>
              <ul className="way-features">
                <li>Individual flow with zero GSTIN required</li>
                <li>Unlock verified farmer &amp; processor phone numbers</li>
                <li>Direct wholesale enquiries with volume specifications</li>
                <li>Add-on 10 more sellers anytime for ₹{PRICING.buyerAddonFee}</li>
              </ul>
              <Link href="/register?role=buyer" className="btn primary block">
                Join as Buyer →
              </Link>
            </div>
          </Reveal>

          {/* Card 2: Seller */}
          <Reveal delay={80}>
            <div className="way-card hot">
              <div className="way-head">
                <span className="role-pill seller">Seller</span>
                <div className="way-amt">
                  ₹{PRICING.sellerMonthlyFee}
                  <small> / month</small>
                </div>
              </div>
              <h3>List &amp; Distribute Harvest</h3>
              <p className="way-desc">
                For farmers, farmer collectives (FPO), agro-producers, spice growers and commodity traders.
              </p>
              <ul className="way-features">
                <li>Verified Seller trust badge awarded after manual check</li>
                <li>Publish commodity catalogs with price slabs &amp; MOQ</li>
                <li>Phone number &amp; GSTIN kept private by default</li>
                <li>Receive direct purchase requests without intermediaries</li>
              </ul>
              <Link href="/register?role=seller" className="btn amber block">
                Join as Seller →
              </Link>
            </div>
          </Reveal>

          {/* Card 3: Both */}
          <Reveal delay={120}>
            <div className="way-card dual">
              <div className="way-head">
                <span className="role-pill dual">Both</span>
                <div className="way-amt">
                  ₹{PRICING.buyerBaseFee + PRICING.sellerMonthlyFee}
                  <small> (₹365 / role)</small>
                </div>
              </div>
              <h3>Buy Raw &amp; Sell Finished</h3>
              <p className="way-desc">
                For food processing units, rice mills, oil extractors, and bakeries that buy raw crops and sell packaged food.
              </p>
              <ul className="way-features">
                <li>One single company login for both buying &amp; selling</li>
                <li>Instant role switcher on your trading dashboard</li>
                <li>Re-use company details and GSTIN across both operations</li>
                <li>Both payments and role approvals tracked transparently</li>
              </ul>
              <Link href="/register?role=both" className="btn primary block">
                Join as Both →
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>);
}
