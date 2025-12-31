import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Home } from 'lucide-react';

const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
          <ShieldAlert className="w-10 h-10 text-red-600" />
        </div>

        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Acceso No Autorizado
        </h1>

        <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
          No tienes permisos para acceder a esta página. Si crees que esto es un error,
          contacta al administrador.
        </p>

        <button
          onClick={() => navigate('/')}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Home className="w-5 h-5" />
          Volver al Inicio
        </button>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
