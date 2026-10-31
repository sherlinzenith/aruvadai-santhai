"use client";
import { useState } from "react";
import Link from "next/link";
import Reveal from "./Reveal";

type F = { name: string; email: string; mobile: string; password: string; confirm: string; terms: boolean };
const empty: F = { name: "", email: "", mobile: "", password: "", confirm: "", terms: false };

function validate(f: F) {
  const e: Partial<Record<keyof F, string>> = {};
  if (f.name.trim().length < 2) e.name = "Enter your full name";
  if (!/^\S+@\S+\.\S+$/.test(f.email)) e.email = "Enter a valid email";
  if (!/^[6-9]\d{9}$/.test(f.mobile)) e.mobile = "Enter a 10-digit Indian mobile number";
  if (f.password.length < 8 || !/\d/.test(f.password) || !/[A-Za-z]/.test(f.password)) e.password = "Min 8 characters with letters and a number";
  if (f.confirm !== f.password || !f.confirm) e.confirm = "Passwords do not match";
  if (!f.terms) e.terms = "Please accept to continue";
  return e;
}

export default function SignupForm() {
  const [f, setF] = useState<F>(empty);
  const [touched, setTouched] = useState(false);
  const [done, setDone] = useState(false);
  const errs = validate(f);
  const set = <K extends keyof F>(k: K, v: F[K]) => setF((p) => ({ ...p, [k]: v }));

  function submit(ev: React.FormEvent) {
    ev.preventDefault();
    setTouched(true);
    if (Object.keys(errs).length === 0) setDone(true); // TODO: call your register API here
  }

  const Err = ({ k }: { k: keyof F }) => (touched && errs[k] ? <small className="err">{errs[k]}</small> : null);

  return (
    <section id="join" className="sec join">
      <div className="wrap join-grid">
        <Reveal>
          <div className="join-copy">
            <span className="eyebrow light">Create your account</span>
            <h2>Register once. Trade as a buyer, a seller, or both.</h2>
            <ul className="ticks light">
              <li>Verify by email link or OTP</li>
              <li>Choose your role right after sign in</li>
              <li>Pay ₹365 and an admin unlocks your account</li>
            </ul>
          </div>
        </Reveal>
        <Reveal delay={100}>
          <div className="formcard">
            {done ? (
              <div className="ok-state">
                <div className="big" aria-hidden>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--amber)" }}>
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </div>
                <h3>Check your inbox</h3>
                <p>We sent a verification link to <b>{f.email}</b>. Verify to continue to sign in.</p>
                <button className="btn ghost" onClick={() => { setF(empty); setTouched(false); setDone(false); }}>Register another</button>
              </div>
            ) : (
              <form onSubmit={submit} noValidate>
                <h3>Registration</h3>
                <label>Full name<input value={f.name} onChange={(e) => set("name", e.target.value)} autoComplete="name" /><Err k="name" /></label>
                <div className="two">
                  <label>Email<input type="email" value={f.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" /><Err k="email" /></label>
                  <label>Mobile number<input inputMode="numeric" maxLength={10} value={f.mobile} onChange={(e) => set("mobile", e.target.value.replace(/\D/g, ""))} autoComplete="tel" /><Err k="mobile" /></label>
                </div>
                <div className="two">
                  <label>Password<input type="password" value={f.password} onChange={(e) => set("password", e.target.value)} autoComplete="new-password" /><Err k="password" /></label>
                  <label>Confirm password<input type="password" value={f.confirm} onChange={(e) => set("confirm", e.target.value)} autoComplete="new-password" /><Err k="confirm" /></label>
                </div>
                <label className="check">
                  <input type="checkbox" checked={f.terms} onChange={(e) => set("terms", e.target.checked)} />
                  <span>I accept the Terms and Privacy Policy</span>
                </label>
                <Err k="terms" />
                <button className="btn primary block lg" type="submit">Create account</button>
                <p className="fine">Already registered? <Link href="/login" className="highlight-link">Sign in</Link></p>
              </form>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
