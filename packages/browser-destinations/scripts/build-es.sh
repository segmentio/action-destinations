#!/bin/bash
find ./destinations -maxdepth 1 -mindepth 1 -type d -exec bash -c "cd '{}' && pwd && yarn tsc --build" \;