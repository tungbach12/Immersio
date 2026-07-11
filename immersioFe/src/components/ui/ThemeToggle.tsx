import React from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme, ThemeMode } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

const OPTIONS: { mode: ThemeMode; icon: React.ReactNode; label: string }[] = [
  { mode: "light",  icon: <Sun  size={14} />, label: "Light"  },
  { mode: "dark",   icon: <Moon size={14} />, label: "Dark"   },
  { mode: "system", icon: <Monitor size={14} />, label: "System" },
];

export function ThemeToggle({ collapsed = false }: { collapsed?: boolean }) {
  const { mode, setMode } = useTheme();

  return (
    <div className={cn(
      "flex items-center gap-1 p-1 rounded-xl bg-black/10 dark:bg-white/5 border border-black/10 dark:border-white/5",
      collapsed ? "flex-col" : "flex-row"
    )}>
      {OPTIONS.map(({ mode: m, icon, label }) => (
        <button
          key={m}
          type="button"
          onClick={() => setMode(m)}
          title={label}
          className={cn(
            "flex items-center justify-center gap-1.5 rounded-lg transition-all",
            collapsed ? "h-8 w-8" : "h-7 px-2.5 gap-1",
            mode === m
              ? "bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-sm"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          )}
        >
          {icon}
          {!collapsed && <span className="text-[9px] font-black uppercase tracking-wider">{label}</span>}
        </button>
      ))}
    </div>
  );
}
