import { useRef, useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useWorkspaceUser } from "@/components/layout/WorkspaceUserContext";
import { authService } from "@/services/auth";
import { uploadImage } from "@/services/upload";

export function useProfile() {
  const { user, setUser } = useWorkspaceUser();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState("");

  async function changeAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
      setError("Choose an image smaller than 5 MB.");
      event.target.value = "";
      return;
    }
    setUploading(true);
    try {
      const url = await uploadImage(file, "immersio/avatars");
      const updated = await authService.updateAvatar(url);
      authService.updateUser(updated);
      setUser(updated);
    } catch {
      setError("Your photo could not be uploaded. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function signOut() {
    setLoggingOut(true);
    try {
      await authService.revokeToken();
    } finally {
      authService.clearSession();
      navigate("/login", { replace: true });
    }
  }
  return {
    user,
    fileInputRef,
    uploading,
    loggingOut,
    error,
    changeAvatar,
    signOut,
  };
}
