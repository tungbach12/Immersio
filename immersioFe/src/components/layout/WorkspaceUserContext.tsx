import {
  createContext,
  useContext,
  useEffect,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { useLocation } from "react-router-dom";
import { authService, type UserDto } from "@/services/auth";

interface WorkspaceUserValue {
  user: UserDto | null;
  setUser: Dispatch<SetStateAction<UserDto | null>>;
  loading: boolean;
}
const WorkspaceUserContext = createContext<WorkspaceUserValue | null>(null);

export function WorkspaceUserProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const [user, setUser] = useState<UserDto | null>(() => {
    try {
      return authService.getUser();
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    setLoading(true);
    authService
      .getMe()
      .then((latest) => {
        if (active) {
          authService.updateUser(latest);
          setUser(latest);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [pathname]);
  return (
    <WorkspaceUserContext.Provider value={{ user, setUser, loading }}>
      {children}
    </WorkspaceUserContext.Provider>
  );
}

export function useWorkspaceUser() {
  const context = useContext(WorkspaceUserContext);
  if (!context)
    throw new Error("useWorkspaceUser requires WorkspaceUserProvider.");
  return context;
}
