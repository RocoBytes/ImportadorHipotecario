import React, { useState, useEffect, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LogOut, 
  Search, 
  FileText,
  User as UserIcon,
  AlertCircle,
  Loader2,
  Download
} from 'lucide-react';
import * as XLSX from 'xlsx';
import api from '../services/api';

interface Operation {
  id: string;
  // Básicos
  fechaCreacion: string;
  diasTasa: number;
  tipo: string;
  solicitud: number;
  estadoSolicitud: string;
  fechaResolucion: string;
  fechaAprobacionManual90: string;
  fechaEscritura: string;
  estadoMutuo: string;
  mutuo: string;
  
  // Cliente
  rut: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  
  // Ejecutivos
  ejecutivo: string;
  ejecutivoOperaciones: string;
  
  // Operación
  tipoOperacion: string;
  
  // Montos (números)
  valorVenta: number;
  valorAsegurable: number;
  montoPie: number;
  montoSubsidio: number;
  creditoTotal: number;
  montoHipoteca: number;
  finesGenerales: number;
  gastosOperacionales: number;
  noFinanciado: number;
  valorTasacion: number;
  
  // Términos
  plazo: number;
  periodoGracia: number;
  tasaEmision: number;
  
  // Otros datos
  bancoAlzante: string;
  repertorio: string;
  notaria: string;
  agenciaBroker: string;
  abogado: string;
  prontoPago: boolean;
  rol: string;
  caratula: string;
  caratulaEndoso: string;
  fechaF24: string;
  inversionista: string;
  tasaEndoso: number;
  comunaBienRaiz: string;
  estadoActual: string;
  
  // Fechas de proceso (40+ campos)
  oeVisadoInicio: string;
  oeVisadoTermino: string;
  borradorInicio: string;
  borradorTermino: string;
  preFirmaInicio: string;
  preFirmaTermino: string;
  firmaClienteInicio: string;
  firmaClienteTermino: string;
  firmaCodeudoresInicio: string;
  firmaCodeudoresTermino: string;
  firmaMandatarioInicio: string;
  firmaMandatarioTermino: string;
  firmaVendedorInicio: string;
  firmaVendedorTermino: string;
  firmaAlzanteInicio: string;
  rechazoAlzanteInicio: string;
  rechazoAlzanteTermino: string;
  firmaAlzanteTermino: string;
  firmaHipotecariaEvolucionaInicio: string;
  firmaHipotecariaEvolucionaTermino: string;
  vbAbogadosInicio: string;
  vbAbogadosTermino: string;
  cierreCopiasInicio: string;
  cierreCopiasTermino: string;
  cbrInicio: string;
  rechazoCbrInicio: string;
  rechazoCbrTermino: string;
  cbrTermino: string;
  informeFinalInicio: string;
  informeFinalTermino: string;
  fechaEndoso: string;
  saldoPendienteDesembolso: number;
  fechaDesembolsoPago: string;
  fechaPreagoTotal: string;
  endosoCbrInicio: string;
  endosoCbrTermino: string;
  entregaEscInicio: string;
  entregaEscTermino: string;
  
  // Vendedor
  rutVendedor: string;
  nombreVendedor: string;
  
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

