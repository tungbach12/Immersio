import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, UserRound } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AuthField } from "@/features/auth/components/AuthField";
import { AuthPageFrame } from "@/features/auth/components/AuthPageFrame";
import { authService } from "@/services/auth";

export default function Register() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleCredentialResponse = async (response: any) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await authService.loginWithGoogle(response.credential);
      if (res.user.role === "Admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/student/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Google sign-up failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    const initializeGoogle = () => {
      const google = (window as any).google;
      const button = document.getElementById("google-signup-btn");
      if (google && button) {
        google.accounts.id.initialize({
          client_id: (import.meta as any).env.VITE_GOOGLE_CLIENT_ID || "292647291155-7bfaa0cioukmqmah4g5lhg9qqcd1mu26.apps.googleusercontent.com",
          callback: handleGoogleCredentialResponse,
        });
        google.accounts.id.renderButton(button, {
          theme: "outline",
          size: "large",
          width: Math.max(120, Math.floor(button.clientWidth || 320)),
          shape: "rectangular",
          text: "continue_with",
          locale: "en",
        });
        return true;
      }
      return false;
    };

    const isInitialized = initializeGoogle();
    if (!isInitialized) {
      const interval = setInterval(() => {
        if (initializeGoogle()) clearInterval(interval);
      }, 500);
      return () => clearInterval(interval);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await authService.register(username, email, password);
      navigate("/onboarding");
    } catch (err: any) {
      setError(err.message || "Sign-up failed. Check your details and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthPageFrame
      eyebrow="YOUR NEXT CHAPTER"
      title="Start with hello."
      description="Make English part of your everyday, one small conversation at a time."
      googleButtonId="google-signup-btn"
      footer={(
        <p className="auth-footer">
          Already have an account?
          <Link to="/login" className="auth-footer-link">Sign in</Link>
        </p>
      )}
    >
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -7 }}
          animate={{ opacity: 1, y: 0 }}
          className="auth-error"
          role="alert"
        >
          {error}
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="auth-form">
        <AuthField
          id="register-name"
          label="Your name"
          icon={UserRound}
          type="text"
          autoComplete="name"
          required
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="How should we call you?"
        />

        <AuthField
          id="register-email"
          label="Email address"
          icon={Mail}
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
        />

        <AuthField
          id="register-password"
          label="Password"
          icon={LockKeyhole}
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Create a password"
          trailing={(
            <button
              type="button"
              className="auth-password-toggle"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          )}
        />

        <div className="auth-terms">
          <input id="accept-terms" type="checkbox" required />
          <label htmlFor="accept-terms">
            I agree to the terms of service and have read the <Link to="/privacy">Privacy Policy</Link>.
          </label>
        </div>

        <Button type="submit" className="auth-submit" disabled={isLoading}>
          {isLoading ? <span className="auth-spinner" aria-label="Creating account" /> : (
            <span className="auth-submit-content">Create my account <ArrowRight size={15} /></span>
          )}
        </Button>
      </form>
    </AuthPageFrame>
  );
}
