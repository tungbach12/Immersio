import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { WorkspaceLink } from "./WorkspaceSidebar";
import { isWorkspaceLinkActive } from "./workspaceNavigation";

export function WorkspaceMobileNavigation({
  links,
  pathname,
  isAdmin,
  menuOpen,
}: {
  links: WorkspaceLink[];
  pathname: string;
  isAdmin: boolean;
  menuOpen: boolean;
}) {
  const visible = isAdmin ? links : links.filter((link) => link.mobileLabel);
  return (
    <nav
      className="workspace-mobile-nav"
      aria-label={
        isAdmin ? "Admin quick navigation" : "Learning quick navigation"
      }
      inert={menuOpen ? true : undefined}
    >
      {visible.map((link) => {
        const active = isWorkspaceLinkActive(pathname, link.path);
        return (
          <Link
            to={link.path}
            key={link.path}
            className={cn(active && "is-active")}
            aria-current={active ? "page" : undefined}
          >
            <link.icon size={20} strokeWidth={active ? 2 : 1.7} />
            <span>{link.mobileLabel || link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
