import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import type { ReactNode } from 'react';

// Layout
import { AppShell } from '../components/layout/AppShell.js';

// Auth pages
import { LoginPage } from '../pages/auth/LoginPage.js';
import { CallbackPage } from '../pages/auth/CallbackPage.js';

// App pages
import { DashboardPage } from '../pages/dashboard/DashboardPage.js';

// Compliance module
import { ComplianceDashboard } from '../pages/compliance/ComplianceDashboard.js';
import { DBSManagement } from '../pages/compliance/DBSManagement.js';
import { TrainingTracker } from '../pages/compliance/TrainingTracker.js';

// Grants module
import { GrantsDashboard } from '../pages/grants/GrantsDashboard.js';
import { ApplicationTracker } from '../pages/grants/ApplicationTracker.js';

// Fixtures module
import { FixturesDashboard } from '../pages/fixtures/FixturesDashboard.js';

// Settings
import { ClubSettings } from '../pages/settings/ClubSettings.js';
import { UserSettings } from '../pages/settings/UserSettings.js';

const auth0Configured =
  import.meta.env['VITE_AUTH0_CLIENT_ID'] &&
  import.meta.env['VITE_AUTH0_CLIENT_ID'] !== 'CHANGE_ME_AUTH0_CLIENT_ID';

function ProtectedRoute({ children }: { children: ReactNode }): JSX.Element {
  const { isAuthenticated, isLoading } = useAuth0();

  // Auth0 not configured — bypass auth entirely (dev mode)
  if (!auth0Configured) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export function AppRouter(): JSX.Element {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/callback" element={<CallbackPage />} />

      {/* Protected routes */}
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* Compliance Sentinel */}
        <Route path="/compliance" element={<ComplianceDashboard />} />
        <Route path="/compliance/dbs" element={<DBSManagement />} />
        <Route path="/compliance/training" element={<TrainingTracker />} />

        {/* AI Grant Writer */}
        <Route path="/grants" element={<GrantsDashboard />} />
        <Route path="/grants/applications" element={<ApplicationTracker />} />

        {/* Fixture & Volunteer Manager */}
        <Route path="/fixtures" element={<FixturesDashboard />} />

        {/* Settings */}
        <Route path="/settings" element={<Navigate to="/settings/club" replace />} />
        <Route path="/settings/club" element={<ClubSettings />} />
        <Route path="/settings/profile" element={<UserSettings />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
