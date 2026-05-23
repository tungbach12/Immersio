import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import Splash from "@/pages/Splash";
import Intro from "@/pages/Intro";
import Onboarding from "@/pages/Onboarding";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import StudentDashboard from "@/pages/student/Dashboard";
import Scenarios from "@/pages/student/Scenarios";
import ScenarioDetail from "@/pages/student/ScenarioDetail";
import Practice from "@/pages/student/Practice";
import FlashcardsPage from "@/pages/student/FlashcardsPage";
import Profile from "@/pages/student/Profile";
import Subscription from "@/pages/student/Subscription";
import AdminDashboard from "@/pages/admin/Dashboard";
import AITuning from "@/pages/admin/AITuning";
import UsersManagement from "@/pages/admin/UsersManagement";
import ScenarioBuilder from "@/pages/admin/ScenarioBuilder";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Intro />} />
        <Route path="/intro" element={<Intro />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/onboarding" element={<Onboarding />} />
        
        {/* Student Routes */}
        <Route path="/student" element={<AppLayout />}>
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="scenarios" element={<Scenarios />} />
          <Route path="scenarios/:id" element={<ScenarioDetail />} />
          <Route path="practice" element={<Practice />} />
          <Route path="flashcards" element={<FlashcardsPage />} />
          <Route path="flashcards/:deckId" element={<FlashcardsPage />} />
          <Route path="profile" element={<Profile />} />
          <Route path="subscription" element={<Subscription />} />
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={<AppLayout />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<UsersManagement />} />
          <Route path="scenarios" element={<ScenarioBuilder />} />
          <Route path="ai-tuning" element={<AITuning />} />
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}
