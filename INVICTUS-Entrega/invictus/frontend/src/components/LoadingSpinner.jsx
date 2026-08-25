function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-invictus-200 border-t-invictus-600 rounded-full animate-spin" />
        <span className="text-sm text-slate-500 font-medium">Cargando...</span>
      </div>
    </div>
  );
}

export default LoadingSpinner;
