import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { ToastProvider } from "@/components/ui/Toast";

const Intro = lazy(() => import("@/pages/Intro"));
const Onboarding = lazy(() => import("@/pages/Onboarding"));
const Login = lazy(() => import("@/pages/auth/Login"));
const Register = lazy(() => import("@/pages/auth/Register"));
const ForgotPassword = lazy(() => import("@/pages/auth/ForgotPassword"));
const PayOsReturn = lazy(() => import("@/pages/payment/PayOsReturn"));
const StudentDashboard = lazy(() => import("@/pages/student/Dashboard"));
const Scenarios = lazy(() => import("@/pages/student/Scenarios"));
const ScenarioDetail = lazy(() => import("@/pages/student/ScenarioDetail"));
const VocalLab = lazy(() => import("@/pages/student/VocalLab"));
const FlashcardsPage = lazy(() => import("@/pages/student/FlashcardsPage"));
const DictionaryPage = lazy(() => import("@/pages/student/DictionaryPage"));
const Profile = lazy(() => import("@/pages/student/Profile"));
const Subscription = lazy(() => import("@/pages/student/Subscription"));
const Notifications = lazy(() => import("@/pages/student/Notifications"));
const HelpCenter = lazy(() => import("@/pages/student/Help"));
const AdminDashboard = lazy(() => import("@/pages/admin/Dashboard"));
const AITuning = lazy(() => import("@/pages/admin/AITuning"));
const UsersManagement = lazy(() => import("@/pages/admin/UsersManagement"));
const TransactionsManagement = lazy(() => import("@/pages/admin/TransactionsManagement"));
const ScenarioBuilder = lazy(() => import("@/pages/admin/ScenarioBuilder"));
const PrivacyPolicy = lazy(() => import("@/pages/legal/PrivacyPolicy"));
const DeleteAccount = lazy(() => import("@/pages/legal/DeleteAccount"));

function PageLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-label="Loading page">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
    </div>
  );
}

function ThemeManager() {
  const location = useLocation();
  useEffect(() => {
    const isAdmin = location.pathname.startsWith("/admin");
    if (isAdmin) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [location]);
  return null;
}

export default function App() {
  return (
    <ToastProvider>
      <Router>
      <ThemeManager />
      <Suspense fallback={<PageLoading />}>
        <Routes>
        <Route path="/" element={<Intro />} />
        <Route path="/intro" element={<Intro />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/payment/payos-return" element={<PayOsReturn />} />
        <Route path="/onboarding" element={<Onboarding />} />
        {/* Legal pages — bắt buộc cho Google Play Data Safety */}
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/delete-account" element={<DeleteAccount />} />
        
        {/* Student Routes */}
        <Route path="/student" element={<AppLayout />}>
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="scenarios" element={<Scenarios />} />
          <Route path="scenarios/:id" element={<ScenarioDetail />} />
          <Route path="vocal-lab" element={<VocalLab />} />
          <Route path="flashcards" element={<FlashcardsPage />} />
          <Route path="flashcards/:deckId" element={<FlashcardsPage />} />
          <Route path="dictionary" element={<DictionaryPage />} />
          <Route path="profile" element={<Profile />} />
          <Route path="subscription" element={<Subscription />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="help" element={<HelpCenter />} />
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={<AppLayout />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<UsersManagement />} />
          <Route path="transactions" element={<TransactionsManagement />} />
          <Route path="scenarios" element={<ScenarioBuilder />} />
          <Route path="ai-tuning" element={<AITuning />} />
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>
        </Routes>
      </Suspense>
      </Router>
    </ToastProvider>
  );
}
