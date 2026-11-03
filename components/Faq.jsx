import { faqs } from "@/lib/content";
import Reveal from "./Reveal";
export default function Faq() {
    return (<section id="faq" className="sec">
      <div className="wrap narrow">
        <Reveal>
          <div className="head">
            <span className="eyebrow">Questions</span>
            <h2>Good to know before you join.</h2>
          </div>
        </Reveal>
        {faqs.map((f, i) => (<Reveal key={f.q} delay={i * 40}>
            <details className="faq">
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          </Reveal>))}
      </div>
    </section>);
}
