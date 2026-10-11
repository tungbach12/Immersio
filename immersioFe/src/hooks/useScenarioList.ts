import { useCallback, useEffect, useRef, useState } from "react";
import { scenarioService, type Scenario } from "@/services/scenario";

export function useScenarioList() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const request = useRef(0);
  const reload = useCallback(async () => {
    const requestId = ++request.current;
    setLoading(true);
    setError(false);
    try {
      const data = await scenarioService.getScenarios();
      if (requestId === request.current) setScenarios(data);
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
  return { scenarios, loading, error, reload };
}
