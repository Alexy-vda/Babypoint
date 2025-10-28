"use client";

import { useEffect } from "react";

/**
 * Global Error Boundary
 * Attrape les erreurs qui échappent aux error.tsx locaux
 * Requis par Next.js 16 pour une gestion d'erreur complète
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global Error:", error);
  }, [error]);

  return (
    <html lang="fr">
      <body className="bg-slate-950">
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="text-center space-y-6 max-w-md">
            <h1 className="text-4xl font-bold text-white">Erreur Critique</h1>
            <p className="text-slate-400 text-lg">
              Une erreur critique est survenue. Veuillez rafraîchir la page.
            </p>
            <button
              onClick={reset}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Rafraîchir la page
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
