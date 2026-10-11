import { Link } from "react-router-dom";
import { Bell, ChevronRight, Menu } from "lucide-react";
import type { UserDto } from "@/services/auth";
import { WorkspaceBrand, userInitials } from "./WorkspaceSidebar";

export function WorkspaceHeader({
  isAdmin,
  title,
  user,
}: {
  isAdmin: boolean;
  title: string;
  user: UserDto | null;
}) {
  return (
    <header className="workspace-topbar">
      <div className="workspace-breadcrumb">
        <span>{isAdmin ? "Workspace" : "Your learning space"}</span>
        <ChevronRight size={13} />
        <strong>{title}</strong>
      </div>
      <div className="workspace-topbar-actions">
        <span className="workspace-today">
          {new Intl.DateTimeFormat("en", {
            weekday: "short",
            month: "short",
            day: "numeric",
          }).format(new Date())}
        </span>
        {!isAdmin && (
          <Link
            to="/student/notifications"
            className="workspace-icon-button"
            aria-label="Notifications"
          >
            <Bell size={19} />
          </Link>
        )}
        {isAdmin ? (
          <span className="workspace-avatar">
            {userInitials(user?.username)}
          </span>
        ) : (
          <Link
            to="/student/profile"
            className="workspace-avatar"
            aria-label="My profile"
          >
            {user?.profilePictureUrl ? (
              <img src={user.profilePictureUrl} alt="" />
            ) : (
              userInitials(user?.username)
            )}
          </Link>
        )}
      </div>
    </header>
  );
}

export function WorkspaceMobileHeader({
  isAdmin,
  menuOpen,
  onOpenMenu,
}: {
  isAdmin: boolean;
  menuOpen: boolean;
  onOpenMenu: () => void;
}) {
  return (
    <header className="workspace-mobile-header">
      <button
        type="button"
        className="workspace-icon-button"
        onClick={onOpenMenu}
        aria-label="Open navigation menu"
        aria-expanded={menuOpen}
      >
        <Menu size={21} />
      </button>
      <Link
        to={isAdmin ? "/admin/dashboard" : "/student/dashboard"}
        aria-label="Immersio dashboard"
      >
        <WorkspaceBrand />
      </Link>
      {!isAdmin ? (
        <Link
          to="/student/notifications"
          className="workspace-icon-button"
          aria-label="Notifications"
        >
          <Bell size={19} />
        </Link>
      ) : (
        <span className="workspace-admin-label">Admin</span>
      )}
    </header>
  );
}
