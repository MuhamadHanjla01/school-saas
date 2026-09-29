import { lazy, Suspense } from 'react';
import ResetPasswordPage from './components/website/ResetPasswordPage';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import LandingPage from './components/website/LandingPage';
import DemoPage from './components/website/DemoPage';
import AboutPage from './components/website/AboutPage';
import PurchasePage from './components/website/PurchasePage';
const SuperadminPage = lazy(() => import('./components/superadmin/SuperadminPage'));
const AdminPage = lazy(() => import('./components/admin/AdminPage'));
const TeacherPage = lazy(() => import('./components/teacher/TeacherPage'));
const StudentPage = lazy(() => import('./components/student/StudentPage'));
import LoginPage from './components/website/LoginPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { portalForRole } from './context/sessionClient';
import ProtectedRoute from './components/ProtectedRoute';

function UnavailablePage({ unauthorized = false }) {
  const { user } = useAuth();
  const destination = user ? portalForRole(user.role) : '/login';
  return <main className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
    <h1 className="text-2xl font-bold">{unauthorized ? 'This page is not available for your account' : 'Page not found'}</h1>
    <p>{unauthorized ? 'Your account can access only its assigned school portal.' : 'The requested address does not exist.'}</p>
    <Link className="bg-primary text-white px-4 py-3 rounded-xl" to={destination === '/unauthorized' ? '/login' : destination}>Return to your portal</Link>
  </main>;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Suspense fallback={<p role="status" className="p-8">Loading portal…</p>}><Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/demo" element={<DemoPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/purchase" element={<PurchasePage />} />
          <Route 
            path="/superadmin/*" 
            element={
              <ProtectedRoute allowedRoles={['SuperAdmin']}>
                <SuperadminPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/*" 
            element={
              <ProtectedRoute allowedRoles={['SchoolAdmin']}>
                <AdminPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/teacher/*" 
            element={
              <ProtectedRoute allowedRoles={['Teacher']}>
                <TeacherPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/student/*" 
            element={
              <ProtectedRoute allowedRoles={['Student']}>
                <StudentPage />
              </ProtectedRoute>
            } 
          />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/unauthorized" element={<UnavailablePage unauthorized />} />
          <Route path="*" element={<UnavailablePage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Routes></Suspense>
      </Router>
    </AuthProvider>
  );
}

