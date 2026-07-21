#!/usr/bin/env bash
set -euo pipefail

echo "=== Building frontend ==="
npx vite build

echo "=== Bundling server ==="
mkdir -p dist
npx esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs

echo "=== Build complete ==="
ls -lh dist/
