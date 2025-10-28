export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">BabyPoint</h1>
          <p className="text-slate-400">Suivez vos matchs de babyfoot</p>
        </div>
        {children}
      </div>
    </div>
  );
}
