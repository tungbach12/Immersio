import { ImmersioLanding } from "@/features/landing/components/ImmersioLanding.jsx";
import { siteContent } from "@/features/landing/content.js";
import "@/features/landing/postcard.css";
import "@/features/landing/learning.css";
import "@/features/landing/integration.css";

export default function Landing() {
  return (
    <main aria-label="Immersio English learning">
      <ImmersioLanding {...siteContent} />
    </main>
  );
}
