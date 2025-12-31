import React, { useState, useEffect, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LogOut, 
  Search, 
  FileText,
  Calendar,
  DollarSign,
  User as UserIcon,
  AlertCircle,
  Loader2
} from 'lucide-react';
import api from '../services/api';

interface Operation {
  id: string;
  idMutuo: string;
  fechaEscritura: string;
  valorVenta: number;
  rutCliente: string;
  nombreCliente: string;
  createdAt: string;
}

const SellerDashboard: React.FC = () => {
  const [operations, setOperations] = useState<Operation[]>([]);
  const [filteredOperations, setFilteredOperations] = useState<Operation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Cargar operaciones al montar el componente
  useEffect(() => {
    loadOperations();
  }, []);

  // Filtrar operaciones cuando cambia el término de búsqueda
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredOperations(operations);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = operations.filter(op => 
        op.nombreCliente.toLowerCase().includes(term) ||
        op.rutCliente.toLowerCase().includes(term) ||
        op.idMutuo.toLowerCase().includes(term)
      );
      setFilteredOperations(filtered);
    }
  }, [searchTerm, operations]);

  const loadOperations = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await api.get<Operation[]>('/api/operations/me');
      setOperations(response.data);
      setFilteredOperations(response.data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Error al cargar las operaciones';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(value);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-CL').format(date);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Mis Operaciones
            </h1>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.rut}</p>
                <p className="text-xs text-gray-500">{user?.rol}</p>
              </div>
              <button
                onClick={handleLogout}
                className="btn-secondary flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Salir
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Card de Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Operaciones</p>
                <p className="text-2xl font-bold text-gray-900">{operations.length}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Valor Total</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(operations.reduce((sum, op) => sum + op.valorVenta, 0))}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <UserIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Clientes Únicos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(operations.map(op => op.rutCliente)).size}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Card de Tabla */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Listado de Operaciones</h2>
            
            {/* Barra de Búsqueda */}
            <div className="relative w-full max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Buscar por cliente, RUT o ID mutuo..."
                className="input-field pl-10"
              />
            </div>
          </div>

          {/* Mensajes de Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Loading */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <span className="ml-3 text-gray-600">Cargando operaciones...</span>
            </div>
          ) : filteredOperations.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm ? 'No se encontraron operaciones con ese criterio' : 'No tienes operaciones registradas'}
              </p>
            </div>
          ) : (
            <>
              {/* Tabla para pantallas grandes */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID Mutuo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        RUT Cliente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha Escritura
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Valor Venta
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredOperations.map((operation) => (
                      <tr key={operation.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {operation.idMutuo}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {operation.nombreCliente}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {operation.rutCliente}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            {formatDate(operation.fechaEscritura)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                          {formatCurrency(operation.valorVenta)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Cards para pantallas pequeñas */}
              <div className="md:hidden space-y-4">
                {filteredOperations.map((operation) => (
                  <div key={operation.id} className="border border-gray-200 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">{operation.nombreCliente}</p>
                        <p className="text-sm text-gray-500">{operation.rutCliente}</p>
                      </div>
                      <span className="text-sm font-medium text-green-600">
                        {formatCurrency(operation.valorVenta)}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-gray-100 space-y-1">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <FileText className="w-4 h-4" />
                        <span>ID: {operation.idMutuo}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(operation.fechaEscritura)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Contador de resultados */}
              <div className="mt-4 text-sm text-gray-600 text-center">
                Mostrando {filteredOperations.length} de {operations.length} operaciones
              </div>
            </>
          )}
        </div>

        {/* Botón para cambiar contraseña */}
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/change-password')}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Cambiar mi contraseña
          </button>
        </div>
      </main>
    </div>
  );
};

export default SellerDashboard;
