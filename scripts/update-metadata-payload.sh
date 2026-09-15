#!/bin/sh
# Regenerates metadata.json for destinations whose source files are staged.
# Called by lint-staged with the list of staged file paths as arguments.
set -e

DIRS=""

for file in "$@"; do
  # Cloud: packages/destination-actions/src/destinations/<name>/...
  dir=$(echo "$file" | sed -n 's|.*packages/destination-actions/src/destinations/\([^/]*\)/.*|\1|p')
  if [ -n "$dir" ]; then
    DIRS="$DIRS packages/destination-actions/src/destinations/$dir"
    continue
  fi

  # Browser: packages/browser-destinations/destinations/<name>/...
  dir=$(echo "$file" | sed -n 's|.*packages/browser-destinations/destinations/\([^/]*\)/.*|\1|p')
  if [ -n "$dir" ]; then
    DIRS="$DIRS packages/browser-destinations/destinations/$dir"
    continue
  fi

  # Warehouse: packages/warehouse-destinations/src/destinations/<name>/...
  dir=$(echo "$file" | sed -n 's|.*packages/warehouse-destinations/src/destinations/\([^/]*\)/.*|\1|p')
  if [ -n "$dir" ]; then
    DIRS="$DIRS packages/warehouse-destinations/src/destinations/$dir"
    continue
  fi
done

# Deduplicate
DIRS=$(echo "$DIRS" | tr ' ' '\n' | sort -u | tr '\n' ' ' | xargs)

if [ -z "$DIRS" ]; then
  exit 0
fi

# Build --path arguments for each directory
PATH_ARGS=""
for dir in $DIRS; do
  PATH_ARGS="$PATH_ARGS --path $dir"
done

# Regenerate metadata only for affected destinations
./bin/run generate:metadata-payload $PATH_ARGS
