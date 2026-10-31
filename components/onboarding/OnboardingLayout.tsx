"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useOnboarding } from "@/lib/onboarding-context";

interface Props {
  currentStep: 1 | 2 | 3 | 4 | 5;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

const STEPS = [
  { n: 1, label: "Role" },
  { n: 2, label: "Account Type" },
  { n: 3, label: "Details" },
  { n: 4, label: "Payment" },
  { n: 5, label: "Review Status" },
];

export default function OnboardingLayout({ currentStep, title, subtitle, children }: Props) {
  const { state, signOutUser } = useOnboarding();

  return (
    <div className="onboard-page">
      <div className="onboard-container">
        {/* Top Header */}
        <header className="onboard-nav">
          <Link href="/" className="logo" aria-label="UlavanSanthai home">
            <Image
              src="/logo.png"
              alt="UlavanSanthai"
              width={180}
              height={40}
              priority
              className="brand-logo"
            />
          </Link>

          <div className="onboard-progress" role="progressbar" aria-valuenow={currentStep} aria-valuemin={1} aria-valuemax={5}>
            {STEPS.map((s, idx) => (
              <React.Fragment key={s.n}>
                <span className={`step-dot ${currentStep >= s.n ? "active" : ""}`}>
                  <b>{s.n}.</b> {s.label}
                </span>
                {idx < STEPS.length - 1 && <span className="dot-sep">›</span>}
              </React.Fragment>
            ))}
          </div>

          <div className="onboard-user-badge">
            <span className="user-email-chip">{state.user?.email || "Trader"}</span>
            <button
              type="button"
              className="signout-link"
              onClick={signOutUser}
              title="Sign out and reset"
            >
              Sign out
            </button>
          </div>
        </header>

        {/* Step Head */}
        <div className="onboard-step-card">
          <div className="step-head">
            <span className="eyebrow">Step {currentStep} of 5</span>
            <h2>{title}</h2>
            <p className="muted">{subtitle}</p>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}

