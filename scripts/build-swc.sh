#!/bin/bash
set -e

# SWC Build Script
# This script builds a package using SWC for transpilation and tsc for type declarations
# Usage: ./scripts/build-swc.sh <package-dir>
# Example: ./scripts/build-swc.sh packages/core

PACKAGE_DIR="${1:-.}"
SRC_DIR="${PACKAGE_DIR}/src"
DIST_DIR="${PACKAGE_DIR}/dist"

if [ ! -d "$SRC_DIR" ]; then
  echo "Error: Source directory not found: $SRC_DIR"
  exit 1
fi

echo "Building package: $PACKAGE_DIR"

# Clean dist directory
echo "Cleaning dist directory..."
rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR/cjs" "$DIST_DIR/esm"

# Build CommonJS with SWC
echo "Building CommonJS..."
npx swc "$SRC_DIR" -d "$DIST_DIR/cjs" --config-file .swcrc.cjs --strip-leading-paths

# Build ESM with SWC
echo "Building ESM..."
npx swc "$SRC_DIR" -d "$DIST_DIR/esm" --config-file .swcrc.esm --strip-leading-paths

# Generate TypeScript declarations with tsc
echo "Generating type declarations..."
cd "$PACKAGE_DIR"
npx tsc --emitDeclarationOnly --declaration --declarationMap --outDir dist/types

# Copy package.json metadata to dist
if [ -f "package.json" ]; then
  # Create a minimal package.json for the dist directory with dual package support
  cat > dist/package.json << 'EOF'
{
  "type": "commonjs",
  "exports": {
    ".": {
      "import": "./esm/index.js",
      "require": "./cjs/index.js",
      "types": "./types/index.d.ts"
    },
    "./*": {
      "import": "./esm/*.js",
      "require": "./cjs/*.js",
      "types": "./types/*.d.ts"
    }
  }
}
EOF
fi

echo "Build complete for $PACKAGE_DIR"
