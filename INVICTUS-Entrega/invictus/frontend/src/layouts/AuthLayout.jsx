import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import CanvasFondo from '../components/CanvasFondo';

function AuthLayout() {
  const { user, loading, getRedirectPath } = useAuth();

  if (loading) return <LoadingSpinner />;

  if (user) return <Navigate to={getRedirectPath()} replace />;

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#071A2B] via-[#0A2438] to-[#071A2B] flex items-center justify-center p-4 overflow-hidden">
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-invictus-500/20 blur-3xl" />
      <div className="absolute -bottom-32 -right-16 w-[28rem] h-[28rem] rounded-full bg-teal-400/10 blur-3xl" />
      <div className="absolute top-1/3 right-1/4 w-72 h-72 rounded-full bg-emerald-600/15 blur-3xl animate-float-slow" />
      <div className="absolute bottom-1/4 left-1/4 w-56 h-56 rounded-full bg-cyan-400/10 blur-3xl animate-float-slower" />
      <span aria-hidden="true" className="pointer-events-none select-none absolute -bottom-20 -left-10 text-[22rem] leading-none opacity-[0.05] -rotate-12">🥊</span>
      <span aria-hidden="true" className="pointer-events-none select-none absolute top-8 right-10 text-[9rem] leading-none opacity-[0.07] rotate-12">🥊</span>
      <CanvasFondo />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
      <Outlet />
    </div>
  );
}

export default AuthLayout;
