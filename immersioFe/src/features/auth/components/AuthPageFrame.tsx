import type { ReactNode } from "react";
import { ArrowLeft, Check, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import "../auth.css";

type AuthPageFrameProps = {
  eyebrow: string;
  title: string;
  description: string;
  googleButtonId: string;
  children: ReactNode;
  footer: ReactNode;
};

const practiceSteps = ["Listen to a phrase", "Try it in your own words", "Come back tomorrow"];

export function AuthPageFrame({
  eyebrow,
  title,
  description,
  googleButtonId,
  children,
  footer,
}: AuthPageFrameProps) {
  return (
    <main className="auth-page">
      <div className="auth-page-grain" aria-hidden="true" />
      <div className="auth-shell">
        <aside className="auth-story" aria-label="About Immersio">
          <Link to="/" className="auth-brand" aria-label="Immersio home">
            <span className="auth-brand-mark"><img src="/immersio-mark.svg" alt="" /></span>
            <span>Immersio</span>
          </Link>

          <div className="auth-story-main">
            <div className="auth-story-copy">
              <p className="auth-story-eyebrow"><Sparkles size={13} /> ENGLISH FOR THE EVERYDAY</p>
              <h2>A little English.<br /><em>A world of possibility.</em></h2>
              <p className="auth-story-description">
                For the coffee you order, the people you meet, and the stories you want to tell.
              </p>
            </div>

            <div className="auth-postcard" aria-hidden="true">
              <span className="auth-postcard-stamp">HELLO<br /><small>ANYWHERE</small></span>
              <span className="auth-postcard-line auth-postcard-line-one" />
              <span className="auth-postcard-line auth-postcard-line-two" />
              <span className="auth-postcard-note">Small steps.<br />Real conversations.</span>
              <span className="auth-postcard-sun" />
            </div>

            <ul className="auth-practice-steps">
              {practiceSteps.map((step) => (
                <li key={step}><span><Check size={12} strokeWidth={2.5} /></span>{step}</li>
              ))}
            </ul>
          </div>

          <p className="auth-story-footnote">A friendlier way to find your words.</p>
        </aside>

        <section className="auth-form-panel" aria-labelledby="auth-title">
          <Link to="/" className="auth-mobile-brand" aria-label="Immersio home">
            <img src="/immersio-mark.svg" alt="" />
            <span>Immersio</span>
          </Link>
          <Link to="/" className="auth-back-link"><ArrowLeft size={15} /> Back to home</Link>
          <div className="auth-form-content">
            <header className="auth-form-heading">
              <p className="auth-form-eyebrow">{eyebrow}</p>
              <h1 id="auth-title">{title}</h1>
              <p>{description}</p>
            </header>

            {children}

            <div className="auth-divider"><span>or continue with</span></div>
            <div className="auth-google-wrap">
              <div id={googleButtonId} className="auth-google-button" />
            </div>
            {footer}
          </div>
          <p className="auth-form-note">Your next chapter starts here <span aria-hidden="true">✳</span></p>
        </section>
      </div>
    </main>
  );
}
