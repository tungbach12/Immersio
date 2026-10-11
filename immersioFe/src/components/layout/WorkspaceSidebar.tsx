import { forwardRef } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  ArrowUpRight,
  HelpCircle,
  LogOut,
  X,
  type LucideIcon,
} from "lucide-react";
import type { UserDto } from "@/services/auth";
import { cn } from "@/lib/utils";

export interface WorkspaceLink {
  icon: LucideIcon;
  label: string;
  mobileLabel?: string;
  path: string;
}
export function userInitials(name = "Learner") {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .filter((_, index, all) => index === 0 || index === all.length - 1)
      .join("")
      .toUpperCase() || "L"
  );
}
export function WorkspaceBrand() {
  return (
    <span className="workspace-brand">
      <span className="workspace-brand-mark" aria-hidden="true">
        <BookOpen size={24} strokeWidth={1.5} />
      </span>
      <span>
        Immersio<span className="workspace-brand-dot">.</span>
      </span>
    </span>
  );
}

interface SidebarProps {
  links: WorkspaceLink[];
  pathname: string;
  user: UserDto | null;
  isAdmin: boolean;
  open: boolean;
  loggingOut: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export const WorkspaceSidebar = forwardRef<HTMLElement, SidebarProps>(
  function WorkspaceSidebar(
    { links, pathname, user, isAdmin, open, loggingOut, onClose, onLogout },
    ref,
  ) {
    return (
      <aside
        ref={ref}
        className={cn("workspace-sidebar", open && "is-open")}
        role={open ? "dialog" : undefined}
        aria-modal={open ? true : undefined}
        aria-label={isAdmin ? "Administration menu" : "Learning menu"}
      >
        <div className="workspace-sidebar-brand">
          <Link to="/" aria-label="Immersio home" onClick={onClose}>
            <WorkspaceBrand />
          </Link>
          <button
            type="button"
            className="workspace-drawer-close"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X size={21} />
          </button>
        </div>
        <p className="workspace-sidebar-caption">
          {isAdmin
            ? "Behind every good learning day."
            : "A little English. Every day."}
        </p>
        <nav
          className="workspace-sidebar-nav"
          aria-label={isAdmin ? "Administration" : "Your learning"}
        >
          <p className="workspace-nav-label">
            {isAdmin ? "Your workspace" : "Your learning space"}
          </p>
          {links.map((link) => {
            const active =
              pathname === link.path || pathname.startsWith(link.path + "/");
            return (
              <Link
                key={link.path}
                to={link.path}
                aria-current={active ? "page" : undefined}
                className={cn("workspace-nav-link", active && "is-active")}
                onClick={onClose}
              >
                <link.icon size={19} strokeWidth={1.7} />
                <span>{link.label}</span>
                {active && (
                  <span className="workspace-active-dot" aria-hidden="true" />
                )}
              </Link>
            );
          })}
        </nav>
        {!isAdmin && (
          <div className="workspace-sidebar-note">
            <span className="workspace-note-star" aria-hidden="true">
              ✦
            </span>
            <p>
              Make room for
              <br />a little possibility.
            </p>
            <Link to="/student/subscription" onClick={onClose}>
              Explore your plan <ArrowUpRight size={14} />
            </Link>
          </div>
        )}
        <div className="workspace-sidebar-bottom">
          {!isAdmin && (
            <Link
              to="/student/help"
              className="workspace-support"
              onClick={onClose}
            >
              <HelpCircle size={17} /> Help & support <ArrowUpRight size={13} />
            </Link>
          )}
          <div className="workspace-user">
            <span className="workspace-avatar">
              {user?.profilePictureUrl ? (
                <img src={user.profilePictureUrl} alt="" />
              ) : (
                userInitials(user?.username)
              )}
            </span>
            <span>
              <strong>
                {user?.username || (isAdmin ? "Administrator" : "Learner")}
              </strong>
              <small>
                {isAdmin
                  ? "Administration"
                  : user?.subscriptionTier || "Your learning journey"}
              </small>
            </span>
          </div>
          <button
            type="button"
            className="workspace-logout"
            onClick={onLogout}
            disabled={loggingOut}
          >
            <LogOut size={16} />
            {loggingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </aside>
    );
  },
);
