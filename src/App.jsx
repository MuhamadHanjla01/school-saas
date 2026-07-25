import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/website/LandingPage';
import DemoPage from './components/website/DemoPage';
import AboutPage from './components/website/AboutPage';
import PurchasePage from './components/website/PurchasePage';
import SuperadminPage from './components/superadmin/SuperadminPage';
import AdminPage from './components/admin/AdminPage';
import LoginPage from './components/website/LoginPage';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
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
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
