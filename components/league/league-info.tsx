"use client";

/**
 * Composant client pour les informations de ligue avec interactions de copie
 */

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface LeagueInfoProps {
  inviteCode: string;
  inviteUrl: string;
  createdAt: string;
  membersCount: number;
  matchesCount: number;
  isOwner: boolean;
}

export function LeagueInfo({
  inviteCode,
  inviteUrl,
  createdAt,
  membersCount,
  matchesCount,
  isOwner,
}: LeagueInfoProps) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <div className="space-y-4">
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Inviter des joueurs</CardTitle>
          <CardDescription className="text-slate-400">
            Partagez le code d&apos;invitation ou le QR code
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-slate-200 text-sm mb-2 block">
              Code d&apos;invitation
            </Label>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-slate-900 px-4 py-2 rounded text-white font-mono">
                {inviteCode}
              </code>
              <Button
                variant="outline"
                size="sm"
                className="border-slate-600"
                onClick={handleCopyCode}
              >
                {copiedCode ? (
                  <>
                    <Check className="h-4 w-4 mr-2 text-green-500" />
                    Copié
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copier
                  </>
                )}
              </Button>
            </div>
          </div>

          <div>
            <Label className="text-slate-200 text-sm mb-2 block">
              Lien d&apos;invitation
            </Label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inviteUrl}
                readOnly
                className="flex-1 bg-slate-900 px-4 py-2 rounded text-white text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                className="border-slate-600"
                onClick={handleCopyUrl}
              >
                {copiedUrl ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Détails de la ligue</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">Créée le</span>
            <span className="text-white">
              {new Date(createdAt).toLocaleDateString("fr-FR")}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Membres</span>
            <span className="text-white">{membersCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Matchs joués</span>
            <span className="text-white">{matchesCount}</span>
          </div>
          {isOwner && (
            <div className="flex justify-between">
              <span className="text-slate-400">Rôle</span>
              <span className="text-blue-400 font-medium">Créateur</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
