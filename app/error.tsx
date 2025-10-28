"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log l'erreur vers un service de monitoring (ex: Sentry)
    console.error("Application Error:", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950 p-4">
      <Card className="bg-slate-800/50 border-slate-700 max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <CardTitle className="text-white text-2xl">
              Une erreur est survenue
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-slate-400">
            Désolé, quelque chose s&apos;est mal passé. Nous avons été notifiés
            du problème.
          </p>

          {process.env.NODE_ENV === "development" && (
            <div className="bg-slate-900 p-3 rounded border border-slate-700">
              <p className="text-xs text-red-400 font-mono break-all">
                {error.message}
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              onClick={reset}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Réessayer
            </Button>
            <Button
              onClick={() => (window.location.href = "/dashboard")}
              variant="outline"
              className="flex-1 border-slate-600 text-slate-300"
            >
              Retour au dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
