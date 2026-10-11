import { Camera, Loader2 } from "lucide-react";
import { userInitials } from "@/components/layout/WorkspaceSidebar";
import type { useProfile } from "../hooks/useProfile";

type Props = Pick<
  ReturnType<typeof useProfile>,
  "user" | "fileInputRef" | "uploading" | "changeAvatar"
>;

export function ProfileIdentity({
  user,
  fileInputRef,
  uploading,
  changeAvatar,
}: Props) {
  return (
    <section className="learning-paper profile-identity">
      <div className="profile-photo">
        <span>
          {user?.profilePictureUrl ? (
            <img
              src={user.profilePictureUrl}
              alt={`${user.username}'s profile photo`}
            />
          ) : (
            userInitials(user?.username)
          )}
        </span>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          tabIndex={-1}
          onChange={changeAvatar}
          aria-label="Choose profile photo"
        />
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          aria-label={
            uploading ? "Uploading profile photo" : "Change profile photo"
          }
        >
          {uploading ? (
            <Loader2 size={17} className="animate-spin" />
          ) : (
            <Camera size={17} />
          )}
        </button>
      </div>
      <div>
        <p className="workspace-eyebrow">
          A learner, a little braver every day
        </p>
        <h2>{user?.username || "Your profile"}</h2>
        <p className="profile-email">{user?.email || ""}</p>
        <span className="profile-membership">
          Immersio {user?.subscriptionTier || "Basic"}
        </span>
      </div>
    </section>
  );
}
