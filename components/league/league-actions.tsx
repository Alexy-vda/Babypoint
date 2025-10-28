"use client";

/**
 * Composant client pour les actions interactives d'une ligue
 * Extrait de la page league pour permettre la migration RSC
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { QrCode, LogOut, Copy, Check } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { leaveLeague } from "@/app/actions/league";

interface LeagueActionsProps {
  leagueId: string;
  inviteCode: string;
  isOwner: boolean;
}

export function LeagueActions({
  leagueId,
  inviteCode,
  isOwner,
}: LeagueActionsProps) {
  const router = useRouter();
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [isLeaving, setIsLeaving] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const handleGenerateQR = async () => {
    try {
      const response = await fetch(`/api/leagues/${leagueId}/invite-qr`);
      if (response.ok) {
        const data = await response.json();
        setQrCodeUrl(data.qrCode);
      }
    } catch (error) {
      console.error("Erreur lors de la génération du QR code:", error);
    }
  };

  const handleCopyInviteCode = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleLeaveLeague = async () => {
    if (!confirm("Êtes-vous sûr de vouloir quitter cette ligue ?")) {
      return;
    }

    setIsLeaving(true);
    const result = await leaveLeague(leagueId);

    if (result?.error) {
      alert(result.error);
      setIsLeaving(false);
    } else if (result?.success) {
      // Redirection côté client après succès
      router.push("/dashboard");
    }
  };

  return (
    <div className="flex items-center gap-2 shrink-0">
      {/* QR Code Dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="border-slate-600 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-slate-200"
            onClick={handleGenerateQR}
          >
            <QrCode className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">
              QR Code d&apos;invitation
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Scannez ce code pour rejoindre la ligue
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            {qrCodeUrl ? (
              <div className="bg-white p-4 rounded-lg">
                <Image
                  src={qrCodeUrl}
                  alt="QR Code"
                  width={256}
                  height={256}
                  className="block"
                  unoptimized
                />
              </div>
            ) : (
              <div className="w-64 h-64 bg-slate-700 rounded flex items-center justify-center">
                <p className="text-slate-400">Chargement...</p>
              </div>
            )}
            <div className="w-full space-y-2">
              <p className="text-sm text-slate-400 text-center">
                Code d&apos;invitation:
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-slate-900 px-4 py-2 rounded text-white font-mono text-center">
                  {inviteCode}
                </code>
                <Button
                  size="icon"
                  variant="outline"
                  className="border-slate-600"
                  onClick={handleCopyInviteCode}
                >
                  {copiedCode ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {!isOwner && (
        <Button
          variant="outline"
          size="icon"
          className="border-red-600 text-red-400 bg-red-500/10 hover:bg-red-500/20 hover:text-red-300"
          onClick={handleLeaveLeague}
          disabled={isLeaving}
          title="Quitter la ligue"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
