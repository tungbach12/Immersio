import { useCallback, useEffect, useRef, useState } from "react";
import { adminService, type AdminDashboardStats } from "@/services/admin";

export function useAdminDashboard() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const request = useRef(0);
  const reload = useCallback(async () => {
    const requestId = ++request.current;
    setLoading(true);
    setError(false);
    try {
      const data = await adminService.getDashboardStats();
      if (requestId === request.current) setStats(data);
    } catch {
      if (requestId === request.current) setError(true);
    } finally {
      if (requestId === request.current) setLoading(false);
    }
  }, []);
  useEffect(() => {
    void reload();
    return () => {
      ++request.current;
    };
  }, [reload]);
  return { stats, loading, error, reload };
}
