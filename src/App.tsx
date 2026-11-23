import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { ROLE_HOME, StoreProvider, useStore } from "@/lib/store";
import { ScrollToTop, ToastHost } from "@/components/SiteLayout";
import Home from "@/pages/Home";
import Auth from "@/pages/Auth";
import ResetPassword from "@/pages/ResetPassword";
import Expos from "@/pages/Expos";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import ExhibitorDirectory from "@/pages/ExhibitorDirectory";
import ExhibitorProfile from "@/pages/ExhibitorProfile";
import ExpoDetail from "@/pages/ExpoDetail";
import FloorPlanPage from "@/pages/FloorPlanPage";
import SchedulePage from "@/pages/SchedulePage";
import SupportPage from "@/pages/SupportPage";
import AdminLayout from "@/pages/admin/AdminLayout";
import AdminOverview from "@/pages/admin/AdminOverview";
import AdminExpos from "@/pages/admin/AdminExpos";
import AdminExhibitors from "@/pages/admin/AdminExhibitors";
import AdminAttendees from "@/pages/admin/AdminAttendees";
import AdminFeedback from "@/pages/admin/AdminFeedback";
import AdminSchedule from "@/pages/admin/AdminSchedule";
import AdminFloorPlan from "@/pages/admin/AdminFloorPlan";
import AdminAnalytics from "@/pages/admin/AdminAnalytics";
import AdminMessages from "@/pages/admin/AdminMessages";
import AdminSettings from "@/pages/admin/AdminSettings";
import ExhibitorPortal from "@/pages/ExhibitorPortal";
import AttendeePortal from "@/pages/AttendeePortal";

function RequireRole({ role, children }: { role: "organizer" | "exhibitor" | "attendee"; children: React.ReactNode }) {
  const { user, hydrating } = useStore();

  // wait for the session restore before deciding
  if (hydrating) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-100">
        <div className="flex flex-col items-center gap-4">
          <span className="relative grid size-14 place-items-center">
            <span className="absolute inset-0 animate-ping rounded-2xl bg-brand-400/30" />
            <span className="relative grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-lg shadow-brand-600/30">
              <svg viewBox="0 0 24 24" className="size-6 text-white" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M3 20h18" /><path d="M6 20V9l6-5 6 5v11" /><path d="M10 20v-6h4v6" />
              </svg>
            </span>
          </span>
          <div className="text-center">
            <p className="font-display text-[15px] font-bold text-slate-900">EventSphere</p>
            <p className="mt-1 text-[12.5px] text-slate-500">Restoring your session…</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to={`/login?role=${role}`} replace />;
  // send the user to their own portal rather than bouncing them to login
  if (user.role !== role) return <Navigate to={ROLE_HOME[user.role]} replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <StoreProvider>
      <HashRouter>
        <ScrollToTop />
        <ToastHost />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/expos" element={<Expos />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/exhibitors" element={<ExhibitorDirectory />} />
          <Route path="/exhibitors/:id" element={<ExhibitorProfile />} />
          <Route path="/expos/:slug" element={<ExpoDetail />} />
          <Route path="/floor-plan" element={<FloorPlanPage />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/explore-expos" element={<Navigate to="/expos" replace />} />
          <Route path="/events/:slug" element={<ExpoDetail />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/login" element={<Auth mode="login" />} />
          <Route path="/register" element={<Auth mode="register" />} />
          <Route path="/forgot-password" element={<Auth mode="forgot" />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          <Route
            path="/admin"
            element={
              <RequireRole role="organizer">
                <AdminLayout />
              </RequireRole>
            }
          >
            <Route index element={<AdminOverview />} />
            <Route path="expos" element={<AdminExpos />} />
            <Route path="exhibitors" element={<AdminExhibitors />} />
            <Route path="attendees" element={<AdminAttendees />} />
            <Route path="feedback" element={<AdminFeedback />} />
            <Route path="schedule" element={<AdminSchedule />} />
            <Route path="floor-plan" element={<AdminFloorPlan />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="messages" element={<AdminMessages />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          <Route
            path="/portal"
            element={
              <RequireRole role="exhibitor">
                <ExhibitorPortal />
              </RequireRole>
            }
          />
          <Route
            path="/attendee"
            element={
              <RequireRole role="attendee">
                <AttendeePortal />
              </RequireRole>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </StoreProvider>
  );
}
