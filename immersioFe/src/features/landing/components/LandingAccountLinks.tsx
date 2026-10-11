import { Link } from "react-router-dom";

export function LandingAccountLinks() {
  return (
    <div className="landing-account-links" aria-label="Your account">
      <Link to="/login" className="landing-sign-in">Sign in</Link>
      <Link to="/register" className="landing-start">Start learning <span aria-hidden="true">↗</span></Link>
    </div>
  );
}
