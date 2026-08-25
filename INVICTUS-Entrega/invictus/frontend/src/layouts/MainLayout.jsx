import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { roleNames, menuByRole } from '../config/menuConfig';
import CommandPalette from '../components/CommandPalette';


function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const roleLabel = roleNames[user?.rol] || user?.rol;
  const menuItems = menuByRole[user?.rol] || [];
  const currentPath = location.pathname;

  useEffect(() => { setMobileOpen(false); }, [currentPath]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const iniciales = (user?.nombre || '?')
    .split(' ').map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();

  const SidebarContent = ({ collapsed }) => (
    <>
      <div className={`h-16 flex items-center border-b border-slate-200 relative ${collapsed ? 'justify-center px-2' : 'px-5'}`}>
        <div className="absolute bottom-0 left-0 h-[2px] w-full bg-gradient-to-r from-invictus-500 via-invictus-300 to-transparent" />
        <button
          onClick={() => collapsed ? setSidebarOpen(false) : setSidebarOpen(!sidebarOpen)}
          className="text-2xl flex-shrink-0"
        >
          🥊
        </button>
        {!collapsed && (
          <div className="ml-3 leading-tight">
            <p className="text-base font-extrabold tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-invictus-600 to-invictus-800">INVICTUS</p>
            <p className="text-[10px] font-semibold text-slate-400 tracking-[0.25em] uppercase">Boxeo Academy</p>
          </div>
        )}
      </div>

      <span aria-hidden="true" className="pointer-events-none select-none absolute -bottom-6 -right-4 text-[8rem] leading-none opacity-[0.05] -rotate-12 z-0">🥊</span>
      <div className={`relative z-[1] flex-1 overflow-y-auto py-4 space-y-1 ${collapsed ? 'px-2' : 'px-3'}`}>
        {menuItems.map((item, idx) => (
          item.seccion ? (
            !collapsed ? (
              <p key={`sec-${idx}`} className="px-3 pt-4 pb-1 text-[10px] font-bold tracking-[0.15em] uppercase text-slate-400">
                {item.seccion}
              </p>
            ) : (
              <div key={`sec-${idx}`} className="mx-2 my-2 border-t border-slate-100" />
            )
          ) : (() => {
            const isActive = currentPath === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 rounded-lg text-sm font-medium transition-all ${
                  collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2'
                } ${
                  isActive
                    ? 'bg-invictus-600 text-white shadow-md shadow-invictus-600/25'
                    : 'text-slate-600 hover:bg-invictus-50 hover:text-invictus-700'
                }`}
                title={collapsed ? item.label : ''}
              >
                <span className="w-5 text-center flex-shrink-0 opacity-90">{item.icon}</span>
                {!collapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })()
        ))}
      </div>

      <div className="border-t border-slate-200 p-3">
        {!collapsed ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3 min-w-0 ring-1 ring-inset ring-slate-200/60">
              <div className="w-9 h-9 rounded-full bg-invictus-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                {iniciales}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#172033] truncate">{user?.nombre}</p>
                <p className="text-[11px] text-slate-500 truncate">{roleLabel}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-600 hover:text-white rounded-lg transition-colors"
            >
              Cerrar sesión
            </button>
          </div>
        ) : (
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Cerrar sesión"
          >
            🚪
          </button>
        )}
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gris-fondo flex">
      <aside className={`${sidebarOpen ? 'w-64' : 'w-[72px]'} bg-white border-r border-slate-200 flex-col transition-all duration-300 hidden lg:flex relative overflow-hidden`}>
        <SidebarContent collapsed={!sidebarOpen} />
      </aside>

      <div className="lg:hidden fixed inset-0 z-50 flex" style={{ display: mobileOpen ? 'flex' : 'none' }}>
        <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
        <aside className="relative w-72 bg-white shadow-modal flex flex-col h-full overflow-hidden">
          <SidebarContent collapsed={false} />
        </aside>
      </div>

      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* ── Capa decorativa: agua esmeralda/cian + identidad boxeo ── */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-24 w-[38rem] h-[38rem] rounded-full bg-gradient-to-br from-invictus-100/60 via-teal-50 to-cyan-100/50 blur-3xl animate-float-slow" />
          <div className="absolute top-[45%] -left-48 w-[32rem] h-[32rem] rounded-full bg-gradient-to-tr from-cyan-100/60 via-sky-50/80 to-transparent blur-3xl animate-float-slower" />
          <div className="absolute -bottom-48 right-1/4 w-[34rem] h-[34rem] rounded-full bg-gradient-to-tl from-emerald-50 via-invictus-50/70 to-transparent blur-3xl" />
          <span className="absolute bottom-2 right-2 text-[17rem] leading-none opacity-[0.045] -rotate-[18deg] select-none">🥊</span>
        </div>

        <header className="h-16 bg-white shadow-sm border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (window.innerWidth >= 1024) setSidebarOpen(!sidebarOpen);
                else setMobileOpen(!mobileOpen);
              }}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="px-3 py-1 bg-invictus-50 text-invictus-800 border border-invictus-100 rounded-full text-xs font-bold">
              {roleLabel}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPaletteOpen(true)}
              className="hidden md:flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-slate-400 hover:border-slate-300 hover:text-slate-500 transition-colors"
              aria-label="Abrir paleta de comandos"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              Buscar o ir a...
              <kbd className="ml-2 px-1.5 py-0.5 text-[10px] font-semibold bg-slate-100 border border-gray-200 rounded">Ctrl K</kbd>
            </button>
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-gray-800 leading-tight">{user?.nombre}</p>
              <p className="text-[11px] text-gray-400 leading-tight">{user?.correo}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-invictus-600 flex items-center justify-center text-xs font-bold text-white">
              {iniciales}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto relative z-[1]">
          <div key={currentPath} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-scale-in">
            <Outlet />
          </div>
        </main>
      </div>

      <CommandPalette open={paletteOpen} setOpen={setPaletteOpen} />
    </div>
  );
}

export default MainLayout;
