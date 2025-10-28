#!/bin/bash
set -e

echo "📦 Generating Prisma Client..."
npx prisma generate

echo "🔍 Checking Prisma engines..."
ls -la node_modules/.prisma/client/ || true
ls -la node_modules/@prisma/engines/ || true

echo "🏗️  Building Next.js app..."
next build

echo "✅ Build complete!"
