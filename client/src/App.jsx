import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AttendanceProvider } from './context/AttendanceContext';

// Components
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import ErrorBoundary from './components/ErrorBoundary';

// Pages (lazy-loaded for code splitting)
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const StudentRegistration = lazy(() => import('./pages/StudentRegistration'));
const Attendance = lazy(() => import('./pages/Attendance'));
const Reports = lazy(() => import('./pages/Reports'));
const Settings = lazy(() => import('./pages/Settings'));
const Admin = lazy(() => import('./pages/Admin'));
const LiveAttendance = lazy(() => import('./pages/LiveAttendance'));

const ProtectedLayout = ({ children }) => {
  const { user } = useAuth();

  if (!user) return <Login />;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <div className="flex-1 lg:ml-64 flex flex-col">
        <Navbar />
        <main className="flex-1 p-4 lg:p-8 pt-16 lg:pt-8">
          <div className="max-w-6xl mx-auto">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AttendanceProvider>
          <Router>
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-500">Loading...</div>}>
              <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
              <Route path="/register-student" element={<ProtectedLayout><StudentRegistration /></ProtectedLayout>} />
              <Route path="/attendance" element={<ProtectedLayout><Attendance /></ProtectedLayout>} />
              <Route path="/reports" element={<ProtectedLayout><Reports /></ProtectedLayout>} />
              <Route path="/live-attendance" element={<ProtectedLayout><LiveAttendance /></ProtectedLayout>} />
              <Route path="/admin" element={<ProtectedLayout><Admin /></ProtectedLayout>} />
              <Route path="/settings" element={<ProtectedLayout><Settings /></ProtectedLayout>} />
              </Routes>
            </Suspense>
          </Router>
        </AttendanceProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
