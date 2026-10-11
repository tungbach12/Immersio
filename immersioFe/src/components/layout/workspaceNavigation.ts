import {
  Home,
  BookOpen,
  User,
  BarChart2,
  Layers,
  Cpu,
  Book,
  Brain,
  Mic,
  CreditCard,
} from "lucide-react";
import type { WorkspaceLink } from "./WorkspaceSidebar";

export const STUDENT_LINKS: WorkspaceLink[] = [
  {
    icon: Home,
    label: "My learning",
    mobileLabel: "Home",
    path: "/student/dashboard",
  },
  {
    icon: BookOpen,
    label: "Conversations",
    mobileLabel: "Learn",
    path: "/student/scenarios",
  },
  {
    icon: Brain,
    label: "Word collection",
    mobileLabel: "Words",
    path: "/student/flashcards",
  },
  {
    icon: Mic,
    label: "Speaking practice",
    mobileLabel: "Speak",
    path: "/student/vocal-lab",
  },
  { icon: Book, label: "Dictionary", path: "/student/dictionary" },
  {
    icon: User,
    label: "My profile",
    mobileLabel: "Profile",
    path: "/student/profile",
  },
];
export const ADMIN_LINKS: WorkspaceLink[] = [
  { icon: BarChart2, label: "Overview", path: "/admin/dashboard" },
  { icon: User, label: "Learners", path: "/admin/users" },
  { icon: CreditCard, label: "Transactions", path: "/admin/transactions" },
  { icon: Layers, label: "Conversations", path: "/admin/scenarios" },
  { icon: Cpu, label: "AI settings", path: "/admin/ai-tuning" },
];
export function isWorkspaceLinkActive(pathname: string, path: string) {
  return pathname === path || pathname.startsWith(path + "/");
}
export function workspacePageTitle(pathname: string, links: WorkspaceLink[]) {
  return (
    links.find((link) => isWorkspaceLinkActive(pathname, link.path))?.label ||
    ({
      "/student/subscription": "Your plan",
      "/student/notifications": "Notifications",
      "/student/help": "Help & support",
    }[pathname] ??
      "Learning space")
  );
}
