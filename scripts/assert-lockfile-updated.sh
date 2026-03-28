#!/bin/sh
# asserts lockfile is up-to-date with pnpm --frozen-lockfile behavior

pnpm install --frozen-lockfile

git diff pnpm-lock.yaml
if ! git diff --exit-code pnpm-lock.yaml; then
  echo "Changes were detected in pnpm-lock.yaml file after running 'pnpm install', which is not expected. Please run 'pnpm install' locally and commit the changes."
  exit 1
fi
