import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { PublicLayout } from "./layouts/PublicLayout";
import { HomePage } from "./pages/HomePage";

const AboutPage = lazy(() => import("./pages/AboutPage").then((module) => ({ default: module.AboutPage })));
const AdminPanel = lazy(() => import("./pages/AdminPanel").then((module) => ({ default: module.AdminPanel })));
const AdminAnalyticsPage = lazy(() => import("./pages/AdminAnalyticsPage").then((module) => ({ default: module.AdminAnalyticsPage })));
const AdminCertificatesPage = lazy(() => import("./pages/AdminCertificatesPage").then((module) => ({ default: module.AdminCertificatesPage })));
const AdminJudgesPage = lazy(() => import("./pages/AdminJudgesPage").then((module) => ({ default: module.AdminJudgesPage })));
const AdminPaymentsPage = lazy(() => import("./pages/AdminPaymentsPage").then((module) => ({ default: module.AdminPaymentsPage })));
const AdminRegistrationsPage = lazy(() => import("./pages/AdminRegistrationsPage").then((module) => ({ default: module.AdminRegistrationsPage })));
const AdminLoginPage = lazy(() => import("./pages/AdminLoginPage").then((module) => ({ default: module.AdminLoginPage })));
const AdminSettingsPage = lazy(() => import("./pages/AdminSettingsPage").then((module) => ({ default: module.AdminSettingsPage })));
const AdminTeamsPage = lazy(() => import("./pages/AdminTeamsPage").then((module) => ({ default: module.AdminTeamsPage })));
const ContactPage = lazy(() => import("./pages/ContactPage").then((module) => ({ default: module.ContactPage })));
const CopyrightRightsPage = lazy(() => import("./pages/CopyrightRightsPage").then((module) => ({ default: module.CopyrightRightsPage })));
const ExploreTeamsPage = lazy(() => import("./pages/ExploreTeamsPage").then((module) => ({ default: module.ExploreTeamsPage })));
const FaqPage = lazy(() => import("./pages/FaqPage").then((module) => ({ default: module.FaqPage })));
const HackathonRegistrationPage = lazy(() => import("./pages/HackathonRegistrationPage").then((module) => ({ default: module.HackathonRegistrationPage })));
const JudgeAssignedTeamsPage = lazy(() => import("./pages/JudgeAssignedTeamsPage").then((module) => ({ default: module.JudgeAssignedTeamsPage })));
const JudgeLeaderboardPage = lazy(() => import("./pages/JudgeLeaderboardPage").then((module) => ({ default: module.JudgeLeaderboardPage })));
const JudgePanel = lazy(() => import("./pages/JudgePanel").then((module) => ({ default: module.JudgePanel })));
const JudgeScoreSubmissionPage = lazy(() => import("./pages/JudgeScoreSubmissionPage").then((module) => ({ default: module.JudgeScoreSubmissionPage })));
const LoginPage = lazy(() => import("./pages/LoginPage").then((module) => ({ default: module.LoginPage })));
const MyTeamPage = lazy(() => import("./pages/MyTeamPage").then((module) => ({ default: module.MyTeamPage })));
const PaymentStatusPage = lazy(() => import("./pages/PaymentStatusPage").then((module) => ({ default: module.PaymentStatusPage })));
const ParticipantPanel = lazy(() => import("./pages/ParticipantPanel").then((module) => ({ default: module.ParticipantPanel })));
const ProfilePage = lazy(() => import("./pages/ProfilePage").then((module) => ({ default: module.ProfilePage })));
const RegisterPage = lazy(() => import("./pages/RegisterPage").then((module) => ({ default: module.RegisterPage })));
const RefundPolicyPage = lazy(() => import("./pages/RefundPolicyPage").then((module) => ({ default: module.RefundPolicyPage })));
const RulesPage = lazy(() => import("./pages/RulesPage").then((module) => ({ default: module.RulesPage })));
const SchedulePage = lazy(() => import("./pages/SchedulePage").then((module) => ({ default: module.SchedulePage })));
const SimpleInfoPage = lazy(() => import("./pages/SimpleInfoPage").then((module) => ({ default: module.SimpleInfoPage })));
const TermsAndConditionsPage = lazy(() => import("./pages/TermsAndConditionsPage").then((module) => ({ default: module.TermsAndConditionsPage })));
const ThemePage = lazy(() => import("./pages/ThemePage").then((module) => ({ default: module.ThemePage })));

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
    <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-10 text-center text-slate-600">Loading page...</div>}>
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
    </Suspense>
  );
}

export default App;
