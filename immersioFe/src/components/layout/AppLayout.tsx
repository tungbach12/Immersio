import { useState, useEffect, useRef, useCallback } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { MotionConfig } from "motion/react";
import { authService } from "@/services/auth";
import { useDrawerFocus } from "@/hooks/useDrawerFocus";
import { cn } from "@/lib/utils";
import { WorkspaceSidebar } from "./WorkspaceSidebar";
import { WorkspaceHeader, WorkspaceMobileHeader } from "./WorkspaceHeader";
import { WorkspaceMobileNavigation } from "./WorkspaceMobileNavigation";
import {
  WorkspaceUserProvider,
  useWorkspaceUser,
} from "./WorkspaceUserContext";
import {
  ADMIN_LINKS,
  STUDENT_LINKS,
  workspacePageTitle,
} from "./workspaceNavigation";

function WorkspaceShell() {
  const { pathname } = useLocation(),
    navigate = useNavigate();
  const { user } = useWorkspaceUser();
  const isAdmin = pathname.startsWith("/admin");
  const immersive = /^\/student\/scenarios\/[^/]+/.test(pathname);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null),
    mainRef = useRef<HTMLElement>(null);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  useDrawerFocus(menuOpen, sidebarRef, closeMenu);
  const links = isAdmin ? ADMIN_LINKS : STUDENT_LINKS;

  useEffect(() => {
    setMenuOpen(false);
    mainRef.current?.scrollTo({ top: 0 });
  }, [pathname]);
  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const closeOnDesktop = () => {
      if (media.matches) setMenuOpen(false);
    };
    media.addEventListener("change", closeOnDesktop);
    return () => media.removeEventListener("change", closeOnDesktop);
  }, []);
  async function signOut() {
    setLoggingOut(true);
    try {
      await authService.revokeToken();
    } finally {
      authService.clearSession();
      navigate("/login", { replace: true });
    }
  }

  return (
    <MotionConfig reducedMotion="user">
      <div
        className={cn(
          "learning-workspace",
          isAdmin && "workspace-admin",
          immersive && "workspace-immersive",
        )}
      >
        <a className="workspace-skip" href="#workspace-content">
          Skip to content
        </a>
        {!immersive && (
          <>
            {menuOpen && (
              <button
                className="workspace-menu-overlay"
                type="button"
                onClick={closeMenu}
                aria-label="Close navigation menu"
              />
            )}
            <WorkspaceSidebar
              ref={sidebarRef}
              links={links}
              pathname={pathname}
              user={user}
              isAdmin={isAdmin}
              open={menuOpen}
              loggingOut={loggingOut}
              onClose={closeMenu}
              onLogout={signOut}
            />
            <WorkspaceMobileHeader
              isAdmin={isAdmin}
              menuOpen={menuOpen}
              onOpenMenu={() => setMenuOpen(true)}
            />
          </>
        )}
        <main
          ref={mainRef}
          className="workspace-main"
          inert={menuOpen ? true : undefined}
        >
          {!immersive && (
            <WorkspaceHeader
              isAdmin={isAdmin}
              title={workspacePageTitle(pathname, links)}
              user={user}
            />
          )}
          <div
            id="workspace-content"
            className="workspace-content"
            tabIndex={-1}
          >
            <Outlet />
          </div>
        </main>
        {!immersive && (
          <WorkspaceMobileNavigation
            links={links}
            pathname={pathname}
            isAdmin={isAdmin}
            menuOpen={menuOpen}
          />
        )}
      </div>
    </MotionConfig>
  );
}

export default function AppLayout() {
  return (
    <WorkspaceUserProvider>
      <WorkspaceShell />
    </WorkspaceUserProvider>
  );
}
