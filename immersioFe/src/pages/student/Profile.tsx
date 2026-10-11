import { Link } from "react-router-dom";
import { Bell, CreditCard, HelpCircle, ArrowRight, LogOut } from "lucide-react";
import { PageHeading } from "@/components/learning/PageHeading";
import { Button } from "@/components/ui/Button";
import { ProfileIdentity } from "@/features/profile/components/ProfileIdentity";
import { useProfile } from "@/features/profile/hooks/useProfile";

const accountLinks = [
  {
    icon: Bell,
    label: "Your reminders",
    description: "Choose how learning fits into your day.",
    path: "/student/notifications",
  },
  {
    icon: CreditCard,
    label: "Your learning plan",
    description: "View your membership and explore the next step.",
    path: "/student/subscription",
  },
  {
    icon: HelpCircle,
    label: "A little help",
    description: "Find answers and get in touch with support.",
    path: "/student/help",
  },
];

export default function Profile() {
  const profile = useProfile();
  return (
    <div className="profile-workspace">
      <PageHeading
        eyebrow="Your learning journey"
        title="A little about you."
        description="Your progress, your preferences, and the space you’re making for new words."
      />
      {profile.error && (
        <p className="learning-inline-error mb-5" role="alert">
          {profile.error}
        </p>
      )}
      <ProfileIdentity {...profile} />
      <div className="word-progress-metrics">
        <div>
          <span>Day streak</span>
          <strong>{profile.user?.streakCount || 0}</strong>
        </div>
        <div>
          <span>Experience earned</span>
          <strong>
            {(profile.user?.experiencePoints || 0).toLocaleString()}
          </strong>
        </div>
        <div>
          <span>Hours of learning</span>
          <strong>{Math.round(profile.user?.learningHours || 0)}</strong>
        </div>
      </div>
      <div className="learning-paper profile-account-links">
        {accountLinks.map((link) => (
          <Link key={link.path} to={link.path}>
            <link.icon size={22} />
            <span>
              <strong>{link.label}</strong>
              <small>{link.description}</small>
            </span>
            <ArrowRight size={17} />
          </Link>
        ))}
      </div>
      <div className="profile-sign-out">
        <Button
          variant="ghost"
          onClick={profile.signOut}
          disabled={profile.loggingOut}
        >
          <LogOut size={16} className="mr-2" />
          {profile.loggingOut ? "Signing out…" : "Sign out"}
        </Button>
      </div>
    </div>
  );
}
