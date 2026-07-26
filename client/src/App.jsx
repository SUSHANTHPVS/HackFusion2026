import { Navigate, Route, Routes } from "react-router-dom";
import { AboutPage } from "./pages/AboutPage";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { PublicLayout } from "./layouts/PublicLayout";
import { AdminPanel } from "./pages/AdminPanel";
import { AdminAnalyticsPage } from "./pages/AdminAnalyticsPage";
import { AdminCertificatesPage } from "./pages/AdminCertificatesPage";
import { AdminJudgesPage } from "./pages/AdminJudgesPage";
import { AdminPaymentsPage } from "./pages/AdminPaymentsPage";
import { AdminRegistrationsPage } from "./pages/AdminRegistrationsPage";
import { AdminLoginPage } from "./pages/AdminLoginPage";
import { AdminSettingsPage } from "./pages/AdminSettingsPage";
import { AdminTeamsPage } from "./pages/AdminTeamsPage";
import { ContactPage } from "./pages/ContactPage";
import { CopyrightRightsPage } from "./pages/CopyrightRightsPage";
import { ExploreTeamsPage } from "./pages/ExploreTeamsPage";
import { FaqPage } from "./pages/FaqPage";
import { HackathonRegistrationPage } from "./pages/HackathonRegistrationPage";
import { HomePage } from "./pages/HomePage";
import { JudgeAssignedTeamsPage } from "./pages/JudgeAssignedTeamsPage";
import { JudgeLeaderboardPage } from "./pages/JudgeLeaderboardPage";
import { JudgePanel } from "./pages/JudgePanel";
import { JudgeScoreSubmissionPage } from "./pages/JudgeScoreSubmissionPage";
import { LoginPage } from "./pages/LoginPage";
import { MyTeamPage } from "./pages/MyTeamPage";
import { PaymentStatusPage } from "./pages/PaymentStatusPage";
import { ParticipantPanel } from "./pages/ParticipantPanel";
import { ProfilePage } from "./pages/ProfilePage";
import { RegisterPage } from "./pages/RegisterPage";
import { RefundPolicyPage } from "./pages/RefundPolicyPage";
import { RulesPage } from "./pages/RulesPage";
import { SchedulePage } from "./pages/SchedulePage";
import { SimpleInfoPage } from "./pages/SimpleInfoPage";
import { TermsAndConditionsPage } from "./pages/TermsAndConditionsPage";
import { ThemePage } from "./pages/ThemePage";

const participantNav = [
  { to: "/participant", label: "Dashboard" },
  { to: "/participant/my-team", label: "My Team" },
  { to: "/participant/explore-teams", label: "Explore Teams" },
  { to: "/participant/payment-status", label: "Payment Status" },
  { to: "/participant/profile", label: "Profile" }
];

const adminNav = [
  { to: "/admin", label: "Dashboard" },
  { to: "/admin/registrations", label: "Registrations" },
  { to: "/admin/payments", label: "Payments" },
  { to: "/admin/teams", label: "Teams" },
  { to: "/admin/judges", label: "Judges" },
  { to: "/admin/certificates", label: "Certificates" },
  { to: "/admin/analytics", label: "Analytics" },
  { to: "/admin/settings", label: "Settings" }
];

const judgeNav = [
  { to: "/judge", label: "Assigned Teams" },
  { to: "/judge/score-submission", label: "Score Submission" },
  { to: "/judge/leaderboard", label: "Leaderboard" }
];

function info(title, description) {
  return <SimpleInfoPage title={title} description={description} />;
}

function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/theme" element={<ThemePage />} />
        <Route path="/schedule" element={<SchedulePage />} />
        <Route path="/rules" element={<RulesPage />} />
        <Route path="/faq" element={<FaqPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/terms-and-conditions" element={<TermsAndConditionsPage />} />
        <Route path="/refund-policy" element={<RefundPolicyPage />} />
        <Route path="/copyright-rights" element={<CopyrightRightsPage />} />
        <Route path="/sponsors" element={info("Sponsors", "Our sponsors and partnership opportunities.")} />
        <Route path="/hackathon-register" element={<HackathonRegistrationPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />

        <Route
          path="/participant"
          element={
            <ProtectedRoute roles={["participant"]}>
              <DashboardLayout title="Participant" navItems={participantNav} />
            </ProtectedRoute>
          }
        >
          <Route index element={<ParticipantPanel />} />
          <Route path="my-team" element={<MyTeamPage />} />
          <Route path="explore-teams" element={<ExploreTeamsPage />} />
          <Route path="payment-status" element={<PaymentStatusPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={["admin"]}>
              <DashboardLayout title="Admin" navItems={adminNav} />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminPanel />} />
          <Route path="registrations" element={<AdminRegistrationsPage />} />
          <Route path="payments" element={<AdminPaymentsPage />} />
          <Route path="teams" element={<AdminTeamsPage />} />
          <Route path="judges" element={<AdminJudgesPage />} />
          <Route path="certificates" element={<AdminCertificatesPage />} />
          <Route path="analytics" element={<AdminAnalyticsPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
        </Route>

        <Route
          path="/judge"
          element={
            <ProtectedRoute roles={["judge"]}>
              <DashboardLayout title="Judge" navItems={judgeNav} />
            </ProtectedRoute>
          }
        >
          <Route index element={<JudgePanel />} />
          <Route path="assigned-teams" element={<JudgeAssignedTeamsPage />} />
          <Route path="score-submission" element={<JudgeScoreSubmissionPage />} />
          <Route path="leaderboard" element={<JudgeLeaderboardPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
