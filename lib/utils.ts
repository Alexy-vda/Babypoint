import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function getRatingColor(rating: number): string {
  if (rating >= 1200) return "text-yellow-500";
  if (rating >= 1100) return "text-blue-500";
  if (rating >= 1000) return "text-green-500";
  if (rating >= 900) return "text-orange-500";
  return "text-red-500";
}

export function getWinRateColor(winRate: number): string {
  if (winRate >= 70) return "text-green-600";
  if (winRate >= 50) return "text-blue-600";
  if (winRate >= 30) return "text-orange-600";
  return "text-red-600";
}
