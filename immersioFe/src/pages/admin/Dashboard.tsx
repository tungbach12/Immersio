import { PageHeading } from "@/components/learning/PageHeading";
import { ContentState } from "@/components/learning/ContentState";
import { AdminSummary } from "@/features/admin/components/AdminSummary";
import { AdminActivityCharts } from "@/features/admin/components/AdminActivityCharts";
import { useAdminDashboard } from "@/features/admin/hooks/useAdminDashboard";

export default function AdminDashboard() {
  const dashboard = useAdminDashboard();
  return (
    <div>
      <PageHeading
        eyebrow="Behind every good learning day"
        title="Your learning workspace, in view."
        description="A closer look at learners, conversations and the community you’re helping grow."
      />
      {dashboard.loading ? (
        <ContentState loading description="Opening workspace analytics…" />
      ) : dashboard.error || !dashboard.stats ? (
        <ContentState
          title="A moment to reconnect."
          description="Workspace analytics could not be loaded."
          onRetry={dashboard.reload}
        />
      ) : (
        <>
          <AdminSummary stats={dashboard.stats} />
          <AdminActivityCharts stats={dashboard.stats} />
        </>
      )}
    </div>
  );
}
