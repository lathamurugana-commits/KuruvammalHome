import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import SplashScreen from './pages/SplashScreen';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import HouseList from './pages/HouseList';
import AddEditHouse from './pages/AddEditHouse';
import GenerateBill from './pages/GenerateBill';
import BillPreview from './pages/BillPreview';
import BillHistory from './pages/BillHistory';
import EditBill from './pages/EditBill';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';

export default function App() {
  console.log("App component rendering...");
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            className: 'toast-custom',
          }}
        />
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<SplashScreen />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Protected routes with layout */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/houses" element={<HouseList />} />
            <Route path="/houses/add" element={<AddEditHouse />} />
            <Route path="/houses/edit/:id" element={<AddEditHouse />} />
            <Route path="/generate-bill" element={<GenerateBill />} />
            <Route path="/bills/preview/:id" element={<BillPreview />} />
            <Route path="/bills/edit/:id" element={<EditBill />} />
            <Route path="/bills/history" element={<BillHistory />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