  useEffect(() => {
    loadOperations();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredOperations(operations);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = operations.filter(op => 
        op.nombre?.toLowerCase().includes(term) ||
        op.apellidoPaterno?.toLowerCase().includes(term) ||
        op.apellidoMaterno?.toLowerCase().includes(term) ||
        op.rut?.toLowerCase().includes(term) ||
        op.mutuo?.toLowerCase().includes(term) ||
        op.solicitud?.toString().includes(term) ||
        op.ejecutivo?.toLowerCase().includes(term) ||
        op.estadoMutuo?.toLowerCase().includes(term)
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
    if (!value && value !== 0) return '-';
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('es-CL').format(date);
    } catch {
      return '-';
    }
  };

  const formatBoolean = (value: boolean): string => {
    return value ? 'Sí' : 'No';
  };

  const exportToExcel = () => {
    // Preparar datos solo con las columnas visibles
    const dataToExport = filteredOperations.map(op => ({
      'Solicitud': op.solicitud,
      'Tipo': op.tipo || '-',
      'Fecha Escritura': formatDate(op.fechaEscritura),
      'Estado Mutuo': op.estadoMutuo || '-',
      'RUT Cliente': op.rut || '-',
      'Nombre': op.nombre || '-',
      'Apellido Paterno': op.apellidoPaterno || '-',
      'Apellido Materno': op.apellidoMaterno || '-',
      'Tipo Operación': op.tipoOperacion || '-',
      'Valor Venta': op.valorVenta || 0,
      'Crédito Total': op.creditoTotal || 0,
      'Banco Alzante': op.bancoAlzante || '-',
      'Repertorio': op.repertorio || '-',
      'Pronto Pago': formatBoolean(op.prontoPago),
      'Carátula': op.caratula || '-',
      'Estado Actual': op.estadoActual || '-',
      'Firma Cliente Inicio': formatDate(op.firmaClienteInicio),
      'Firma Cliente Término': formatDate(op.firmaClienteTermino),
      'Firma Vendedor Inicio': formatDate(op.firmaVendedorInicio),
      'Firma Vendedor Término': formatDate(op.firmaVendedorTermino),
      'Firma Alzante Inicio': formatDate(op.firmaAlzanteInicio),
      'Firma Alzante Término': formatDate(op.firmaAlzanteTermino),
      'Firma Hipotecaria Evoluciona Inicio': formatDate(op.firmaHipotecariaEvolucionaInicio),
      'Firma Hipotecaria Evoluciona Término': formatDate(op.firmaHipotecariaEvolucionaTermino),
      'VB Abogados Inicio': formatDate(op.vbAbogadosInicio),
      'VB Abogados Término': formatDate(op.vbAbogadosTermino),
      'Cierre Copias Inicio': formatDate(op.cierreCopiasInicio),
      'Cierre Copias Término': formatDate(op.cierreCopiasTermino),
      'CBR Inicio': formatDate(op.cbrInicio),
      'CBR Término': formatDate(op.cbrTermino),
      'Informe Final Inicio': formatDate(op.informeFinalInicio),
      'Informe Final Término': formatDate(op.informeFinalTermino),
      'RUT Vendedor': op.rutVendedor || '-',
      'Nombre Vendedor': op.nombreVendedor || '-',
    }));

    // Crear libro de trabajo
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Operaciones');

    // Generar nombre de archivo con fecha
    const fecha = new Date().toLocaleDateString('es-CL').replace(/\//g, '-');
    const fileName = `Operaciones_${user?.rut || 'vendedor'}_${fecha}.xlsx`;

    // Descargar archivo
    XLSX.writeFile(wb, fileName);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mis Operaciones</h1>
              <p className="text-sm text-gray-600">
                {user?.rut} - {user?.rol === 'VENDEDOR' ? 'VENDEDOR' : 'ADMINISTRADOR'}
              </p>
            </div>
            <div className="flex items-center gap-4">
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
      <main className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Card de Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 max-w-7xl">
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
                <UserIcon className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Vendedor</p>
                <p className="text-2xl font-bold text-gray-900">
                  {operations.length > 0 ? operations[0].nombreVendedor : user?.rut || 'N/A'}
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
                  {new Set(operations.map(op => op.rut)).size}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Card de Tabla */}
        <div className="card">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <h2 className="text-xl font-semibold">Listado Completo de Operaciones</h2>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              {/* Botón de Exportar */}
              <button
                onClick={exportToExcel}
                disabled={filteredOperations.length === 0}
                className="btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                Exportar a Excel
              </button>
              
              {/* Barra de Búsqueda */}
              <div className="relative w-full sm:max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  placeholder="Buscar..."
                  className="input-field pl-10"
                />
              </div>
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
              {/* Tabla con scroll horizontal para todas las columnas */}
              <div className="overflow-x-auto">
                <div className="inline-block min-w-full align-middle">
                  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          {/* Columnas visibles */}
                          <th className="sticky left-0 z-10 bg-gray-50 px-3 py-3.5 text-left text-xs font-semibold text-gray-900 border-r border-gray-200">Solicitud</th>
                          <th className="px-3 py-3.5 text-left text-xs font-semibold text-gray-900">Tipo</th>
                          <th className="px-3 py-3.5 text-left text-xs font-semibold text-gray-900">Fecha Escritura</th>
                          <th className="px-3 py-3.5 text-left text-xs font-semibold text-gray-900">Estado Mutuo</th>
                          
                          {/* Cliente */}
                          <th className="px-3 py-3.5 text-left text-xs font-semibold text-gray-900 bg-blue-50">RUT</th>
                          <th className="px-3 py-3.5 text-left text-xs font-semibold text-gray-900 bg-blue-50">Nombre</th>
                          <th className="px-3 py-3.5 text-left text-xs font-semibold text-gray-900 bg-blue-50">Apellido Paterno</th>
                          <th className="px-3 py-3.5 text-left text-xs font-semibold text-gray-900 bg-blue-50">Apellido Materno</th>
                          
                          <th className="px-3 py-3.5 text-left text-xs font-semibold text-gray-900">Tipo Operación</th>
                          
                          {/* Montos visibles */}
                          <th className="px-3 py-3.5 text-left text-xs font-semibold text-gray-900 bg-green-50">Valor Venta</th>
                          <th className="px-3 py-3.5 text-left text-xs font-semibold text-gray-900 bg-green-50">Crédito Total</th>
                          
                          {/* Otros datos visibles */}
                          <th className="px-3 py-3.5 text-left text-xs font-semibold text-gray-900">Banco Alzante</th>
                          <th className="px-3 py-3.5 text-left text-xs font-semibold text-gray-900">Repertorio</th>
                          <th className="px-3 py-3.5 text-left text-xs font-semibold text-gray-900">Pronto Pago</th>
                          <th className="px-3 py-3.5 text-left text-xs font-semibold text-gray-900">Carátula</th>
                          <th className="px-3 py-3.5 text-left text-xs font-semibold text-gray-900">Estado Actual</th>
                          
                          {/* Fechas de proceso visibles */}
                          <th className="px-3 py-3.5 text-left text-xs font-semibold text-gray-900 bg-yellow-50">Firma Cliente Inicio</th>
                          <th className="px-3 py-3.5 text-left text-xs font-semibold text-gray-900 bg-yellow-50">Firma Cliente Término</th>
                          <th className="px-3 py-3.5 text-left text-xs font-semibold text-gray-900 bg-yellow-50">Firma Vendedor Inicio</th>
                          <th className="px-3 py-3.5 text-left text-xs font-semibold text-gray-900 bg-yellow-50">Firma Vendedor Término</th>
                          <th className="px-3 py-3.5 text-left text-xs font-semibold text-gray-900 bg-yellow-50">Firma Alzante Inicio</th>
                          <th className="px-3 py-3.5 text-left text-xs font-semibold text-gray-900 bg-yellow-50">Firma Alzante Término</th>
                          <th className="px-3 py-3.5 text-left text-xs font-semibold text-gray-900 bg-yellow-50">Firma Hipotecaria Evoluciona Inicio</th>
                          <th className="px-3 py-3.5 text-left text-xs font-semibold text-gray-900 bg-yellow-50">Firma Hipotecaria Evoluciona Término</th>
                          <th className="px-3 py-3.5 text-left text-xs font-semibold text-gray-900 bg-yellow-50">VB Abogados Inicio</th>
                          <th className="px-3 py-3.5 text-left text-xs font-semibold text-gray-900 bg-yellow-50">VB Abogados Término</th>
                          <th className="px-3 py-3.5 text-left text-xs font-semibold text-gray-900 bg-yellow-50">Cierre Copias Inicio</th>
                          <th className="px-3 py-3.5 text-left text-xs font-semibold text-gray-900 bg-yellow-50">Cierre Copias Término</th>
                          <th className="px-3 py-3.5 text-left text-xs font-semibold text-gray-900 bg-yellow-50">CBR Inicio</th>
                          <th className="px-3 py-3.5 text-left text-xs font-semibold text-gray-900 bg-yellow-50">CBR Término</th>
                          <th className="px-3 py-3.5 text-left text-xs font-semibold text-gray-900 bg-yellow-50">Informe Final Inicio</th>
                          <th className="px-3 py-3.5 text-left text-xs font-semibold text-gray-900 bg-yellow-50">Informe Final Término</th>
                          
                          {/* Vendedor */}
                          <th className="px-3 py-3.5 text-left text-xs font-semibold text-gray-900 bg-purple-50">RUT Vendedor</th>
                          <th className="px-3 py-3.5 text-left text-xs font-semibold text-gray-900 bg-purple-50">Nombre Vendedor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {filteredOperations.map((op) => (
                          <tr key={op.id} className="hover:bg-gray-50">
                            {/* Columnas visibles */}
                            <td className="sticky left-0 z-10 bg-white px-3 py-4 text-sm font-medium text-gray-900 border-r border-gray-200">{op.solicitud}</td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{op.tipo || '-'}</td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{formatDate(op.fechaEscritura)}</td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{op.estadoMutuo || '-'}</td>
                            
                            {/* Cliente */}
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 bg-blue-50">{op.rut || '-'}</td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 bg-blue-50">{op.nombre || '-'}</td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 bg-blue-50">{op.apellidoPaterno || '-'}</td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 bg-blue-50">{op.apellidoMaterno || '-'}</td>
                            
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{op.tipoOperacion || '-'}</td>
                            
                            {/* Montos visibles */}
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 bg-green-50 font-medium">{formatCurrency(op.valorVenta)}</td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 bg-green-50">{formatCurrency(op.creditoTotal)}</td>
                            
                            {/* Otros datos visibles */}
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{op.bancoAlzante || '-'}</td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{op.repertorio || '-'}</td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{formatBoolean(op.prontoPago)}</td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{op.caratula || '-'}</td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{op.estadoActual || '-'}</td>
                            
                            {/* Fechas de proceso visibles */}
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 bg-yellow-50">{formatDate(op.firmaClienteInicio)}</td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 bg-yellow-50">{formatDate(op.firmaClienteTermino)}</td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 bg-yellow-50">{formatDate(op.firmaVendedorInicio)}</td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 bg-yellow-50">{formatDate(op.firmaVendedorTermino)}</td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 bg-yellow-50">{formatDate(op.firmaAlzanteInicio)}</td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 bg-yellow-50">{formatDate(op.firmaAlzanteTermino)}</td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 bg-yellow-50">{formatDate(op.firmaHipotecariaEvolucionaInicio)}</td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 bg-yellow-50">{formatDate(op.firmaHipotecariaEvolucionaTermino)}</td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 bg-yellow-50">{formatDate(op.vbAbogadosInicio)}</td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 bg-yellow-50">{formatDate(op.vbAbogadosTermino)}</td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 bg-yellow-50">{formatDate(op.cierreCopiasInicio)}</td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 bg-yellow-50">{formatDate(op.cierreCopiasTermino)}</td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 bg-yellow-50">{formatDate(op.cbrInicio)}</td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 bg-yellow-50">{formatDate(op.cbrTermino)}</td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 bg-yellow-50">{formatDate(op.informeFinalInicio)}</td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 bg-yellow-50">{formatDate(op.informeFinalTermino)}</td>
                            
                            {/* Vendedor */}
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 bg-purple-50">{op.rutVendedor || '-'}</td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 bg-purple-50">{op.nombreVendedor || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Contador de resultados */}
              <div className="mt-4 text-sm text-gray-600 text-center">
                Mostrando {filteredOperations.length} de {operations.length} operaciones
              </div>
            </>
          )}
        </div>

        {/* Botón para cambiar contraseña */}
        <div className="mt-6 text-center max-w-7xl mx-auto">
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
