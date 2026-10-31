import Reveal from "./Reveal";

const SIX_STEPS = [
  {
    step: "01",
    title: "Register & Verify",
    desc: "Create your account with name, email, mobile and password. Verify by secure 4-digit email code.",
  },
  {
    step: "02",
    title: "Sign In & Role Choice",
    desc: "Sign in with your email or mobile. Choose Buyer, Seller, or Both under one unified account.",
  },
  {
    step: "03",
    title: "Choose Who You Are",
    desc: "The filter sits before payment: Individual (zero GSTIN) vs Company or Group (GSTIN mandatory).",
  },
  {
    step: "04",
    title: "Complete Details Form",
    desc: "Individuals fill shipping address and purchase purpose. Companies add business category and format-checked GSTIN.",
  },
  {
    step: "05",
    title: "Pay ₹365 Commitment",
    desc: "One flat fee (Both roles pay ₹365 each). Instant receipt and transaction reference generated.",
  },
  {
    step: "06",
    title: "Admin Review & Dashboard",
    desc: "Admin checks payment and verifies GSTIN simultaneously. Once approved, browse sellers or submit listings.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how" className="sec dark">
      <div className="wrap">
        <Reveal>
          <div className="head light text-center mx-auto">
            <span className="eyebrow light">Onboarding Pipeline</span>
            <h2>How it works in 6 clear steps.</h2>
            <p>
              Account classification and GSTIN validation sit before payment, so the admin reviews both at the same time.
            </p>
          </div>
        </Reveal>

        <div className="timeline">
          {SIX_STEPS.map((s, i) => (
            <Reveal key={s.step} delay={i * 50}>
              <div className="tl">
                <div className="num">{s.step}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
