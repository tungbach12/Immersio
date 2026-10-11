import { useEffect, useState } from "react";
import { useWorkspaceUser } from "@/components/layout/WorkspaceUserContext";
import { useToast } from "@/components/ui/Toast";
import { authService } from "@/services/auth";

type Preferences = {
  notifEmail: boolean;
  notifPush: boolean;
  notifStreak: boolean;
  notifTips: boolean;
};
export function useNotificationPreferences() {
  const { user, setUser, loading } = useWorkspaceUser();
  const { showToast } = useToast();
  const [preferences, setPreferences] = useState<Preferences>({
    notifEmail: true,
    notifPush: true,
    notifStreak: true,
    notifTips: false,
  });
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (user)
      setPreferences({
        notifEmail: user.notifEmail !== false,
        notifPush: user.notifPush !== false,
        notifStreak: user.notifStreak !== false,
        notifTips: user.notifTips === true,
      });
  }, [user]);
  function toggle(key: keyof Preferences) {
    const next = !preferences[key];
    setPreferences((previous) => ({ ...previous, [key]: next }));
    if (
      key === "notifPush" &&
      next &&
      "Notification" in window &&
      Notification.permission === "default"
    )
      void Notification.requestPermission();
  }
  async function save() {
    if (saving || loading || !user) return;
    setSaving(true);
    try {
      const updated = await authService.updateSettings(preferences);
      authService.updateUser(updated);
      setUser(updated);
      showToast("Your reminder preferences have been saved.", "success");
    } catch (cause) {
      showToast(
        cause instanceof Error
          ? cause.message
          : "Your preferences could not be saved.",
        "error",
      );
    } finally {
      setSaving(false);
    }
  }
  return {
    preferences,
    toggle,
    save,
    saving,
    loading,
    disabled: loading || saving || !user,
  };
}
