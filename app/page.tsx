"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/lib/store";

export default function Home() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          router.push("/dashboard");
        } else {
          router.push("/login");
        }
      } catch {
        router.push("/login");
      }
    };

    if (user) {
      router.push("/dashboard");
    } else {
      checkAuth();
    }
  }, [user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="text-white">Chargement...</div>
    </div>
  );
}
