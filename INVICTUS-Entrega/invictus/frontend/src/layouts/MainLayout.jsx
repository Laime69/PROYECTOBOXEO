import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const roleNames = {
  SuperAdmin: 'Súper Administrador',
  Administrador: 'Administrador',
  Recepcionista: 'Recepción / Cajero',
  Entrenador: 'Entrenador',
  Alumno: 'Alumno / Deportista',
};

const menuByRole = {
  SuperAdmin: [
    { label: 'Dashboard', path: '/admin/dashboard', icon: '📊' },
    { label: 'Registrar', path: '/admin/register', icon: '➕' },
    { label: 'Gestionar', path: '/admin/manage', icon: '📋' },
    { label: 'Alumnos', path: '/admin/alumnos', icon: '🏋️' },
    { label: 'Entrenadores', path: '/admin/entrenadores', icon: '🥊' },
    { label: 'Pagos', path: '/admin/pagos', icon: '💰' },
    { label: 'Asistencias', path: '/admin/asistencias', icon: '📋' },
    { label: 'Horarios', path: '/admin/horarios', icon: '🕐' },
    { label: 'Reportes', path: '/admin/reportes', icon: '📈' },
    { label: 'Progreso', path: '/admin/progreso', icon: '📈' },
    { label: 'Mi Perfil', path: '/admin/perfil', icon: '👤' },
    { label: 'Bitácora', path: '/admin/bitacora', icon: '📝' },
  ],
  Administrador: [
    { label: 'Dashboard', path: '/admin/dashboard', icon: '📊' },
    { label: 'Registrar', path: '/admin/register', icon: '➕' },
    { label: 'Gestionar', path: '/admin/manage', icon: '📋' },
    { label: 'Alumnos', path: '/admin/alumnos', icon: '🏋️' },
    { label: 'Entrenadores', path: '/admin/entrenadores', icon: '🥊' },
    { label: 'Pagos', path: '/admin/pagos', icon: '💰' },
    { label: 'Asistencias', path: '/admin/asistencias', icon: '📋' },
    { label: 'Horarios', path: '/admin/horarios', icon: '🕐' },
    { label: 'Reportes', path: '/admin/reportes', icon: '📈' },
    { label: 'Progreso', path: '/admin/progreso', icon: '📈' },
    { label: 'Mi Perfil', path: '/admin/perfil', icon: '👤' },
  ],
  Recepcionista: [
    { label: 'Dashboard', path: '/recepcion/dashboard', icon: '📊' },
    { label: 'Registrar', path: '/recepcion/registrar', icon: '➕' },
    { label: 'Alumnos', path: '/recepcion/alumnos', icon: '🏋️' },
    { label: 'Pagos', path: '/recepcion/pagos', icon: '💰' },
    { label: 'Horarios', path: '/recepcion/horarios', icon: '🕐' },
    { label: 'Asistencias', path: '/recepcion/asistencias', icon: '📋' },
    { label: 'Mi Perfil', path: '/recepcion/perfil', icon: '👤' },
  ],
  Entrenador: [
    { label: 'Dashboard', path: '/entrenador/dashboard', icon: '📊' },
    { label: 'Mis Horarios', path: '/entrenador/horarios', icon: '🕐' },
    { label: 'Mis Alumnos', path: '/entrenador/alumnos', icon: '🏋️' },
    { label: 'Asistencias', path: '/entrenador/asistencias', icon: '📋' },
    { label: 'Reportes', path: '/entrenador/reportes', icon: '📈' },
    { label: 'Progreso', path: '/entrenador/progreso', icon: '📈' },
    { label: 'Mi Perfil', path: '/entrenador/perfil', icon: '👤' },
  ],
  Alumno: [
    { label: 'Dashboard', path: '/alumno/dashboard', icon: '📊' },
    { label: 'Mi Perfil', path: '/alumno/perfil', icon: '👤' },
    { label: 'Horarios', path: '/alumno/horarios', icon: '🕐' },
    { label: 'Asistencias', path: '/alumno/asistencias', icon: '📋' },
    { label: 'Estado de Pago', path: '/alumno/pago', icon: '💰' },
    { label: 'Mi Progreso', path: '/alumno/progreso', icon: '📈' },
  ],
};

function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const roleLabel = roleNames[user?.rol] || user?.rol;
  const menuItems = menuByRole[user?.rol] || [];
  const currentPath = location.pathname;

  useEffect(() => { setMobileOpen(false); }, [currentPath]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const SidebarContent = ({ collapsed }) => (
    <>
      <div className="h-16 flex items-center px-4 border-b border-gray-100">
        <button
          onClick={() => collapsed ? setSidebarOpen(false) : setSidebarOpen(!sidebarOpen)}
          className="text-2xl flex-shrink-0"
        >
          🥊
        </button>
        {!collapsed && (
          <span className="ml-2 text-lg font-bold text-gray-800 whitespace-nowrap">Invictus Boxeo</span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {menuItems.map((item) => {
          const isActive = currentPath === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-invictus-50 text-invictus-700 border-r-2 border-invictus-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
              }`}
              title={collapsed ? item.label : ''}
            >
              <span className="text-xl flex-shrink-0">{item.icon}</span>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </div>

      <div className="border-t border-gray-100 p-4">
        {!collapsed ? (
          <div className="space-y-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{user?.nombre}</p>
              <p className="text-xs text-gray-500">{roleLabel}</p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              Cerrar sesión
            </button>
          </div>
        ) : (
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Cerrar sesión"
          >
            🚪
          </button>
        )}
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-white shadow-md border-r border-gray-200 flex flex-col transition-all duration-300 hidden lg:flex`}>
        <SidebarContent collapsed={!sidebarOpen} />
      </aside>

      <div className="lg:hidden fixed inset-0 z-50 flex" style={{ display: mobileOpen ? 'flex' : 'none' }}>
        <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
        <aside className="relative w-72 bg-white shadow-xl flex flex-col h-full">
          <SidebarContent collapsed={false} />
        </aside>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white shadow-sm border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (window.innerWidth >= 1024) setSidebarOpen(!sidebarOpen);
                else setMobileOpen(!mobileOpen);
              }}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg lg:hidden"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="px-3 py-1 bg-invictus-100 text-invictus-800 rounded-full text-xs font-semibold">
              {roleLabel}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 hidden sm:inline">{user?.nombre}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-white bg-invictus-600 hover:bg-invictus-700 rounded-lg transition-colors"
            >
              Salir
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default MainLayout;
