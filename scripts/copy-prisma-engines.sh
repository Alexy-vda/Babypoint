#!/bin/bash
set -e

echo "🔧 Post-build: Copying Prisma engines to .next output..."

# Créer les dossiers de destination si nécessaire
mkdir -p .next/standalone/node_modules/.prisma/client
mkdir -p .next/standalone/node_modules/@prisma/engines
mkdir -p .next/standalone/lib/generated/prisma

# Copier depuis lib/generated/prisma (custom output)
if [ -d "lib/generated/prisma" ]; then
  echo "📦 Copying lib/generated/prisma..."
  cp -r lib/generated/prisma/* .next/standalone/lib/generated/prisma/ || true
fi

# Copier tout le contenu de .prisma/client (fallback)
if [ -d "node_modules/.prisma/client" ]; then
  echo "📦 Copying .prisma/client..."
  cp -r node_modules/.prisma/client/* .next/standalone/node_modules/.prisma/client/ || true
fi

# Copier les engines
if [ -d "node_modules/@prisma/engines" ]; then
  echo "📦 Copying @prisma/engines..."
  cp -r node_modules/@prisma/engines/* .next/standalone/node_modules/@prisma/engines/ || true
fi

# Copier aussi dans le dossier server si il existe
if [ -d ".next/server" ]; then
  echo "📦 Copying to .next/server..."
  mkdir -p .next/server/lib/generated/prisma
  cp -r lib/generated/prisma/* .next/server/lib/generated/prisma/ || true
fi

echo "✅ Prisma engines copied successfully!"

# Lister les fichiers copiés pour vérification
echo "📋 Files in .next/standalone/lib/generated/prisma:"
ls -la .next/standalone/lib/generated/prisma/ || echo "Directory not found"
