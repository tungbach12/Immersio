import { Loader2 } from "lucide-react";
import { PageHeading } from "@/components/learning/PageHeading";
import { ContentState } from "@/components/learning/ContentState";
import { PreferenceToggle } from "@/components/learning/PreferenceToggle";
import { Button } from "@/components/ui/Button";
import { useNotificationPreferences } from "@/features/profile/hooks/useNotificationPreferences";

const options = [
  {
    key: "notifEmail" as const,
    title: "A note in your inbox",
    description: "Receive learning reminders by email.",
  },
  {
    key: "notifPush" as const,
    title: "Browser reminders",
    description:
      "See a reminder on your device when browser permission is enabled.",
  },
  {
    key: "notifStreak" as const,
    title: "Keep your rhythm",
    description: "Get a nudge to keep your learning streak going.",
  },
  {
    key: "notifTips" as const,
    title: "A few useful ideas",
    description: "Receive tips for vocabulary and speaking practice.",
  },
];

export default function Notifications() {
  const settings = useNotificationPreferences();
  return (
    <div className="preferences-workspace">
      <PageHeading
        eyebrow="Your reminders"
        title="Learning, on your terms."
        description="Choose the little nudges that help you make room for practice."
      />
      {settings.loading ? (
        <ContentState
          loading
          description="Opening your reminder preferences…"
        />
      ) : (
        <section className="learning-paper preference-settings">
          {options.map((option) => (
            <PreferenceToggle
              key={option.key}
              title={option.title}
              description={option.description}
              checked={settings.preferences[option.key]}
              disabled={settings.disabled}
              onChange={() => settings.toggle(option.key)}
            />
          ))}
          <Button onClick={settings.save} disabled={settings.disabled}>
            {settings.saving ? (
              <>
                <Loader2 size={16} className="animate-spin mr-2" />
                Saving…
              </>
            ) : (
              "Save preferences"
            )}
          </Button>
        </section>
      )}
    </div>
  );
}
