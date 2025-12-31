import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PrivateRoute, PublicRoute, RoleRoute } from './components/PrivateRoute';

// Páginas
import LoginPage from './pages/LoginPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import AdminDashboard from './pages/AdminDashboard';
import SellerDashboard from './pages/SellerDashboard';
import UnauthorizedPage from './pages/UnauthorizedPage';
import { useAuth } from './contexts/AuthContext';

const AppRoutes: React.FC = () => {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Rutas públicas (solo no autenticados) */}
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      {/* Rutas privadas (requieren autenticación) */}
      <Route element={<PrivateRoute />}>
        {/* Dashboard principal - redirige según rol */}
        <Route 
          path="/" 
          element={
            user?.rol === 'ADMIN' 
              ? <AdminDashboard /> 
              : <SellerDashboard />
          } 
        />
        
        <Route path="/change-password" element={<ChangePasswordPage />} />
        
        {/* Rutas solo para ADMIN */}
        <Route element={<RoleRoute allowedRoles={['ADMIN']} />}>
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>

        {/* Rutas solo para VENDEDOR */}
        <Route element={<RoleRoute allowedRoles={['VENDEDOR']} />}>
          <Route path="/operations" element={<SellerDashboard />} />
        </Route>
      </Route>

      {/* Ruta de no autorizado */}
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Ruta por defecto */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
