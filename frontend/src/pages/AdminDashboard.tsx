import React, { useState, ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LogOut, 
  Upload, 
  FileSpreadsheet, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  X
} from 'lucide-react';
import api from '../services/api';

interface ImportResult {
  success: boolean;
  message: string;
  totalParsed?: number;
  totalFiltered?: number;
  newUsers?: number;
  recordsImported?: number;
}

const AdminDashboard: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState('');

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar que sea un archivo CSV
      if (!file.name.endsWith('.csv')) {
        setError('Solo se permiten archivos CSV');
        return;
      }
      
      setSelectedFile(file);
      setError('');
      setResult(null);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setError('');
    setResult(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      setError('Debes seleccionar un archivo');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError('');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      // Simular progreso (el backend no envía progreso real)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await api.post<ImportResult>('/api/import/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      setResult(response.data);
      setSelectedFile(null);

      // Reset progress después de 2 segundos
      setTimeout(() => {
        setUploadProgress(0);
      }, 2000);

    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Error al procesar el archivo';
      setError(errorMessage);
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Panel de Administración
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
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Card de Carga de CSV */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <FileSpreadsheet className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold">Importar Archivo CSV</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Zona de Drop/Upload */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
              {!selectedFile ? (
                <label className="cursor-pointer block">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={isUploading}
                  />
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">
                    Haz clic para seleccionar un archivo CSV
                  </p>
                  <p className="text-sm text-gray-500">
                    o arrastra y suelta aquí
                  </p>
                </label>
              ) : (
                <div className="flex items-center justify-between bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="w-8 h-8 text-blue-600" />
                    <div className="text-left">
                      <p className="font-medium text-gray-900">{selectedFile.name}</p>
                      <p className="text-sm text-gray-500">
                        {(selectedFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    disabled={isUploading}
                    className="text-gray-500 hover:text-red-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            {/* Barra de Progreso */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Procesando archivo...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-full transition-all duration-300 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Mensajes de Error */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Resultado de la Carga */}
            {result && (
              <div className={`p-4 border rounded-lg flex items-start gap-3 ${
                result.success 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                {result.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className={`font-medium mb-2 ${
                    result.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {result.message}
                  </p>
                  {result.success && (
                    <div className="grid grid-cols-2 gap-2 text-sm text-green-700">
                      <div>
                        <span className="font-medium">Registros parseados:</span> {result.totalParsed}
                      </div>
                      <div>
                        <span className="font-medium">Registros filtrados (Vigente):</span> {result.totalFiltered}
                      </div>
                      <div>
                        <span className="font-medium">Nuevos usuarios creados:</span> {result.newUsers}
                      </div>
                      <div>
                        <span className="font-medium">Operaciones importadas:</span> {result.recordsImported}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Botón de Envío */}
            <button
              type="submit"
              disabled={!selectedFile || isUploading}
              className="w-full btn-primary py-3 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Importar Archivo
                </>
              )}
            </button>
          </form>

          {/* Información adicional */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Formato del archivo CSV:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Delimitador: punto y coma (;)</li>
              <li>• Columnas requeridas: RUT Ejecutivo, Estado Mutuo, ID Mutuo, Fecha Escritura, Valor Venta, RUT Cliente, Nombre Cliente</li>
              <li>• Solo se importarán registros con Estado Mutuo = "Vigente"</li>
              <li>• Los usuarios (ejecutivos) se crearán automáticamente si no existen</li>
            </ul>
          </div>
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

export default AdminDashboard;
